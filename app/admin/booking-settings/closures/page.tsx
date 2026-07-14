import Link from "next/link";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { createClient } from "@/src/lib/supabase/server";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { EmptyState } from "@/src/components/admin/empty-state";
import { ConfirmDialog } from "@/src/components/admin/confirm-dialog";
import { getAllClosures, getActiveVeterinarians } from "@/src/lib/admin/booking/booking-readers";
import { closureTypeLabels } from "@/src/lib/admin/booking/booking-validation";
import { archiveClosure, restoreClosure } from "@/app/admin/booking-settings/actions";

type ClosureRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  closure_type: "full_day" | "half_day" | "veterinarian_leave";
  affects_all_veterinarians: boolean;
  veterinarian_id: string | null;
  notes: string | null;
  archived_at: string | null;
};

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

function Card({ c, vetMap }: { c: ClosureRow; vetMap: Map<string, string> }) {
  const vetName = c.veterinarian_id ? vetMap.get(c.veterinarian_id) ?? "—" : null;
  return (
    <article className="flex flex-wrap items-start justify-between gap-4 rounded-xl bg-white p-5">
      <div>
        <p className="font-semibold">{c.title}</p>
        <p className="text-sm text-[#526a64]">
          {fmtDate(c.starts_at)} — {fmtDate(c.ends_at)}
        </p>
        <p className="mt-1 text-sm">
          <span className="inline-block rounded bg-[#0d2922]/10 px-2 py-0.5 text-xs font-medium">
            {closureTypeLabels[c.closure_type] ?? c.closure_type}
          </span>
          {c.affects_all_veterinarians && (
            <span className="ml-2 inline-block rounded bg-[#0d2922]/10 px-2 py-0.5 text-xs font-medium">
              Tüm Veterinerler
            </span>
          )}
          {vetName && (
            <span className="ml-2 inline-block rounded bg-[#cda85f]/20 px-2 py-0.5 text-xs font-medium">
              {vetName}
            </span>
          )}
        </p>
        {c.notes && <p className="mt-2 text-xs text-[#526a64]">{c.notes}</p>}
      </div>
      <div className="flex gap-2">
        {!c.archived_at && (
          <>
            <Link
              href={`/admin/booking-settings/closures/${c.id}/edit`}
              className="rounded-lg border border-[#0d2922]/20 px-4 py-2 text-sm font-medium"
            >
              Düzenle
            </Link>
            <ConfirmDialog
              title="Kapatmayı Arşivle"
              description={`${c.title} kapatmasını arşivlemek istediğinize emin misiniz? Arşivlenen kapatma randevu hesaplamasında dikkate alınmaz.`}
              triggerLabel="Arşivle"
              confirmLabel="Arşivle"
              action={archiveClosure.bind(null, c.id)}
              danger
            />
          </>
        )}
        {c.archived_at && (
          <ConfirmDialog
            title="Kapatmayı Geri Yükle"
            description={`${c.title} kapatmasını geri yüklemek istediğinize emin misiniz? Kapatma randevu hesaplamasında yeniden dikkate alınacaktır.`}
            triggerLabel="Geri Yükle"
            confirmLabel="Geri Yükle"
            action={restoreClosure.bind(null, c.id)}
          />
        )}
      </div>
    </article>
  );
}

function Section({
  title,
  items,
  emptyTitle,
  emptyDescription,
  vetMap,
}: {
  title: string;
  items: ClosureRow[];
  emptyTitle: string;
  emptyDescription: string;
  vetMap: Map<string, string>;
}) {
  return (
    <section className="mt-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      {items.length > 0 ? (
        <div className="mt-3 space-y-3">{items.map((c) => <Card key={c.id} c={c} vetMap={vetMap} />)}</div>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </section>
  );
}

export default async function ClosuresPage() {
  const session = await requireAdmin();
  const s = await createClient();
  if (!s) return <p role="alert">Veri yüklenemedi.</p>;

  const [closuresResult, vetsResult] = await Promise.all([
    getAllClosures(s),
    getActiveVeterinarians(s),
  ]);

  const closures: ClosureRow[] = closuresResult.data ?? [];
  const vetMap = new Map((vetsResult.data ?? []).map((v) => [v.id, v.full_name]));

  const now = new Date();
  const nowIso = now.toISOString();

  const archived = closures.filter((c) => c.archived_at !== null);
  const active = closures.filter(
    (c) => !c.archived_at && c.starts_at <= nowIso && c.ends_at >= nowIso,
  );
  const upcoming = closures.filter(
    (c) => !c.archived_at && c.starts_at > nowIso,
  );
  const past = closures.filter(
    (c) => !c.archived_at && c.ends_at < nowIso,
  );

  return (
    <AdminShell session={session}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Klinik Kapatmaları</h1>
          <p className="mt-2 text-sm text-[#526a64]">
            {closures.filter((c) => !c.archived_at).length} aktif kapatma
          </p>
        </div>
        <Link
          href="/admin/booking-settings/closures/new"
          className="rounded-lg bg-[#0d2922] px-4 py-3 font-semibold text-white"
        >
          Yeni Kapatma
        </Link>
      </div>

      <Section
        title="Aktif Şimdi"
        items={active}
        emptyTitle="Şu anda aktif kapatma yok"
        emptyDescription="Klinik şu anda herhangi bir kapatma veya izin dışında normal çalışıyor."
        vetMap={vetMap}
      />
      <Section
        title="Yaklaşan"
        items={upcoming}
        emptyTitle="Yaklaşan kapatma yok"
        emptyDescription="Planlı yaklaşan kapatma veya veteriner izni bulunmuyor."
        vetMap={vetMap}
      />
      <Section
        title="Geçmiş"
        items={past}
        emptyTitle="Geçmiş kapatma yok"
        emptyDescription="Bitmiş kapatma kaydı bulunmuyor."
        vetMap={vetMap}
      />
      <Section
        title="Arşivlenmiş"
        items={archived}
        emptyTitle="Arşivlenmiş kapatma yok"
        emptyDescription="Henüz arşivlenmiş kapatma bulunmuyor."
        vetMap={vetMap}
      />
    </AdminShell>
  );
}
