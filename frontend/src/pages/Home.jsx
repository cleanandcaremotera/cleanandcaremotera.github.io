import { Award, CalendarClock, Droplets, ShieldCheck, Truck, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import CategoryGrid from "../components/CategoryGrid.jsx";
import HeroIllustration from "../components/HeroIllustration.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import StarRating from "../components/StarRating.jsx";
import { useCompany } from "../context/CompanyContext.jsx";
import { img } from "../lib/assets.js";

function avatarFor(name) {
  return img(`testimonials/${name.toLowerCase().replace(/\s+/g, "-")}.png`);
}

// One icon per company.about.highlights entry, matched by position (that
// list's order comes from the seed script and isn't admin-editable, so
// matching by index is safe).
const HIGHLIGHT_ICONS = [Zap, Droplets, ShieldCheck, Truck, CalendarClock, Award];

export default function Home() {
  const { company } = useCompany();
  const [testimonials, setTestimonials] = useState([]);
  const [blog, setBlog] = useState([]);

  useEffect(() => {
    api.getTestimonials().then(setTestimonials).catch(() => {});
    api.getBlog().then(setBlog).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-cream">
        <div className="container-x grid grid-cols-1 items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="eyebrow bg-lime/20 rounded-pill px-4 py-1.5">India&rsquo;s Leading</span>
            <h1 className="mt-5 font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl lg:text-5xl">
              Laundry and dry-cleaning brand proudly founded by an IITian
            </h1>
            <p className="mt-5 max-w-md text-ink/70">
              {company?.offer || "Flat 10% Off on your first order"} &mdash; doorstep pickup &amp; drop,
              eco-friendly methods and expert care, every time.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/contact" className="btn-pill-lime">Schedule Pickup</Link>
              <Link to="/services" className="btn-pill-outline">Our Services</Link>
            </div>
          </div>
          <div className="relative">
            <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-3xl bg-lime/30 shadow-xl">
              <HeroIllustration className="h-[85%] w-auto" />
            </div>
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

      {/* Services */}
      <section className="bg-cream py-16">
        <div className="container-x">
          <SectionHeading eyebrow="Services" title="We Provide" />
          <CategoryGrid className="mt-12" />
          <div className="mt-10 text-center">
            <Link to="/services" className="btn-pill-outline">See All Services</Link>
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

      {/* Blog */}
      {blog.length > 0 && (
        <section className="py-16">
          <div className="container-x">
            <SectionHeading eyebrow="Our Latest" title="Blogs" />
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {blog.slice(0, 3).map((post) => (
                <article key={post.id} className="overflow-hidden rounded-2xl border border-ink/10">
                  <img
                    src={img("blog-hanging-shirts.png")}
                    alt=""
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-5">
                    <p className="text-xs text-ink/50">
                      {post.author} &middot; {post.date}
                    </p>
                    <h3 className="mt-2 font-serif text-lg font-semibold text-ink">{post.title}</h3>
                    <p className="mt-2 text-sm text-ink/60">{post.excerpt}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="pb-16">
        <div className="container-x flex flex-col items-center justify-between gap-6 rounded-3xl bg-ink px-8 py-10 text-white lg:flex-row">
          <div>
            <p className="eyebrow !text-lime">{company?.offer}</p>
            <h3 className="text-3xl font-semibold">{company?.ctaHeading}</h3>
          </div>
          <Link to="/contact" className="btn-pill-lime whitespace-nowrap">Schedule Pickup</Link>
        </div>
      </section>
    </div>
  );
}
