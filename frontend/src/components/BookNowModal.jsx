import { CheckCircle2, MapPin, X } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { api } from "../api.js";
import { useHoneypot } from "../lib/honeypot.js";
import { isValidPhone, sanitizePhoneInput } from "../lib/phone.js";
import { sendServiceBookingViaWhatsApp } from "../lib/whatsapp.js";
import MapLoadingOverlay from "./MapLoadingOverlay.jsx";

// Leaflet + react-leaflet are a meaningful chunk on their own — only loaded
// once a visitor actually taps "Pin Your Location on Map", not on every page
// that happens to render this modal's trigger button.
const LocationPickerModal = lazy(() => import("./LocationPickerModal.jsx"));

const inputClass =
  "w-full rounded-lg border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-lime-dark focus:ring-2 focus:ring-lime/30";

export default function BookNowModal({ service, onClose }) {
  const [form, setForm] = useState({ name: "", phone: "", address: "", message: "" });
  const [status, setStatus] = useState(null);
  const [location, setLocation] = useState(null); // { lat, lng, url, address } | null
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const { honeypotFieldProps, isBot } = useHoneypot();

  function handleLocationConfirm(loc) {
    setLocation(loc);
    setShowLocationPicker(false);
    // The geocoded address is never written into the manual field — that's
    // for details a map pin can't capture (flat/society name).
  }

  function submit(e) {
    e.preventDefault();
    if (isBot()) {
      setStatus({ success: "Opening WhatsApp — just hit send there to confirm your booking." });
      return;
    }
    if (!isValidPhone(form.phone)) {
      setStatus({ error: "Enter a valid 10-digit mobile number." });
      return;
    }
    const payload = {
      serviceName: service.title,
      ...form,
      ...(location
        ? { locationUrl: location.url, lat: location.lat, lng: location.lng, pinnedAddress: location.address }
        : {}),
    };
    sendServiceBookingViaWhatsApp(payload);
    api.submitServiceBooking(payload).catch(() => {});
    setStatus({ success: "Opening WhatsApp — just hit send there to confirm your booking." });
  }

  return (
    <div
      // items-start (not items-center) + overflow-y-auto so a form taller
      // than the viewport — e.g. once the on-screen keyboard eats a third
      // of a short phone's screen — scrolls into view instead of having
      // its top (and the submit button) clipped off unreachably.
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/60 p-4 py-8 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md flex-shrink-0 rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Book Now</p>
            <h3 className="font-serif text-xl font-semibold text-ink">{service.title}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-ink/40 hover:bg-cream hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {status?.success ? (
          <div className="py-4 text-center">
            <p className="text-sm text-lime-dark">{status.success}</p>
            <button onClick={onClose} className="btn-pill-outline mt-6 !py-2 !text-xs">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input type="text" {...honeypotFieldProps} />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Name</span>
              <input
                required
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Phone</span>
              <input
                required
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                placeholder="10-digit mobile number"
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: sanitizePhoneInput(e.target.value) })}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Flat / Society Name &amp; Number</span>
              <input
                required
                placeholder="e.g. Flat 302, Shree Krishna Society"
                className={inputClass}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>

            <div>
              <button
                type="button"
                onClick={() => setShowLocationPicker(true)}
                className={`inline-flex items-center gap-1.5 !px-3.5 !py-1.5 !text-[11px] ${
                  location ? "btn-pill bg-lime/15 text-lime-dark hover:bg-lime/25" : "btn-pill-outline"
                }`}
              >
                {location ? <CheckCircle2 className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                {location ? "Location Pinned — Tap to Change" : "Pin Your Location on Map (Optional)"}
              </button>
              {location && (
                <p className="mt-1 text-xs text-ink/50">
                  Pinned location: {location.address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
                </p>
              )}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Message (optional)</span>
              <textarea
                rows={3}
                className={inputClass}
                placeholder="Anything we should know?"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </label>
            <button type="submit" className="btn-pill-lime w-full justify-center">
              Send via WhatsApp
            </button>
            {status?.error && <p className="text-sm text-red-600">{status.error}</p>}
          </form>
        )}
      </div>

      {showLocationPicker && (
        <Suspense fallback={<MapLoadingOverlay />}>
          <LocationPickerModal
            onConfirm={handleLocationConfirm}
            onClose={() => setShowLocationPicker(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
