import Link from "next/link";

type ReceptionToolbarProps = {
  date: string;
  previous: string;
  next: string;
  today: string;
};

export function ReceptionToolbar({ date, previous, next, today }: ReceptionToolbarProps) {
  const dateLabel = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "medium" }).format(new Date(`${date}T12:00:00Z`));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4">
      <div className="flex items-center gap-2">
        <Link
          className="rounded-lg border px-3 py-2 hover:bg-[#f4f0e8]"
          href={`/admin/reception?date=${previous}`}
          aria-label="Önceki gün"
        >
          ←
        </Link>
        <Link
          className="rounded-lg border px-3 py-2 hover:bg-[#f4f0e8]"
          href={`/admin/reception?date=${today}`}
        >
          Bugün
        </Link>
        <Link
          className="rounded-lg border px-3 py-2 hover:bg-[#f4f0e8]"
          href={`/admin/reception?date=${next}`}
          aria-label="Sonraki gün"
        >
          →
        </Link>
        <strong className="ml-2">{dateLabel}</strong>
      </div>
      <div className="flex gap-2">
        <Link href="/admin/appointments/new" className="rounded-lg bg-[#0d2922] px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
          + Yeni Randevu
        </Link>
      </div>
    </div>
  );
}
