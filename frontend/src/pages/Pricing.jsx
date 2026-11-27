import { ArrowLeft, Baby, Footprints, Home as HomeIcon, Percent, Plus, Scale, Shirt, Sparkles, SprayCan } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import OfferCarousel from "../components/OfferCarousel.jsx";
import QtyPromptModal from "../components/QtyPromptModal.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import { useCart } from "../context/CartContext.jsx";
import { img } from "../lib/assets.js";

const selectClass =
  "w-full rounded-lg border border-ink/15 px-4 py-3 text-sm outline-none focus:border-lime-dark focus:ring-2 focus:ring-lime/30";

// A single item's rate(s), shown after it's picked from the dropdown below —
// each rate opens the qty prompt rather than adding straight to cart.
function RateRow({ label, price, onAdd }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink/10 p-4 last:border-0">
      <div>
        <p className="font-medium text-ink">{label}</p>
        <p className="text-sm text-ink/60">&#8377;{price} / item</p>
      </div>
      <button onClick={onAdd} className="btn-pill-lime !py-2 !text-xs">
        <Plus className="h-3.5 w-3.5" /> Add to Cart
      </button>
    </div>
  );
}

// A rate the admin can tap repeatedly to build up a quantity before
// committing anything to the cart — a small circular badge on the corner
// shows the running count; tapping the badge itself removes one.
function RateChip({ label, price, qty, onAdd, onRemove }) {
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={onAdd}
        className={`flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors ${
          qty > 0 ? "border-lime-dark bg-lime/15 text-ink" : "border-ink/15 text-ink/70 hover:bg-cream"
        }`}
      >
        {label} &#8377;{price}
      </button>
      {qty > 0 && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove one ${label} — ${qty} selected`}
          title="Tap to remove one"
          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-lime-dark text-[11px] font-bold text-white shadow"
        >
          {qty}
        </button>
      )}
    </div>
  );
}

function keyFor(item, service) {
  return `${item}__${service}`;
}

// Tap a rate to add one (the badge on its corner tracks the running
// count — tap the badge to remove one), browse and tap as many
// items/services as needed, then one "Add to Cart" commits everything
// at once instead of confirming each item separately.
function PriceTable({ title, items }) {
  const { addItem } = useCart();
  const [qtyByKey, setQtyByKey] = useState({});

  useEffect(() => {
    setQtyByKey({});
  }, [items]);

  function bump(item, service, delta) {
    const key = keyFor(item, service);
    setQtyByKey((prev) => {
      const next = Math.max(0, (prev[key] || 0) + delta);
      return { ...prev, [key]: next };
    });
  }

  const totalSelected = Object.values(qtyByKey).reduce((sum, q) => sum + q, 0);
  const totalPrice = items.reduce((sum, row) => {
    const dcQty = qtyByKey[keyFor(row.item, "dc")] || 0;
    const siQty = qtyByKey[keyFor(row.item, "si")] || 0;
    return sum + dcQty * (row.dc || 0) + siQty * (row.si || 0);
  }, 0);

  function handleAddToCart() {
    items.forEach((row) => {
      const dcQty = qtyByKey[keyFor(row.item, "dc")] || 0;
      if (dcQty > 0) addItem({ item: row.item, service: "dc", price: row.dc, qty: dcQty });
      const siQty = qtyByKey[keyFor(row.item, "si")] || 0;
      if (siQty > 0) addItem({ item: row.item, service: "si", price: row.si, qty: siQty });
    });
    setQtyByKey({});
  }

  return (
    <div>
      {title && <h3 className="mb-4 font-serif text-2xl font-semibold text-ink">{title}</h3>}

      <div className="space-y-3">
        {items.map((row) => (
          <div
            key={row.item}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 p-4"
          >
            <p className="font-medium text-ink">{row.item}</p>
            <div className="flex flex-wrap gap-3">
              {row.dc != null && (
                <RateChip
                  label="Dry Clean"
                  price={row.dc}
                  qty={qtyByKey[keyFor(row.item, "dc")] || 0}
                  onAdd={() => bump(row.item, "dc", 1)}
                  onRemove={() => bump(row.item, "dc", -1)}
                />
              )}
              {row.si != null && (
                <RateChip
                  label="Steam Iron"
                  price={row.si}
                  qty={qtyByKey[keyFor(row.item, "si")] || 0}
                  onAdd={() => bump(row.item, "si", 1)}
                  onRemove={() => bump(row.item, "si", -1)}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {totalSelected > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-ink px-6 py-4 text-white">
          <p className="text-sm font-medium">
            {totalSelected} item{totalSelected > 1 ? "s" : ""} selected &middot; &#8377;{totalPrice}
          </p>
          <button onClick={handleAddToCart} className="btn-pill-lime !py-2 !text-xs">
            <Plus className="h-3.5 w-3.5" /> Add to Cart
          </button>
        </div>
      )}
    </div>
  );
}

// Same dropdown-then-qty-prompt pattern for extras groups (By Weight,
// Shoes Spa, Add-Ons), which only have one rate per row instead of a
// Dry Clean / Steam Iron split.
function SimpleTable({ title, rows, labelKey, valueKey }) {
  const { addItem } = useCart();
  const [selected, setSelected] = useState(rows[0]?.[labelKey] || "");
  const [pendingAdd, setPendingAdd] = useState(null);

  useEffect(() => {
    setSelected(rows[0]?.[labelKey] || "");
  }, [rows, labelKey]);

  const row = rows.find((r) => r[labelKey] === selected);
  const priceValue = row ? Number.parseInt(row[valueKey], 10) : NaN;
  const canAdd = row && !Number.isNaN(priceValue);

  return (
    <div>
      {title && <h3 className="mb-4 font-serif text-2xl font-semibold text-ink">{title}</h3>}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink/80">Choose a service</span>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className={selectClass}>
          {rows.map((r) => (
            <option key={r[labelKey]} value={r[labelKey]}>
              {r[labelKey]}
            </option>
          ))}
        </select>
      </label>

      {canAdd && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10">
          <RateRow
            label={row[labelKey]}
            price={priceValue}
            onAdd={() => setPendingAdd({ item: row[labelKey], service: "dc", price: priceValue })}
          />
        </div>
      )}

      {pendingAdd && (
        <QtyPromptModal
          item={pendingAdd.item}
          price={pendingAdd.price}
          onConfirm={(qty) => {
            addItem({ ...pendingAdd, qty });
            setPendingAdd(null);
          }}
          onCancel={() => setPendingAdd(null)}
        />
      )}
    </div>
  );
}

// Styles cycle by position (modulo), not by name — so categories/extras
// groups added or renamed via the Excel bulk-replace (see AdminPricing)
// always get a consistent look instead of needing a style entry per name.
// Each has a real photo under a same-hue gradient, same pattern as the
// Services category grid.
const CATEGORY_STYLES = [
  { Icon: Shirt, bg: "bg-sky-600", photo: "mens", overlay: "from-sky-950/90 via-sky-900/40" },
  { Icon: Sparkles, bg: "bg-rose-600", photo: "womens", overlay: "from-rose-950/90 via-rose-900/40" },
  { Icon: HomeIcon, bg: "bg-amber-600", photo: "pricing-home", overlay: "from-amber-950/90 via-amber-900/40" },
  { Icon: Baby, bg: "bg-violet-600", photo: "kids", overlay: "from-violet-950/90 via-violet-900/40" },
];

const EXTRAS_STYLES = [
  { Icon: Scale, bg: "bg-emerald-600", photo: "by-weight", overlay: "from-emerald-950/90 via-emerald-900/40" },
  { Icon: Footprints, bg: "bg-teal-600", photo: "shoes-spa", overlay: "from-teal-950/90 via-teal-900/40" },
  { Icon: SprayCan, bg: "bg-fuchsia-600", photo: "add-ons", overlay: "from-fuchsia-950/90 via-fuchsia-900/40" },
];

export default function Pricing() {
  const [data, setData] = useState({ categories: [], extras: [] });
  const [discount, setDiscount] = useState(null);
  const [rateList, setRateList] = useState(null);
  const [params, setParams] = useSearchParams();
  const activeKey = params.get("category");

  useEffect(() => {
    api.getPricing().then(setData).catch(() => {});
    api.getDiscount().then(setDiscount).catch(() => {});
    api.getRateList().then(setRateList).catch(() => {});
  }, []);

  const rateListUrls = rateList?.visible ? rateList.urls || [] : [];

  const { categories, extras } = data;

  const tiles = [
    ...categories.map((c, i) => ({
      key: c.key,
      label: c.category,
      blurb: "Dry Clean & Steam Iron rates",
      type: "table",
      items: c.items,
      ...(CATEGORY_STYLES[i % CATEGORY_STYLES.length]),
    })),
    ...extras.map((g, i) => ({
      key: g.key,
      label: g.label,
      blurb: `${g.rows.length} services`,
      type: "simple",
      rows: g.rows,
      ...(EXTRAS_STYLES[i % EXTRAS_STYLES.length]),
    })),
  ];

  const activeTile = tiles.find((t) => t.key === activeKey) || null;

  function openCategory(key) {
    setParams({ category: key });
  }

  function backToCategories() {
    setParams({});
  }

  const discountActive = Boolean(discount?.active && discount.percent > 0);

  return (
    <div>
      {discountActive && (
        <section className="bg-ink py-4 text-center text-white">
          <div className="container-x flex items-center justify-center gap-2 text-sm font-medium">
            <Percent className="h-4 w-4 text-lime" />
            <span>
              Today's offer: <span className="text-lime">{discount.percent}% off</span>
              {discount.label ? ` — ${discount.label}` : ""} — applied automatically at checkout
            </span>
          </div>
        </section>
      )}

      {rateListUrls.length > 0 && !activeTile && (
        <section className="bg-cream py-16">
          <div className="container-x">
            <SectionHeading eyebrow="Our Rates" title="Rate Card" />
            <div className="mt-12">
              <OfferCarousel images={rateListUrls} />
            </div>
          </div>
        </section>
      )}

      {!activeTile ? (
        <section className="py-16">
          <div className="container-x">
            <SectionHeading eyebrow="Browse by" title="Category" />
            <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {tiles.map(({ key, label, blurb, Icon, photo, overlay }) => (
                <button
                  key={key}
                  onClick={() => openCategory(key)}
                  className="group relative flex min-h-[172px] flex-col justify-end overflow-hidden rounded-3xl p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl sm:min-h-[200px] sm:p-7"
                >
                  <img
                    src={img(`categories/${photo}.jpg`)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${overlay} to-transparent`} />
                  <Icon className="relative mb-2 h-6 w-6 text-white" strokeWidth={1.75} />
                  <div className="relative">
                    <h3 className="font-serif text-lg font-semibold text-white sm:text-xl">{label}</h3>
                    <p className="mt-1 text-xs text-white/85 sm:text-sm">{blurb}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-16">
          <div className="container-x">
            <button
              onClick={backToCategories}
              className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-lime-dark hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              All Categories
            </button>
            <SectionHeading eyebrow="Pricing" title={activeTile.label} />
            <div className="mt-10">
              {activeTile.type === "table" ? (
                <PriceTable items={activeTile.items} />
              ) : (
                <SimpleTable rows={activeTile.rows} labelKey="service" valueKey="price" />
              )}
            </div>
          </div>
        </section>
      )}

      <section className="pb-16">
        <div className="container-x flex flex-col items-center justify-between gap-6 rounded-3xl bg-ink px-8 py-10 text-white lg:flex-row">
          <div>
            <p className="eyebrow !text-lime">
              {discountActive ? `${discount.percent}% off — ${discount.label || "today only"}` : "Flat rates, no surprises"}
            </p>
            <h3 className="text-3xl font-semibold">Ready to get started?</h3>
          </div>
          <Link to="/schedule-pickup" className="btn-pill-lime whitespace-nowrap">Schedule Pickup</Link>
        </div>
      </section>
    </div>
  );
}
