import { AdminShell } from "@/src/components/admin/admin-shell";
import { VeterinarianToolbar } from "@/src/components/admin/veterinarian/veterinarian-toolbar";
import { VeterinarianWorkspace } from "@/src/components/admin/veterinarian/veterinarian-workspace";
import {
  getVetAppointments,
  getVetMetrics,
  getNextPatient,
} from "@/src/lib/admin/veterinarian/veterinarian-readers";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

function shiftDate(date: string, delta: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default async function VeterinarianPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; veterinarian_id?: string }>;
}) {
  const session = await requireStaff();
  const p = await searchParams;

  // Veterinarian defaults to own ID; admin can inspect others via validated UUID filter
  const rawVet = p.veterinarian_id ?? "";
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      rawVet,
    );
  const veterinarianId =
    session.profile.role === "admin" && isUuid ? rawVet : session.id;

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(
    new Date(),
  );
  const date = /^\d{4}-\d{2}-\d{2}$/.test(p.date ?? "") ? p.date! : today;

  const s = await createClient();
  if (!s) return <p role="alert">Veri yüklenemedi.</p>;

  const dateStart = `${date}T00:00:00.000Z`;
  const dateEnd = shiftDate(date, 1) + "T00:00:00.000Z";
  const nowIso = new Date().toISOString();

  const [appointments, metrics, nextPatient] = await Promise.all([
    getVetAppointments(s, veterinarianId, dateStart, dateEnd),
    getVetMetrics(s, veterinarianId, dateStart, dateEnd),
    getNextPatient(s, veterinarianId, nowIso),
  ]);

  return (
    <AdminShell session={session}>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Veteriner Paneli</h1>
      </div>

      <VeterinarianToolbar
        date={date}
        previous={shiftDate(date, -1)}
        next={shiftDate(date, 1)}
        today={today}
      />

      <div className="mt-4">
        <VeterinarianWorkspace
          appointments={appointments}
          metrics={metrics}
          nextPatient={nextPatient}
          role={session.profile.role}
          actorId={session.id}
        />
      </div>
    </AdminShell>
  );
}
