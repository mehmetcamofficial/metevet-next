export function dashboardTimeBounds(nowDate = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(nowDate);
  const startDate = new Date(`${today}T00:00:00+03:00`);
  const endDate = new Date(startDate); endDate.setDate(endDate.getDate() + 1);
  return { start: startDate.toISOString(), end: endDate.toISOString(), now: nowDate.toISOString(), soon: new Date(nowDate.getTime() + 30 * 864e5).toISOString(), oldDraft: new Date(nowDate.getTime() - 7 * 864e5).toISOString(), last30: new Date(nowDate.getTime() - 30 * 864e5).toISOString(), startingSoon: new Date(nowDate.getTime() + 3 * 36e5).toISOString() };
}
