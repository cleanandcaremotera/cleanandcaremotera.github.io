import { CheckCircle2, Mail, MapPin, Phone, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api.js";
import LocationPickerModal from "../components/LocationPickerModal.jsx";
import { useCompany } from "../context/CompanyContext.jsx";
import { isValidPhone, sanitizePhoneInput } from "../lib/phone.js";
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

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink/80">{label}</span>
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
  const [location, setLocation] = useState(null); // { lat, lng, url, address } | null
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  function handleLocationConfirm(loc) {
    setLocation(loc);
    setShowLocationPicker(false);
    // Only auto-fill the typed address if the visitor hasn't written their
    // own — never overwrite something they already typed.
    setPickupForm((prev) => (prev.address ? prev : { ...prev, address: loc.address }));
  }

  function submitContact(e) {
    e.preventDefault();
    if (!isValidPhone(contactForm.phone)) {
      setContactStatus({ error: "Enter a valid 10-digit mobile number." });
      return;
    }
    sendContactViaWhatsApp(contactForm);
    setContactStatus({ success: "Opening WhatsApp — just hit send there to reach us." });
    // Also save to the backend in the background for the admin dashboard record.
    // Not awaited and errors are ignored: WhatsApp is the reliable channel now.
    api.sendContact(contactForm).catch(() => {});
    setContactForm({ name: "", phone: "", email: "", message: "" });
  }

  function submitPickup(e) {
    e.preventDefault();
    if (!isValidPhone(pickupForm.phone)) {
      setPickupStatus({ error: "Enter a valid 10-digit mobile number." });
      return;
    }
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
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              placeholder="10-digit mobile number"
              className={inputClass}
              value={contactForm.phone}
              onChange={(e) => setContactForm({ ...contactForm, phone: sanitizePhoneInput(e.target.value) })}
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
          {contactStatus?.error && <p className="text-sm text-red-600">{contactStatus.error}</p>}
        </form>

        <div
          id="pickup-form"
          className={`space-y-4 rounded-2xl border border-ink/10 p-6 transition-shadow lg:col-span-1 ${highlightClass("pickup-form")}`}
        >
          <h3 className="font-serif text-xl font-semibold text-ink">Schedule a Pickup</h3>

          <Link
            to="/pricing"
            className="flex items-center justify-between gap-3 rounded-xl bg-cream p-4 transition-colors hover:bg-cream/70"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 flex-shrink-0 text-lime-dark" />
              <div>
                <p className="text-sm font-semibold text-ink">Know exactly what you need?</p>
                <p className="text-xs text-ink/60">Pick items &amp; quantities from our price list</p>
              </div>
            </div>
            <span className="text-lime-dark">&rarr;</span>
          </Link>

          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-ink/40">
            <span className="h-px flex-1 bg-ink/10" />
            or just tell us
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          <form onSubmit={submitPickup} className="space-y-4">
          <Field label="Name">
            <input
              required
              className={inputClass}
              value={pickupForm.name}
              onChange={(e) => setPickupForm({ ...pickupForm, name: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <input
              required
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              placeholder="10-digit mobile number"
              className={inputClass}
              value={pickupForm.phone}
              onChange={(e) => setPickupForm({ ...pickupForm, phone: sanitizePhoneInput(e.target.value) })}
            />
          </Field>
          <div>
            <Field label="Pickup Address">
              <input
                required
                className={inputClass}
                value={pickupForm.address}
                onChange={(e) => setPickupForm({ ...pickupForm, address: e.target.value })}
              />
            </Field>
            <button
              type="button"
              onClick={() => setShowLocationPicker(true)}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-lime-dark hover:underline"
            >
              {location ? <CheckCircle2 className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
              {location ? "Location pinned — tap to change" : "Pin pickup location on map (optional)"}
            </button>
            {location && (
              <p className="mt-1 text-xs text-ink/50">
                {location.address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
              </p>
            )}
          </div>
          <Field label="Service (optional)">
            <input
              placeholder="e.g. Dry Cleaning, Wash & Fold"
              className={inputClass}
              value={pickupForm.service}
              onChange={(e) => setPickupForm({ ...pickupForm, service: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Preferred Date">
              <input
                type="date"
                className={inputClass}
                value={pickupForm.preferredDate}
                onChange={(e) => setPickupForm({ ...pickupForm, preferredDate: e.target.value })}
              />
            </Field>
            <Field label="Preferred Time">
              <input
                type="time"
                className={inputClass}
                value={pickupForm.preferredTime}
                onChange={(e) => setPickupForm({ ...pickupForm, preferredTime: e.target.value })}
              />
            </Field>
          </div>
          <button type="submit" className="btn-pill-lime w-full justify-center">
            Schedule Pickup
          </button>
          {pickupStatus?.success && <p className="text-sm text-lime-dark">{pickupStatus.success}</p>}
          {pickupStatus?.error && <p className="text-sm text-red-600">{pickupStatus.error}</p>}
          </form>
        </div>
      </section>

      {showLocationPicker && (
        <LocationPickerModal
          onConfirm={handleLocationConfirm}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
}
