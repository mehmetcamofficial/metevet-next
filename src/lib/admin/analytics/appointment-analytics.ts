import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";
import type { AnalyticsRange } from "./date-range";
import { average, increment, percent } from "./analytics-formatters";
import { istanbulHeatmap } from "./heatmap";
import type { AnalyticsFilters } from "./analytics-filters";
export async function appointmentAnalytics(
  s: SupabaseClient<Database>,
  range: AnalyticsRange,
  filters: AnalyticsFilters = {},
) {
  let query = s
    .from("appointments")
    .select(
      "id,status,source,service_key,starts_at,ends_at,assigned_user_id,created_at",
    )
    .gte("starts_at", range.start)
    .lt("starts_at", range.end)
    .order("starts_at")
    .limit(5000);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.service) query = query.eq("service_key", filters.service);
  if (filters.veterinarian)
    query = query.eq("assigned_user_id", filters.veterinarian);
  const { data, error } = await query;
  if (error) throw new Error("Randevu analitiği yüklenemedi.");
  const rows = data ?? [],
    statuses = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    },
    sources: Record<string, number> = {},
    services: Record<string, number> = {},
    weekdays: Record<string, number> = {},
    hours: Record<string, number> = {},
    staff: Record<string, number> = {},
    trend: Record<string, number> = {};
  for (const x of rows) {
    statuses[x.status]++;
    increment(sources, x.source);
    increment(services, x.service_key);
    const d = new Date(x.starts_at),
      weekday = new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        weekday: "long",
      }).format(d),
      hour = new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        hour: "2-digit",
        hour12: false,
      }).format(d),
      date = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Istanbul",
      }).format(d);
    increment(weekdays, weekday.charAt(0).toUpperCase() + weekday.slice(1));
    increment(hours, `${hour}:00`);
    increment(staff, x.assigned_user_id ?? "Atanmamış");
    increment(trend, `${date} · ${x.status}`);
  }
  const now = new Date().toISOString(),
    [upcoming, unassigned] = await Promise.all([
      s
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .gte("starts_at", now)
        .neq("status", "cancelled"),
      s
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .gte("starts_at", now)
        .is("assigned_user_id", null)
        .neq("status", "cancelled"),
    ]);
  return {
    total: rows.length,
    statuses,
    completionRate: percent(statuses.completed, rows.length),
    cancellationRate: percent(statuses.cancelled, rows.length),
    noShowRate: percent(statuses.no_show, rows.length),
    sources,
    services,
    weekdays,
    hours,
    staff,
    trend,
    heatmap: istanbulHeatmap(rows),
    averageDurationMinutes: average(
      rows.map(
        (x) =>
          (new Date(x.ends_at).getTime() - new Date(x.starts_at).getTime()) /
          60000,
      ),
    ),
    upcoming: upcoming.count ?? 0,
    unassignedUpcoming: unassigned.count ?? 0,
    truncated: rows.length === 5000,
  };
}
