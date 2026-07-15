import Link from "next/link";
import type { CalendarAppointment } from "@/src/lib/admin/calendar/calendar-readers";

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

export function WeekView({ items, anchor }: { items: CalendarAppointment[]; anchor: string }) {
  // Group by day
  const dayGroups = new Map<string, CalendarAppointment[]>();
  for (const item of items) {
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date(item.starts_at));
    const group = dayGroups.get(key) ?? [];
    group.push(item);
    dayGroups.set(key, group);
  }

  // Get week start (Monday)
  const anchorDate = new Date(`${anchor}T12:00:00Z`);
  const weekStart = new Date(anchorDate);
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  return (
    <section className="hidden grid-cols-7 gap-2 md:grid" aria-label="Hafta görünümü">
      {days.map((day, i) => {
        const appts = dayGroups.get(day) ?? [];
        const date = new Date(`${day}T12:00:00Z`);
        const isToday = day === new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());

        return (
          <div key={day} className={`min-h-48 rounded-xl bg-white p-2 ${isToday ? "ring-2 ring-[#0d2922]" : ""}`}>
            <div className={`mb-2 text-center text-xs font-semibold ${isToday ? "text-[#0d2922]" : "text-[#526a64]"}`}>
              <div>{dayNames[i]}</div>
              <div>{date.getUTCDate()}</div>
            </div>
            <div className="space-y-1">
              {appts.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/appointments/${item.id}`}
                  className={`block rounded-lg border p-1.5 text-[10px] hover:shadow ${
                    item.status === "pending"
                      ? "border-amber-300 bg-amber-50"
                      : "border-[#D1DBD5] bg-white"
                  }`}
                >
                  <div className="flex items-center gap-0.5">
                    <span>{statusIcon(item.status)}</span>
                    <span className="font-semibold">
                      {new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(item.starts_at))}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate">{item.pet_name}</div>
                </Link>
              ))}
              {appts.length === 0 && (
                <div className="py-4 text-center text-[10px] text-[#95A8A2]">—</div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
