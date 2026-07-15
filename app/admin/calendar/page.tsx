import { AdminShell } from "@/src/components/admin/admin-shell";
import { CalendarToolbar } from "@/src/components/admin/calendar/calendar-toolbar";
import { DayView } from "@/src/components/admin/calendar/day-view";
import { WeekView } from "@/src/components/admin/calendar/week-view";
import { MobileAgenda } from "@/src/components/admin/calendar/mobile-agenda";
import { PendingQueue } from "@/src/components/admin/calendar/pending-queue";
import { DailyMetricsBar } from "@/src/components/admin/calendar/daily-metrics-bar";
import { ClosureOverlay } from "@/src/components/admin/calendar/closure-overlay";
import { getCalendarAppointments, getCalendarClosures, getDailyMetrics, getActiveVeterinarians } from "@/src/lib/admin/calendar/calendar-readers";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

const ALLOWED_VIEWS = ["day", "week", "agenda"] as const;
type CalendarView = (typeof ALLOWED_VIEWS)[number];

function shiftDate(date: string, delta: number, view: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  if (view === "week") d.setUTCDate(d.getUTCDate() + delta * 7);
  else d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; veterinarian?: string; status?: string }>;
}) {
  const session = await requireStaff();
  const p = await searchParams;

  const rawView = p.view;
  const view: CalendarView = ALLOWED_VIEWS.includes(rawView as CalendarView)
    ? (rawView as CalendarView)
    : "day";

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(p.date ?? "") ? p.date! : today;

  const s = await createClient();
  if (!s) return <p role="alert">Veri yüklenemedi.</p>;

  // Compute date range for bounded queries
  const anchorDate = new Date(`${anchor}T12:00:00Z`);
  const rangeStart = new Date(anchorDate);
  const rangeEnd = new Date(anchorDate);
  if (view === "week") {
    rangeStart.setUTCDate(rangeStart.getUTCDate() - ((rangeStart.getUTCDay() + 6) % 7));
    rangeEnd.setUTCDate(rangeStart.getUTCDate() + 7);
  } else {
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);
  }

  const dateStart = rangeStart.toISOString();
  const dateEnd = rangeEnd.toISOString();

  // Fetch data in parallel
  const [appointments, closures, metrics, vets] = await Promise.all([
    getCalendarAppointments(s, dateStart, dateEnd),
    getCalendarClosures(s, dateStart, dateEnd),
    getDailyMetrics(s, dateStart, dateEnd),
    getActiveVeterinarians(s),
  ]);

  // Filter by query params (validated on server)
  let filteredAppointments = appointments;
  if (p.status && p.status !== "all") {
    filteredAppointments = filteredAppointments.filter((a) => a.status === p.status);
  }
  if (p.veterinarian) {
    filteredAppointments = filteredAppointments.filter((a) => a.assigned_user_id === p.veterinarian);
  }

  // Pending/unassigned queue
  const pendingQueue = appointments.filter(
    (a) => a.status === "pending" || (!a.assigned_user_id && a.requested_veterinarian_id),
  );

  return (
    <AdminShell session={session}>
      <h1 className="mb-4 text-3xl font-semibold">Takvim</h1>

      {/* Daily Metrics */}
      <DailyMetricsBar metrics={metrics} />

      {/* Toolbar */}
      <CalendarToolbar
        view={view}
        anchor={anchor}
        previous={shiftDate(anchor, -1, view)}
        next={shiftDate(anchor, 1, view)}
        today={today}
        vets={vets}
        selectedVet={p.veterinarian ?? ""}
        selectedStatus={p.status ?? "all"}
      />

      {/* Closure Overlay */}
      {closures.length > 0 && <ClosureOverlay closures={closures} anchor={anchor} />}

      {/* Pending Queue */}
      {pendingQueue.length > 0 && <PendingQueue appointments={pendingQueue} vets={vets} />}

      {/* Calendar Views */}
      <div className="mt-4">
        {view === "day" && <DayView items={filteredAppointments} />}
        {view === "week" && <WeekView items={filteredAppointments} anchor={anchor} />}
        {view === "agenda" && <MobileAgenda items={filteredAppointments} />}
      </div>
    </AdminShell>
  );
}
