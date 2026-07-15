"use server";

/**
 * Cloudflare Turnstile verification helper.
 *
 * Uses TURNSTILE_SECRET_KEY environment variable.
 * Fails closed when TURNSTILE_ENABLED=true but keys are missing.
 *
 * Never stores the token, never logs the token,
 * never includes it in audit trails or database records.
 */

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Verify a Turnstile token server-side.
 *
 * @param token - The token from the client-side Turnstile widget
 * @param ip - Optional client IP for Cloudflare verification
 * @returns TurnstileResult
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  ip?: string,
): Promise<TurnstileResult> {
  const enabled = process.env.TURNSTILE_ENABLED !== "false";
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If Turnstile is disabled in config, skip verification
  if (!enabled) {
    return { ok: true };
  }

  // Fail closed: enabled but no secret key configured
  if (!secretKey) {
    console.error("[turnstile] TURNSTILE_ENABLED=true but TURNSTILE_SECRET_KEY is not set — failing closed");
    return { ok: false, error: "Güvenlik doğrulaması yapılandırılmamış." };
  }

  // Fail closed: missing token
  if (!token || token.trim() === "") {
    return { ok: false, error: "Güvenlik doğrulaması gerekli." };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (ip) formData.append("remoteip", ip);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData,
      signal: controller.signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[turnstile] HTTP ${response.status} from Cloudflare`);
      return { ok: false, error: "Doğrulama servisine ulaşılamadı." };
    }

    const result = await response.json() as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (result.success) {
      return { ok: true };
    }

    const errorCodes = result["error-codes"] ?? [];
    console.warn(`[turnstile] Verification failed: ${errorCodes.join(", ")}`);

    if (errorCodes.includes("timeout-or-duplicate")) {
      // Token already used or expired — safe to treat as generic failure
      return { ok: false, error: "Güvenlik doğrulaması süresi doldu. Lütfen tekrar deneyin." };
    }

    return { ok: false, error: "Güvenlik doğrulaması başarısız." };
  } catch (err) {
    // Network failure — fail closed
    console.error("[turnstile] Network error:", err instanceof Error ? err.message : err);
    return { ok: false, error: "Doğrulama servisine ulaşılamadı. Lütfen daha sonra tekrar deneyin." };
  }
}
