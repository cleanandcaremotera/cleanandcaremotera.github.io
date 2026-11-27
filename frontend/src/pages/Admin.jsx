import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Archive as ArchiveIcon,
  CalendarClock,
  Image as ImageIcon,
  Mail,
  MessageCircle,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import AdminPricing from "../components/AdminPricing.jsx";
import AdminWhatsAppInbox from "../components/AdminWhatsAppInbox.jsx";
import LeadTable from "../components/LeadTable.jsx";
import { cloudinaryConfigured, uploadOfferImage } from "../lib/cloudinary.js";
import { auth, db } from "../lib/firebase.js";
import { img } from "../lib/assets.js";
import { leadServiceLabel, sendLeadUpdateViaWhatsApp } from "../lib/whatsapp.js";

const TABS = [
  { id: "offer", label: "Offer", icon: ImageIcon },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "contact", label: "Contact Us", icon: Mail },
  { id: "pricing", label: "Pricing & Discounts", icon: Tag },
  // Service Bookings, Cart Orders, and Pickup Requests all live under this
  // one tab now — they're all just `leads` with a different `type`, and
  // splitting them across three tabs was more navigation than the data
  // warranted. The type filter below lets the admin narrow back down.
  { id: "service", label: "Service Bookings", icon: CalendarClock },
  { id: "feedback", label: "Feedback", icon: Star },
  { id: "archive", label: "Archive", icon: ArchiveIcon },
];

const SERVICE_TYPE_FILTERS = [
  { id: "all", label: "All Types" },
  { id: "service", label: "Service Bookings" },
  { id: "cart", label: "Cart Orders" },
  { id: "pickup", label: "Pickup Requests" },
];

function ServiceTypeFilterBar({ value, onChange }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold text-ink/50">Filter:</span>
      {SERVICE_TYPE_FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={`rounded-pill px-3 py-1 text-xs font-semibold transition-colors ${
            value === f.id ? "bg-ink text-white" : "bg-cream text-ink/60 hover:bg-cream/70"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

const LEAD_TYPE_META = {
  service: { label: "Service Booking", icon: CalendarClock, className: "bg-sky-100 text-sky-800" },
  cart: { label: "Cart Order", icon: ShoppingCart, className: "bg-amber-100 text-amber-800" },
  pickup: { label: "Pickup Request", icon: Truck, className: "bg-violet-100 text-violet-800" },
};
function LeadTypeBadge({ type }) {
  const meta = LEAD_TYPE_META[type];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-pill px-2 py-0.5 text-[11px] font-semibold ${meta.className}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function FeedbackStars({ rating = 0 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-ink/20"}`} />
      ))}
    </div>
  );
}

function formatDate(ts) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(ts) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

// --- Column/mobile-card definitions for each lead type's LeadTable ---

// Service Bookings, Cart Orders, and Pickup Requests are merged into one
// table now — each has a different shape, so "Details" renders whatever
// fields that lead type actually has instead of forcing one column set.
function combinedServiceDetails(item) {
  if (item.type === "service") {
    return (
      <>
        <p className="font-medium">{item.serviceName}</p>
        <p className="text-ink/60">{item.address}</p>
        {item.locationUrl && (
          <a
            href={item.locationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs font-semibold text-lime-dark hover:underline"
          >
            View on map &rarr;
          </a>
        )}
        {item.message && <p className="text-xs text-ink/50">{item.message}</p>}
      </>
    );
  }
  if (item.type === "cart") {
    return (
      <>
        <p>{(item.items || []).map((it) => `${it.item} x${it.qty}`).join(", ")}</p>
        <p className="font-semibold text-ink">&#8377;{item.total}</p>
      </>
    );
  }
  if (item.type === "pickup") {
    return (
      <>
        <p>{item.address}</p>
        {item.service && <p className="text-xs text-ink/50">{item.service}</p>}
      </>
    );
  }
  return null;
}

const COMBINED_SERVICE_COLUMNS = [
  { label: "Type", render: (item) => <LeadTypeBadge type={item.type} /> },
  { label: "Name", render: (item) => item.name },
  { label: "Phone", render: (item) => item.phone },
  { label: "Details", render: (item) => <div className="text-sm">{combinedServiceDetails(item)}</div> },
];

function combinedServiceMobileCard(item) {
  return (
    <>
      <div className="mb-1.5">
        <LeadTypeBadge type={item.type} />
      </div>
      <p className="font-medium text-ink">{item.name}</p>
      <p className="mt-1 text-sm text-ink/60">{item.phone}</p>
      <div className="mt-2 text-sm text-ink/70">{combinedServiceDetails(item)}</div>
    </>
  );
}

const CONTACT_COLUMNS = [
  { label: "Name", render: (c) => c.name },
  { label: "Phone", render: (c) => c.phone },
  { label: "Email", render: (c) => c.email },
  { label: "Message", render: (c) => c.message },
];
function contactMobileCard(c) {
  return (
    <>
      <p className="font-medium text-ink">{c.name}</p>
      <p className="mt-1 text-sm text-ink/60">
        {c.phone}
        {c.email ? ` · ${c.email}` : ""}
      </p>
      {c.message && <p className="mt-1 text-sm text-ink/70">{c.message}</p>}
    </>
  );
}

const FEEDBACK_COLUMNS = [
  { label: "Service", render: (f) => <span className="font-medium">{f.service || "Service"}</span> },
  { label: "Rating", render: (f) => <FeedbackStars rating={f.rating} /> },
  { label: "Comment", render: (f) => f.comment },
  { label: "Date", render: (f) => <span className="text-ink/60">{formatDate(f.createdAt)}</span> },
];
function feedbackMobileCard(f) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-ink">{f.service || "Service"}</p>
        <FeedbackStars rating={f.rating} />
      </div>
      <p className="mt-1 text-xs text-ink/50">{formatDate(f.createdAt)}</p>
      {f.comment && <p className="mt-2 text-sm text-ink/70">{f.comment}</p>}
    </>
  );
}

const WHATSAPP_COLUMNS = [
  { label: "From", render: (m) => <span className="font-medium">{m.from}</span> },
  { label: "Message", render: (m) => m.text },
  { label: "Received", render: (m) => <span className="text-ink/60">{formatDateTime(m.createdAt)}</span> },
];
function whatsappMobileCard(m) {
  return (
    <>
      <p className="font-medium text-ink">{m.from}</p>
      <p className="mt-2 text-sm text-ink/70">{m.text}</p>
      <p className="mt-1 text-xs text-ink/50">{formatDateTime(m.createdAt)}</p>
    </>
  );
}

export default function Admin() {
  const [user, setUser] = useState(undefined); // undefined = still checking, null = signed out
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const [contacts, setContacts] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [cartOrders, setCartOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [whatsappMessages, setWhatsappMessages] = useState([]);
  const [whatsappLoading, setWhatsappLoading] = useState(true);

  const [offerFiles, setOfferFiles] = useState([]);
  const [offerStatus, setOfferStatus] = useState(null);
  const [offerVisible, setOfferVisible] = useState(false);
  const [offerUrls, setOfferUrls] = useState([]);
  const [offerProgress, setOfferProgress] = useState({ index: 0, total: 0, percent: 0 });

  // Row selection, keyed per table (not just per tab) — the Archive tab
  // renders several LeadTables at once, and without separate keys per
  // type a checkbox ticked in one table would bleed into another's
  // "N selected" count and bulk actions.
  const [selectedByType, setSelectedByType] = useState({});
  // Which lead type to show within the combined Service Bookings tab —
  // shared between the live view and the Archive tab's combined section.
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.some((t) => t.id === searchParams.get("tab")) ? searchParams.get("tab") : TABS[0].id;
  function setActiveTab(id) {
    setSearchParams({ tab: id });
  }

  useEffect(() => {
    setSelectedByType({});
  }, [activeTab]);

  function getSelected(type) {
    return selectedByType[type] || new Set();
  }
  function toggleOne(type, id) {
    setSelectedByType((prev) => {
      const current = prev[type] || new Set();
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, [type]: next };
    });
  }
  function toggleAll(type, items) {
    setSelectedByType((prev) => {
      const current = prev[type] || new Set();
      const allSelected = items.length > 0 && items.every((i) => current.has(i.id));
      return { ...prev, [type]: allSelected ? new Set() : new Set(items.map((i) => i.id)) };
    });
  }
  function clearSelected(type) {
    setSelectedByType((prev) => ({ ...prev, [type]: new Set() }));
  }

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  async function login(e) {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
    } catch (err) {
      setError(err.message.replace(/^Firebase:\s*/, ""));
    }
  }

  function logout() {
    signOut(auth);
  }

  async function uploadOffers(e) {
    e.preventDefault();
    if (offerFiles.length === 0) return;
    setOfferStatus({ loading: true });
    setOfferProgress({ index: 0, total: offerFiles.length, percent: 0 });
    try {
      const newUrls = [];
      for (let i = 0; i < offerFiles.length; i++) {
        // Each upload gets a brand-new Cloudinary URL (see lib/cloudinary.js —
        // the preset doesn't have Overwrite enabled, so reusing a fixed
        // public_id silently no-oped and kept serving the original image).
        const url = await uploadOfferImage(offerFiles[i], (percent) =>
          setOfferProgress({ index: i, total: offerFiles.length, percent })
        );
        newUrls.push(url);
      }
      const urls = [...offerUrls, ...newUrls];
      await setDoc(doc(db, "settings", "offerBanner"), { visible: true, urls });
      setOfferStatus({ success: "Offer image(s) added — now live on the Offers page." });
      setOfferFiles([]);
      setOfferVisible(true);
      setOfferUrls(urls);
    } catch (err) {
      setOfferStatus({ error: err.message });
    } finally {
      setOfferProgress({ index: 0, total: 0, percent: 0 });
    }
  }

  async function removeOfferImage(url) {
    const urls = offerUrls.filter((u) => u !== url);
    setOfferUrls(urls);
    try {
      await setDoc(doc(db, "settings", "offerBanner"), { visible: offerVisible, urls });
    } catch (err) {
      setOfferStatus({ error: err.message });
    }
  }

  async function toggleOfferVisible() {
    const visible = !offerVisible;
    setOfferVisible(visible);
    try {
      await setDoc(doc(db, "settings", "offerBanner"), { visible, urls: offerUrls });
      setOfferStatus({ success: visible ? "Offers are now visible on the Offers page." : "Offers hidden from the Offers page." });
    } catch (err) {
      setOfferStatus({ error: err.message });
    }
  }

  // Optimistically update local state, then persist — keeps the dropdown snappy.
  function makeStatusHandler(setList) {
    return async (id, status) => {
      setList((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      try {
        await api.updateLeadStatus(id, status);
      } catch {
        // Revert on failure by refetching isn't critical here — rare, and
        // the admin can just retry the dropdown if it doesn't stick.
      }
    };
  }
  const updateContactStatus = makeStatusHandler(setContacts);
  const updatePickupStatus = makeStatusHandler(setPickups);
  const updateCartStatus = makeStatusHandler(setCartOrders);
  const updateBookingStatus = makeStatusHandler(setBookings);

  // Single-row archive/restore toggle — reused for both the active tab
  // (archives) and the Archive tab (restores).
  function makeArchiveHandler(setList, markFn) {
    return async (id, archived) => {
      setList((prev) => prev.map((d) => (d.id === id ? { ...d, archived } : d)));
      try {
        await markFn([id], archived);
      } catch {
        // Not critical — admin can just retry the toggle.
      }
    };
  }
  const archiveContact = makeArchiveHandler(setContacts, api.markLeadsArchived);
  const archiveBooking = makeArchiveHandler(setBookings, api.markLeadsArchived);
  const archiveCart = makeArchiveHandler(setCartOrders, api.markLeadsArchived);
  const archivePickup = makeArchiveHandler(setPickups, api.markLeadsArchived);
  const archiveFeedbackItem = makeArchiveHandler(setFeedback, api.markFeedbackArchived);
  const archiveWhatsapp = makeArchiveHandler(setWhatsappMessages, api.markWhatsAppArchived);

  // Bulk variants — operate on whatever is selected under `type`'s key.
  function makeBulkStatusHandler(type, setList) {
    return async (status) => {
      const ids = [...getSelected(type)];
      if (ids.length === 0) return;
      setList((prev) => prev.map((d) => (ids.includes(d.id) ? { ...d, status } : d)));
      clearSelected(type);
      try {
        await api.bulkUpdateLeadStatus(ids, status);
      } catch {
        // Not critical — admin can just retry.
      }
    };
  }
  function makeBulkArchiveHandler(type, setList, markFn, archivedValue) {
    return async () => {
      const ids = [...getSelected(type)];
      if (ids.length === 0) return;
      setList((prev) => prev.map((d) => (ids.includes(d.id) ? { ...d, archived: archivedValue } : d)));
      clearSelected(type);
      try {
        await markFn(ids, archivedValue);
      } catch {
        // Not critical — admin can just retry.
      }
    };
  }

  // The combined Service Bookings table mixes three lead types sharing one
  // Firestore collection — a row's id alone doesn't say which of the three
  // local arrays it lives in, so look it up before dispatching.
  function findServiceLeadType(id) {
    if (bookings.some((b) => b.id === id)) return "service";
    if (cartOrders.some((o) => o.id === id)) return "cart";
    if (pickups.some((p) => p.id === id)) return "pickup";
    return null;
  }

  function updateServiceLeadStatus(id, status) {
    const type = findServiceLeadType(id);
    if (type === "service") updateBookingStatus(id, status);
    else if (type === "cart") updateCartStatus(id, status);
    else if (type === "pickup") updatePickupStatus(id, status);
  }

  function archiveServiceLead(id, archived) {
    const type = findServiceLeadType(id);
    if (type === "service") archiveBooking(id, archived);
    else if (type === "cart") archiveCart(id, archived);
    else if (type === "pickup") archivePickup(id, archived);
  }

  // Bulk variants for the combined table: a selection can span all three
  // types at once, so split the ids by type before updating local state —
  // the actual Firestore write is still one batch call either way, since
  // all three types live in the same `leads` collection.
  function makeCombinedBulkStatusHandler(selectionKey) {
    return async (status) => {
      const ids = [...getSelected(selectionKey)];
      if (ids.length === 0) return;
      const serviceIds = ids.filter((id) => bookings.some((b) => b.id === id));
      const cartIds = ids.filter((id) => cartOrders.some((o) => o.id === id));
      const pickupIds = ids.filter((id) => pickups.some((p) => p.id === id));
      if (serviceIds.length) setBookings((prev) => prev.map((b) => (serviceIds.includes(b.id) ? { ...b, status } : b)));
      if (cartIds.length) setCartOrders((prev) => prev.map((o) => (cartIds.includes(o.id) ? { ...o, status } : o)));
      if (pickupIds.length) setPickups((prev) => prev.map((p) => (pickupIds.includes(p.id) ? { ...p, status } : p)));
      clearSelected(selectionKey);
      try {
        await api.bulkUpdateLeadStatus(ids, status);
      } catch {
        // Not critical — admin can just retry.
      }
    };
  }

  function makeCombinedBulkArchiveHandler(selectionKey, archivedValue) {
    return async () => {
      const ids = [...getSelected(selectionKey)];
      if (ids.length === 0) return;
      const serviceIds = ids.filter((id) => bookings.some((b) => b.id === id));
      const cartIds = ids.filter((id) => cartOrders.some((o) => o.id === id));
      const pickupIds = ids.filter((id) => pickups.some((p) => p.id === id));
      if (serviceIds.length)
        setBookings((prev) => prev.map((b) => (serviceIds.includes(b.id) ? { ...b, archived: archivedValue } : b)));
      if (cartIds.length)
        setCartOrders((prev) => prev.map((o) => (cartIds.includes(o.id) ? { ...o, archived: archivedValue } : o)));
      if (pickupIds.length)
        setPickups((prev) => prev.map((p) => (pickupIds.includes(p.id) ? { ...p, archived: archivedValue } : p)));
      clearSelected(selectionKey);
      try {
        await api.markLeadsArchived(ids, archivedValue);
      } catch {
        // Not critical — admin can just retry.
      }
    };
  }

  async function markCombinedServiceSeenIfNeeded(list) {
    const unseenIds = list.filter((d) => d.seen === false).map((d) => d.id);
    if (unseenIds.length === 0) return;
    const unseenSet = new Set(unseenIds);
    setBookings((prev) => prev.map((b) => (unseenSet.has(b.id) ? { ...b, seen: true } : b)));
    setCartOrders((prev) => prev.map((o) => (unseenSet.has(o.id) ? { ...o, seen: true } : o)));
    setPickups((prev) => prev.map((p) => (unseenSet.has(p.id) ? { ...p, seen: true } : p)));
    try {
      await api.markLeadsSeen(unseenIds);
    } catch {
      // Not critical — the badge will just reappear until the next retry.
    }
  }

  // Clears a tab's unread badge by batch-marking any `seen: false` docs in
  // that list as seen, the moment the admin actually opens that tab.
  async function markSeenIfNeeded(list, setList, markFn) {
    const unseenIds = list.filter((d) => d.seen === false).map((d) => d.id);
    if (unseenIds.length === 0) return;
    setList((prev) => prev.map((d) => (unseenIds.includes(d.id) ? { ...d, seen: true } : d)));
    try {
      await markFn(unseenIds);
    } catch {
      // Not critical — the badge will just reappear until the next retry.
    }
  }

  // Active (non-archived) vs. archived split for every record type —
  // archived records are simply filtered out of the normal tabs and only
  // ever shown on the Archive tab.
  const activeContacts = contacts.filter((c) => c.archived !== true);
  const archivedContacts = contacts.filter((c) => c.archived === true);
  const activeBookings = bookings.filter((b) => b.archived !== true);
  const archivedBookings = bookings.filter((b) => b.archived === true);
  const activeCartOrders = cartOrders.filter((o) => o.archived !== true);
  const archivedCartOrders = cartOrders.filter((o) => o.archived === true);
  const activePickups = pickups.filter((p) => p.archived !== true);
  const archivedPickups = pickups.filter((p) => p.archived === true);
  const activeFeedback = feedback.filter((f) => f.archived !== true);
  const archivedFeedback = feedback.filter((f) => f.archived === true);
  const activeWhatsapp = whatsappMessages.filter((m) => m.archived !== true);
  const archivedWhatsapp = whatsappMessages.filter((m) => m.archived === true);

  // The combined Service Bookings view, before the type filter is applied —
  // the tab's own badge/count always reflects all three types regardless
  // of what the admin currently has the filter set to.
  const activeServiceLeads = [...activeBookings, ...activeCartOrders, ...activePickups].sort(
    (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
  );
  const archivedServiceLeads = [...archivedBookings, ...archivedCartOrders, ...archivedPickups].sort(
    (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
  );
  const activeServiceLeadsFiltered =
    serviceTypeFilter === "all" ? activeServiceLeads : activeServiceLeads.filter((i) => i.type === serviceTypeFilter);
  const archivedServiceLeadsFiltered =
    serviceTypeFilter === "all" ? archivedServiceLeads : archivedServiceLeads.filter((i) => i.type === serviceTypeFilter);
  const serviceEmptyText =
    serviceTypeFilter === "all"
      ? "No service bookings, cart orders, or pickup requests yet."
      : serviceTypeFilter === "service"
        ? "No service bookings yet."
        : serviceTypeFilter === "cart"
          ? "No cart orders yet."
          : "No pickup requests yet.";

  const hasArchivedRecords =
    archivedContacts.length > 0 || archivedServiceLeads.length > 0 || archivedFeedback.length > 0 || archivedWhatsapp.length > 0;

  useEffect(() => {
    if (!user) return;
    if (activeTab === "contact") markSeenIfNeeded(activeContacts, setContacts, api.markLeadsSeen);
    else if (activeTab === "service") markCombinedServiceSeenIfNeeded(activeServiceLeadsFiltered);
    else if (activeTab === "feedback") markSeenIfNeeded(activeFeedback, setFeedback, api.markFeedbackSeen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user, contacts, cartOrders, bookings, pickups, feedback, serviceTypeFilter]);

  const unreadByTab = {
    whatsapp: activeWhatsapp.filter((m) => !m.read).length,
    contact: activeContacts.filter((c) => c.seen === false).length,
    service: activeServiceLeads.filter((i) => i.seen === false).length,
    feedback: activeFeedback.filter((f) => f.seen === false).length,
  };

  const countByTab = {
    whatsapp: activeWhatsapp.length,
    contact: activeContacts.length,
    service: activeServiceLeads.length,
    feedback: activeFeedback.length,
  };

  async function toggleWhatsAppRead(id, read) {
    setWhatsappMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read } : m)));
    try {
      await api.markWhatsAppMessageRead(id, read);
    } catch {
      // Not critical — admin can just retry the toggle.
    }
  }

  function notifyCustomer(type, lead) {
    const label = leadServiceLabel(type, lead);
    const feedbackUrl = `${window.location.origin}${import.meta.env.BASE_URL}feedback?lead=${lead.id}&service=${encodeURIComponent(label)}`;
    sendLeadUpdateViaWhatsApp({ type, lead, feedbackUrl });
  }

  useEffect(() => {
    if (!user) return;

    getDoc(doc(db, "settings", "offerBanner")).then((snap) => {
      setOfferVisible(snap.exists() && snap.data().visible === true);
      const data = snap.exists() ? snap.data() : null;
      // `urls` is the current shape; `url` is a fallback for a doc still in
      // the old single-image shape, migrated to `urls` on the next save.
      setOfferUrls(data?.urls?.length ? data.urls : data?.url ? [data.url] : []);
    });

    api.getLeadsByType("contact").then(setContacts);
    api.getLeadsByType("pickup").then(setPickups);
    api.getLeadsByType("cart").then(setCartOrders);
    api.getLeadsByType("service").then(setBookings);
    api.getFeedback().then(setFeedback);
    api.getWhatsAppMessages().then(setWhatsappMessages).catch(() => {}).finally(() => setWhatsappLoading(false));
  }, [user]);

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-light text-center text-ink/50">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream-light px-5 py-16">
        <img src={img("logo.png")} alt="Clean & Care" className="h-12 w-auto" />
        <form onSubmit={login} className="w-full max-w-sm space-y-4 rounded-2xl border border-ink/10 bg-white p-8 shadow-lg">
          <div>
            <p className="eyebrow">Admin Access</p>
            <h1 className="font-serif text-2xl font-semibold text-ink">Dashboard Login</h1>
          </div>
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-lg border border-ink/15 px-4 py-2.5 text-sm focus:border-lime-dark focus:outline-none"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            placeholder="Password"
            type="password"
            className="w-full rounded-lg border border-ink/15 px-4 py-2.5 text-sm focus:border-lime-dark focus:outline-none"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button type="submit" className="btn-pill-lime w-full justify-center">Log In</button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
        <Link to="/" className="text-sm font-semibold text-ink/50 hover:text-ink">
          &larr; Back to Site
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-light">
      {/* Header band — same ink/lime language as the site's own CTA banners */}
      <div className="bg-ink text-white">
        <div className="container-x flex flex-wrap items-center justify-between gap-5 py-8">
          <div className="flex items-center gap-4">
            <img src={img("logo.png")} alt="Clean & Care" className="h-11 w-auto" />
            <div>
              <p className="eyebrow !mb-1 !text-lime">Admin</p>
              <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded-pill border border-white/25 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition-colors hover:border-lime hover:text-lime"
            >
              View Site
            </Link>
            <button onClick={logout} className="btn-pill-lime !py-2 !text-xs">Log Out</button>
          </div>
        </div>
      </div>

      <div className="container-x py-10">
        {/* Tab bar — record counts sit right in the label (small, muted) so
            the separate summary-card row isn't needed. */}
        <div className="mb-6 flex gap-1.5 overflow-x-auto rounded-pill bg-white p-1.5 shadow-sm">
          {TABS.map((t) => {
            const Icon = t.icon;
            const unread = unreadByTab[t.id] || 0;
            const count = countByTab[t.id];
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill px-4 py-2 text-sm font-semibold transition-colors ${
                  active ? "bg-ink text-white" : "text-ink/50 hover:bg-cream hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {t.label}
                {count !== undefined && (
                  <span className={`text-[10px] font-normal ${active ? "text-white/50" : "text-ink/35"}`}>
                    {count}
                  </span>
                )}
                {unread > 0 && (
                  <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-pill bg-red-600 px-1 text-[11px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active tab content, framed like the rest of the site's content cards */}
        <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-sm sm:p-8">
          {activeTab === "offer" && (
            <section className="mb-12">
              <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Offer Banner</h2>
              <p className="mb-4 text-sm text-ink/60">
                Upload one or more images to show as a slideshow on the site's Offers page.
              </p>
              <div className="rounded-2xl border border-ink/10 p-6">
                {offerUrls.length > 0 ? (
                  <div className="mb-5 flex flex-wrap gap-3">
                    {offerUrls.map((url) => (
                      <div key={url} className="group relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-cream">
                        <img src={url} alt="Offer" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeOfferImage(url)}
                          aria-label="Remove image"
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mb-5 text-xs text-ink/40">
                    {!cloudinaryConfigured()
                      ? "Image hosting not configured (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET missing)"
                      : "No offer images set"}
                  </p>
                )}

                <form onSubmit={uploadOffers} className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setOfferFiles(Array.from(e.target.files || []))}
                    className="block w-full text-sm text-ink/70 file:mr-4 file:rounded-pill file:border-0 file:bg-cream file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-lime/30"
                  />
                  {offerStatus?.loading && (
                    <div>
                      <div className="h-2 w-full overflow-hidden rounded-pill bg-cream">
                        <div
                          className="h-full rounded-pill bg-lime transition-all"
                          style={{ width: `${offerProgress.percent}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-ink/50">
                        Uploading image {offerProgress.index + 1} of {offerProgress.total}… {offerProgress.percent}%
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="btn-pill-lime !py-2 !text-xs"
                      disabled={offerFiles.length === 0 || offerStatus?.loading}
                    >
                      {offerStatus?.loading ? "Uploading…" : offerFiles.length > 1 ? `Upload ${offerFiles.length} Images` : "Upload"}
                    </button>
                    <button
                      type="button"
                      onClick={toggleOfferVisible}
                      className="btn-pill-outline !py-2 !text-xs"
                      disabled={offerUrls.length === 0 || offerStatus?.loading}
                    >
                      {offerVisible ? "Hide From Offers Page" : "Show On Offers Page"}
                    </button>
                  </div>
                  {offerStatus?.success && <p className="text-sm text-lime-dark">{offerStatus.success}</p>}
                  {offerStatus?.error && <p className="text-sm text-red-600">{offerStatus.error}</p>}
                </form>
              </div>
            </section>
          )}

          {activeTab === "whatsapp" && (
            <AdminWhatsAppInbox
              messages={activeWhatsapp}
              loading={whatsappLoading}
              onToggleRead={toggleWhatsAppRead}
              onArchive={(id) => archiveWhatsapp(id, true)}
            />
          )}

          {activeTab === "pricing" && <AdminPricing />}

          {activeTab === "service" && (
            <>
              <ServiceTypeFilterBar value={serviceTypeFilter} onChange={setServiceTypeFilter} />
              <LeadTable
                title="Service Bookings"
                items={activeServiceLeadsFiltered}
                columns={COMBINED_SERVICE_COLUMNS}
                renderMobileCard={combinedServiceMobileCard}
                onStatusChange={updateServiceLeadStatus}
                onNotify={(item) => notifyCustomer(item.type, item)}
                onArchiveToggle={archiveServiceLead}
                selectedIds={getSelected("service")}
                onToggleOne={(id) => toggleOne("service", id)}
                onToggleAll={() => toggleAll("service", activeServiceLeadsFiltered)}
                onBulkStatus={makeCombinedBulkStatusHandler("service")}
                onBulkArchive={makeCombinedBulkArchiveHandler("service", true)}
                emptyText={serviceEmptyText}
              />
            </>
          )}

          {activeTab === "contact" && (
            <LeadTable
              title="Contact Messages"
              items={activeContacts}
              columns={CONTACT_COLUMNS}
              renderMobileCard={contactMobileCard}
              onStatusChange={updateContactStatus}
              onNotify={(c) => notifyCustomer("contact", c)}
              onArchiveToggle={archiveContact}
              selectedIds={getSelected("contact")}
              onToggleOne={(id) => toggleOne("contact", id)}
              onToggleAll={() => toggleAll("contact", activeContacts)}
              onBulkStatus={makeBulkStatusHandler("contact", setContacts)}
              onBulkArchive={makeBulkArchiveHandler("contact", setContacts, api.markLeadsArchived, true)}
              emptyText="No messages yet."
            />
          )}

          {activeTab === "feedback" && (
            <LeadTable
              title="Customer Feedback"
              items={activeFeedback}
              columns={FEEDBACK_COLUMNS}
              renderMobileCard={feedbackMobileCard}
              hasStatus={false}
              onArchiveToggle={archiveFeedbackItem}
              selectedIds={getSelected("feedback")}
              onToggleOne={(id) => toggleOne("feedback", id)}
              onToggleAll={() => toggleAll("feedback", activeFeedback)}
              onBulkArchive={makeBulkArchiveHandler("feedback", setFeedback, api.markFeedbackArchived, true)}
              emptyText="No feedback submitted yet."
            />
          )}

          {activeTab === "archive" && (
            <div className="space-y-12">
              {!hasArchivedRecords && <p className="text-sm text-ink/50">No archived records yet.</p>}

              {archivedContacts.length > 0 && (
                <LeadTable
                  title="Archived Contact Messages"
                  items={archivedContacts}
                  columns={CONTACT_COLUMNS}
                  renderMobileCard={contactMobileCard}
                  archived
                  onStatusChange={updateContactStatus}
                  onNotify={(c) => notifyCustomer("contact", c)}
                  onArchiveToggle={archiveContact}
                  selectedIds={getSelected("contact-archived")}
                  onToggleOne={(id) => toggleOne("contact-archived", id)}
                  onToggleAll={() => toggleAll("contact-archived", archivedContacts)}
                  onBulkStatus={makeBulkStatusHandler("contact-archived", setContacts)}
                  onBulkArchive={makeBulkArchiveHandler("contact-archived", setContacts, api.markLeadsArchived, false)}
                  emptyText=""
                />
              )}

              {archivedServiceLeads.length > 0 && (
                <div>
                  <ServiceTypeFilterBar value={serviceTypeFilter} onChange={setServiceTypeFilter} />
                  <LeadTable
                    title="Archived Service Bookings"
                    items={archivedServiceLeadsFiltered}
                    columns={COMBINED_SERVICE_COLUMNS}
                    renderMobileCard={combinedServiceMobileCard}
                    archived
                    onStatusChange={updateServiceLeadStatus}
                    onNotify={(item) => notifyCustomer(item.type, item)}
                    onArchiveToggle={archiveServiceLead}
                    selectedIds={getSelected("service-archived")}
                    onToggleOne={(id) => toggleOne("service-archived", id)}
                    onToggleAll={() => toggleAll("service-archived", archivedServiceLeadsFiltered)}
                    onBulkStatus={makeCombinedBulkStatusHandler("service-archived")}
                    onBulkArchive={makeCombinedBulkArchiveHandler("service-archived", false)}
                    emptyText="No archived records match this filter."
                  />
                </div>
              )}

              {archivedFeedback.length > 0 && (
                <LeadTable
                  title="Archived Feedback"
                  items={archivedFeedback}
                  columns={FEEDBACK_COLUMNS}
                  renderMobileCard={feedbackMobileCard}
                  hasStatus={false}
                  archived
                  onArchiveToggle={archiveFeedbackItem}
                  selectedIds={getSelected("feedback-archived")}
                  onToggleOne={(id) => toggleOne("feedback-archived", id)}
                  onToggleAll={() => toggleAll("feedback-archived", archivedFeedback)}
                  onBulkArchive={makeBulkArchiveHandler("feedback-archived", setFeedback, api.markFeedbackArchived, false)}
                  emptyText=""
                />
              )}

              {archivedWhatsapp.length > 0 && (
                <LeadTable
                  title="Archived WhatsApp Messages"
                  items={archivedWhatsapp}
                  columns={WHATSAPP_COLUMNS}
                  renderMobileCard={whatsappMobileCard}
                  hasStatus={false}
                  archived
                  onArchiveToggle={archiveWhatsapp}
                  selectedIds={getSelected("whatsapp-archived")}
                  onToggleOne={(id) => toggleOne("whatsapp-archived", id)}
                  onToggleAll={() => toggleAll("whatsapp-archived", archivedWhatsapp)}
                  onBulkArchive={makeBulkArchiveHandler("whatsapp-archived", setWhatsappMessages, api.markWhatsAppArchived, false)}
                  emptyText=""
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
