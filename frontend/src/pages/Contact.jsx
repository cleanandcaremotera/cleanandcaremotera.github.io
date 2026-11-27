import { Mail, MessageSquare, Phone, User } from "lucide-react";
import { useState } from "react";
import { api } from "../api.js";
import { ContactInfoSidebar, FormHeader, IconField, inputClass } from "../components/FormParts.jsx";
import { useCompany } from "../context/CompanyContext.jsx";
import { useHoneypot } from "../lib/honeypot.js";
import { isValidPhone, sanitizePhoneInput } from "../lib/phone.js";
import { sendContactViaWhatsApp } from "../lib/whatsapp.js";

export default function Contact() {
  const { company } = useCompany();
  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [contactStatus, setContactStatus] = useState(null);
  const { honeypotFieldProps, isBot } = useHoneypot();

  function submitContact(e) {
    e.preventDefault();
    if (isBot()) {
      setContactStatus({ success: "Opening WhatsApp — just hit send there to reach us." });
      setContactForm({ name: "", phone: "", email: "", message: "" });
      return;
    }
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

  return (
    <div>
      <section className="bg-cream py-16 text-center">
        <div className="container-x">
          <p className="eyebrow">Contact Us</p>
          <h1 className="text-3xl font-semibold text-ink sm:text-4xl lg:text-5xl">We&rsquo;d Love to Hear From You</h1>
        </div>
      </section>

      <section className="container-x grid grid-cols-1 gap-10 py-16 lg:grid-cols-[300px_1fr] lg:gap-16">
        <ContactInfoSidebar company={company} />

        <div className="mx-auto w-full max-w-xl rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
          <FormHeader icon={MessageSquare} title="Send a Message" subtitle="We typically reply within a few hours." />

          <form onSubmit={submitContact} className="space-y-4">
            <input type="text" {...honeypotFieldProps} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <IconField label="Name" icon={User}>
                <input
                  required
                  className={inputClass}
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
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
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: sanitizePhoneInput(e.target.value) })}
                />
              </IconField>
            </div>

            <IconField label="Email (optional)" icon={Mail}>
              <input
                type="email"
                className={inputClass}
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              />
            </IconField>

            <IconField label="Message" icon={MessageSquare} textarea>
              <textarea
                rows={4}
                className={inputClass}
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
              />
            </IconField>

            <button type="submit" className="btn-pill-lime w-full justify-center">
              Send Message
            </button>
            {contactStatus?.success && <p className="text-sm text-lime-dark">{contactStatus.success}</p>}
            {contactStatus?.error && <p className="text-sm text-red-600">{contactStatus.error}</p>}
          </form>
        </div>
      </section>
    </div>
  );
}
