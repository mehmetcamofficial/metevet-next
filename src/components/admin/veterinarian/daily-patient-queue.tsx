import Link from "next/link";
import type { VetAppointment } from "@/src/lib/admin/veterinarian/veterinarian-readers";
import { AppointmentStatusBadge } from "../appointments/appointment-status-badge";
import { serviceLabels } from "@/src/lib/admin/appointments";
import type { AppointmentStatus } from "@/src/types/database";

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function statusIcon(status: string): string {
  switch (status) {
    case "pending": return "⏳";
    case "confirmed": return "✅";
    case "completed": return "✔";
    case "cancelled": return "❌";
    case "no_show": return "🚫";
    default: return "📋";
  }
}

export function DailyPatientQueue({ appointments }: { appointments: VetAppointment[] }) {
  const active = appointments.filter((a) => a.status !== "cancelled" && a.status !== "no_show");
  const completed = appointments.filter((a) => a.status === "completed");
  const cancelled = appointments.filter((a) => a.status === "cancelled" || a.status === "no_show");

  return (
    <div className="space-y-6">
      {/* Active appointments */}
      <section aria-label="Bugünün hastaları">
        <h2 className="mb-3 text-sm font-semibold">Bugünün Hastaları ({active.length})</h2>
        {active.length > 0 ? (
          <div className="space-y-2">
            {active.map((a) => (
              <article key={a.id} className="rounded-xl border border-[#D1DBD5] bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{statusIcon(a.status)}</span>
                      <span className="font-semibold">{formatTime(a.starts_at)}</span>
                      <span className="font-medium">{a.pet_name}</span>
                    </div>
                    <p className="mt-1 text-sm text-[#526a64]">
                      {a.pet_species} · {a.owner_name} · {serviceLabels[a.service_key] ?? a.service_key}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <AppointmentStatusBadge status={a.status as AppointmentStatus} />
                    <Link href={`/admin/appointments/${a.id}`} className="text-xs text-[#123A30] underline">
                      Detay
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-white p-8 text-center text-[#526a64]">Bu gün için aktif randevu bulunmuyor.</p>
        )}
      </section>

      {/* Completed and Cancelled (collapsed) */}
      {(completed.length > 0 || cancelled.length > 0) && (
        <details className="rounded-xl bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[#526a64]">
            Tamamlananlar / İptaller ({completed.length + cancelled.length})
          </summary>
          <div className="mt-3 space-y-2">
            {completed.map((a) => (
              <article key={a.id} className="rounded-xl border border-[#D1DBD5] bg-white p-3 opacity-70">
                <div className="flex items-center gap-2">
                  <span>{statusIcon(a.status)}</span>
                  <span className="font-semibold">{formatTime(a.starts_at)}</span>
                  <span>{a.pet_name}</span>
                  <AppointmentStatusBadge status={a.status as AppointmentStatus} />
                </div>
              </article>
            ))}
            {cancelled.map((a) => (
              <article key={a.id} className="rounded-xl border border-[#D1DBD5] bg-white p-3 opacity-70">
                <div className="flex items-center gap-2">
                  <span>{statusIcon(a.status)}</span>
                  <span className="font-semibold">{formatTime(a.starts_at)}</span>
                  <span>{a.pet_name}</span>
                  <AppointmentStatusBadge status={a.status as AppointmentStatus} />
                </div>
              </article>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
