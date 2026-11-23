import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OfferCarousel from "../components/OfferCarousel.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import { db } from "../lib/firebase.js";

export default function Offers() {
  const [offers, setOffers] = useState(undefined); // undefined = loading, [] = none active

  useEffect(() => {
    getDoc(doc(db, "settings", "offerBanner"))
      .then((snap) => {
        const data = snap.exists() ? snap.data() : null;
        if (!data?.visible) return setOffers([]);
        // `urls` is the current shape; `url` is kept as a fallback for any
        // doc still in the old single-image shape before the admin's next save.
        const list = data.urls?.length ? data.urls : data.url ? [data.url] : [];
        setOffers(list);
      })
      .catch(() => setOffers([]));
  }, []);

  return (
    <section className="py-16">
      <div className="container-x">
        <SectionHeading eyebrow="Limited Time" title="Current Offers" />

        <div className="mt-12">
          {offers === undefined && (
            <p className="text-center text-sm text-ink/50">Loading…</p>
          )}
          {offers?.length === 0 && (
            <div className="mx-auto max-w-lg rounded-3xl border border-ink/10 bg-cream px-8 py-14 text-center">
              <p className="font-serif text-xl font-semibold text-ink">No active offers right now</p>
              <p className="mt-2 text-sm text-ink/60">
                Check back soon — or schedule a pickup anyway, we still give it our best.
              </p>
              <Link to="/schedule-pickup" className="btn-pill-lime mt-6 inline-block">Schedule Pickup</Link>
            </div>
          )}
          {offers && offers.length > 0 && <OfferCarousel images={offers} />}
        </div>
      </div>
    </section>
  );
}
