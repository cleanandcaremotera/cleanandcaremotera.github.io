import { ChevronDown, Download, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { cloudinaryConfigured, uploadRateListImage } from "../lib/cloudinary.js";
import { exportPricingWorkbook, parsePricingWorkbook } from "../lib/pricingExcel.js";

function CategoryEditor({ category, onSave }) {
  const [items, setItems] = useState(category.items);
  const [status, setStatus] = useState(null);

  function updateField(idx, field, value) {
    setItems((prev) => prev.map((it, i) => (i !== idx ? it : { ...it, [field]: value === "" ? null : Number(value) })));
  }

  async function save() {
    setStatus({ loading: true });
    try {
      await onSave(items);
      setStatus({ success: "Saved." });
    } catch (err) {
      setStatus({ error: err.message });
    }
  }

  return (
    <div className="border-t border-ink/10 p-4">
      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={it.item} className="flex flex-wrap items-center gap-3 text-sm">
            <span className="min-w-0 flex-1">{it.item}</span>
            <label className="flex items-center gap-1.5 text-xs text-ink/50">
              DC
              <input
                type="number"
                className="w-20 rounded-lg border border-ink/15 px-2 py-1 text-ink"
                value={it.dc ?? ""}
                onChange={(e) => updateField(idx, "dc", e.target.value)}
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-ink/50">
              SI
              <input
                type="number"
                className="w-20 rounded-lg border border-ink/15 px-2 py-1 text-ink"
                value={it.si ?? ""}
                onChange={(e) => updateField(idx, "si", e.target.value)}
              />
            </label>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={save} disabled={status?.loading} className="btn-pill-lime !py-1.5 !text-xs">
          {status?.loading ? "Saving…" : "Save Changes"}
        </button>
        {status?.success && <p className="text-xs text-lime-dark">{status.success}</p>}
        {status?.error && <p className="text-xs text-red-600">{status.error}</p>}
      </div>
    </div>
  );
}

function ExtrasEditor({ rows, onSave }) {
  const [localRows, setLocalRows] = useState(rows);
  const [status, setStatus] = useState(null);

  function updateField(idx, field, value) {
    setLocalRows((prev) => prev.map((r, i) => (i !== idx ? r : { ...r, [field]: value })));
  }

  async function save() {
    setStatus({ loading: true });
    try {
      await onSave(localRows);
      setStatus({ success: "Saved." });
    } catch (err) {
      setStatus({ error: err.message });
    }
  }

  return (
    <div className="border-t border-ink/10 p-4">
      <div className="space-y-2">
        {localRows.map((row, idx) => (
          <div key={row.service} className="flex items-center gap-3 text-sm">
            <span className="min-w-0 flex-1">{row.service}</span>
            <label className="flex items-center gap-1.5 text-xs text-ink/50">
              Price
              <input
                className="w-28 rounded-lg border border-ink/15 px-2 py-1 text-ink"
                value={row.price}
                onChange={(e) => updateField(idx, "price", e.target.value)}
              />
            </label>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={save} disabled={status?.loading} className="btn-pill-lime !py-1.5 !text-xs">
          {status?.loading ? "Saving…" : "Save Changes"}
        </button>
        {status?.success && <p className="text-xs text-lime-dark">{status.success}</p>}
        {status?.error && <p className="text-xs text-red-600">{status.error}</p>}
      </div>
    </div>
  );
}

export default function AdminPricing() {
  const [categories, setCategories] = useState([]);
  const [extras, setExtras] = useState([]);
  const [discount, setDiscount] = useState({ active: false, percent: 0, label: "" });
  const [discountStatus, setDiscountStatus] = useState(null);
  const [openKey, setOpenKey] = useState(null);

  const [rateListUrls, setRateListUrls] = useState([]);
  const [rateListVisible, setRateListVisible] = useState(false);
  const [rateListFiles, setRateListFiles] = useState([]);
  const [rateListStatus, setRateListStatus] = useState(null);
  const [rateListProgress, setRateListProgress] = useState({ index: 0, total: 0, percent: 0 });

  // Bulk rate update via Excel: parsing just stages a preview — nothing is
  // written to Firestore until the admin explicitly confirms the replace.
  const [pendingImport, setPendingImport] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const importFileRef = useRef(null);

  useEffect(() => {
    api.getPricing().then(({ categories, extras }) => {
      setCategories(categories);
      setExtras(extras);
    });
    api.getDiscount().then(setDiscount);
    api.getRateList().then((data) => {
      setRateListVisible(data.visible === true);
      setRateListUrls(data.urls || []);
    });
  }, []);

  async function saveDiscount() {
    setDiscountStatus({ loading: true });
    try {
      await api.updateDiscount(discount);
      setDiscountStatus({ success: "Discount updated." });
    } catch (err) {
      setDiscountStatus({ error: err.message });
    }
  }

  function downloadRatesExcel() {
    exportPricingWorkbook({ categories, extras, discount });
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImport(null);
    setImportStatus({ loading: true });
    try {
      const parsed = await parsePricingWorkbook(file);
      setPendingImport(parsed);
      const extraLine = parsed.discount ? ` Discount sheet found: ${parsed.discount.active ? "active" : "inactive"}, ${parsed.discount.percent}% off.` : "";
      setImportStatus({
        success: `Found ${parsed.categories.length} categories (${parsed.categories.reduce((n, c) => n + c.items.length, 0)} items) and ${parsed.extras.length} extras groups (${parsed.extras.reduce((n, g) => n + g.rows.length, 0)} rows) in the file.${extraLine} Review below, then confirm to replace.`,
      });
    } catch (err) {
      setImportStatus({ error: err.message });
    } finally {
      if (importFileRef.current) importFileRef.current.value = "";
    }
  }

  async function confirmImport() {
    if (!pendingImport) return;
    setImportStatus({ loading: true });
    try {
      await api.replacePricing({ categories: pendingImport.categories, extras: pendingImport.extras });
      if (pendingImport.discount) {
        await api.updateDiscount(pendingImport.discount);
        setDiscount(pendingImport.discount);
      }
      setCategories(pendingImport.categories);
      setExtras(pendingImport.extras);
      setPendingImport(null);
      setOpenKey(null);
      setImportStatus({ success: "Rates replaced — the Pricing page now reflects the uploaded file." });
    } catch (err) {
      setImportStatus({ error: err.message });
    }
  }

  function cancelImport() {
    setPendingImport(null);
    setImportStatus(null);
  }

  async function uploadRateListImages(e) {
    e.preventDefault();
    if (rateListFiles.length === 0) return;
    setRateListStatus({ loading: true });
    setRateListProgress({ index: 0, total: rateListFiles.length, percent: 0 });
    try {
      const newUrls = [];
      for (let i = 0; i < rateListFiles.length; i++) {
        const url = await uploadRateListImage(rateListFiles[i], (percent) =>
          setRateListProgress({ index: i, total: rateListFiles.length, percent })
        );
        newUrls.push(url);
      }
      const urls = [...rateListUrls, ...newUrls];
      await api.updateRateList({ visible: true, urls });
      setRateListStatus({ success: "Rate list image(s) added — now live on the Pricing page." });
      setRateListFiles([]);
      setRateListVisible(true);
      setRateListUrls(urls);
    } catch (err) {
      setRateListStatus({ error: err.message });
    } finally {
      setRateListProgress({ index: 0, total: 0, percent: 0 });
    }
  }

  async function removeRateListImage(url) {
    const urls = rateListUrls.filter((u) => u !== url);
    setRateListUrls(urls);
    try {
      await api.updateRateList({ visible: rateListVisible, urls });
    } catch (err) {
      setRateListStatus({ error: err.message });
    }
  }

  async function toggleRateListVisible() {
    const visible = !rateListVisible;
    setRateListVisible(visible);
    try {
      await api.updateRateList({ visible, urls: rateListUrls });
      setRateListStatus({
        success: visible ? "Rate list is now visible on the Pricing page." : "Rate list hidden from the Pricing page.",
      });
    } catch (err) {
      setRateListStatus({ error: err.message });
    }
  }

  return (
    <section className="mb-12">
      <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Pricing &amp; Discount</h2>

      <div className="mb-6 rounded-2xl border border-ink/10 p-5">
        <h3 className="mb-3 font-semibold text-ink">Today's Discount</h3>
        <p className="mb-4 text-sm text-ink/60">
          Shown on the Pricing page and applied automatically to the cart total at checkout.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={discount.active}
              onChange={(e) => setDiscount({ ...discount, active: e.target.checked })}
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            % Off
            <input
              type="number"
              min="0"
              max="100"
              className="w-20 rounded-lg border border-ink/15 px-2 py-1.5"
              value={discount.percent}
              onChange={(e) => setDiscount({ ...discount, percent: Number(e.target.value) })}
            />
          </label>
          <label className="flex min-w-[200px] flex-1 items-center gap-2 text-sm">
            Label
            <input
              className="flex-1 rounded-lg border border-ink/15 px-2 py-1.5"
              placeholder="e.g. First order special"
              value={discount.label}
              onChange={(e) => setDiscount({ ...discount, label: e.target.value })}
            />
          </label>
          <button onClick={saveDiscount} disabled={discountStatus?.loading} className="btn-pill-lime !py-1.5 !text-xs">
            {discountStatus?.loading ? "Saving…" : "Save"}
          </button>
        </div>
        {discountStatus?.success && <p className="mt-2 text-xs text-lime-dark">{discountStatus.success}</p>}
        {discountStatus?.error && <p className="mt-2 text-xs text-red-600">{discountStatus.error}</p>}
      </div>

      <div className="mb-6 rounded-2xl border border-ink/10 p-5">
        <h3 className="mb-3 font-semibold text-ink">Bulk Rate Update (Excel)</h3>
        <p className="mb-4 text-sm text-ink/60">
          Download the current rates as an Excel file, edit prices (or add/remove categories, items and extras
          rows) in a spreadsheet, then upload it here to replace everything at once on the Pricing page.
        </p>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={downloadRatesExcel} className="btn-pill-outline !py-1.5 !text-xs">
            <Download className="h-3.5 w-3.5" />
            Download Current Rates
          </button>
          <label className="btn-pill-lime !py-1.5 !text-xs cursor-pointer">
            <Upload className="h-3.5 w-3.5" />
            Upload Excel File
            <input
              ref={importFileRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        {importStatus?.loading && <p className="mt-3 text-xs text-ink/50">Reading file…</p>}
        {importStatus?.success && <p className="mt-3 text-xs text-lime-dark">{importStatus.success}</p>}
        {importStatus?.error && <p className="mt-3 text-xs text-red-600">{importStatus.error}</p>}

        {pendingImport && (
          <div className="mt-4 rounded-xl border border-lime-dark/30 bg-lime/10 p-4">
            <p className="mb-3 text-sm font-semibold text-ink">
              Replace all current rates with this file? This can't be undone (download today's rates first if you
              want a backup).
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={confirmImport} className="btn-pill-lime !py-1.5 !text-xs">
                Confirm &amp; Replace All Rates
              </button>
              <button onClick={cancelImport} className="btn-pill-outline !py-1.5 !text-xs">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6 rounded-2xl border border-ink/10 p-5">
        <h3 className="mb-3 font-semibold text-ink">Rate List</h3>
        <p className="mb-4 text-sm text-ink/60">
          Upload a photo of your rate card (with any offer already shown on it) to display at the top of the
          Pricing page, above the category list below.
        </p>

        {rateListUrls.length > 0 ? (
          <div className="mb-5 flex flex-wrap gap-3">
            {rateListUrls.map((url) => (
              <div key={url} className="group relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-cream">
                <img src={url} alt="Rate list" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeRateListImage(url)}
                  aria-label="Remove image"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-5 text-xs text-ink/40">
            {!cloudinaryConfigured()
              ? "Image hosting not configured (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET missing)"
              : "No rate list images set"}
          </p>
        )}

        <form onSubmit={uploadRateListImages} className="space-y-3">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setRateListFiles(Array.from(e.target.files || []))}
            className="block w-full text-sm text-ink/70 file:mr-4 file:rounded-pill file:border-0 file:bg-cream file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-lime/30"
          />
          {rateListStatus?.loading && (
            <div>
              <div className="h-2 w-full overflow-hidden rounded-pill bg-cream">
                <div
                  className="h-full rounded-pill bg-lime transition-all"
                  style={{ width: `${rateListProgress.percent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-ink/50">
                Uploading image {rateListProgress.index + 1} of {rateListProgress.total}… {rateListProgress.percent}%
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="btn-pill-lime !py-1.5 !text-xs"
              disabled={rateListFiles.length === 0 || rateListStatus?.loading}
            >
              {rateListStatus?.loading
                ? "Uploading…"
                : rateListFiles.length > 1
                  ? `Upload ${rateListFiles.length} Images`
                  : "Upload"}
            </button>
            <button
              type="button"
              onClick={toggleRateListVisible}
              className="btn-pill-outline !py-1.5 !text-xs"
              disabled={rateListUrls.length === 0 || rateListStatus?.loading}
            >
              {rateListVisible ? "Hide From Pricing Page" : "Show On Pricing Page"}
            </button>
          </div>
          {rateListStatus?.success && <p className="text-xs text-lime-dark">{rateListStatus.success}</p>}
          {rateListStatus?.error && <p className="text-xs text-red-600">{rateListStatus.error}</p>}
        </form>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.key} className="rounded-2xl border border-ink/10">
            <button
              onClick={() => setOpenKey(openKey === cat.key ? null : cat.key)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="font-semibold text-ink">{cat.category}</span>
              <ChevronDown className={`h-4 w-4 flex-shrink-0 text-ink/50 transition-transform ${openKey === cat.key ? "rotate-180" : ""}`} />
            </button>
            {openKey === cat.key && (
              <CategoryEditor
                category={cat}
                onSave={async (items) => {
                  const updated = categories.map((c) => (c.key === cat.key ? { ...c, items } : c));
                  await api.replacePricing({ categories: updated, extras });
                  setCategories(updated);
                }}
              />
            )}
          </div>
        ))}

        {extras.map((group) => (
          <div key={group.key} className="rounded-2xl border border-ink/10">
            <button
              onClick={() => setOpenKey(openKey === group.key ? null : group.key)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="font-semibold text-ink">{group.label}</span>
              <ChevronDown className={`h-4 w-4 flex-shrink-0 text-ink/50 transition-transform ${openKey === group.key ? "rotate-180" : ""}`} />
            </button>
            {openKey === group.key && (
              <ExtrasEditor
                rows={group.rows}
                onSave={async (rows) => {
                  const updated = extras.map((g) => (g.key === group.key ? { ...g, rows } : g));
                  await api.replacePricing({ categories, extras: updated });
                  setExtras(updated);
                }}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
