import type { CalendarClosure } from "@/src/lib/admin/calendar/calendar-readers";

const CLOSURE_LABELS: Record<string, string> = {
  full_day: "Tam Gün Kapatma",
  half_day: "Yarım Gün Kapatma",
  veterinarian_leave: "Veteriner İzni",
};

export function ClosureOverlay({ closures, anchor }: { closures: CalendarClosure[]; anchor: string }) {
  // Filter closures that affect the current view date
  const anchorDate = new Date(`${anchor}T12:00:00Z`);
  const relevant = closures.filter((c) => {
    const start = new Date(c.starts_at);
    const end = new Date(c.ends_at);
    return start <= anchorDate && end >= anchorDate;
  });

  if (relevant.length === 0) return null;

  return (
    <section className="mb-4 rounded-xl border-2 border-red-300 bg-red-50 p-4" aria-label="Klinik kapatmaları">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-800">
        <span>⚠️</span>
        Kapatma / İzin Bildirimi
      </h2>
      <div className="space-y-1">
        {relevant.map((c) => (
          <div key={c.id} className="text-sm text-red-700">
            <span className="font-semibold">{CLOSURE_LABELS[c.closure_type] ?? c.closure_type}</span>
            <span className="ml-2">{c.title}</span>
            {!c.affects_all_veterinarians && c.veterinarian_id && (
              <span className="ml-2 text-xs text-red-500">(Belirli veteriner)</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
