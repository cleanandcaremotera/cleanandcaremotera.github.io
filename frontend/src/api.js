import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./lib/firebase.js";

const DEFAULT_DISCOUNT = { active: false, percent: 0, label: "" };

async function getOrdered(collectionName) {
  const q = query(collection(db, collectionName), orderBy("order"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function batchUpdate(collectionName, ids, data) {
  if (ids.length === 0) return;
  const batch = writeBatch(db);
  ids.forEach((id) => batch.update(doc(db, collectionName, id), data));
  await batch.commit();
}

// `seen` only exists on docs created after this feature shipped — older
// docs are left without the field so they never retroactively count as
// unread. Cleared in one batch write when the admin opens the matching tab.
function markSeen(collectionName, ids) {
  return batchUpdate(collectionName, ids, { seen: true });
}

export const api = {
  async getCompany() {
    const snap = await getDoc(doc(db, "company", "main"));
    return snap.exists() ? snap.data() : null;
  },

  getServices: () => getOrdered("services"),

  async getPricing() {
    const snap = await getDoc(doc(db, "pricing", "main"));
    const data = snap.exists() ? snap.data() : {};
    return { categories: data.categories || [], extras: data.extras || [] };
  },

  // Admin-only. Overwrites the whole catalog (every category's items, every
  // extras group) in a single write — used both by the per-row editors in
  // AdminPricing (which send back the full arrays with just one row
  // changed) and by the Excel bulk-replace import, which recomputes the
  // whole thing from the uploaded file including new/removed categories
  // and groups.
  async replacePricing({ categories, extras }) {
    await setDoc(doc(db, "pricing", "main"), { categories, extras });
  },

  getTestimonials: () => getOrdered("testimonials"),
  getBlog: () => getOrdered("blog"),

  async getDiscount() {
    const snap = await getDoc(doc(db, "settings", "discount"));
    return snap.exists() ? { ...DEFAULT_DISCOUNT, ...snap.data() } : DEFAULT_DISCOUNT;
  },

  // Admin-only (Firestore rules require an authenticated user for these).
  async updateDiscount(payload) {
    await setDoc(doc(db, "settings", "discount"), payload);
  },

  async getRateList() {
    const snap = await getDoc(doc(db, "settings", "rateList"));
    return snap.exists() ? snap.data() : { visible: false, urls: [] };
  },

  // Admin-only (Firestore rules require an authenticated user for these).
  async updateRateList(payload) {
    await setDoc(doc(db, "settings", "rateList"), payload);
  },

  async sendContact(payload) {
    await addDoc(collection(db, "leads"), {
      type: "contact",
      ...payload,
      status: "new",
      seen: false,
      archived: false,
      createdAt: serverTimestamp(),
    });
    return { message: "Thanks! We'll get back to you shortly." };
  },

  async schedulePickup(payload) {
    await addDoc(collection(db, "leads"), {
      type: "pickup",
      ...payload,
      status: "pending",
      seen: false,
      archived: false,
      createdAt: serverTimestamp(),
    });
    return { message: "Pickup scheduled! Our team will confirm shortly." };
  },

  async submitCartOrder(payload) {
    await addDoc(collection(db, "leads"), {
      type: "cart",
      ...payload,
      status: "pending",
      seen: false,
      archived: false,
      createdAt: serverTimestamp(),
    });
    return { message: "Order received! Confirm it on WhatsApp to finish." };
  },

  async submitServiceBooking(payload) {
    await addDoc(collection(db, "leads"), {
      type: "service",
      ...payload,
      status: "pending",
      seen: false,
      archived: false,
      createdAt: serverTimestamp(),
    });
    return { message: "Booking request sent! Confirm it on WhatsApp to finish." };
  },

  // Admin-only (Firestore rules require an authenticated user for these).
  async getLeadsByType(type) {
    const q = query(collection(db, "leads"), where("type", "==", type), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async updateLeadStatus(id, status) {
    await updateDoc(doc(db, "leads", id), { status });
  },

  // Bulk status change for the "select several rows, set status once" flow.
  async bulkUpdateLeadStatus(ids, status) {
    await batchUpdate("leads", ids, { status });
  },

  // Admin-only. Batch-clears the "unread" badge for a lead type's tab.
  async markLeadsSeen(ids) {
    await markSeen("leads", ids);
  },

  async markLeadsArchived(ids, archived) {
    await batchUpdate("leads", ids, { archived });
  },

  async submitFeedback(payload) {
    await addDoc(collection(db, "feedback"), { ...payload, seen: false, archived: false, createdAt: serverTimestamp() });
  },

  // Admin-only (Firestore rules require an authenticated user for this).
  async getFeedback() {
    const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async markFeedbackSeen(ids) {
    await markSeen("feedback", ids);
  },

  async markFeedbackArchived(ids, archived) {
    await batchUpdate("feedback", ids, { archived });
  },

  // Admin-only. Written server-side by the Cloudflare Worker webhook
  // receiver (see cloudflare-worker/), never by the client.
  async getWhatsAppMessages() {
    const q = query(collection(db, "whatsappMessages"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async markWhatsAppMessageRead(id, read) {
    await updateDoc(doc(db, "whatsappMessages", id), { read });
  },

  async markWhatsAppArchived(ids, archived) {
    await batchUpdate("whatsappMessages", ids, { archived });
  },
};
