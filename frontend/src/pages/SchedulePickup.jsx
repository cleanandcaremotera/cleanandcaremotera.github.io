import { Calendar, CheckCircle2, Clock, MapPin, Phone, Shirt, ShoppingCart, Truck, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { ContactInfoSidebar, FormHeader, IconField, inputClass } from "../components/FormParts.jsx";
import LocationPickerModal from "../components/LocationPickerModal.jsx";
import { useCompany } from "../context/CompanyContext.jsx";
import { isValidPhone, sanitizePhoneInput } from "../lib/phone.js";
import { sendPickupViaWhatsApp } from "../lib/whatsapp.js";

export default function SchedulePickup() {
  const { company } = useCompany();

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
    // The geocoded address is never written into the manual address field —
    // that field is for details a map pin can't capture (flat/society name).
  }

  function submitPickup(e) {
    e.preventDefault();
    if (!isValidPhone(pickupForm.phone)) {
      setPickupStatus({ error: "Enter a valid 10-digit mobile number." });
      return;
    }
    const payload = {
      ...pickupForm,
      ...(location
        ? { locationUrl: location.url, lat: location.lat, lng: location.lng, pinnedAddress: location.address }
        : {}),
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
          <p className="eyebrow">Schedule a Pickup</p>
          <h1 className="text-3xl font-semibold text-ink sm:text-4xl lg:text-5xl">We&rsquo;ll Be At Your Doorstep</h1>
        </div>
      </section>

      <section className="container-x grid grid-cols-1 gap-10 py-16 lg:grid-cols-[300px_1fr] lg:gap-16">
        <ContactInfoSidebar company={company} />

        <div className="mx-auto w-full max-w-xl rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
          <FormHeader icon={Truck} title="Schedule a Pickup" subtitle="Doorstep pickup, at a time that works for you." />

          <Link
            to="/pricing"
            className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-cream p-4 transition-colors hover:bg-cream/70"
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

          <div className="mb-5 flex items-center gap-3 text-xs uppercase tracking-wide text-ink/40">
            <span className="h-px flex-1 bg-ink/10" />
            or just tell us
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          <form onSubmit={submitPickup} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <IconField label="Name" icon={User}>
                <input
                  required
                  className={inputClass}
                  value={pickupForm.name}
                  onChange={(e) => setPickupForm({ ...pickupForm, name: e.target.value })}
                />
              </IconField>
              <IconField label="Phone" icon={Phone}>
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
              </IconField>
            </div>

            <div>
              <IconField label="Flat / Society Name &amp; Number" icon={MapPin}>
                <input
                  required
                  placeholder="e.g. Flat 302, Shree Krishna Society"
                  className={inputClass}
                  value={pickupForm.address}
                  onChange={(e) => setPickupForm({ ...pickupForm, address: e.target.value })}
                />
              </IconField>
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
                  Pinned location: {location.address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
                </p>
              )}
            </div>

            <IconField label="Service (optional)" icon={Shirt}>
              <input
                placeholder="e.g. Dry Cleaning, Wash & Fold"
                className={inputClass}
                value={pickupForm.service}
                onChange={(e) => setPickupForm({ ...pickupForm, service: e.target.value })}
              />
            </IconField>

            <div className="grid grid-cols-2 gap-4">
              <IconField label="Preferred Date" icon={Calendar}>
                <input
                  type="date"
                  className={inputClass}
                  value={pickupForm.preferredDate}
                  onChange={(e) => setPickupForm({ ...pickupForm, preferredDate: e.target.value })}
                />
              </IconField>
              <IconField label="Preferred Time" icon={Clock}>
                <input
                  type="time"
                  className={inputClass}
                  value={pickupForm.preferredTime}
                  onChange={(e) => setPickupForm({ ...pickupForm, preferredTime: e.target.value })}
                />
              </IconField>
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
