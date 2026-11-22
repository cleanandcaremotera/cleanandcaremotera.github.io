import { Calendar, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { openWhatsAppChat } from "../lib/whatsapp.js";

// Persistent quick actions so "book a pickup" and "talk to us" are always
// one tap away, not just from the hero or nav. The bottom offset matches
// BottomNav's own clearance (see App.jsx) so the two never overlap on
// mobile; on desktop (no BottomNav) it just sits a little above the edge.
export default function FloatingActions() {
  return (
    <div
      className="fixed right-4 z-40 flex flex-col items-end gap-3 lg:right-6"
      style={{ bottom: "calc(3.5rem + env(safe-area-inset-bottom) + 16px)" }}
    >
      <button
        type="button"
        onClick={() => openWhatsAppChat()}
        className="flex items-center gap-2 rounded-pill bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-lg ring-1 ring-ink/10 transition-transform hover:-translate-y-0.5"
      >
        <MessageCircle className="h-4 w-4 text-[#25D366]" />
        Contact Us
      </button>
      <Link
        to="/contact"
        className="flex items-center gap-2 rounded-pill bg-lime px-4 py-2.5 text-sm font-semibold text-ink shadow-lg transition-transform hover:-translate-y-0.5"
      >
        <Calendar className="h-4 w-4" />
        Schedule Pickup
      </Link>
    </div>
  );
}
