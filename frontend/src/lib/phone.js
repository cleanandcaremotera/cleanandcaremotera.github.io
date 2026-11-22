// Strips anything non-numeric as the user types (so pasting or typing
// letters/symbols never gets in), capped at 10 digits — Indian mobile
// numbers are what every form on this site actually sends to WhatsApp.
export function sanitizePhoneInput(raw) {
  return raw.replace(/\D/g, "").slice(0, 10);
}

export function isValidPhone(digits) {
  return /^[6-9]\d{9}$/.test(digits);
}
