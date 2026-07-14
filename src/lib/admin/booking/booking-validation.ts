import type { Database } from "@/src/types/database";

type ServiceInsert = Database["public"]["Tables"]["appointment_services"]["Insert"];

const SLUG_RE = /^[a-z][a-z0-9-]{1,58}[a-z0-9]$/;
const ALLOWED_SLOT_INTERVALS = new Set([5, 10, 15, 20, 30, 60]);
const ALLOWED_CONFIRMATION_MODES = new Set(["pending", "confirmed"] as const);

export function validateServiceInsert(input: Partial<ServiceInsert>): string | null {
  if (!input.name_tr || input.name_tr.trim().length < 2) return "Türkçe ad en az 2 karakter olmalı.";
  if (!input.name_en || input.name_en.trim().length < 2) return "English name must be at least 2 characters.";
  if (!input.slug || !SLUG_RE.test(input.slug)) return "Slug formatı geçersiz.";
  if (input.duration_minutes === undefined || input.duration_minutes < 5 || input.duration_minutes > 480)
    return "Süre 5–480 dakika arası olmalı.";
  if (input.buffer_before_minutes !== undefined && (input.buffer_before_minutes < 0 || input.buffer_before_minutes > 180))
    return "Başlangıç bekleme 0–180 dakika arası olmalı.";
  if (input.buffer_after_minutes !== undefined && (input.buffer_after_minutes < 0 || input.buffer_after_minutes > 180))
    return "Bitiş bekleme 0–180 dakika arası olmalı.";
  if (input.description_tr && input.description_tr.length > 500) return "Türkçe açıklama 500 karakterden uzun olamaz.";
  if (input.description_en && input.description_en.length > 500) return "English description must be under 500 characters.";
  return null;
}

export function validateAvailability(input: {
  weekday?: number;
  start_time?: string | null;
  end_time?: string | null;
  break_start?: string | null;
  break_end?: string | null;
  is_available?: boolean;
  effective_from?: string | null;
  effective_until?: string | null;
}): string | null {
  if (input.weekday === undefined || input.weekday < 1 || input.weekday > 7)
    return "Haftanın günü 1–7 arası olmalı (ISO 8601).";

  if (input.is_available === false) {
    // Unavailable rows: all time fields must be null
    if (input.start_time !== null && input.start_time !== undefined)
      return "Uygun değil günlerde saat bilgisi olamaz.";
    if (input.end_time !== null && input.end_time !== undefined)
      return "Uygun değil günlerde saat bilgisi olamaz.";
    if (input.break_start !== null && input.break_start !== undefined)
      return "Uygun değil günlerde mola bilgisi olamaz.";
    if (input.break_end !== null && input.break_end !== undefined)
      return "Uygun değil günlerde mola bilgisi olamaz.";
    return null;
  }

  // Available rows: start and end required
  if (!input.start_time || !input.end_time) return "Başlangıç ve bitiş saati zorunlu.";
  if (input.start_time >= input.end_time) return "Başlangıç bitişten önce olmalı.";
  if (input.break_start && input.break_end) {
    if (input.start_time >= input.break_start) return "Mola başlangıç randevu başlangıcından sonra olmalı.";
    if (input.break_end >= input.end_time) return "Mola bitiş randevu bitişinden önce olmalı.";
    if (input.break_start >= input.break_end) return "Mola başlangıç mola bitişinden önce olmalı.";
  } else if (input.break_start || input.break_end) {
    return "Mola başlangıç ve bitiş birlikte belirtilmelidir.";
  }
  if (input.effective_from && input.effective_until && input.effective_from > input.effective_until)
    return "Geçerlilik başlangıç bitişten önce olmalı.";
  return null;
}

export function validateClosure(input: {
  title?: string;
  starts_at?: string;
  ends_at?: string;
  closure_type?: string;
  affects_all_veterinarians?: boolean;
  veterinarian_id?: string | null;
  notes?: string | null;
}): string | null {
  if (!input.title || input.title.trim().length < 2) return "Başlık en az 2 karakter olmalı.";
  if (!input.starts_at || !input.ends_at) return "Başlangıç ve bitiş zorunlu.";
  if (new Date(input.starts_at) >= new Date(input.ends_at)) return "Başlangıç bitişten önce olmalı.";
  if (!input.closure_type || !["full_day", "half_day", "veterinarian_leave"].includes(input.closure_type))
    return "Kapatma türü geçersiz.";
  if (input.closure_type === "veterinarian_leave" && !input.veterinarian_id)
    return "Veteriner izmi için veteriner seçimi zorunlu.";
  if (input.closure_type !== "veterinarian_leave" && input.veterinarian_id)
    return "Genel kapatma türlerinde veteriner belirtilmez.";
  if (input.notes && input.notes.length > 500) return "Notlar 500 karakterden uzun olamaz.";
  return null;
}

export function validateBookingRules(input: {
  minimum_notice_minutes?: number;
  maximum_advance_days?: number;
  slot_interval_minutes?: number;
  default_confirmation_mode?: string;
  cancellation_notice_minutes?: number;
}): string | null {
  if (input.minimum_notice_minutes !== undefined && (input.minimum_notice_minutes < 0 || input.minimum_notice_minutes > 10080))
    return "Minimum bildirim 0–10080 dakika arası olmalı.";
  if (input.maximum_advance_days !== undefined && (input.maximum_advance_days < 1 || input.maximum_advance_days > 365))
    return "Maksimum ön rezervasyon 1–365 gün arası olmalı.";
  if (input.slot_interval_minutes !== undefined && !ALLOWED_SLOT_INTERVALS.has(input.slot_interval_minutes))
    return "Slot aralığı geçersiz (5, 10, 15, 20, 30 veya 60 dakika).";
  if (input.default_confirmation_mode !== undefined && !ALLOWED_CONFIRMATION_MODES.has(input.default_confirmation_mode as "pending" | "confirmed"))
    return "Onay modu geçersiz (pending veya confirmed).";
  if (input.cancellation_notice_minutes !== undefined && (input.cancellation_notice_minutes < 0 || input.cancellation_notice_minutes > 10080))
    return "İptal bildirim 0–10080 dakika arası olmalı.";
  return null;
}

export const closureTypeLabels: Record<string, string> = {
  full_day: "Tam gün",
  half_day: "Yarım gün",
  veterinarian_leave: "Veteriner izni",
};

export const confirmationModeLabels: Record<string, string> = {
  pending: "Onay bekliyor",
  confirmed: "Otomatik onaylı",
};
