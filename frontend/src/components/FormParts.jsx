import { Mail, MapPin, Phone } from "lucide-react";

export const inputClass =
  "w-full rounded-lg border border-ink/15 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-lime-dark focus:ring-2 focus:ring-lime/30";

// Every field gets a leading icon inside the input — the small touch that
// separates a "rich" form from a stack of bare label+input pairs.
export function IconField({ label, icon: Icon, textarea = false, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink/80">{label}</span>
      <div className="relative">
        <Icon
          className={`pointer-events-none absolute left-3.5 h-4 w-4 text-ink/35 ${
            textarea ? "top-3.5" : "top-1/2 -translate-y-1/2"
          }`}
        />
        {children}
      </div>
    </label>
  );
}

export function FormHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-lime/20">
        <Icon className="h-5 w-5 text-lime-dark" strokeWidth={1.75} />
      </div>
      <div>
        <h3 className="font-serif text-xl font-semibold text-ink">{title}</h3>
        <p className="text-xs text-ink/50">{subtitle}</p>
      </div>
    </div>
  );
}

export function ContactInfoSidebar({ company }) {
  return (
    <aside className="space-y-6 lg:pt-2">
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
    </aside>
  );
}
