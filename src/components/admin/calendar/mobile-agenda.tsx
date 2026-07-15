import Link from "next/link";
import type { CalendarAppointment } from "@/src/lib/admin/calendar/calendar-readers";
import type { AppointmentStatus } from "@/src/types/database";
import { AppointmentStatusBadge } from "../appointments/appointment-status-badge";
import { serviceLabels, sourceLabels } from "@/src/lib/admin/appointments";

export function MobileAgenda({ items }: { items: CalendarAppointment[] }) {
  // Group by date
  const dayGroups = new Map<string, CalendarAppointment[]>();
  for (const item of items) {
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date(item.starts_at));
    const group = dayGroups.get(key) ?? [];
    group.push(item);
    dayGroups.set(key, group);
  }

  return (
    <section className="md:hidden" aria-label="Ajanda görünümü">
      {dayGroups.size === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-[#526a64]">
          Bu dönem için randevu bulunmuyor.
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(dayGroups.entries()).map(([date, appts]) => {
            const dateObj = new Date(`${date}T12:00:00Z`);
            const dateLabel = new Intl.DateTimeFormat("tr-TR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(dateObj);

            return (
              <div key={date}>
                <h3 className="mb-2 text-sm font-semibold text-[#526a64]">{dateLabel}</h3>
                <div className="space-y-2">
                  {appts.map((item) => (
                    <article key={item.id} className="rounded-xl bg-white p-4">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/admin/appointments/${item.id}`} className="font-semibold hover:underline">
                          {item.pet_name}
                        </Link>
                        <AppointmentStatusBadge status={item.status as AppointmentStatus} />
                      </div>
                      <p className="mt-1 text-sm">
                        {new Intl.DateTimeFormat("tr-TR", {
                          timeZone: "Europe/Istanbul",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(item.starts_at))}
                      </p>
                      <p className="mt-1 text-sm text-[#526a64]">
                        {item.owner_name} · {serviceLabels[item.service_key] ?? item.service_key}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[#95A8A2]">
                        <span>{sourceLabels[item.source as keyof typeof sourceLabels] ?? item.source}</span>
                        {item.vet_name && <span>· {item.vet_name}</span>}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
