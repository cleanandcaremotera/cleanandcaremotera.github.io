import { doc, increment, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";

// All day-bucketing for the Performance tab uses the business's own
// timezone (Ahmedabad, India) — not the visitor's or the server's — so a
// late-night visit doesn't get filed under the wrong calendar day.
export function dayKey(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

// Bumps today's visit counter by exactly 1. Public/unauthenticated — see
// firestore.rules' `analytics` match for how that's kept safe (increment-only,
// read restricted to the admin).
export async function trackVisit() {
  const key = dayKey();
  try {
    await setDoc(doc(db, "analytics", key), { date: key, visits: increment(1) }, { merge: true });
  } catch {
    // Non-critical — a missed visit count shouldn't break the site.
  }
}
