import { Archive, ArchiveRestore, ChevronDown, MessageCircle } from "lucide-react";
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

// A labeled field inside an expanded row's detail panel — renders nothing
// if the value is empty, so optional fields (email, message, map link)
// don't leave behind an awkward blank caption.
export function DetailField({ label, children }) {
  if (children === undefined || children === null || children === "") return null;
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/40">{label}</p>
      <div className="mt-0.5 text-sm text-ink/80">{children}</div>
    </div>
  );
}

function LeadRow({
  item,
  renderTitle,
  renderSubtitle,
  renderBadge,
  renderDetails,
  hasStatus,
  onStatusChange,
  onNotify,
  archived,
  onArchiveClick,
  selected,
  onToggleSelect,
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-colors ${
        selected ? "border-lime-dark bg-lime/5" : "border-ink/10 bg-white"
      }`}
    >
      <div className="flex items-center gap-3 p-3.5 sm:p-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="h-4 w-4 flex-shrink-0 rounded border-ink/30"
          aria-label="Select row"
        />
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {renderBadge && <div className="flex-shrink-0">{renderBadge(item)}</div>}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-ink">{renderTitle(item)}</p>
            {renderSubtitle && <p className="truncate text-xs text-ink/50">{renderSubtitle(item)}</p>}
          </div>
          <ChevronDown
            className={`h-4 w-4 flex-shrink-0 text-ink/30 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
        <div className="flex flex-shrink-0 items-center gap-2">
          {hasStatus && <StatusSelect status={item.status} onChange={onStatusChange} />}
          {onNotify && <NotifyButton onClick={onNotify} />}
          <ArchiveButton archived={archived} onClick={onArchiveClick} />
        </div>
      </div>
      {expanded && (
        <div className="border-t border-ink/10 bg-cream/40 px-4 py-4 sm:px-5">{renderDetails(item)}</div>
      )}
    </div>
  );
}

// Elegant, compact-by-default list for every admin lead-type tab (Contact,
// Service Bookings, Feedback, archived WhatsApp). Each row shows just a
// title/subtitle/badge summary; tapping it expands a formatted detail panel
// with everything else. This component owns the parts that are identical
// everywhere: row selection, bulk status/archive actions, and the per-row
// archive toggle. `archived` flips the row action to "restore" and the
// bulk action to "Restore Selected" for use on the Archive tab.
export default function LeadTable({
  title,
  items,
  renderTitle,
  renderSubtitle,
  renderBadge,
  renderDetails,
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

        <div className="space-y-2">
          {items.map((item) => (
            <LeadRow
              key={item.id}
              item={item}
              renderTitle={renderTitle}
              renderSubtitle={renderSubtitle}
              renderBadge={renderBadge}
              renderDetails={renderDetails}
              hasStatus={hasStatus}
              onStatusChange={(s) => onStatusChange(item.id, s)}
              onNotify={onNotify ? () => onNotify(item) : null}
              archived={archived}
              onArchiveClick={() => setPendingArchive({ ids: [item.id] })}
              selected={selectedIds.has(item.id)}
              onToggleSelect={() => onToggleOne(item.id)}
            />
          ))}
          {items.length === 0 && <p className="text-sm text-ink/50">{emptyText}</p>}
        </div>

        {items.length > 0 && (
          <label className="mt-3 flex w-fit items-center gap-2 text-xs font-medium text-ink/50 hover:text-ink">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleAll}
              className="h-4 w-4 rounded border-ink/30"
            />
            Select all
          </label>
        )}
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
