"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { createServerActionClient } from "@/src/lib/supabase/server-action";
import {
  validateServiceInsert,
  validateAvailability,
  validateClosure,
  validateBookingRules,
} from "@/src/lib/admin/booking/booking-validation";
import { istanbulDateTimeLocalToIso } from "@/src/lib/admin/appointments";
import type { ConfirmationMode } from "@/src/types/database";

// ── State types ──

export type BookingSettingsState = {
  message: string | null;
  errors?: Record<string, string>;
};

// ── Helpers ──

function fd(fd: FormData) {
  return {
    str: (key: string) => String(fd.get(key) ?? "").trim(),
    num: (key: string) => Number(fd.get(key) ?? 0),
    bool: (key: string) => fd.get(key) === "on" || fd.get(key) === "true",
    maybeStr: (key: string) => {
      const v = String(fd.get(key) ?? "").trim();
      return v || null;
    },
  };
}

function translateDbError(msg: string): string {
  if (msg.includes("duplicate key") || msg.includes("appointment_services_active_slug_idx")) return "Bu kayıt zaten mevcut.";
  if (msg.includes("exclusion constraint") || msg.includes("cc_no_clinic_overlap") || msg.includes("cc_no_vet_leave_overlap")) return "Bu zaman aralığı mevcut bir kayıtla çakışıyor.";
  if (msg.includes("check constraint") || msg.includes("cc_vet_leave_not_all") || msg.includes("as_online_requires_active")) return "Girilen değerler kural gereği geçersiz.";
  if (msg.includes("foreign key")) return "İlişkili kayıt bulunamadı.";
  return "İşlem tamamlanamadı.";
}

// ── Service actions ──

export async function createService(
  _state: BookingSettingsState,
  formData: FormData,
): Promise<BookingSettingsState> {
  const session = await requireAdmin();
  const v = fd(formData);
  const input = {
    name_tr: v.str("name_tr"),
    name_en: v.str("name_en"),
    slug: v.str("slug"),
    description_tr: v.maybeStr("description_tr"),
    description_en: v.maybeStr("description_en"),
    duration_minutes: v.num("duration_minutes"),
    buffer_before_minutes: v.num("buffer_before_minutes"),
    buffer_after_minutes: v.num("buffer_after_minutes"),
    is_online_bookable: v.bool("is_online_bookable"),
    requires_manual_confirmation: v.bool("requires_manual_confirmation"),
    is_active: v.bool("is_active"),
  };

  const validationError = validateServiceInsert(input);
  if (validationError) return { message: validationError };

  const s = await createServerActionClient();
  if (!s) return { message: "İşlem tamamlanamadı." };

  const result = await s
    .from("appointment_services")
    .insert({
      ...input,
      created_by: session.id,
      updated_by: session.id,
    })
    .select("id")
    .single();

  if (result.error)
    return { message: translateDbError(result.error.message) };

  await s.from("audit_logs").insert({
    actor_user_id: session.id,
    action: "appointment_service_created",
    entity_type: "appointment_service",
    entity_id: result.data.id,
    metadata: { slug: input.slug, name_tr: input.name_tr, duration_minutes: input.duration_minutes },
  });

  revalidatePath("/admin/booking-settings");
  revalidatePath("/admin/booking-settings/services");
  redirect(`/admin/booking-settings/services`);
}

export async function updateService(
  id: string,
  _state: BookingSettingsState,
  formData: FormData,
): Promise<BookingSettingsState> {
  const session = await requireAdmin();
  const v = fd(formData);
  const input = {
    name_tr: v.str("name_tr"),
    name_en: v.str("name_en"),
    slug: v.str("slug"),
    description_tr: v.maybeStr("description_tr"),
    description_en: v.maybeStr("description_en"),
    duration_minutes: v.num("duration_minutes"),
    buffer_before_minutes: v.num("buffer_before_minutes"),
    buffer_after_minutes: v.num("buffer_after_minutes"),
    is_online_bookable: v.bool("is_online_bookable"),
    requires_manual_confirmation: v.bool("requires_manual_confirmation"),
    is_active: v.bool("is_active"),
  };

  const validationError = validateServiceInsert(input);
  if (validationError) return { message: validationError };

  const s = await createServerActionClient();
  if (!s) return { message: "İşlem tamamlanamadı." };

  const result = await s
    .from("appointment_services")
    .update({ ...input, updated_by: session.id })
    .eq("id", id)
    .select("id")
    .single();

  if (result.error)
    return { message: translateDbError(result.error.message) };

  await s.from("audit_logs").insert({
    actor_user_id: session.id,
    action: "appointment_service_updated",
    entity_type: "appointment_service",
    entity_id: id,
    metadata: { slug: input.slug, changed_fields: Object.keys(input) },
  });

  revalidatePath("/admin/booking-settings");
  revalidatePath("/admin/booking-settings/services");
  redirect(`/admin/booking-settings/services`);
}

export async function archiveService(id: string) {
  const session = await requireAdmin();
  const s = await createServerActionClient();
  if (!s) throw new Error("İşlem başarısız.");

  const { error } = await s
    .from("appointment_services")
    .update({ archived_at: new Date().toISOString(), updated_by: session.id })
    .eq("id", id);

  if (error) throw new Error("İşlem başarısız.");

  await s.from("audit_logs").insert({
    actor_user_id: session.id,
    action: "appointment_service_archived",
    entity_type: "appointment_service",
    entity_id: id,
    metadata: {},
  });

  revalidatePath("/admin/booking-settings");
  revalidatePath("/admin/booking-settings/services");
  redirect("/admin/booking-settings/services");
}

export async function restoreService(id: string) {
  const session = await requireAdmin();
  const s = await createServerActionClient();
  if (!s) throw new Error("İşlem başarısız.");

  const { error } = await s
    .from("appointment_services")
    .update({ archived_at: null, updated_by: session.id })
    .eq("id", id);

  if (error) throw new Error("İşlem başarısız.");

  await s.from("audit_logs").insert({
    actor_user_id: session.id,
    action: "appointment_service_restored",
    entity_type: "appointment_service",
    entity_id: id,
    metadata: {},
  });

  revalidatePath("/admin/booking-settings");
  revalidatePath("/admin/booking-settings/services");
  redirect("/admin/booking-settings/services");
}

// ── Availability actions ──

export async function saveAvailability(
  _state: BookingSettingsState,
  formData: FormData,
): Promise<BookingSettingsState> {
  const session = await requireAdmin();
  const v = fd(formData);
  const veterinarian_id = v.str("veterinarian_id");
  if (!veterinarian_id) return { message: "Veteriner seçimi zorunlu." };

  // Parse weekday entries from form data
  const weekdayStrs = formData.getAll("weekday");
  const entries: Array<{
    weekday: number;
    is_available: boolean;
    start_time: string | null;
    end_time: string | null;
    break_start: string | null;
    break_end: string | null;
    effective_from: string | null;
    effective_until: string | null;
    id: string | null;
  }> = [];

  const errors: Record<string, string> = {};

  for (const ws of weekdayStrs) {
    const wd = Number(ws);
    const is_avail = formData.get(`is_available_${wd}`) === "true";
    const start = v.maybeStr(`start_time_${wd}`);
    const end = v.maybeStr(`end_time_${wd}`);
    const brk_s = v.maybeStr(`break_start_${wd}`);
    const brk_e = v.maybeStr(`break_end_${wd}`);
    const eff_from = v.maybeStr(`effective_from_${wd}`);
    const eff_until = v.maybeStr(`effective_until_${wd}`);
    const existing_id = v.maybeStr(`id_${wd}`);

    const validationError = validateAvailability({
      weekday: wd,
      is_available: is_avail,
      start_time: is_avail ? start : null,
      end_time: is_avail ? end : null,
      break_start: is_avail ? brk_s : null,
      break_end: is_avail ? brk_e : null,
      effective_from: eff_from,
      effective_until: eff_until,
    });

    if (validationError) {
      errors[`weekday_${wd}`] = validationError;
      continue;
    }

    entries.push({
      weekday: wd,
      is_available: is_avail,
      start_time: is_avail ? start : null,
      end_time: is_avail ? end : null,
      break_start: is_avail && brk_s ? brk_s : null,
      break_end: is_avail && brk_e ? brk_e : null,
      effective_from: eff_from,
      effective_until: eff_until,
      id: existing_id,
    });
  }

  if (Object.keys(errors).length)
    return { message: "Günleri düzeltin.", errors };

  const s = await createServerActionClient();
  if (!s) return { message: "İşlem tamamlanamadı." };

  // Verify veterinarian is active vet
  const { data: vet } = await s
    .from("profiles")
    .select("id, role, status")
    .eq("id", veterinarian_id)
    .single();

  if (!vet || vet.role !== "veterinarian" || vet.status !== "active")
    return { message: "Geçerli aktif veteriner seçin." };

  // Upsert each entry
  for (const entry of entries) {
    const record = {
      veterinarian_id,
      weekday: entry.weekday,
      is_available: entry.is_available,
      start_time: entry.start_time,
      end_time: entry.end_time,
      break_start: entry.break_start,
      break_end: entry.break_end,
      effective_from: entry.effective_from,
      effective_until: entry.effective_until,
      updated_by: session.id,
    };

    if (entry.id) {
      const { error } = await s
        .from("veterinarian_availability")
        .update(record)
        .eq("id", entry.id);
      if (error) {
        const msg = translateDbError(error.message);
        return { message: msg, errors: { [`weekday_${entry.weekday}`]: msg } };
      }
    } else {
      const { error } = await s
        .from("veterinarian_availability")
        .insert({ ...record, created_by: session.id })
        .select("id")
        .single();
      if (error) {
        const msg = translateDbError(error.message);
        return { message: msg, errors: { [`weekday_${entry.weekday}`]: msg } };
      }
    }
  }

  await s.from("audit_logs").insert({
    actor_user_id: session.id,
    action: "veterinarian_availability_updated",
    entity_type: "veterinarian_availability",
    entity_id: veterinarian_id,
    metadata: { veterinarian_id, days_updated: entries.map((e) => e.weekday) },
  });

  revalidatePath("/admin/booking-settings");
  revalidatePath("/admin/booking-settings/availability");
  redirect("/admin/booking-settings/availability");
}

// ── Closure actions ──

export async function createClosure(
  _state: BookingSettingsState,
  formData: FormData,
): Promise<BookingSettingsState> {
  const session = await requireAdmin();
  const v = fd(formData);
  const input = {
    title: v.str("title"),
    starts_at: v.str("starts_at"),
    ends_at: v.str("ends_at"),
    closure_type: v.str("closure_type"),
    affects_all_veterinarians: v.bool("affects_all_veterinarians"),
    veterinarian_id: v.maybeStr("veterinarian_id"),
    notes: v.maybeStr("notes"),
  };

  const validationError = validateClosure(input);
  if (validationError) return { message: validationError };

  const s = await createServerActionClient();
  if (!s) return { message: "İşlem tamamlanamadı." };

  // Convert Istanbul datetime-local to ISO
  const startsIso = istanbulDateTimeLocalToIso(input.starts_at);
  const endsIso = istanbulDateTimeLocalToIso(input.ends_at);
  if (!startsIso || !endsIso) return { message: "Tarih/saat formatı geçersiz." };

  const record = {
    title: input.title,
    starts_at: startsIso,
    ends_at: endsIso,
    closure_type: input.closure_type as "full_day" | "half_day" | "veterinarian_leave",
    affects_all_veterinarians: input.affects_all_veterinarians,
    veterinarian_id: input.veterinarian_id,
    notes: input.notes,
    created_by: session.id,
    updated_by: session.id,
  };

  const result = await s
    .from("clinic_closures")
    .insert(record)
    .select("id")
    .single();

  if (result.error) {
    return { message: translateDbError(result.error.message) };
  }

  await s.from("audit_logs").insert({
    actor_user_id: session.id,
    action: "clinic_closure_created",
    entity_type: "clinic_closure",
    entity_id: result.data.id,
    metadata: { closure_type: record.closure_type, title: record.title },
  });

  revalidatePath("/admin/booking-settings");
  revalidatePath("/admin/booking-settings/closures");
  redirect("/admin/booking-settings/closures");
}

export async function updateClosure(
  id: string,
  _state: BookingSettingsState,
  formData: FormData,
): Promise<BookingSettingsState> {
  const session = await requireAdmin();
  const v = fd(formData);
  const input = {
    title: v.str("title"),
    starts_at: v.str("starts_at"),
    ends_at: v.str("ends_at"),
    closure_type: v.str("closure_type"),
    affects_all_veterinarians: v.bool("affects_all_veterinarians"),
    veterinarian_id: v.maybeStr("veterinarian_id"),
    notes: v.maybeStr("notes"),
  };

  const validationError = validateClosure(input);
  if (validationError) return { message: validationError };

  const s = await createServerActionClient();
  if (!s) return { message: "İşlem tamamlanamadı." };

  // Convert Istanbul datetime-local to ISO
  const startsIso = istanbulDateTimeLocalToIso(input.starts_at);
  const endsIso = istanbulDateTimeLocalToIso(input.ends_at);
  if (!startsIso || !endsIso) return { message: "Tarih/saat formatı geçersiz." };

  const record = {
    title: input.title,
    starts_at: startsIso,
    ends_at: endsIso,
    closure_type: input.closure_type as "full_day" | "half_day" | "veterinarian_leave",
    affects_all_veterinarians: input.affects_all_veterinarians,
    veterinarian_id: input.veterinarian_id,
    notes: input.notes,
    updated_by: session.id,
  };

  const result = await s
    .from("clinic_closures")
    .update(record)
    .eq("id", id)
    .select("id")
    .single();

  if (result.error) {
    return { message: translateDbError(result.error.message) };
  }

  await s.from("audit_logs").insert({
    actor_user_id: session.id,
    action: "clinic_closure_updated",
    entity_type: "clinic_closure",
    entity_id: id,
    metadata: { closure_type: record.closure_type, changed_fields: Object.keys(record) },
  });

  revalidatePath("/admin/booking-settings");
  revalidatePath("/admin/booking-settings/closures");
  redirect("/admin/booking-settings/closures");
}

export async function archiveClosure(id: string) {
  const session = await requireAdmin();
  const s = await createServerActionClient();
  if (!s) throw new Error("İşlem başarısız.");

  const { error } = await s
    .from("clinic_closures")
    .update({ archived_at: new Date().toISOString(), updated_by: session.id })
    .eq("id", id);

  if (error) throw new Error("İşlem başarısız.");

  await s.from("audit_logs").insert({
    actor_user_id: session.id,
    action: "clinic_closure_archived",
    entity_type: "clinic_closure",
    entity_id: id,
    metadata: {},
  });

  revalidatePath("/admin/booking-settings");
  revalidatePath("/admin/booking-settings/closures");
  redirect("/admin/booking-settings/closures");
}

export async function restoreClosure(id: string) {
  const session = await requireAdmin();
  const s = await createServerActionClient();
  if (!s) throw new Error("İşlem başarısız.");

  const { error } = await s
    .from("clinic_closures")
    .update({ archived_at: null, updated_by: session.id })
    .eq("id", id);

  if (error) throw new Error("İşlem başarısız.");

  await s.from("audit_logs").insert({
    actor_user_id: session.id,
    action: "clinic_closure_restored",
    entity_type: "clinic_closure",
    entity_id: id,
    metadata: {},
  });

  revalidatePath("/admin/booking-settings");
  revalidatePath("/admin/booking-settings/closures");
  redirect("/admin/booking-settings/closures");
}

// ── Booking rules action ──

export async function updateBookingRules(
  _state: BookingSettingsState,
  formData: FormData,
): Promise<BookingSettingsState> {
  const session = await requireAdmin();
  const v = fd(formData);
  const input = {
    minimum_notice_minutes: v.num("minimum_notice_minutes"),
    maximum_advance_days: v.num("maximum_advance_days"),
    slot_interval_minutes: v.num("slot_interval_minutes"),
    default_confirmation_mode: v.str("default_confirmation_mode") as ConfirmationMode,
    allow_same_day_booking: v.bool("allow_same_day_booking"),
    require_email: v.bool("require_email"),
    require_phone: v.bool("require_phone"),
    allow_first_available_veterinarian: v.bool("allow_first_available_veterinarian"),
    cancellation_notice_minutes: v.num("cancellation_notice_minutes"),
  };

  const validationError = validateBookingRules(input);
  if (validationError) return { message: validationError };

  const s = await createServerActionClient();
  if (!s) return { message: "İşlem tamamlanamadı." };

  const result = await s
    .from("booking_rules")
    .update({ ...input, updated_by: session.id })
    .eq("id", true)
    .select("id")
    .single();

  if (result.error)
    return { message: translateDbError(result.error.message) };

  await s.from("audit_logs").insert({
    actor_user_id: session.id,
    action: "booking_rules_updated",
    entity_type: "booking_rules",
    entity_id: "true",
    metadata: { changed_fields: Object.keys(input) },
  });

  revalidatePath("/admin/booking-settings");
  revalidatePath("/admin/booking-settings/rules");
  redirect("/admin/booking-settings/rules");
}
