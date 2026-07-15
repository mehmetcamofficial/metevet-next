/**
 * Server-safe phone normalization for public booking.
 *
 * Mirrors the normalization logic in create_public_booking SQL function:
 *   1. Strip all non-digit characters
 *   2. Remove 0090 prefix (international with leading zeros)
 *   3. Remove 90 prefix when total length is 12 (international without leading zero)
 *   4. Remove leading 0 when total length is 11 (domestic format)
 *
 * Canonical output: 10-digit Turkish mobile number starting with 5.
 *   e.g. "5065859155"
 */

export function normalizePhone(raw: string): string {
  // Strip all non-digit characters
  let digits = raw.replace(/\D/g, "");

  // Strip international prefixes
  if (digits.startsWith("0090")) {
    digits = digits.substring(4);
  } else if (digits.startsWith("90") && digits.length === 12) {
    digits = digits.substring(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.substring(1);
  }

  return digits;
}

/**
 * Validate that a phone number is a valid Turkish mobile number after normalization.
 *
 * Rules:
 * - Must be exactly 10 digits
 * - Must start with 5 (Turkish mobile prefix)
 */
export function isValidTurkishMobile(normalized: string): boolean {
  return normalized.length === 10 && normalized.startsWith("5");
}

/**
 * Combined normalize + validate. Returns error string or null.
 */
export function validatePhone(raw: string): string | null {
  const normalized = normalizePhone(raw);
  if (!isValidTurkishMobile(normalized)) {
    return "Geçerli bir telefon numarası giriniz.";
  }
  return null;
}
