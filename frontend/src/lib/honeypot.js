import { useRef, useState } from "react";

// Lightweight, dependency-free spam mitigation for the site's public forms
// (no CAPTCHA, no backend to run one) — all of them accept an unauthenticated
// `create` per firestore.rules, since a real customer has to be able to
// submit one without an account. Two generic-bot signals, combined:
//   - a field real visitors never see or fill, because it's positioned
//     off-screen rather than `display:none` (which some scrapers skip,
//     specifically to defeat the obvious version of this trick)
//   - a minimum time-on-page, since a scripted submission tends to fire
//     within milliseconds of the page loading
// This stops generic scripted form-spam, not a targeted attacker who reads
// this file — there's no way to do better than that without a server.
export function useHoneypot() {
  const [trap, setTrap] = useState("");
  const mountedAt = useRef(Date.now());

  const honeypotFieldProps = {
    name: "company_website",
    value: trap,
    onChange: (e) => setTrap(e.target.value),
    tabIndex: -1,
    autoComplete: "off",
    "aria-hidden": "true",
    className: "absolute left-[-9999px] top-0 h-px w-px overflow-hidden opacity-0",
  };

  function isBot() {
    if (trap) return true;
    return Date.now() - mountedAt.current < 1500;
  }

  return { honeypotFieldProps, isBot };
}
