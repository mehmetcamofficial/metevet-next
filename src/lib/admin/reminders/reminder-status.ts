import type { ReminderStatus } from "@/src/types/database";

export const reminderStatusLabels: Record<ReminderStatus, string> = { pending: "Bekliyor", ready: "Hazır", sent: "Gönderildi", failed: "Başarısız", cancelled: "İptal" };
const transitions: Record<ReminderStatus, ReminderStatus[]> = {
  pending: ["ready", "sent", "failed", "cancelled"], ready: ["sent", "failed", "cancelled"],
  failed: ["ready", "sent", "cancelled"], sent: [], cancelled: [],
};
export function canTransitionReminder(from: ReminderStatus, to: ReminderStatus) { return transitions[from].includes(to); }
export function reminderDueState(scheduledFor: string, now = new Date()) {
  const target = new Date(scheduledFor); const diff = target.getTime() - now.getTime();
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" });
  return { overdue: diff < 0, dueToday: day.format(target) === day.format(now), millisecondsUntilDue: diff };
}
