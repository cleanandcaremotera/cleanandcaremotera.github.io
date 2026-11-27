import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Crosshair, Loader2, Search, X } from "lucide-react";
import { useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

// Leaflet's default marker icon references image paths that break once a
// bundler fingerprints them — the standard fix is to re-point them at the
// actual bundled asset URLs.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

// Ahmedabad (the business's own city) — only used until the visitor picks
// a real point, so the map never opens centered on the ocean.
const DEFAULT_CENTER = [23.0225, 72.5714];

async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
  );
  if (!res.ok) return "";
  const data = await res.json();
  return data.display_name || "";
}

function Recenter({ position }) {
  const map = useMap();
  map.setView(position, map.getZoom() < 14 ? 16 : map.getZoom());
  return null;
}

function ClickToPlace({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerModal({ onConfirm, onClose }) {
  const [position, setPosition] = useState(null); // [lat, lng] | null
  const [address, setAddress] = useState("");
  const [resolving, setResolving] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  async function pickPosition(lat, lng) {
    setPosition([lat, lng]);
    setResults([]);
    setError("");
    setResolving(true);
    setAddress(await reverseGeocode(lat, lng));
    setResolving(false);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location sharing.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        pickPosition(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied — search or tap the map instead."
            : "Couldn't get your location — search or tap the map instead."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function search(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setResults(data);
      if (data.length === 0) setError("No matches found — try a different search.");
    } catch {
      setError("Search failed — check your connection and try again.");
    } finally {
      setSearching(false);
    }
  }

  function pickResult(r) {
    setQuery(r.display_name);
    pickPosition(Number(r.lat), Number(r.lon));
  }

  function confirm() {
    if (!position) return;
    const [lat, lng] = position;
    onConfirm({ lat, lng, url: `https://www.google.com/maps?q=${lat},${lng}`, address });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/60 p-4" onClick={onClose}>
      <div
        // The header/search/map/footer sections are fixed-height, so without
        // its own scroll the max-h cap alone just clips content on a short
        // screen instead of making it reachable.
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-ink/10 p-5">
          <div>
            <p className="eyebrow">Pickup Location</p>
            <h3 className="font-serif text-xl font-semibold text-ink">Pin Your Location</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-ink/40 hover:bg-cream hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <form onSubmit={search} className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for an address or area"
              className="w-full rounded-lg border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-lime-dark focus:ring-2 focus:ring-lime/30"
            />
            <button
              type="submit"
              disabled={searching}
              className="flex flex-shrink-0 items-center justify-center rounded-lg bg-ink px-4 text-white disabled:opacity-50"
              aria-label="Search"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </button>
          </form>

          {results.length > 0 && (
            <ul className="max-h-36 overflow-y-auto rounded-lg border border-ink/10">
              {results.map((r) => (
                <li key={r.place_id}>
                  <button
                    type="button"
                    onClick={() => pickResult(r)}
                    className="w-full border-b border-ink/5 px-3 py-2 text-left text-xs text-ink/70 last:border-0 hover:bg-cream"
                  >
                    {r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="relative h-48 w-full flex-shrink-0 border-y border-ink/10 sm:h-72">
          <MapContainer
            center={position || DEFAULT_CENTER}
            zoom={position ? 16 : 12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickToPlace onPick={pickPosition} />
            {position && (
              <>
                <Recenter position={position} />
                <Marker
                  position={position}
                  draggable
                  eventHandlers={{
                    dragend: (e) => {
                      const { lat, lng } = e.target.getLatLng();
                      pickPosition(lat, lng);
                    },
                  }}
                />
              </>
            )}
          </MapContainer>

          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            aria-label="Locate me"
            title="Locate me"
            className="absolute bottom-3 right-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-lg ring-1 ring-ink/10 hover:bg-cream disabled:opacity-50"
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
          </button>
        </div>

        <div className="space-y-3 p-5">
          <p className="min-h-[2.5rem] text-xs text-ink/60">
            {!position
              ? "Search above, tap the locate-me button on the map, or tap anywhere on the map to drop a pin."
              : resolving
                ? "Looking up this address…"
                : address || "Pinned — drag the marker to fine-tune."}
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-pill-outline flex-1 justify-center">
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={!position}
              className="btn-pill-lime flex-1 justify-center disabled:opacity-50"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
