import type { VetMetrics } from "@/src/lib/admin/veterinarian/veterinarian-readers";

export function VeterinarianMetrics({ metrics }: { metrics: VetMetrics }) {
  const items = [
    { label: "Bugün", value: metrics.todayTotal, color: "bg-[#0d2922] text-white" },
    { label: "Bekleyen", value: metrics.pending, color: "bg-amber-100 text-amber-800" },
    { label: "Onaylı", value: metrics.confirmed, color: "bg-green-100 text-green-800" },
    { label: "Muayene Bekliyor", value: metrics.noExamination, color: "bg-purple-100 text-purple-800" },
  ];

  return (
    <div className="flex flex-wrap gap-2" aria-label="Günlük metrikler">
      {items.map((item) => (
        <div key={item.label} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${item.color}`}>
          <span>{item.label}</span>
          <span className="text-lg font-bold">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
