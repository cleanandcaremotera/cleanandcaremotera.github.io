import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase.js";

// Renders nothing unless Firestore's settings/offerBanner.visible is true
// AND the image actually loads. Visibility is a Firestore flag (not "does
// the Cloudinary asset exist") because removing it client-side can't call
// Cloudinary's delete API — that needs a secret we don't have in the browser.
//
// The image URL itself also comes from Firestore (written at upload time,
// see Admin.jsx) rather than being computed from a fixed public_id — each
// upload gets a brand-new Cloudinary URL, so there's never a stale cached
// copy to work around.
export default function OfferBanner() {
  const [visible, setVisible] = useState(false);
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "settings", "offerBanner"))
      .then((snap) => {
        setVisible(snap.exists() && snap.data().visible === true);
        setUrl(snap.exists() ? snap.data().url || null : null);
      })
      .catch(() => setVisible(false));
  }, []);

  if (!visible || !url || failed) return null;

  return (
    <section className="container-x py-10">
      <img
        src={url}
        alt="Current offer"
        className="mx-auto w-full max-w-4xl rounded-2xl shadow-lg"
        onError={() => setFailed(true)}
      />
    </section>
  );
}
