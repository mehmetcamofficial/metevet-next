import type { AppointmentSource, AppointmentStatus, UserRole } from "@/src/types/database";

export const appointmentStatuses: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "no_show"];
export const appointmentSources: AppointmentSource[] = ["website", "plandok", "whatsapp", "phone", "walk_in", "admin"];
export const serviceLabels: Record<string, string> = { general_examination: "Genel Muayene", preventive_care: "Aşı ve Koruyucu Hekimlik", diagnostics: "Laboratuvar ve Tanı", surgery: "Cerrahi İşlemler", dental_care: "Diş ve Ağız Sağlığı", urgent_assessment: "Acil Değerlendirme" };
export const statusLabels: Record<AppointmentStatus, string> = { pending: "Bekliyor", confirmed: "Onaylandı", completed: "Tamamlandı", cancelled: "İptal", no_show: "Gelmedi" };
export const sourceLabels: Record<AppointmentSource, string> = { website: "Web sitesi", plandok: "Plandok", whatsapp: "WhatsApp", phone: "Telefon", walk_in: "Doğrudan başvuru", admin: "Yönetim paneli" };

export function canTransitionStatus(from: AppointmentStatus, to: AppointmentStatus, role: UserRole, adminOverride = false) {
  if (from === to) return true;
  if (role === "admin" && adminOverride) return true;
  if (to === "cancelled") return role === "admin" && (from === "pending" || from === "confirmed");
  return (from === "pending" && to === "confirmed") || (from === "confirmed" && (to === "completed" || to === "no_show"));
}

export function istanbulLocalToIso(date: string, time: string) {
  const value = new Date(`${date}T${time}:00+03:00`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}
export function istanbulParts(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${map.year}-${map.month}-${map.day}`, time: `${map.hour}:${map.minute}` };
}
export function appointmentDuration(startsAt: string, endsAt: string) { return Math.max(0, Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000)); }
export function appointmentsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) { return new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart); }
export function calendarRange(anchor: string, view: "day" | "week" | "month") {
  const date = new Date(`${anchor}T00:00:00Z`);
  const start = new Date(date);
  if (view === "week") start.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  if (view === "month") start.setUTCDate(1);
  const end = new Date(start);
  if (view === "month") end.setUTCMonth(start.getUTCMonth() + 1);
  else end.setUTCDate(start.getUTCDate() + (view === "week" ? 7 : 1));
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);
  return { start: istanbulLocalToIso(startDate, "00:00")!, end: istanbulLocalToIso(endDate, "00:00")! };
}
