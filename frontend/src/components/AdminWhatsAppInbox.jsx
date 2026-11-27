import { Archive, ChevronDown, MessageCircleMore } from "lucide-react";
import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog.jsx";
import { DetailField } from "./LeadTable.jsx";

function formatTime(ts) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

// Opens the sender's number in regular WhatsApp (not the Business API) so
// the admin can reply by hand — this inbox is read-only, replying through
// the Cloud API needs either the 24h customer-service window or an
// approved message template, out of scope for a simple inbox view.
function replyLink(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

// Compact by default (sender + time); tap to expand the full message text
// and the reply link — same accordion pattern as LeadTable's rows.
function MessageRow({ message: m, onToggleRead, onArchiveClick }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-colors ${
        m.read ? "border-ink/10 bg-white" : "border-lime bg-lime/5"
      }`}
    >
      <div className="flex items-center gap-3 p-3.5 sm:p-4">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-ink">{m.from}</p>
            <p className="truncate text-xs text-ink/50">{formatTime(m.createdAt)}</p>
          </div>
          <ChevronDown
            className={`h-4 w-4 flex-shrink-0 text-ink/30 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={() => onToggleRead(m.id, !m.read)}
            className={`rounded-pill px-2.5 py-1 text-xs font-medium ${m.read ? "bg-cream text-ink/60" : "bg-lime text-ink"}`}
          >
            {m.read ? "Read" : "Mark read"}
          </button>
          <button
            onClick={onArchiveClick}
            title="Archive"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink/50 hover:bg-ink/10 hover:text-ink"
          >
            <Archive className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-ink/10 bg-cream/40 px-4 py-4 sm:px-5">
          <DetailField label="Message">{m.text}</DetailField>
          <a
            href={replyLink(m.from)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-lime-dark hover:underline"
          >
            <MessageCircleMore className="h-3.5 w-3.5" /> Reply on WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

// Messages (and their unread count) live in the parent Admin page now, so
// the tab bar can show an accurate badge without this inbox being mounted
// first — this component just renders what it's given.
export default function AdminWhatsAppInbox({ messages, loading, onToggleRead, onArchive }) {
  const unreadCount = messages.filter((m) => !m.read).length;
  const [pendingArchiveId, setPendingArchiveId] = useState(null);

  function confirmArchive() {
    if (pendingArchiveId) onArchive(pendingArchiveId);
    setPendingArchiveId(null);
  }

  return (
    <>
      <section className="mb-12">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="font-serif text-xl font-semibold text-ink">WhatsApp Inbox</h2>
          {unreadCount > 0 && (
            <span className="rounded-pill bg-lime px-2 py-0.5 text-xs font-bold text-ink">{unreadCount} new</span>
          )}
        </div>
        <p className="mb-4 text-sm text-ink/60">
          Messages sent to{" "}
          <a
            href="https://wa.me/918160677875"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-lime-dark hover:underline"
          >
            +91 81606 77875
          </a>
          , the dedicated WhatsApp Business number.
        </p>

        <div className="space-y-2">
          {messages.map((m) => (
            <MessageRow
              key={m.id}
              message={m}
              onToggleRead={onToggleRead}
              onArchiveClick={() => setPendingArchiveId(m.id)}
            />
          ))}
          {messages.length === 0 && (
            <p className="text-sm text-ink/50">{loading ? "Loading…" : "No WhatsApp messages yet."}</p>
          )}
        </div>
      </section>

      {pendingArchiveId && (
        <ConfirmDialog
          title="Archive This Message?"
          message="This WhatsApp message will be hidden from the inbox and moved to the Archive tab. You can restore it anytime."
          confirmLabel="Archive"
          onConfirm={confirmArchive}
          onCancel={() => setPendingArchiveId(null)}
        />
      )}
    </>
  );
}
