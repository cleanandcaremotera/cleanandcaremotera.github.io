// Generic yes/no confirmation modal — same overlay/card pattern as
// BookNowModal (dark scrim, click-outside-to-cancel, stopPropagation on
// the card itself so clicks inside don't bubble to the overlay).
export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/60 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-ink/60">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-pill-outline !py-2 !text-xs">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="btn-pill-lime !py-2 !text-xs">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
