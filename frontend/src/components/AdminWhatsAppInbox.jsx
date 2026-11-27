import { Archive, MessageCircleMore } from "lucide-react";

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

// Messages (and their unread count) live in the parent Admin page now, so
// the tab bar can show an accurate badge without this inbox being mounted
// first — this component just renders what it's given.
export default function AdminWhatsAppInbox({ messages, loading, onToggleRead, onArchive }) {
  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <section className="mb-12">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="font-serif text-xl font-semibold text-ink">WhatsApp Inbox</h2>
        {unreadCount > 0 && (
          <span className="rounded-pill bg-lime px-2 py-0.5 text-xs font-bold text-ink">{unreadCount} new</span>
        )}
      </div>
      <p className="mb-4 text-sm text-ink/60">
        Messages sent to {" "}
        <a href="https://wa.me/918160677875" target="_blank" rel="noopener noreferrer" className="font-medium text-lime-dark hover:underline">
          +91 81606 77875
        </a>
        , the dedicated WhatsApp Business number.
      </p>

      {/* Mobile: stacked cards */}
      <div className="space-y-3 sm:hidden">
        {messages.map((m) => (
          <div key={m.id} className={`rounded-xl border p-4 ${m.read ? "border-ink/10" : "border-lime bg-lime/5"}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-ink">{m.from}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleRead(m.id, !m.read)}
                  className={`rounded-pill px-2.5 py-1 text-xs font-medium ${m.read ? "bg-cream text-ink/60" : "bg-lime text-ink"}`}
                >
                  {m.read ? "Read" : "Mark read"}
                </button>
                <button
                  onClick={() => onArchive(m.id)}
                  title="Archive"
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink/50 hover:bg-ink/10 hover:text-ink"
                >
                  <Archive className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-ink/70">{m.text}</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-ink/50">{formatTime(m.createdAt)}</p>
              <a
                href={replyLink(m.from)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-semibold text-lime-dark hover:underline"
              >
                <MessageCircleMore className="h-3.5 w-3.5" /> Reply
              </a>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-sm text-ink/50">{loading ? "Loading…" : "No WhatsApp messages yet."}</p>
        )}
      </div>

      {/* Tablet/desktop: table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-ink/10 sm:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-cream">
            <tr>
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id} className={`border-t border-ink/5 ${m.read ? "" : "bg-lime/5"}`}>
                <td className="px-4 py-2.5 font-medium">{m.from}</td>
                <td className="px-4 py-2.5">{m.text}</td>
                <td className="px-4 py-2.5 text-ink/60">{formatTime(m.createdAt)}</td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => onToggleRead(m.id, !m.read)}
                    className={`rounded-pill px-2.5 py-1 text-xs font-medium ${m.read ? "bg-cream text-ink/60" : "bg-lime text-ink"}`}
                  >
                    {m.read ? "Read" : "Mark read"}
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <a
                      href={replyLink(m.from)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-lime-dark hover:underline"
                    >
                      <MessageCircleMore className="h-3.5 w-3.5" /> Reply
                    </a>
                    <button
                      onClick={() => onArchive(m.id)}
                      title="Archive"
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink/50 hover:bg-ink/10 hover:text-ink"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr><td className="px-4 py-4 text-ink/50" colSpan={5}>{loading ? "Loading…" : "No WhatsApp messages yet."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
