"use server";

import { createClient } from "@/src/lib/supabase/server";
import { getAvailableSlots } from "@/src/lib/admin/booking/availability-engine";
import type { EngineResponse } from "@/src/lib/admin/booking/availability-engine";

// ── Public-safe service listing ──

export type PublicService = {
  id: string;
  nameTr: string;
  nameEn: string;
  slug: string;
  durationMinutes: number;
  descriptionTr: string | null;
  descriptionEn: string | null;
  requiresManualConfirmation: boolean;
};

export async function getPublicServices(): Promise<PublicService[]> {
  const s = await createClient();
  if (!s) return [];

  const { data } = await s
    .from("appointment_services")
    .select("id,name_tr,name_en,slug,duration_minutes,description_tr,description_en,requires_manual_confirmation")
    .eq("is_online_bookable", true)
    .eq("is_active", true)
    .is("archived_at", null)
    .order("sort_order")
    .limit(50);

  if (!data) return [];

  return data.map((svc) => ({
    id: svc.id,
    nameTr: svc.name_tr,
    nameEn: svc.name_en,
    slug: svc.slug,
    durationMinutes: svc.duration_minutes,
    descriptionTr: svc.description_tr,
    descriptionEn: svc.description_en,
    requiresManualConfirmation: svc.requires_manual_confirmation,
  }));
}

// ── Public-safe veterinarian listing ──

export type PublicVeterinarian = {
  id: string;
  fullName: string;
  title: string | null;
};

export async function getPublicVeterinarians(): Promise<PublicVeterinarian[]> {
  const s = await createClient();
  if (!s) return [];

  const { data } = await s
    .from("profiles")
    .select("id, full_name")
    .eq("role", "veterinarian")
    .eq("status", "active");

  if (!data) return [];

  return data.map((vet) => ({
    id: vet.id,
    fullName: vet.full_name,
    title: null, // No public title column yet
  }));
}

// ── Public-safe booking rules ──

export type PublicBookingRules = {
  allowFirstAvailableVeterinarian: boolean;
  requireEmail: boolean;
  requirePhone: boolean;
  defaultConfirmationMode: "pending" | "confirmed";
  minimumNoticeMinutes: number;
  maximumAdvanceDays: number;
};

export async function getPublicBookingRules(): Promise<PublicBookingRules | null> {
  const s = await createClient();
  if (!s) return null;

  const { data } = await s
    .from("booking_rules")
    .select("minimum_notice_minutes,maximum_advance_days,default_confirmation_mode,allow_first_available_veterinarian,require_email,require_phone")
    .eq("id", true)
    .single();

  if (!data) return null;

  return {
    allowFirstAvailableVeterinarian: data.allow_first_available_veterinarian,
    requireEmail: data.require_email,
    requirePhone: data.require_phone,
    defaultConfirmationMode: data.default_confirmation_mode as "pending" | "confirmed",
    minimumNoticeMinutes: data.minimum_notice_minutes,
    maximumAdvanceDays: data.maximum_advance_days,
  };
}

// ── Public-safe slot availability ──

export type PublicAvailabilitySlot = {
  startsAt: string;
  endsAt: string;
  displayTime: string;
  veterinarianId: string;
  veterinarianName: string;
};

export type PublicAvailabilityResult =
  | { ok: true; date: string; timezone: string; slots: PublicAvailabilitySlot[] }
  | { ok: false; reason: string };

export async function getPublicAvailability(
  serviceId: string,
  date: string,
  veterinarianId?: string,
): Promise<PublicAvailabilityResult> {
  if (!serviceId) return { ok: false, reason: "Hizmet seçilmelidir." };
  if (!date) return { ok: false, reason: "Tarih seçilmelidir." };

  const engineResult: EngineResponse = await getAvailableSlots(serviceId, date, {
    veterinarianId: veterinarianId || undefined,
  });

  if ("reason" in engineResult) {
    return { ok: false, reason: engineResult.reason };
  }

  const slots: PublicAvailabilitySlot[] = [];

  for (const vet of engineResult.veterinarians) {
    for (const slot of vet.slots) {
      slots.push({
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        displayTime: slot.displayTime,
        veterinarianId: vet.veterinarianId,
        veterinarianName: vet.fullName,
      });
    }
  }

  // Sort by time
  slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return {
    ok: true,
    date: engineResult.date,
    timezone: engineResult.timezone,
    slots,
  };
}
