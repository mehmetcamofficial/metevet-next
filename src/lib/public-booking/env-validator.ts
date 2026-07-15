import "server-only";

/**
 * Server-only typed validator for Turnstile environment variables.
 *
 * TURNSTILE_ENABLED=false → local/dev submission may proceed without token
 * TURNSTILE_ENABLED=true  → secret and site key both required, fails closed
 *
 * Never returns secret values — only safe status indicators.
 */

export type TurnstileEnvStatus =
  | { ok: true; enabled: false }
  | { ok: true; enabled: true }
  | { ok: false; error: string };

/**
 * Validate Turnstile environment configuration.
 * Safe to call from anywhere — never returns or logs secret values.
 */
export function validateTurnstileEnv(): TurnstileEnvStatus {
  const enabledRaw = process.env.TURNSTILE_ENABLED;
  const enabled = enabledRaw !== "false" && enabledRaw !== "0";

  if (!enabled) {
    return { ok: true, enabled: false };
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!secretKey || secretKey.trim() === "") {
    return {
      ok: false,
      error: "TURNSTILE_SECRET_KEY is required when TURNSTILE_ENABLED=true",
    };
  }

  if (!siteKey || siteKey.trim() === "") {
    return {
      ok: false,
      error: "NEXT_PUBLIC_TURNSTILE_SITE_KEY is required when TURNSTILE_ENABLED=true",
    };
  }

  return { ok: true, enabled: true };
}
