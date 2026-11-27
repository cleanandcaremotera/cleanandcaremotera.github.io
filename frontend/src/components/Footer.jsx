import { Facebook, Instagram, Mail, MapPin, Phone, Star, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { useCompany } from "../context/CompanyContext.jsx";
import { img } from "../lib/assets.js";

// The business's Google Business Profile review link (by Place ID) — a
// fixed external URL, not admin-editable content, so it lives here rather
// than in the company doc.
const GOOGLE_REVIEW_URL = "https://search.google.com/local/writereview?placeid=ChIJlaPPNwCDXjkRUk3l-yrmNiU";

export default function Footer() {
  const { company } = useCompany();

  return (
    <footer className="bg-ink text-white">
      <div className="container-x py-10">
        <div className="grid grid-cols-1 gap-10 py-10 sm:grid-cols-2">
          <div>
            <img src={img("logo-mark.png")} alt="Clean & Care" className="mb-4 h-14 w-14" />
            <p className="text-sm italic text-white/70">
              &ldquo;{company?.footerQuote || "India's Trusted Live Professional Laundry & Dry-Cleaning Services at Global Standards"}&rdquo;
            </p>
            <Link to="/about" className="mt-4 inline-block text-sm font-semibold text-lime hover:underline">
              Read More &rarr;
            </Link>
            <div className="mt-5 flex gap-3">
              <a href={company?.social?.youtube || "#"} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-lime hover:text-ink">
                <Youtube className="h-4 w-4" />
              </a>
              <a href={company?.social?.facebook || "#"} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-lime hover:text-ink">
                <Facebook className="h-4 w-4" />
              </a>
              <a href={company?.social?.instagram || "#"} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-lime hover:text-ink">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill-lime mt-5 !py-2 !text-xs"
            >
              <Star className="h-3.5 w-3.5" />
              Rate Us on Google
            </a>
          </div>

          <div>
            <h4 className="mb-4 font-serif text-xl font-semibold">Contact Us</h4>
            <ul className="space-y-4 text-sm text-white/75">
              <li className="flex gap-3">
                <MapPin className="h-5 w-5 flex-shrink-0 text-lime" />
                <span>
                  {company?.address?.line1}
                  <br />
                  {company?.address?.line2}
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="h-5 w-5 flex-shrink-0 text-lime" />
                <span>{company?.phones?.join(" | ")}</span>
              </li>
              <li className="flex gap-3">
                <Mail className="h-5 w-5 flex-shrink-0 text-lime" />
                <span>{company?.email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Clean &amp; Care. All rights reserved.</p>
          <p>Design &amp; Develop by: {company?.designCredit || "Clean & Care"}</p>
        </div>
      </div>
    </footer>
  );
}
