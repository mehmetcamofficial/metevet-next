import { ReceptionMetrics } from "./reception-metrics";
import { ReceptionAppointmentCard } from "./reception-appointment-card";
import type {
  ReceptionAppointment,
  ReceptionMetrics as MetricsType,
} from "@/src/lib/admin/reception/reception-readers";
import { RECEPTION_FLOW_SECTIONS } from "@/src/lib/admin/clinic-flow/clinic-flow";
import type { UserRole } from "@/src/types/database";

type ReceptionWorkspaceProps = {
  appointments: ReceptionAppointment[];
  metrics: MetricsType;
  date: string;
  today: string;
  role: UserRole;
  actorId: string;
  searchResults?: {
    owners: Array<{ id: string; full_name: string; phone: string | null }>;
    pets: Array<{ id: string; name: string; owner_id: string }>;
  };
};

export function ReceptionWorkspace({
  appointments,
  metrics,
  role,
  actorId,
  searchResults,
}: ReceptionWorkspaceProps) {
  const pending = appointments.filter((a) => a.status === "pending");
  const unassigned = appointments.filter((a) => !a.assigned_user_id && a.status !== "cancelled");
  const terminal = appointments.filter(
    (a) => a.status === "cancelled" || a.status === "no_show",
  );

  // Operational board: exclude cancelled/no_show from flow columns (completed flow stays visible)
  const operational = appointments.filter(
    (a) => a.status !== "cancelled" && a.status !== "no_show",
  );

  return (
    <div className="space-y-6">
      <ReceptionMetrics metrics={metrics} />

      {searchResults && (searchResults.owners.length > 0 || searchResults.pets.length > 0) && (
        <section className="rounded-xl bg-white p-4" aria-label="Arama sonuçları">
          <h2 className="mb-3 text-sm font-semibold">Arama Sonuçları</h2>
          <div className="flex flex-wrap gap-2">
            {searchResults.owners.map((o) => (
              <a
                key={o.id}
                href={`/admin/owners/${o.id}`}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-[#f4f0e8]"
              >
                👤 {o.full_name}
              </a>
            ))}
            {searchResults.pets.map((p) => (
              <a
                key={p.id}
                href={`/admin/pets/${p.id}`}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-[#f4f0e8]"
              >
                🐾 {p.name}
              </a>
            ))}
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section
          className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4"
          aria-label="Bekleyen online talepler"
        >
          <h2 className="mb-3 text-sm font-semibold text-amber-800">
            ⏳ Bekleyen Online Talepler ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((a) => (
              <ReceptionAppointmentCard key={a.id} item={a} role={role} actorId={actorId} />
            ))}
          </div>
        </section>
      )}

      {unassigned.length > 0 && (
        <section
          className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4"
          aria-label="Atanmamış randevular"
        >
          <h2 className="mb-3 text-sm font-semibold text-orange-800">
            📋 Atanmamış Randevular ({unassigned.length})
          </h2>
          <div className="space-y-2">
            {unassigned.map((a) => (
              <ReceptionAppointmentCard key={a.id} item={a} role={role} actorId={actorId} />
            ))}
          </div>
        </section>
      )}

      {/* Clinic flow board — single column on mobile, grouped sections on desktop */}
      <div className="space-y-4" aria-label="Klinik akış panosu">
        <h2 className="text-base font-semibold text-[#0D2922]">Klinik Akış</h2>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {RECEPTION_FLOW_SECTIONS.map(({ state, title }) => {
            const items = operational.filter((a) => a.flow_state === state);
            return (
              <section
                key={state}
                className="rounded-xl border border-[#D1DBD5] bg-white p-4"
                aria-label={title}
              >
                <h3 className="mb-3 flex items-center justify-between text-sm font-semibold text-[#0D2922]">
                  <span>{title}</span>
                  <span className="rounded-full bg-[#DDE9E3] px-2 py-0.5 text-xs font-medium text-[#123A30]">
                    {items.length}
                  </span>
                </h3>
                {items.length > 0 ? (
                  <div className="space-y-2">
                    {items.map((a) => (
                      <ReceptionAppointmentCard
                        key={a.id}
                        item={a}
                        role={role}
                        actorId={actorId}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-xs text-[#95A8A2]">Kayıt yok</p>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {terminal.length > 0 && (
        <details className="rounded-xl bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[#526a64]">
            İptal / Gelmedi ({terminal.length})
          </summary>
          <div className="mt-3 space-y-2">
            {terminal.map((a) => (
              <ReceptionAppointmentCard key={a.id} item={a} role={role} actorId={actorId} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
