import { CheckCircle2, Mail, MapPin, Phone, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api.js";
import { useCompany } from "../context/CompanyContext.jsx";
import { sendContactViaWhatsApp, sendPickupViaWhatsApp } from "../lib/whatsapp.js";

// Links like /contact#pickup-form (Schedule Pickup buttons) or
// /contact#message-form (Contact Us links) bring the matching form to the
// front instead of landing on whichever one happens to be on the left.
function useHashHighlight() {
  const { hash } = useLocation();
  const [highlighted, setHighlighted] = useState(null);

  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlighted(id);
    const timer = setTimeout(() => setHighlighted(null), 2000);
    return () => clearTimeout(timer);
  }, [hash]);

  return (id) => (highlighted === id ? "ring-2 ring-lime-dark ring-offset-2" : "");
}

// `light` flips the label to a pale color for the dark "Schedule a Pickup"
// panel — the default ink/80 label is invisible against that panel's own
// ink background, which made every field in it look unlabeled.
function Field({ label, children, light = false }) {
  return (
    <label className="block">
      <span className={`mb-1.5 block text-sm font-medium ${light ? "text-white/80" : "text-ink/80"}`}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-lime-dark focus:ring-2 focus:ring-lime/30";

export default function Contact() {
  const { company } = useCompany();
  const highlightClass = useHashHighlight();

  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [contactStatus, setContactStatus] = useState(null);

  const [pickupForm, setPickupForm] = useState({
    name: "",
    phone: "",
    address: "",
    service: "",
    preferredDate: "",
    preferredTime: "",
  });
  const [pickupStatus, setPickupStatus] = useState(null);
  const [location, setLocation] = useState(null); // { lat, lng, url } | null
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);

  function captureLocation() {
    if (!navigator.geolocation) {
      setLocationError("Your browser doesn't support location sharing.");
      return;
    }
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({
          lat: latitude,
          lng: longitude,
          url: `https://www.google.com/maps?q=${latitude},${longitude}`,
        });
        setLocating(false);
      },
      (err) => {
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied — you can still type your address above."
            : "Couldn't get your location — you can still type your address above."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function submitContact(e) {
    e.preventDefault();
    sendContactViaWhatsApp(contactForm);
    setContactStatus({ success: "Opening WhatsApp — just hit send there to reach us." });
    // Also save to the backend in the background for the admin dashboard record.
    // Not awaited and errors are ignored: WhatsApp is the reliable channel now.
    api.sendContact(contactForm).catch(() => {});
    setContactForm({ name: "", phone: "", email: "", message: "" });
  }

  function submitPickup(e) {
    e.preventDefault();
    const payload = {
      ...pickupForm,
      ...(location ? { locationUrl: location.url, lat: location.lat, lng: location.lng } : {}),
    };
    sendPickupViaWhatsApp(payload);
    setPickupStatus({ success: "Opening WhatsApp — just hit send there to confirm your pickup." });
    api.schedulePickup(payload).catch(() => {});
    setPickupForm({ name: "", phone: "", address: "", service: "", preferredDate: "", preferredTime: "" });
    setLocation(null);
  }

  return (
    <div>
      <section className="bg-cream py-16 text-center">
        <div className="container-x">
          <p className="eyebrow">Contact Us</p>
          <h1 className="text-3xl font-semibold text-ink sm:text-4xl lg:text-5xl">We&rsquo;d Love to Hear From You</h1>
        </div>
      </section>

      <section className="container-x grid grid-cols-1 gap-12 py-16 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="flex gap-3">
            <MapPin className="h-5 w-5 flex-shrink-0 text-lime-dark" />
            <p className="text-sm text-ink/70">
              {company?.address?.line1}
              <br />
              {company?.address?.line2}
            </p>
          </div>
          <div className="flex gap-3">
            <Phone className="h-5 w-5 flex-shrink-0 text-lime-dark" />
            <p className="text-sm text-ink/70">{company?.phones?.join(" | ")}</p>
          </div>
          <div className="flex gap-3">
            <Mail className="h-5 w-5 flex-shrink-0 text-lime-dark" />
            <p className="text-sm text-ink/70">{company?.email}</p>
          </div>
        </div>

        <form
          id="message-form"
          onSubmit={submitContact}
          className={`space-y-4 rounded-2xl border border-ink/10 p-6 transition-shadow lg:col-span-1 ${highlightClass("message-form")}`}
        >
          <h3 className="font-serif text-xl font-semibold text-ink">Send a Message</h3>
          <Field label="Name">
            <input
              required
              className={inputClass}
              value={contactForm.name}
              onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <input
              required
              className={inputClass}
              value={contactForm.phone}
              onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
            />
          </Field>
          <Field label="Email (optional)">
            <input
              type="email"
              className={inputClass}
              value={contactForm.email}
              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
            />
          </Field>
          <Field label="Message">
            <textarea
              rows={4}
              className={inputClass}
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
            />
          </Field>
          <button type="submit" className="btn-pill-lime w-full justify-center">
            Send Message
          </button>
          {contactStatus?.success && <p className="text-sm text-lime-dark">{contactStatus.success}</p>}
        </form>

        <div
          id="pickup-form"
          className={`space-y-4 rounded-2xl bg-ink p-6 text-white transition-shadow lg:col-span-1 ${highlightClass("pickup-form")}`}
        >
          <h3 className="font-serif text-xl font-semibold">Schedule a Pickup</h3>

          <Link
            to="/pricing"
            className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-4 transition-colors hover:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 flex-shrink-0 text-lime" />
              <div>
                <p className="text-sm font-semibold">Know exactly what you need?</p>
                <p className="text-xs text-white/60">Pick items &amp; quantities from our price list</p>
              </div>
            </div>
            <span className="text-lime">&rarr;</span>
          </Link>

          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-white/40">
            <span className="h-px flex-1 bg-white/10" />
            or just tell us
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={submitPickup} className="space-y-4">
          <Field label="Name" light>
            <input
              required
              className={`${inputClass} border-white/20 bg-white/5 text-white placeholder:text-white/40`}
              value={pickupForm.name}
              onChange={(e) => setPickupForm({ ...pickupForm, name: e.target.value })}
            />
          </Field>
          <Field label="Phone" light>
            <input
              required
              className={`${inputClass} border-white/20 bg-white/5 text-white placeholder:text-white/40`}
              value={pickupForm.phone}
              onChange={(e) => setPickupForm({ ...pickupForm, phone: e.target.value })}
            />
          </Field>
          <div>
            <Field label="Pickup Address" light>
              <input
                required
                className={`${inputClass} border-white/20 bg-white/5 text-white placeholder:text-white/40`}
                value={pickupForm.address}
                onChange={(e) => setPickupForm({ ...pickupForm, address: e.target.value })}
              />
            </Field>
            <button
              type="button"
              onClick={captureLocation}
              disabled={locating}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-lime hover:underline disabled:opacity-50"
            >
              {location ? <CheckCircle2 className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
              {locating
                ? "Getting your location…"
                : location
                  ? "Location added — tap to refresh"
                  : "Share my current location (optional)"}
            </button>
            {location && (
              <p className="mt-1 text-xs text-white/50">
                Pinned at {location.lat.toFixed(5)}, {location.lng.toFixed(5)} — we&rsquo;ll use this to find you faster.
              </p>
            )}
            {locationError && <p className="mt-1 text-xs text-red-400">{locationError}</p>}
          </div>
          <Field label="Service (optional)" light>
            <input
              placeholder="e.g. Dry Cleaning, Wash & Fold"
              className={`${inputClass} border-white/20 bg-white/5 text-white placeholder:text-white/40`}
              value={pickupForm.service}
              onChange={(e) => setPickupForm({ ...pickupForm, service: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Preferred Date" light>
              <input
                type="date"
                className={`${inputClass} border-white/20 bg-white/5 text-white [color-scheme:dark]`}
                value={pickupForm.preferredDate}
                onChange={(e) => setPickupForm({ ...pickupForm, preferredDate: e.target.value })}
              />
            </Field>
            <Field label="Preferred Time" light>
              <input
                type="time"
                className={`${inputClass} border-white/20 bg-white/5 text-white [color-scheme:dark]`}
                value={pickupForm.preferredTime}
                onChange={(e) => setPickupForm({ ...pickupForm, preferredTime: e.target.value })}
              />
            </Field>
          </div>
          <button type="submit" className="btn-pill-lime w-full justify-center">
            Schedule Pickup
          </button>
          {pickupStatus?.success && <p className="text-sm text-lime">{pickupStatus.success}</p>}
          </form>
        </div>
      </section>
    </div>
  );
}
