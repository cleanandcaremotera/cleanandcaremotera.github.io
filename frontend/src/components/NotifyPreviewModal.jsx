import { MessageCircle } from "lucide-react";
import { useState } from "react";

// Shown before an admin's "notify customer" WhatsApp message actually goes
// out — lets them see the exact text first, and (only on a completed
// update) tick a box to fold in a Google-review ask. `buildMessage` is
// called with the current tick state on every render so the preview stays
// live as the admin toggles the checkbox.
export default function NotifyPreviewModal({ buildMessage, showGoogleReviewOption, onConfirm, onCancel }) {
  const [includeGoogleReview, setIncludeGoogleReview] = useState(false);
  const message = buildMessage(includeGoogleReview);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-ink/60 p-4 py-8 sm:items-center"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md flex-shrink-0 rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="eyebrow flex items-center gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Preview
        </p>
        <h3 className="font-serif text-lg font-semibold text-ink">Message to Customer</h3>

        <div className="mt-4 whitespace-pre-wrap rounded-xl bg-cream p-4 text-sm text-ink/80">{message}</div>

        {showGoogleReviewOption && (
          <label className="mt-4 flex items-start gap-2.5 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={includeGoogleReview}
              onChange={(e) => setIncludeGoogleReview(e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-ink/30"
            />
            <span>Include Google review link — asks the customer to rate us on Google if satisfied</span>
          </label>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-pill-outline !py-2 !text-xs">
            Cancel
          </button>
          <button type="button" onClick={() => onConfirm(includeGoogleReview)} className="btn-pill-lime !py-2 !text-xs">
            Send via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
