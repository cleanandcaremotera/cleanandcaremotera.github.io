import * as XLSX from "xlsx";

export function slugify(text) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "item"
  );
}

// Keeps the same key when a category/group name is unchanged across an
// export → edit → import round trip (so the admin's per-row editors below
// don't lose their place), but still produces a stable, unique key for a
// brand-new name.
function uniqueKey(label, seen) {
  const base = slugify(label);
  let key = base;
  let n = 2;
  while (seen.has(key)) {
    key = `${base}-${n}`;
    n++;
  }
  seen.add(key);
  return key;
}

// Excel sheet (tab) names can't contain \ / ? * [ ] : and are capped at 31
// characters — most category names are longer than that, so the tab name
// is just for navigating the workbook. The full name always travels inside
// the sheet itself (the "Category"/"Group" row), so a truncated or
// admin-renamed tab never loses data.
function sheetTabName(label, used) {
  const base = label.replace(/[\\/?*[\]:]/g, "").trim().slice(0, 31) || "Sheet";
  let name = base;
  let n = 2;
  while (used.has(name.toLowerCase()) || name.toLowerCase() === "discount") {
    const suffix = ` ${n}`;
    name = base.slice(0, 31 - suffix.length) + suffix;
    n++;
  }
  used.add(name.toLowerCase());
  return name;
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function truthy(value) {
  if (typeof value === "boolean") return value;
  const s = String(value ?? "").trim().toLowerCase();
  return s === "true" || s === "yes" || s === "1" || s === "active";
}

export function exportPricingWorkbook({ categories, extras, discount }) {
  const wb = XLSX.utils.book_new();
  const usedNames = new Set();

  // One tab per category: a small "Category" label row (the full name,
  // never truncated) followed by the real Item/DC/SI table.
  for (const c of categories) {
    const aoa = [
      ["Category", c.category],
      ["Item", "DC Price", "SI Price"],
      ...c.items.map((it) => [it.item, it.dc ?? "", it.si ?? ""]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), sheetTabName(c.category, usedNames));
  }

  // One tab per extras group, same pattern with a Service/Price table.
  for (const g of extras) {
    const aoa = [
      ["Group", g.label],
      ["Service", "Price"],
      ...g.rows.map((r) => [r.service, r.price]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), sheetTabName(g.label, usedNames));
  }

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      {
        Active: discount?.active ? "TRUE" : "FALSE",
        Percent: discount?.percent ?? 0,
        Label: discount?.label ?? "",
      },
    ]),
    "Discount"
  );

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "clean-and-care-rates.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function normalizeRow(row) {
  return row.map((c) => String(c ?? "").trim());
}

function rowMatches(row, expected) {
  const norm = normalizeRow(row).map((c) => c.toLowerCase());
  return expected.every((e, i) => norm[i] === e);
}

// A category/extras sheet looks like:
//   Row 1: "Category" | <full name>     (or "Group" | <full name>)
//   Row 2: "Item" | "DC Price" | "SI Price"   (or "Service" | "Price")
//   Row 3+: data, until a blank row or the end of the sheet.
// The label row is optional — if missing (e.g. the admin built a brand-new
// tab from scratch), the sheet's own tab name is used as the label instead.
function readDataSheet(sheetName, rows) {
  let label = null;
  let kind = null;
  let headerRowIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    const row = normalizeRow(rows[i]);
    if (!label) {
      if (row[0]?.toLowerCase() === "category" && row[1]) {
        label = row[1];
      } else if (row[0]?.toLowerCase() === "group" && row[1]) {
        label = row[1];
      }
    }
    if (rowMatches(rows[i], ["item", "dc price", "si price"])) {
      kind = "category";
      headerRowIndex = i;
      break;
    }
    if (rowMatches(rows[i], ["service", "price"])) {
      kind = "extras";
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) return null; // not a recognizable data sheet — skip it
  if (!label) label = sheetName;

  const dataRows = [];
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = normalizeRow(rows[i]);
    if (row.every((c) => c === "")) break;
    dataRows.push(row);
  }

  return { kind, label, dataRows };
}

// Throws a descriptive Error on anything that doesn't look like a workbook
// produced by exportPricingWorkbook — admin-facing messages, not stack traces.
export async function parsePricingWorkbook(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const categoryKeys = new Set();
  const extraKeys = new Set();
  const categories = [];
  const extrasGroups = [];

  for (const sheetName of wb.SheetNames) {
    if (sheetName.toLowerCase() === "discount") continue;

    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: "" });
    const parsed = readDataSheet(sheetName, rows);
    if (!parsed) continue;

    if (parsed.kind === "category") {
      const items = parsed.dataRows
        .filter((r) => r[0])
        .map((r) => ({ item: r[0], dc: toNumberOrNull(r[1]), si: toNumberOrNull(r[2]) }));
      if (items.length > 0) {
        categories.push({ key: uniqueKey(parsed.label, categoryKeys), category: parsed.label, items });
      }
    } else {
      const rowsOut = parsed.dataRows
        .filter((r) => r[0])
        .map((r) => ({ service: r[0], price: r[1] ?? "" }));
      if (rowsOut.length > 0) {
        extrasGroups.push({ key: uniqueKey(parsed.label, extraKeys), label: parsed.label, rows: rowsOut });
      }
    }
  }

  if (categories.length === 0) {
    throw new Error(
      'No category tabs found — each category needs its own sheet with an "Item / DC Price / SI Price" row, like the downloaded template.'
    );
  }

  let discount;
  const discountSheetName = wb.SheetNames.find((n) => n.toLowerCase() === "discount");
  if (discountSheetName) {
    const discountRows = XLSX.utils.sheet_to_json(wb.Sheets[discountSheetName], { defval: "" });
    if (discountRows.length > 0) {
      const row = discountRows[0];
      discount = {
        active: truthy(row["Active"]),
        percent: Number(row["Percent"]) || 0,
        label: String(row["Label"] || "").trim(),
      };
    }
  }

  return { categories, extras: extrasGroups, discount };
}
