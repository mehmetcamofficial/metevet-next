import Link from "next/link";
import type { CalendarAppointment } from "@/src/lib/admin/calendar/calendar-readers";
import { serviceLabels } from "@/src/lib/admin/appointments";

export function PendingQueue({
  appointments,
  vets,
}: {
  appointments: CalendarAppointment[];
  vets: Array<{ id: string; full_name: string }>;
}) {
  return (
    <section className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4" aria-label="Bekleyen online talepler">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800">
        <span>⏳</span>
        Bekleyen Online Talepler ({appointments.length})
      </h2>
      <div className="space-y-2">
        {appointments.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg bg-white p-3 text-sm"
          >
            <div>
              <Link href={`/admin/appointments/${item.id}`} className="font-semibold text-amber-900 hover:underline">
                {item.pet_name}
              </Link>
              <span className="ml-2 text-[#526a64]">
                {item.owner_name} · {serviceLabels[item.service_key] ?? item.service_key}
              </span>
              {item.requested_veterinarian_id && (
                <span className="ml-2 text-xs text-[#95A8A2]">
                  İstenen: {vets.find((v) => v.id === item.requested_veterinarian_id)?.full_name ?? "—"}
                </span>
              )}
              {!item.assigned_user_id && (
                <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">
                  Atanmamış
                </span>
              )}
            </div>
            <Link
              href={`/admin/appointments/${item.id}`}
              className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
            >
              İncele
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
