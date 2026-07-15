import Link from "next/link";
import type { CalendarAppointment } from "@/src/lib/admin/calendar/calendar-readers";
import { serviceLabels, sourceLabels } from "@/src/lib/admin/appointments";

/** Visible day window: 07:00 – 20:00 (13 hours). */
const START_HOUR = 7;
const END_HOUR = 20;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; // 780
/** Fixed hour row height keeps cards inside the grid on all breakpoints. */
const HOUR_HEIGHT_PX = 64;
const GRID_HEIGHT_PX = ((END_HOUR - START_HOUR) * HOUR_HEIGHT_PX);
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

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

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function minutesFromStart(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes() - START_HOUR * 60;
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

              {/* Timeline grid: fixed height so % / px positioning is stable */}
              <div
                className="relative flex min-w-0"
                style={{ height: GRID_HEIGHT_PX }}
              >
                {/* Time axis labels */}
                <div
                  className="relative w-14 shrink-0 border-r border-[#D1DBD5] sm:w-16"
                  aria-hidden
                >
                  {HOURS.map((h) => {
                    const top = ((h - START_HOUR) / (END_HOUR - START_HOUR)) * 100;
                    // End label (20:00) sits just above the bottom edge
                    const isEnd = h === END_HOUR;
                    return (
                      <div
                        key={h}
                        className="absolute left-0 w-full"
                        style={{
                          top: isEnd ? "auto" : `${top}%`,
                          bottom: isEnd ? 0 : undefined,
                          transform: isEnd ? undefined : "translateY(-50%)",
                        }}
                      >
                        <span className="ml-1 text-[10px] leading-none text-[#95A8A2] sm:text-xs">
                          {String(h).padStart(2, "0")}:00
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Appointment lane: grid lines + cards */}
                <div className="relative min-w-0 flex-1 overflow-hidden">
                  {/* Hour row borders (below cards) */}
                  {HOURS.slice(0, -1).map((h) => {
                    const top = ((h - START_HOUR) / (END_HOUR - START_HOUR)) * 100;
                    return (
                      <div
                        key={h}
                        className="pointer-events-none absolute inset-x-0 border-t border-[#f0f0f0]"
                        style={{ top: `${top}%`, height: HOUR_HEIGHT_PX }}
                        aria-hidden
                      />
                    );
                  })}
                  {/* Bottom border of last hour */}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-[#f0f0f0]"
                    aria-hidden
                  />

                  {/* Appointment cards — z-10: above grid, below sticky toolbars (z-20+) */}
                  {appts.map((item) => {
                    const startOffset = minutesFromStart(item.starts_at);
                    const durationMin = Math.max(
                      15,
                      (new Date(item.ends_at).getTime() - new Date(item.starts_at).getTime()) / 60000,
                    );

                    // Clamp into visible window
                    const clampedStart = Math.max(0, Math.min(TOTAL_MINUTES, startOffset));
                    const clampedEnd = Math.max(
                      clampedStart + 15,
                      Math.min(TOTAL_MINUTES, startOffset + durationMin),
                    );
                    const topPx = (clampedStart / TOTAL_MINUTES) * GRID_HEIGHT_PX;
                    const heightPx = Math.max(
                      28,
                      ((clampedEnd - clampedStart) / TOTAL_MINUTES) * GRID_HEIGHT_PX,
                    );

                    // Inset from row edges so the card sits fully inside the hour row
                    const insetTop = 2;
                    const insetBottom = 2;
                    const cardTop = topPx + insetTop;
                    const cardHeight = Math.max(24, heightPx - insetTop - insetBottom);

                    return (
                      <Link
                        key={item.id}
                        href={`/admin/appointments/${item.id}`}
                        className={`absolute z-10 block overflow-hidden rounded-md border px-2 pb-1 pt-1.5 text-xs leading-tight hover:shadow ${
                          item.status === "pending"
                            ? "border-amber-300 bg-amber-50"
                            : "border-[#D1DBD5] bg-white"
                        }`}
                        style={{
                          top: cardTop,
                          height: cardHeight,
                          left: 8,
                          right: 4,
                        }}
                        aria-label={`${item.pet_name} - ${formatTime(item.starts_at)}`}
                      >
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span
                            className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-[11px] leading-none"
                            aria-hidden
                          >
                            {statusIcon(item.status)}
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums">
                            {formatTime(item.starts_at)}
                          </span>
                          <span className="min-w-0 truncate">{item.pet_name}</span>
                        </div>
                        <div className="mt-0.5 truncate text-[#526a64]">
                          {item.owner_name} · {serviceLabels[item.service_key] ?? item.service_key}
                        </div>
                        <div className="mt-0.5 flex min-w-0 items-center gap-2 truncate text-[10px] text-[#95A8A2]">
                          <span className="shrink-0">{channelLabel(item.source)}</span>
                          {item.public_booking_reference && (
                            <span className="truncate font-mono">{item.public_booking_reference}</span>
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
