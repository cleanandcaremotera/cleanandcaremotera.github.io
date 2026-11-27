import { Star } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import { useHoneypot } from "../lib/honeypot.js";

// Each feedback link is tied to one order/booking (the `lead` param) — once
// submitted from this browser, remember it so re-opening the same link
// (easy to do by accident from a chat history) doesn't file a second,
// duplicate feedback entry for the same order.
const SUBMITTED_KEY = "cc_feedback_submitted";

function hasSubmitted(leadId) {
  if (!leadId) return false;
  try {
    const ids = JSON.parse(localStorage.getItem(SUBMITTED_KEY) || "[]");
    return Array.isArray(ids) && ids.includes(leadId);
  } catch {
    return false;
  }
}

function markSubmitted(leadId) {
  if (!leadId) return;
  try {
    const ids = JSON.parse(localStorage.getItem(SUBMITTED_KEY) || "[]");
    const list = Array.isArray(ids) ? ids : [];
    if (!list.includes(leadId)) {
      localStorage.setItem(SUBMITTED_KEY, JSON.stringify([...list, leadId]));
    }
  } catch {
    // Non-critical — worst case, this one link can be submitted again.
  }
}

export default function Feedback() {
  const [params] = useSearchParams();
  const leadId = params.get("lead") || null;
  const service = params.get("service") || "service";

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState(() => (hasSubmitted(leadId) ? { success: true, already: true } : null));
  const { honeypotFieldProps, isBot } = useHoneypot();

  async function submit(e) {
    e.preventDefault();
    if (isBot()) {
      setStatus({ success: true });
      return;
    }
    setStatus({ loading: true });
    try {
      await api.submitFeedback({ leadId, service, rating, comment });
      markSubmitted(leadId);
      setStatus({ success: true });
    } catch (err) {
      setStatus({ error: err.message });
    }
  }

  if (status?.success) {
    return (
      <div className="container-x flex min-h-[60vh] items-center justify-center py-16 text-center">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Thank you!</h1>
          <p className="mt-2 text-ink/60">
            {status.already ? "You've already shared feedback for this order." : "Your feedback helps us improve."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x flex min-h-[60vh] items-center justify-center py-16">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl border border-ink/10 p-8">
        <input type="text" {...honeypotFieldProps} />
        <div>
          <p className="eyebrow">Feedback</p>
          <h1 className="font-serif text-2xl font-semibold text-ink">
            How was your {service.toLowerCase()}?
          </h1>
        </div>

        <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <Star
                className={`h-8 w-8 ${
                  n <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "text-ink/20"
                }`}
              />
            </button>
          ))}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink/80">Comments (optional)</span>
          <textarea
            rows={4}
            className="w-full rounded-lg border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-lime-dark focus:ring-2 focus:ring-lime/30"
            placeholder="Tell us about your experience…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </label>

        <button type="submit" className="btn-pill-lime w-full justify-center" disabled={status?.loading}>
          {status?.loading ? "Submitting…" : "Submit Feedback"}
        </button>
        {status?.error && <p className="text-sm text-red-600">{status.error}</p>}
      </form>
    </div>
  );
}
