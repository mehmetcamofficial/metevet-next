import type { DailyMetrics } from "@/src/lib/admin/calendar/calendar-readers";

const STATUS_LABELS: Record<string, string> = {
  total: "Toplam",
  pending: "Bekleyen",
  confirmed: "Onaylı",
  completed: "Tamamlandı",
  cancelled: "İptal",
  no_show: "Gelmedi",
  online: "Online",
  unassigned: "Atanmamış",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-100 text-gray-800",
  online: "bg-purple-100 text-purple-800",
  unassigned: "bg-orange-100 text-orange-800",
};

export function DailyMetricsBar({ metrics }: { metrics: DailyMetrics }) {
  const keys = ["total", "pending", "confirmed", "online", "unassigned"] as const;

  return (
    <div className="mb-4 flex flex-wrap gap-3" aria-label="Günlük özet">
      {keys.map((key) => (
        <div
          key={key}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${STATUS_COLORS[key] ?? "bg-white border"}`}
        >
          <span>{STATUS_LABELS[key]}</span>
          <span className="text-lg font-bold">{metrics[key]}</span>
        </div>
      ))}
    </div>
  );
}
