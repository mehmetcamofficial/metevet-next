import { AdminShell } from "@/src/components/admin/admin-shell";
import { ReceptionToolbar } from "@/src/components/admin/reception/reception-toolbar";
import { ReceptionWorkspace } from "@/src/components/admin/reception/reception-workspace";
import { QuickActions } from "@/src/components/admin/quick-actions";
import { getReceptionAppointments, getReceptionMetrics, searchOwnersAndPets } from "@/src/lib/admin/reception/reception-readers";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

function shiftDate(date: string, delta: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default async function ReceptionPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; search?: string }>;
}) {
  const session = await requireStaff();
  const p = await searchParams;

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  const date = /^\d{4}-\d{2}-\d{2}$/.test(p.date ?? "") ? p.date! : today;
  const searchQuery = p.search?.trim() ?? "";

  const s = await createClient();
  if (!s) return <p role="alert">Veri yüklenemedi.</p>;

  // Date range for bounded query (single day)
  const dateStart = `${date}T00:00:00.000Z`;
  const dateEnd = shiftDate(date, 1) + "T00:00:00.000Z";

  // Fetch in parallel
  const [appointments, metrics, searchResults] = await Promise.all([
    getReceptionAppointments(s, dateStart, dateEnd),
    getReceptionMetrics(s, dateStart, dateEnd),
    searchQuery.length >= 2 ? searchOwnersAndPets(s, searchQuery) : Promise.resolve({ owners: [], pets: [] }),
  ]);

  return (
    <AdminShell session={session}>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Resepsiyon</h1>
      </div>

      <ReceptionToolbar date={date} previous={shiftDate(date, -1)} next={shiftDate(date, 1)} today={today} />

      <div className="mt-4">
        <ReceptionWorkspace
          appointments={appointments}
          metrics={metrics}
          date={date}
          today={today}
          searchResults={searchQuery.length >= 2 ? searchResults : undefined}
        />
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6">
        <QuickActions role={session.profile.role} />
      </div>
    </AdminShell>
  );
}
