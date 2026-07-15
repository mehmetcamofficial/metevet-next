import { ReceptionMetrics } from "./reception-metrics";
import { ReceptionAppointmentCard } from "./reception-appointment-card";
import type { ReceptionAppointment, ReceptionMetrics as MetricsType } from "@/src/lib/admin/reception/reception-readers";

type ReceptionWorkspaceProps = {
  appointments: ReceptionAppointment[];
  metrics: MetricsType;
  date: string;
  today: string;
  searchResults?: { owners: Array<{ id: string; full_name: string; phone: string | null }>; pets: Array<{ id: string; name: string; owner_id: string }> };
};

export function ReceptionWorkspace({ appointments, metrics, searchResults }: ReceptionWorkspaceProps) {
  const pending = appointments.filter((a) => a.status === "pending");
  const unassigned = appointments.filter((a) => !a.assigned_user_id && a.status !== "cancelled");
  const todayAppts = appointments.filter((a) => a.status !== "cancelled");
  const completed = appointments.filter((a) => a.status === "completed");
  const cancelled = appointments.filter((a) => a.status === "cancelled" || a.status === "no_show");

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <ReceptionMetrics metrics={metrics} />

      {/* Search Results */}
      {searchResults && (searchResults.owners.length > 0 || searchResults.pets.length > 0) && (
        <section className="rounded-xl bg-white p-4" aria-label="Arama sonuçları">
          <h2 className="mb-3 text-sm font-semibold">Arama Sonuçları</h2>
          <div className="flex flex-wrap gap-2">
            {searchResults.owners.map((o) => (
              <a key={o.id} href={`/admin/owners/${o.id}`} className="rounded-lg border px-3 py-2 text-sm hover:bg-[#f4f0e8]">
                👤 {o.full_name}
              </a>
            ))}
            {searchResults.pets.map((p) => (
              <a key={p.id} href={`/admin/pets/${p.id}`} className="rounded-lg border px-3 py-2 text-sm hover:bg-[#f4f0e8]">
                🐾 {p.name}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Pending Online Requests */}
      {pending.length > 0 && (
        <section className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4" aria-label="Bekleyen online talepler">
          <h2 className="mb-3 text-sm font-semibold text-amber-800">⏳ Bekleyen Online Talepler ({pending.length})</h2>
          <div className="space-y-2">
            {pending.map((a) => <ReceptionAppointmentCard key={a.id} item={a} />)}
          </div>
        </section>
      )}

      {/* Unassigned Appointments */}
      {unassigned.length > 0 && (
        <section className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4" aria-label="Atanmamış randevular">
          <h2 className="mb-3 text-sm font-semibold text-orange-800">📋 Atanmamış Randevular ({unassigned.length})</h2>
          <div className="space-y-2">
            {unassigned.map((a) => <ReceptionAppointmentCard key={a.id} item={a} />)}
          </div>
        </section>
      )}

      {/* Today's Appointments */}
      <section aria-label="Bugünün randevuları">
        <h2 className="mb-3 text-sm font-semibold">Bugünün Randevuları ({todayAppts.length})</h2>
        {todayAppts.length > 0 ? (
          <div className="space-y-2">
            {todayAppts.map((a) => <ReceptionAppointmentCard key={a.id} item={a} />)}
          </div>
        ) : (
          <p className="rounded-xl bg-white p-8 text-center text-[#526a64]">Bu gün için randevu bulunmuyor.</p>
        )}
      </section>

      {/* Completed and Cancelled (collapsed by default) */}
      {(completed.length > 0 || cancelled.length > 0) && (
        <details className="rounded-xl bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[#526a64]">
            Tamamlananlar / İptaller ({completed.length + cancelled.length})
          </summary>
          <div className="mt-3 space-y-2">
            {completed.map((a) => <ReceptionAppointmentCard key={a.id} item={a} />)}
            {cancelled.map((a) => <ReceptionAppointmentCard key={a.id} item={a} />)}
          </div>
        </details>
      )}
    </div>
  );
}
