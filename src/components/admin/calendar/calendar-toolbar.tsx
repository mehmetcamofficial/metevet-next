import Link from "next/link";

type CalendarToolbarProps = {
  view: "day" | "week" | "agenda";
  anchor: string;
  previous: string;
  next: string;
  today: string;
  vets: Array<{ id: string; full_name: string }>;
  selectedVet: string;
  selectedStatus: string;
};

const VIEWS: Record<string, string> = { day: "Gün", week: "Hafta", agenda: "Ajanda" };

export function CalendarToolbar({
  view,
  anchor,
  previous,
  next,
  today,
  vets,
  selectedVet,
  selectedStatus,
}: CalendarToolbarProps) {
  const anchorDate = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    dateStyle: "medium",
  }).format(new Date(`${anchor}T12:00:00Z`));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Link
          className="rounded-lg border px-3 py-2 hover:bg-[#f4f0e8]"
          href={`/admin/calendar?view=${view}&date=${previous}${selectedVet ? `&veterinarian=${selectedVet}` : ""}${selectedStatus !== "all" ? `&status=${selectedStatus}` : ""}`}
          aria-label="Önceki dönem"
        >
          ←
        </Link>
        <Link
          className="rounded-lg border px-3 py-2 hover:bg-[#f4f0e8]"
          href={`/admin/calendar?view=${view}&date=${today}`}
        >
          Bugün
        </Link>
        <Link
          className="rounded-lg border px-3 py-2 hover:bg-[#f4f0e8]"
          href={`/admin/calendar?view=${view}&date=${next}${selectedVet ? `&veterinarian=${selectedVet}` : ""}${selectedStatus !== "all" ? `&status=${selectedStatus}` : ""}`}
          aria-label="Sonraki dönem"
        >
          →
        </Link>
        <strong className="ml-2">{anchorDate}</strong>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Veterinarian filter */}
        {vets.length > 0 && (
          <select
            aria-label="Veteriner filtresi"
            className="rounded-lg border px-3 py-2 text-sm"
            value={selectedVet}
            onChange={(e) => {
              const url = new URL(window.location.href);
              if (e.target.value) url.searchParams.set("veterinarian", e.target.value);
              else url.searchParams.delete("veterinarian");
              window.location.href = url.toString();
            }}
          >
            <option value="">Tüm veterinerler</option>
            {vets.map((v) => (
              <option key={v.id} value={v.id}>
                {v.full_name}
              </option>
            ))}
          </select>
        )}

        {/* Status filter */}
        <select
          aria-label="Durum filtresi"
          className="rounded-lg border px-3 py-2 text-sm"
          value={selectedStatus}
          onChange={(e) => {
            const url = new URL(window.location.href);
            if (e.target.value !== "all") url.searchParams.set("status", e.target.value);
            else url.searchParams.delete("status");
            window.location.href = url.toString();
          }}
        >
          <option value="all">Tüm durumlar</option>
          <option value="pending">Bekleyen</option>
          <option value="confirmed">Onaylandı</option>
          <option value="completed">Tamamlandı</option>
          <option value="cancelled">İptal</option>
          <option value="no_show">Gelmedi</option>
        </select>

        {/* View switcher */}
        <div className="flex gap-1" aria-label="Takvim görünümü">
          {(["day", "week", "agenda"] as const).map((v) => (
            <Link
              key={v}
              aria-current={v === view ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm ${v === view ? "bg-[#0d2922] text-white" : "border hover:bg-[#f4f0e8]"}`}
              href={`/admin/calendar?view=${v}&date=${anchor}`}
            >
              {VIEWS[v]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
