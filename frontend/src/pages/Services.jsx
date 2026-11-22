import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import BookNowModal from "../components/BookNowModal.jsx";
import CategoryGrid, { CATEGORIES } from "../components/CategoryGrid.jsx";
import IconBadge from "../components/IconBadge.jsx";
import SectionHeading from "../components/SectionHeading.jsx";

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingService, setBookingService] = useState(null);
  const [params, setParams] = useSearchParams();
  const activeKey = params.get("category");
  const activeCategory = CATEGORIES.find((c) => c.key === activeKey) || null;

  useEffect(() => {
    api.getServices().then(setServices).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function backToCategories() {
    setParams({});
  }

  const categoryServices = activeCategory
    ? services.filter((s) => s.category === activeCategory.key)
    : [];

  return (
    <div>
      {!activeCategory ? (
        <section className="py-16">
          <div className="container-x">
            <SectionHeading eyebrow="Browse by" title="Category" />
            <CategoryGrid className="mt-12" />
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
            <SectionHeading eyebrow="Services" title={activeCategory.label} />
            <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
              {categoryServices.map((s) => (
                <div
                  key={s.id}
                  className={`group relative flex min-h-[220px] flex-col justify-between gap-5 overflow-hidden rounded-3xl p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl sm:min-h-[240px] sm:gap-6 sm:p-7 ${activeCategory.bg}`}
                >
                  <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 transition-transform group-hover:scale-110" />
                  <IconBadge icon={s.icon} slug={s.slug} />
                  <div className="relative flex flex-1 flex-col">
                    <h3 className="font-serif text-lg font-semibold text-white sm:text-xl">{s.title}</h3>
                    <p className="mt-1 flex-1 text-xs text-white/85 sm:text-sm">{s.description}</p>
                    <button
                      onClick={() => setBookingService(s)}
                      className="relative mt-4 self-start rounded-pill bg-white px-4 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-white/90"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
              {categoryServices.length === 0 && (
                <p className="col-span-2 text-sm text-ink/50 lg:col-span-3">
                  {loading ? "Loading services…" : "No services in this category yet."}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="py-4 pb-16">
        <div className="container-x flex flex-col items-center justify-between gap-6 rounded-3xl bg-ink px-8 py-10 text-white lg:flex-row">
          <div>
            <p className="eyebrow !text-lime">2 hr Service Available</p>
            <h3 className="text-3xl font-semibold">Ready when you need it most</h3>
          </div>
          <Link to="/contact" className="btn-pill-lime whitespace-nowrap">Schedule Pickup</Link>
        </div>
      </section>

      {bookingService && (
        <BookNowModal service={bookingService} onClose={() => setBookingService(null)} />
      )}
    </div>
  );
}
