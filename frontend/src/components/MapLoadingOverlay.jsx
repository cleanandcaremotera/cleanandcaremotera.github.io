import { Loader2 } from "lucide-react";

// Suspense fallback for LocationPickerModal, which is lazy-loaded (Leaflet
// and react-leaflet are a meaningful chunk of their own, needed only by the
// small share of visitors who open the map picker) — shown for the instant
// it takes that chunk to arrive.
export default function MapLoadingOverlay() {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4">
      <div className="flex items-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm text-ink/70 shadow-xl">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading map…
      </div>
    </div>
  );
}
