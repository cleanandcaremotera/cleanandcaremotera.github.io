import { Archive, ArchiveRestore, MessageCircle } from "lucide-react";
import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog.jsx";

export const STATUS_OPTIONS = ["new", "pending", "in-progress", "completed", "cancelled"];

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-800",
  pending: "bg-amber-100 text-amber-800",
  "in-progress": "bg-purple-100 text-purple-800",
  completed: "bg-lime/30 text-ink",
  cancelled: "bg-red-100 text-red-800",
};

export function StatusSelect({ status, onChange }) {
  return (
    <select
      value={status || "pending"}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-pill border-0 px-2.5 py-1 text-xs font-medium capitalize ${
        STATUS_COLORS[status] || "bg-cream text-ink"
      }`}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

export function NotifyButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Notify customer via WhatsApp"
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#128C7E] hover:bg-[#25D366]/25"
    >
      <MessageCircle className="h-4 w-4" />
    </button>
  );
}

function ArchiveButton({ archived, onClick }) {
  const Icon = archived ? ArchiveRestore : Archive;
  return (
    <button
      type="button"
      onClick={onClick}
      title={archived ? "Restore to inbox" : "Archive"}
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink/50 hover:bg-ink/10 hover:text-ink"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

// Generic table/card-list for every admin lead-type tab (Contact, Service
// Bookings, Cart Orders, Pickup Requests, Feedback). Each type supplies its
// own column/mobile-card rendering; this component owns the parts that are
// identical everywhere: row selection, bulk status/archive actions, and the
// per-row archive toggle. `archived` flips the row action to "restore" and
// the bulk action to "Restore Selected" for use on the Archive tab.
export default function LeadTable({
  title,
  items,
  columns,
  renderMobileCard,
  hasStatus = true,
  onStatusChange,
  onNotify,
  archived = false,
  onArchiveToggle,
  selectedIds,
  onToggleOne,
  onToggleAll,
  onBulkStatus,
  onBulkArchive,
  emptyText,
}) {
  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const colSpan = columns.length + (hasStatus ? 1 : 0) + 2;

  // Archive/restore is a one-click, somewhat-hidden icon button — a
  // confirmation step (for both a single row and the bulk toolbar) avoids
  // accidentally hiding a record the admin didn't mean to touch.
  const [pendingArchive, setPendingArchive] = useState(null); // { ids: string[] } | null
  const pendingCount = pendingArchive?.ids.length || 0;
  const pendingIsBulk = pendingCount > 1;
  const archiveActionWord = archived ? "Restore" : "Archive";
  const archiveDialogTitle = pendingIsBulk
    ? `${archiveActionWord} ${pendingCount} Selected Records?`
    : `${archiveActionWord} This Record?`;
  const archiveDialogMessage = archived
    ? pendingIsBulk
      ? "These records will be removed from the Archive tab and reappear in their regular list."
      : "This record will be removed from the Archive tab and reappear in its regular list."
    : pendingIsBulk
      ? "These records will be hidden from this list and moved to the Archive tab. You can restore them anytime."
      : "This record will be hidden from this list and moved to the Archive tab. You can restore it anytime.";

  function confirmPendingArchive() {
    if (!pendingArchive) return;
    if (pendingArchive.ids.length === 1) {
      onArchiveToggle(pendingArchive.ids[0], !archived);
    } else {
      onBulkArchive();
    }
    setPendingArchive(null);
  }

  return (
    <>
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold text-ink">{title}</h2>
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-pill bg-cream px-3 py-1.5">
            <span className="text-xs font-semibold text-ink/70">{selectedIds.size} selected</span>
            {hasStatus && (
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    onBulkStatus(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="rounded-pill border-0 bg-white px-2.5 py-1 text-xs font-medium text-ink"
              >
                <option value="" disabled>
                  Set status…
                </option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => setPendingArchive({ ids: [...selectedIds] })}
              className="rounded-pill bg-ink px-3 py-1 text-xs font-semibold text-white hover:bg-ink/80"
            >
              {archived ? "Restore Selected" : "Archive Selected"}
            </button>
          </div>
        )}
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-3 sm:hidden">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border p-4 ${selectedIds.has(item.id) ? "border-lime-dark bg-lime/5" : "border-ink/10"}`}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <input
                type="checkbox"
                checked={selectedIds.has(item.id)}
                onChange={() => onToggleOne(item.id)}
                className="h-4 w-4 rounded border-ink/30"
                aria-label="Select row"
              />
              <div className="flex items-center gap-2">
                {hasStatus && <StatusSelect status={item.status} onChange={(s) => onStatusChange(item.id, s)} />}
                {onNotify && <NotifyButton onClick={() => onNotify(item)} />}
                <ArchiveButton archived={archived} onClick={() => setPendingArchive({ ids: [item.id] })} />
              </div>
            </div>
            {renderMobileCard(item)}
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-ink/50">{emptyText}</p>}
      </div>

      {/* Tablet/desktop: table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-ink/10 sm:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-cream">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="h-4 w-4 rounded border-ink/30"
                  aria-label="Select all rows"
                />
              </th>
              {columns.map((c) => (
                <th key={c.label} className="px-4 py-3">
                  {c.label}
                </th>
              ))}
              {hasStatus && <th className="px-4 py-3">Status</th>}
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={`border-t border-ink/5 ${selectedIds.has(item.id) ? "bg-lime/5" : ""}`}>
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => onToggleOne(item.id)}
                    className="h-4 w-4 rounded border-ink/30"
                    aria-label="Select row"
                  />
                </td>
                {columns.map((c) => (
                  <td key={c.label} className="px-4 py-2.5">
                    {c.render(item)}
                  </td>
                ))}
                {hasStatus && (
                  <td className="px-4 py-2.5">
                    <StatusSelect status={item.status} onChange={(s) => onStatusChange(item.id, s)} />
                  </td>
                )}
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {onNotify && <NotifyButton onClick={() => onNotify(item)} />}
                    <ArchiveButton archived={archived} onClick={() => setPendingArchive({ ids: [item.id] })} />
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-ink/50" colSpan={colSpan}>
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>

    {pendingArchive && (
      <ConfirmDialog
        title={archiveDialogTitle}
        message={archiveDialogMessage}
        confirmLabel={archiveActionWord}
        onConfirm={confirmPendingArchive}
        onCancel={() => setPendingArchive(null)}
      />
    )}
    </>
  );
}
