export function StatusBadge({ archived }: { archived: boolean }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${archived ? "bg-stone-200 text-stone-700" : "bg-emerald-100 text-emerald-800"}`}>{archived ? "Arşivlenmiş" : "Aktif"}</span>;
}
