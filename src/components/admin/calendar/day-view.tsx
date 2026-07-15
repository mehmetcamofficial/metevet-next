import Link from "next/link";
import type { CalendarAppointment } from "@/src/lib/admin/calendar/calendar-readers";
import { serviceLabels, sourceLabels } from "@/src/lib/admin/appointments";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 - 20:00

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

function channelLabel(source: string): string {
  return sourceLabels[source as keyof typeof sourceLabels] ?? source;
}

export function DayView({ items }: { items: CalendarAppointment[] }) {
  // Group by veterinarian
  const vetGroups = new Map<string | null, CalendarAppointment[]>();
  for (const item of items) {
    const key = item.assigned_user_id ?? "unassigned";
    const group = vetGroups.get(key) ?? [];
    group.push(item);
    vetGroups.set(key, group);
  }

  return (
    <section className="hidden rounded-2xl bg-white p-5 md:block" aria-label="Gün görünümü">
      {vetGroups.size === 0 ? (
        <p className="py-8 text-center text-[#526a64]">Bu gün için randevu bulunmuyor.</p>
      ) : (
        <div className="space-y-6">
          {Array.from(vetGroups.entries()).map(([vetId, appts]) => (
            <div key={vetId ?? "unassigned"}>
              <h2 className="mb-2 text-sm font-semibold text-[#526a64]">
                {vetId === "unassigned" ? "Atanmamış" : `Veteriner`}
              </h2>
              <div className="relative">
                {/* Time axis */}
                <div className="absolute left-0 top-0 h-full w-16 border-r border-[#D1DBD5]">
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-[#f0f0f0]"
                      style={{ top: `${((h - 7) * 60) / 1440 * 100}%` }}
                    >
                      <span className="ml-1 text-xs text-[#95A8A2]">
                        {String(h).padStart(2, "0")}:00
                      </span>
                    </div>
                  ))}
                </div>

                {/* Appointments */}
                <div className="ml-16 space-y-2">
                  {appts.map((item) => {
                    const startMin = new Date(item.starts_at).getHours() * 60 + new Date(item.starts_at).getMinutes();
                    const durationMin = (new Date(item.ends_at).getTime() - new Date(item.starts_at).getTime()) / 60000;
                    const topPercent = ((startMin - 420) / 780) * 100;
                    const heightPercent = (durationMin / 780) * 100;

                    return (
                      <Link
                        key={item.id}
                        href={`/admin/appointments/${item.id}`}
                        className={`absolute left-0 right-0 ml-2 block rounded-lg border p-2 text-xs hover:shadow ${
                          item.status === "pending" ? "border-amber-300 bg-amber-50" : "border-[#D1DBD5] bg-white"
                        }`}
                        style={{
                          top: `${Math.max(0, topPercent)}%`,
                          height: `${Math.max(2, heightPercent)}%`,
                        }}
                        aria-label={`${item.pet_name} - ${new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(item.starts_at))}`}
                      >
                        <div className="flex items-center gap-1">
                          <span>{statusIcon(item.status)}</span>
                          <span className="font-semibold">
                            {new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(item.starts_at))}
                          </span>
                          <span>{item.pet_name}</span>
                        </div>
                        <div className="mt-1 text-[#526a64]">
                          {item.owner_name} · {serviceLabels[item.service_key] ?? item.service_key}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[#95A8A2]">
                          <span>{channelLabel(item.source)}</span>
                          {item.public_booking_reference && (
                            <span className="font-mono">{item.public_booking_reference}</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
