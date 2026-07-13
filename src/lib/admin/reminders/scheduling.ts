export const REMINDER_LEAD_TIMES = { appointment_upcoming: 24, appointment_same_day: 3, vaccine_due: 24 * 7, parasite_due: 24 * 3, follow_up_due: 24 * 2 } as const;
export function scheduleBefore(sourceDate: string, leadHours: number) { return new Date(new Date(sourceDate).getTime() - leadHours * 3_600_000).toISOString(); }
export function istanbulParts(value: string) {
  const date = new Date(value);
  return {
    date: new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "short" }).format(date),
    time: new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", timeStyle: "short" }).format(date),
  };
}
export function isDuplicateReminder(existing: Array<{ reminder_type: string; appointment_id?: string|null; vaccine_record_id?: string|null; parasite_record_id?: string|null; examination_id?: string|null }>, candidate: typeof existing[number]) {
  return existing.some((item) => item.reminder_type === candidate.reminder_type && ["appointment_id","vaccine_record_id","parasite_record_id","examination_id"].some((key) => item[key as keyof typeof item] && item[key as keyof typeof item] === candidate[key as keyof typeof candidate]));
}
