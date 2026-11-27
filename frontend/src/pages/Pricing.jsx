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

// Pick an item from the dropdown, see its Dry Clean / Steam Iron rates,
// then confirm a quantity before anything actually lands in the cart.
function PriceTable({ title, items }) {
  const { addItem } = useCart();
  const [selected, setSelected] = useState(items[0]?.item || "");
  const [pendingAdd, setPendingAdd] = useState(null); // { item, service, price } | null

  useEffect(() => {
    setSelected(items[0]?.item || "");
  }, [items]);

  const row = items.find((r) => r.item === selected);

  return (
    <div>
      {title && <h3 className="mb-4 font-serif text-2xl font-semibold text-ink">{title}</h3>}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink/80">Choose an item</span>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className={selectClass}>
          {items.map((r) => (
            <option key={r.item} value={r.item}>
              {r.item}
            </option>
          ))}
        </select>
      </label>

      {row && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10">
          {row.dc != null && (
            <RateRow
              label="Dry Clean"
              price={row.dc}
              onAdd={() => setPendingAdd({ item: row.item, service: "dc", price: row.dc })}
            />
          )}
          {row.si != null && (
            <RateRow
              label="Steam Iron"
              price={row.si}
              onAdd={() => setPendingAdd({ item: row.item, service: "si", price: row.si })}
            />
          )}
        </div>
      )}

      {pendingAdd && (
        <QtyPromptModal
          item={pendingAdd.item}
          serviceLabel={pendingAdd.service === "dc" ? "Dry Clean" : "Steam Iron"}
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
