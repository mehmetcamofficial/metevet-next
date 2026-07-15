import Link from "next/link";

type VeterinarianToolbarProps = {
  date: string;
  previous: string;
  next: string;
  today: string;
};

export function VeterinarianToolbar({ date, previous, next, today }: VeterinarianToolbarProps) {
  const dateLabel = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "medium" }).format(new Date(`${date}T12:00:00Z`));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4">
      <div className="flex items-center gap-2">
        <Link
          className="rounded-lg border px-3 py-2 hover:bg-[#f4f0e8]"
          href={`/admin/veterinarian?date=${previous}`}
          aria-label="Önceki gün"
        >
          ←
        </Link>
        <Link
          className="rounded-lg border px-3 py-2 hover:bg-[#f4f0e8]"
          href={`/admin/veterinarian?date=${today}`}
        >
          Bugün
        </Link>
        <Link
          className="rounded-lg border px-3 py-2 hover:bg-[#f4f0e8]"
          href={`/admin/veterinarian?date=${next}`}
          aria-label="Sonraki gün"
        >
          →
        </Link>
        <strong className="ml-2">{dateLabel}</strong>
      </div>
    </div>
  );
}
