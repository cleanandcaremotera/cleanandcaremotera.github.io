import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeading from "../components/SectionHeading.jsx";
import { db } from "../lib/firebase.js";

export default function Offers() {
  const [offer, setOffer] = useState(null); // undefined = loading, null = none active

  useEffect(() => {
    getDoc(doc(db, "settings", "offerBanner"))
      .then((snap) => {
        const data = snap.exists() ? snap.data() : null;
        setOffer(data?.visible && data?.url ? data.url : null);
      })
      .catch(() => setOffer(null));
  }, []);

  return (
    <section className="py-16">
      <div className="container-x">
        <SectionHeading eyebrow="Limited Time" title="Current Offers" />

        <div className="mt-12">
          {offer === undefined && (
            <p className="text-center text-sm text-ink/50">Loading…</p>
          )}
          {offer === null && (
            <div className="mx-auto max-w-lg rounded-3xl border border-ink/10 bg-cream px-8 py-14 text-center">
              <p className="font-serif text-xl font-semibold text-ink">No active offers right now</p>
              <p className="mt-2 text-sm text-ink/60">
                Check back soon — or schedule a pickup anyway, we still give it our best.
              </p>
              <Link to="/contact#pickup-form" className="btn-pill-lime mt-6 inline-block">Schedule Pickup</Link>
            </div>
          )}
          {offer && (
            <img
              src={offer}
              alt="Current offer"
              className="mx-auto w-full max-w-4xl rounded-2xl shadow-lg"
              onError={() => setOffer(null)}
            />
          )}
        </div>
      </div>
    </section>
  );
}
