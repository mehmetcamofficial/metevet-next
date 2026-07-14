import Link from "next/link";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { createClient } from "@/src/lib/supabase/server";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { DataTable } from "@/src/components/admin/data-table";
import { EmptyState } from "@/src/components/admin/empty-state";
import { ConfirmDialog } from "@/src/components/admin/confirm-dialog";
import { StatusBadge } from "@/src/components/admin/status-badge";
import { getAllServices } from "@/src/lib/admin/booking/booking-readers";
import { archiveService, restoreService } from "@/app/admin/booking-settings/actions";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await requireAdmin();
  const p = await searchParams;
  const s = await createClient();
  if (!s) return <p role="alert">Veri yüklenemedi.</p>;

  const { data } = await getAllServices(s);
  const items = (data ?? []).filter((x) => {
    const q = p.q?.toLocaleLowerCase("tr") ?? "";
    if (q && !`${x.name_tr} ${x.slug}`.toLocaleLowerCase("tr").includes(q)) return false;
    if (p.active === "active" && (!x.is_active || x.archived_at)) return false;
    if (p.active === "inactive" && x.is_active && !x.archived_at) return false;
    if (p.online === "1" && !x.is_online_bookable) return false;
    if (p.archived === "1" && !x.archived_at) return false;
    if (p.archived !== "1" && p.archived !== undefined && x.archived_at && p.archived !== "1") return false;
    return true;
  });

  const headings = ["Ad", "Slug", "Süre", "Online", "Durum", "İşlemler"];

  return (
    <AdminShell session={session}>
      <div className="flex justify-between">
        <h1 className="text-3xl font-semibold">Hizmetler</h1>
        <Link href="/admin/booking-settings/services/new" className="rounded bg-[#0d2922] px-4 py-2 text-white">
          Yeni Hizmet
        </Link>
      </div>

      <form className="my-6 flex flex-wrap gap-3 rounded-xl bg-white p-4">
        <input name="q" defaultValue={p.q} placeholder="Ad veya slug ara" className="rounded border p-2" />
        <select name="active" defaultValue={p.active ?? ""} className="rounded border p-2">
          <option value="">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="online" value="1" defaultChecked={p.online === "1"} />
          Online randevuya uygun
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="archived" value="1" defaultChecked={p.archived === "1"} />
          Arşivlenmiş
        </label>
        <button className="rounded border px-4">Filtrele</button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          title="Hizmet bulunamadı"
          description="Henüz randevu hizmeti tanımlanmamış veya filtre sonuçları boş."
          action={
            <Link href="/admin/booking-settings/services/new" className="rounded bg-[#0d2922] px-4 py-2 text-white">
              Yeni Hizmet
            </Link>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <DataTable headings={headings} label="Hizmetler listesi">
            {items.map((x) => (
              <tr key={x.id}>
                <td className="px-5 py-4">
                  <Link href={`/admin/booking-settings/services/${x.id}/edit`} className="font-semibold hover:underline">
                    {x.name_tr}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {!x.is_active && !x.archived_at && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">Pasif</span>
                    )}
                    {!x.is_online_bookable && !x.archived_at && (
                      <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">Online kapalı</span>
                    )}
                    {x.archived_at && (
                      <span className="rounded bg-stone-200 px-1.5 py-0.5 text-xs text-stone-700">Arşivlenmiş</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-[#526a64]">{x.slug}</td>
                <td className="px-5 py-4">{x.duration_minutes} dk</td>
                <td className="px-5 py-4">
                  {x.is_online_bookable ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Evet</span>
                  ) : (
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">Hayır</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge archived={!!x.archived_at} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    {!x.archived_at && (
                      <>
                        <Link
                          href={`/admin/booking-settings/services/${x.id}/edit`}
                          className="rounded-lg border border-[#0d2922]/20 px-3 py-1.5 text-sm font-medium"
                        >
                          Düzenle
                        </Link>
                        <ConfirmDialog
                          title="Hizmeti arşivle"
                          description={`"${x.name_tr}" hizmetini arşivlemek istediğinizden emin misiniz? Arşivlenen hizmet online randevularda görünmez.`}
                          triggerLabel="Arşivle"
                          confirmLabel="Arşivle"
                          action={archiveService.bind(null, x.id)}
                          danger
                        />
                      </>
                    )}
                    {x.archived_at && (
                      <ConfirmDialog
                        title="Hizmeti geri yükle"
                        description={`"${x.name_tr}" hizmetini geri yüklemek istediğinizden emin misiniz?`}
                        triggerLabel="Geri Yükle"
                        confirmLabel="Geri Yükle"
                        action={restoreService.bind(null, x.id)}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {items.map((x) => (
              <article key={x.id} className="flex flex-wrap justify-between gap-4 rounded-xl bg-white p-5">
                <div>
                  <Link href={`/admin/booking-settings/services/${x.id}/edit`} className="font-semibold hover:underline">
                    {x.name_tr}
                  </Link>
                  <p className="text-sm text-[#526a64]">{x.duration_minutes} dk · {x.slug}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {!x.is_active && !x.archived_at && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">Pasif</span>
                    )}
                    {!x.is_online_bookable && !x.archived_at && (
                      <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">Online kapalı</span>
                    )}
                    {x.archived_at && (
                      <span className="rounded bg-stone-200 px-1.5 py-0.5 text-xs text-stone-700">Arşivlenmiş</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge archived={!!x.archived_at} />
                  {!x.archived_at ? (
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/booking-settings/services/${x.id}/edit`}
                        className="rounded-lg border border-[#0d2922]/20 px-3 py-1.5 text-sm font-medium"
                      >
                        Düzenle
                      </Link>
                      <ConfirmDialog
                        title="Hizmeti arşivle"
                        description={`"${x.name_tr}" hizmetini arşivlemek istediğinizden emin misiniz?`}
                        triggerLabel="Arşivle"
                        confirmLabel="Arşivle"
                        action={archiveService.bind(null, x.id)}
                        danger
                      />
                    </div>
                  ) : (
                    <ConfirmDialog
                      title="Hizmeti geri yükle"
                      description={`"${x.name_tr}" hizmetini geri yüklemek istediğinizden emin misiniz?`}
                      triggerLabel="Geri Yükle"
                      confirmLabel="Geri Yükle"
                      action={restoreService.bind(null, x.id)}
                    />
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </AdminShell>
  );
}
