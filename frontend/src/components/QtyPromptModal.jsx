import { Minus, Plus } from "lucide-react";
import { useState } from "react";

// Asks "how many?" before an item actually lands in the cart — shown after
// picking an item (and its Dry Clean / Steam Iron rate) from the Pricing
// page's category dropdown.
export default function QtyPromptModal({ item, serviceLabel, price, onConfirm, onCancel }) {
  const [qty, setQty] = useState(1);

  function changeQty(delta) {
    setQty((q) => Math.max(1, q + delta));
  }

  return (
    <div
      // items-start (not items-center) + overflow-y-auto so this never
      // clips off-screen on a short phone — same fix as the other modals.
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/60 p-4 py-8 sm:items-center"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm flex-shrink-0 rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="eyebrow">Add to Cart</p>
        <h3 className="font-serif text-lg font-semibold text-ink">{item}</h3>
        <p className="mt-1 text-sm text-ink/60">
          {serviceLabel ? `${serviceLabel} · ` : ""}&#8377;{price} each
        </p>

        <div className="mt-5">
          <span className="mb-1.5 block text-sm font-medium text-ink/80">Quantity</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => changeQty(-1)}
              aria-label="Decrease quantity"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-ink/15 hover:bg-cream"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 rounded-lg border border-ink/15 px-3 py-2 text-center text-sm outline-none focus:border-lime-dark focus:ring-2 focus:ring-lime/30"
            />
            <button
              type="button"
              onClick={() => changeQty(1)}
              aria-label="Increase quantity"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-ink/15 hover:bg-cream"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm font-semibold text-ink">Total: &#8377;{price * qty}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-pill-outline !py-2 !text-xs">
            Cancel
          </button>
          <button type="button" onClick={() => onConfirm(qty)} className="btn-pill-lime !py-2 !text-xs">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
