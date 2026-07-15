/**
 * Cloudflare Turnstile configuration helpers.
 *
 * Pure utility — NOT a Server Action.
 * Used by the client to decide whether to render the Turnstile widget.
 */

/**
 * Check if Turnstile should be required (enabled in production).
 * Used by the client to decide whether to render the Turnstile widget.
 */
export function isTurnstileEnabled(): boolean {
  const enabled = process.env.TURNSTILE_ENABLED;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (enabled === "false") return false;
  if (enabled === "true") return true;
  // Default: enabled if both env vars exist (production default)
  return Boolean(siteKey && process.env.TURNSTILE_SECRET_KEY);
}
