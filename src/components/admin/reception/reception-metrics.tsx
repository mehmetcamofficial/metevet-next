import type { ReceptionMetrics as MetricsType } from "@/src/lib/admin/reception/reception-readers";

export function ReceptionMetrics({ metrics }: { metrics: MetricsType }) {
  const items = [
    { label: "Bugün", value: metrics.todayTotal, color: "bg-[#0d2922] text-white" },
    { label: "Bekleyen onay", value: metrics.pending, color: "bg-amber-100 text-amber-800" },
    { label: "Onaylı", value: metrics.confirmed, color: "bg-green-100 text-green-800" },
    { label: "Bekleme salonu", value: metrics.waiting, color: "bg-sky-100 text-sky-900" },
    { label: "Muayenede", value: metrics.inExam, color: "bg-teal-100 text-teal-900" },
    { label: "Online", value: metrics.website, color: "bg-purple-100 text-purple-800" },
    { label: "Atanmamış", value: metrics.unassigned, color: "bg-orange-100 text-orange-800" },
  ];

  return (
    <div className="flex flex-wrap gap-2" aria-label="Günlük metrikler">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${item.color}`}
        >
          <span>{item.label}</span>
          <span className="text-lg font-bold" aria-label={`${item.label}: ${item.value}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
