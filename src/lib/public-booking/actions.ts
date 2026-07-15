"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { verifyTurnstileToken } from "@/src/lib/public-booking/turnstile";
import { normalizePhone } from "@/src/lib/public-booking/validation";
import type { Locale } from "@/types";

// ── Types ──

export type PublicBookingPayload = {
  serviceId: string;
  veterinarianId?: string | null;
  date: string;
  time: string;
  fullName: string;
  phone: string;
  email?: string;
  petName: string;
  species: string;
  breed?: string;
  birthDate?: string;
  note?: string;
  consentPrivacy: boolean;
  consentMarketing: boolean;
  honeypot: string;
  turnstileToken?: string;
};

export type PublicBookingResult =
  | { ok: true; reference: string; status: "pending" | "confirmed"; appointmentId: string; serviceNameTr: string; serviceNameEn: string; date: string; time: string; veterinarianName: string | null }
  | { ok: false; reason: string };

// ── Idempotency key generation (inlined, not exported to avoid "use server" restriction) ──

function generateIdempotencyKey(): string {
  return randomBytes(12)
    .reduce((acc, b) => acc + b.toString(36).padStart(2, "0"), "");
}

// ── Server action ──

export async function submitPublicBooking(
  payload: PublicBookingPayload,
  locale: Locale,
): Promise<PublicBookingResult> {
  // Validate honeypot client-side double-check
  if (payload.honeypot) {
    return { ok: true, reference: "000000000000", status: "pending", appointmentId: "", serviceNameTr: "", serviceNameEn: "", date: payload.date, time: payload.time, veterinarianName: null };
  }

  // Get idempotency key from cookie or generate new one
  const cookieStore = await cookies();
  let idempotencyKey = cookieStore.get("bk_idem")?.value;
  if (!idempotencyKey || idempotencyKey.length < 8) {
    idempotencyKey = generateIdempotencyKey();
  }

  // Get client IP from request headers for rate limiting (stored as SHA-256 only)
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  const clientIp = forwardedFor?.split(",")[0]?.trim() ?? realIp ?? "unknown";

  // ── Turnstile verification (server-side) ──
  const turnstileResult = await verifyTurnstileToken(
    payload.turnstileToken || null,
    clientIp !== "unknown" ? clientIp : undefined,
  );
  if (!turnstileResult.ok) {
    return { ok: false, reason: turnstileResult.error };
  }

  // Validate required fields
  if (!payload.serviceId) return { ok: false, reason: locale === "tr" ? "Hizmet seçilmelidir." : "A service must be selected." };
  if (!payload.date) return { ok: false, reason: locale === "tr" ? "Tarih seçilmelidir." : "A date must be selected." };
  if (!payload.time) return { ok: false, reason: locale === "tr" ? "Saat seçilmelidir." : "A time must be selected." };
  if (!payload.fullName?.trim()) return { ok: false, reason: locale === "tr" ? "Ad soyad girilmelidir." : "Full name is required." };
  if (!payload.phone?.trim()) return { ok: false, reason: locale === "tr" ? "Telefon numarası girilmelidir." : "Phone number is required." };
  if (!payload.petName?.trim()) return { ok: false, reason: locale === "tr" ? "Hayvan adı girilmelidir." : "Pet name is required." };
  if (!payload.species?.trim()) return { ok: false, reason: locale === "tr" ? "Hayvan türü girilmelidir." : "Species is required." };
  if (!payload.consentPrivacy) return { ok: false, reason: locale === "tr" ? "KVKK onayı gereklidir." : "Privacy consent is required." };

  // Sanitize inputs
  const sanitize = (s: string) =>
    s
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
      .replace(/<[^>]*>/g, "")
      .trim();
  const safeFullName = sanitize(payload.fullName).slice(0, 200);
  const safePhone = normalizePhone(payload.phone).slice(0, 30);
  const safeEmail = (payload.email || "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim()
    .toLowerCase()
    .slice(0, 254);
  const safePetName = sanitize(payload.petName).slice(0, 100);
  const safeSpecies = sanitize(payload.species).slice(0, 50);
  const safeBreed = payload.breed ? sanitize(payload.breed).slice(0, 100) : "";
  const safeBirthDate = payload.birthDate?.trim() || "";
  const safeNote = payload.note ? sanitize(payload.note).slice(0, 500) : "";

  // Call the database function
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, reason: locale === "tr" ? "İşlem tamamlanamadı." : "Operation failed." };
  }

  const { data, error } = await supabase.rpc("create_public_booking", {
    payload: {
      p_service_id: payload.serviceId,
      p_veterinarian_id: payload.veterinarianId || null,
      p_date: payload.date,
      p_time: payload.time,
      p_full_name: safeFullName,
      p_phone: safePhone,
      p_email: safeEmail || null,
      p_pet_name: safePetName,
      p_species: safeSpecies,
      p_breed: safeBreed || null,
      p_birth_date: safeBirthDate || null,
      p_note: safeNote || null,
      p_idempotency_key: idempotencyKey,
      p_honeypot: payload.honeypot || "",
      p_consent_privacy: payload.consentPrivacy,
      p_consent_marketing: payload.consentMarketing || false,
      p_turnstile_token: payload.turnstileToken || null,
      p_client_ip: clientIp,
    },
  });

  if (error) {
    console.error("Public booking error:", error);
    return { ok: false, reason: locale === "tr" ? "İşlem tamamlanamadı." : "Operation failed." };
  }

  const result = data as unknown as PublicBookingResult;

  // Store idempotency key in cookie for replay protection
  cookieStore.set("bk_idem", idempotencyKey, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 86400, // 24 hours
    path: "/",
  });

  return result;
}
