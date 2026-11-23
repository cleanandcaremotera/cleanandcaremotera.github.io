import {
  Armchair,
  Award,
  Baby,
  Briefcase,
  CalendarClock,
  Droplets,
  Flame,
  Footprints,
  Home as HomeIcon,
  ShieldCheck,
  Shirt,
  Sparkles,
  SprayCan,
  Truck,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import BookNowModal from "../components/BookNowModal.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import StarRating from "../components/StarRating.jsx";
import { useCompany } from "../context/CompanyContext.jsx";
import { img } from "../lib/assets.js";
import { CATEGORIES } from "../lib/categories.js";

function avatarFor(name) {
  return img(`testimonials/${name.toLowerCase().replace(/\s+/g, "-")}.png`);
}

// One icon per company.about.highlights entry, matched by position (that
// list's order comes from the seed script and isn't admin-editable, so
// matching by index is safe).
const HIGHLIGHT_ICONS = [Zap, Droplets, ShieldCheck, Truck, CalendarClock, Award];

// A curated, explicitly-ordered subset of services (not every service,
// not grouped by category) — the owner's chosen front-page lineup. `photo`
// reuses an existing categories/*.jpg where one already fits the service;
// bag-cleaning and toy-cleaning had no close match so those two are new
// sourced photos (see public/images/categories/).
// Plain icons (no circle backdrop) matching each service's own `icon` field.
const SERVICE_ICONS = {
  shirt: Shirt,
  iron: Flame,
  home: HomeIcon,
  sofa: Armchair,
  shoe: Footprints,
  briefcase: Briefcase,
  toy: Baby,
  spray: SprayCan,
};

const FEATURED_SERVICES = [
  { slug: "dry-cleaning", photo: "dryclean" },
  { slug: "steam-ironing", photo: "ironing" },
  { slug: "home-cleaning", photo: "home-services" },
  { slug: "sofa-cleaning", photo: "furniture" },
  { slug: "shoes-spa", photo: "shoes-spa" },
  { slug: "bag-cleaning", photo: "bag-cleaning" },
  { slug: "toy-cleaning", photo: "toy-cleaning" },
  { slug: "home-sanitize", photo: "sanitization" },
];

export default function Home() {
  const { company } = useCompany();
  const [testimonials, setTestimonials] = useState([]);
  const [services, setServices] = useState([]);
  const [bookingService, setBookingService] = useState(null);

  useEffect(() => {
    api.getTestimonials().then(setTestimonials).catch(() => {});
    api.getServices().then(setServices).catch(() => {});
  }, []);

  const featuredServices = FEATURED_SERVICES.map((f) => {
    const s = services.find((x) => x.slug === f.slug);
    return s ? { ...s, photo: f.photo } : null;
  }).filter(Boolean);

  return (
    <div>
      {/* Services */}
      <section className="bg-cream py-16">
        <div className="container-x">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {featuredServices.map((s) => {
              const overlay =
                CATEGORIES.find((c) => c.key === s.category)?.overlay || "from-ink/90 via-ink/40";
              const Icon = SERVICE_ICONS[s.icon] || Sparkles;
              return (
                <div
                  key={s.id}
                  className="group relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-3xl p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <img
                    src={img(`categories/${s.photo}.jpg`)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${overlay} to-transparent`} />
                  <Icon className="relative mb-2 h-6 w-6 text-white" strokeWidth={1.75} />
                  <div className="relative">
                    <h3 className="font-serif text-base font-semibold text-white sm:text-lg">{s.title}</h3>
                    <button
                      onClick={() => setBookingService(s)}
                      className="relative mt-3 self-start rounded-pill bg-white px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-white/90"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why we are */}
      <section className="py-16">
        <div className="container-x">
          <SectionHeading eyebrow="Why We Are?" title={company?.about?.whyWeAre?.heading} />
          <p className="mx-auto mt-5 max-w-2xl text-center text-ink/70">
            {company?.about?.whyWeAre?.body}
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
            {(company?.about?.highlights || []).map((h, i) => {
              const Icon = HIGHLIGHT_ICONS[i] || Zap;
              return (
                <div
                  key={h.title}
                  className="rounded-2xl border border-ink/10 bg-cream/60 p-5 text-center sm:p-6"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime/25">
                    <Icon className="h-6 w-6 text-lime-dark" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-ink">{h.title}</h3>
                  <p className="mt-1.5 text-xs text-ink/60">{h.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <Link to="/about" className="btn-pill-lime">Read More</Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16">
        <div className="container-x grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">About Us</p>
            <h2 className="text-3xl font-semibold text-ink sm:text-4xl">
              {company?.about?.heading}
            </h2>
            <p className="mt-5 text-ink/70">{company?.about?.body}</p>
            <Link to="/about" className="btn-pill-lime mt-6">Read More</Link>
          </div>
          <img
            src={img("about-collage.png")}
            alt="Clean & Care quality certification and freshly folded clothes"
            className="w-full rounded-2xl shadow-lg"
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-lime py-16">
        <div className="container-x">
          <SectionHeading eyebrow="Testimonials" title="Our Happy Clients" light />
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.slice(0, 3).map((t) => (
              <div key={t.id} className="rounded-2xl bg-ink/95 p-6 text-white shadow-lg">
                <p className="text-sm leading-relaxed text-white/85">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarFor(t.name)}
                      alt={t.name}
                      className="h-10 w-10 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <p className="font-semibold">{t.name}</p>
                  </div>
                  <StarRating rating={t.rating} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-16">
        <div className="container-x flex flex-col items-center justify-between gap-6 rounded-3xl bg-ink px-8 py-10 text-white lg:flex-row">
          <div>
            <p className="eyebrow !text-lime">{company?.offer}</p>
            <h3 className="text-3xl font-semibold">{company?.ctaHeading}</h3>
          </div>
          <Link to="/contact#pickup-form" className="btn-pill-lime whitespace-nowrap">Schedule Pickup</Link>
        </div>
      </section>

      {bookingService && (
        <BookNowModal service={bookingService} onClose={() => setBookingService(null)} />
      )}
    </div>
  );
}
