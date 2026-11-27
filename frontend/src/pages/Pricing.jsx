import {
  ArrowLeft,
  Baby,
  ChevronDown,
  Footprints,
  Home as HomeIcon,
  Percent,
  Plus,
  Scale,
  Shirt,
  ShoppingCart,
  Sparkles,
  SprayCan,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import OfferCarousel from "../components/OfferCarousel.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import { useCart } from "../context/CartContext.jsx";
import { img } from "../lib/assets.js";

// A rate the customer can tap repeatedly to build up a quantity before
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

// Compact by default — just the item name and a running-qty badge if
// anything's selected. Tap to expand and reveal its rate chip(s) (same
// tap-to-add, tap-badge-to-remove pattern) — one Dry Clean/Steam Iron pair
// for a category item, or a single rate for an extras-group row. Same
// component either way, so every category on this page behaves identically.
function PriceRow({ label, rates, qtyByKey, onBump }) {
  const [expanded, setExpanded] = useState(false);
  const rowQty = rates.reduce((sum, r) => sum + (qtyByKey[r.key] || 0), 0);

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-colors ${
        rowQty > 0 ? "border-lime-dark bg-lime/5" : "border-ink/10 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <p className="font-medium text-ink">{label}</p>
        <div className="flex flex-shrink-0 items-center gap-2">
          {rowQty > 0 && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-pill bg-lime-dark px-1 text-[11px] font-bold text-white">
              {rowQty}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-ink/30 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>
      {expanded && (
        <div className="flex flex-wrap gap-3 border-t border-ink/10 px-4 pb-4 pt-3">
          {rates.map((r) => (
            <RateChip
              key={r.key}
              label={r.label}
              price={r.price}
              qty={qtyByKey[r.key] || 0}
              onAdd={() => onBump(r.key, 1)}
              onRemove={() => onBump(r.key, -1)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Plain list rendering — the actual pending-quantity state lives in the
// parent Pricing component so the page-level floating "Add to Cart"
// button can read and act on it too.
function CategoryList({ rows, qtyByKey, onBump }) {
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <PriceRow key={row.label} label={row.label} rates={row.rates} qtyByKey={qtyByKey} onBump={onBump} />
      ))}
    </div>
  );
}

// Normalizes a tile's rows into one consistent shape — { label, rates }, with
// `rates` being one or two { key, label, service, price } entries — so a
// category's Dry Clean/Steam Iron items and an extras group's single-rate
// rows (By Weight, Shoes Spa, Add-Ons) run through the exact same list,
// row, and cart-building logic below.
function buildDisplayRows(tile) {
  if (!tile) return [];
  if (tile.type === "table") {
    return tile.items.map((row) => ({
      label: row.item,
      rates: [
        row.dc != null && { key: keyFor(row.item, "dc"), label: "Dry Clean", service: "dc", price: row.dc },
        row.si != null && { key: keyFor(row.item, "si"), label: "Steam Iron", service: "si", price: row.si },
      ].filter(Boolean),
    }));
  }
  return tile.rows
    .map((row) => {
      const price = Number.parseInt(row.price, 10);
      return {
        label: row.service,
        rates: Number.isNaN(price)
          ? []
          : [{ key: keyFor(row.service, "dc"), label: "Add", service: "dc", price }],
      };
    })
    .filter((row) => row.rates.length > 0);
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
  const { addItem, count: cartCount, total: cartTotal } = useCart();

  // Pending (not-yet-added) quantities for the currently open tile's list —
  // lives here, not inside CategoryList, so the floating "Add to Cart"
  // button at the bottom of the page can read and act on it too.
  const [qtyByKey, setQtyByKey] = useState({});

  useEffect(() => {
    setQtyByKey({});
  }, [activeKey]);

  function bump(key, delta) {
    setQtyByKey((prev) => {
      const next = Math.max(0, (prev[key] || 0) + delta);
      return { ...prev, [key]: next };
    });
  }

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
  const displayRows = buildDisplayRows(activeTile);

  const pendingCount = Object.values(qtyByKey).reduce((sum, q) => sum + q, 0);
  const pendingTotal = displayRows.reduce(
    (sum, row) => sum + row.rates.reduce((s, r) => s + (qtyByKey[r.key] || 0) * r.price, 0),
    0
  );

  function handleAddToCart() {
    displayRows.forEach((row) => {
      row.rates.forEach((r) => {
        const qty = qtyByKey[r.key] || 0;
        if (qty > 0) addItem({ item: row.label, service: r.service, price: r.price, qty });
      });
    });
    setQtyByKey({});
  }

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
              <CategoryList rows={displayRows} qtyByKey={qtyByKey} onBump={bump} />
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

      {/* Replaces the site's usual floating Contact Us / Schedule Pickup
          buttons on this page (see App.jsx's HIDE_FAB_ON) with whatever's
          actually relevant here: the pending selection in the open
          category, and the cart itself. */}
      {(pendingCount > 0 || cartCount > 0) && (
        <div
          className="fixed right-4 z-40 flex flex-col items-end gap-3 lg:right-6"
          style={{ bottom: "calc(3.5rem + env(safe-area-inset-bottom) + 16px)" }}
        >
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex items-center gap-2 rounded-pill bg-lime px-4 py-2.5 text-sm font-semibold text-ink shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Add to Cart &middot; {pendingCount} &middot; &#8377;{pendingTotal}
            </button>
          )}
          {cartCount > 0 && (
            <Link
              to="/cart"
              className="flex items-center gap-2 rounded-pill bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-lg ring-1 ring-ink/10 transition-transform hover:-translate-y-0.5"
            >
              <ShoppingCart className="h-4 w-4 text-ink/70" />
              Cart &middot; &#8377;{cartTotal} ({cartCount})
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
