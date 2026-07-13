import Link from "next/link";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { EmptyState } from "@/src/components/admin/empty-state";
import { OwnerList } from "@/src/components/admin/owners/owner-list";
import type { OwnerListItem } from "@/src/components/admin/owners/owner-card";
import { PAGE_SIZE, safePage } from "@/src/lib/admin/records";
import { canWriteClinicalRecords } from "@/src/lib/admin/permissions";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

type Props = { searchParams: Promise<{ q?: string; page?: string; sort?: string; archived?: string }> };
export default async function OwnersPage({ searchParams }: Props) {
  const session = await requireStaff(); const params = await searchParams; const supabase = await createClient();
  const page = safePage(params.page); const q = (params.q ?? "").trim().replace(/[,()%_]/g, ""); const showArchived = params.archived === "true"; const sort = params.sort === "name" ? "name" : "newest";
  let owners: OwnerListItem[] = [];
  let count = 0; let hasError = !supabase;
  if (supabase) {
    let query = supabase.from("owners").select("id, full_name, phone, email, archived_at, created_at", { count: "exact" }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    query = showArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
    if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
    query = sort === "name" ? query.order("full_name") : query.order("created_at", { ascending: false });
    const result = await query; owners = result.data ?? []; count = result.count ?? 0; hasError = Boolean(result.error);
  }
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const linkFor = (target: number) => `/admin/owners?${new URLSearchParams({ ...(q ? { q } : {}), ...(sort !== "newest" ? { sort } : {}), ...(showArchived ? { archived: "true" } : {}), page: String(target) })}`;
  return <AdminShell session={session}><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold">Hayvan Sahipleri</h1><p className="mt-2 text-sm text-[#526a64]">{count} kayıt</p></div>{canWriteClinicalRecords(session.profile.role) ? <Link href="/admin/owners/new" className="rounded-lg bg-[#0d2922] px-4 py-3 font-semibold text-white">Yeni Kayıt</Link> : null}</div>
    <form className="my-6 grid gap-3 rounded-xl bg-white p-4 sm:grid-cols-[1fr_auto_auto_auto]"><label className="sr-only" htmlFor="owner-search">Ad veya telefon ara</label><input id="owner-search" name="q" defaultValue={q} placeholder="Ad veya telefon ara" className="rounded-lg border px-3 py-2"/><select name="sort" defaultValue={sort} aria-label="Sıralama" className="rounded-lg border px-3 py-2"><option value="newest">En yeni</option><option value="name">Ada göre</option></select><label className="flex items-center gap-2 px-2 text-sm"><input type="checkbox" name="archived" value="true" defaultChecked={showArchived}/> Arşiv</label><button className="rounded-lg border px-4 py-2 font-medium">Filtrele</button></form>
    {hasError ? <div role="alert" className="rounded-xl bg-red-50 p-5 text-red-800">Kayıtlar yüklenemedi. Lütfen tekrar deneyin.</div> : owners.length ? <OwnerList owners={owners} /> : <EmptyState title="Kayıt bulunamadı" description={q ? "Arama ölçütlerinizi değiştirin." : "Henüz görüntülenecek hayvan sahibi yok."} />}
    {totalPages > 1 ? <nav aria-label="Sayfalama" className="mt-6 flex items-center justify-between"><Link aria-disabled={page <= 1} href={linkFor(Math.max(1, page - 1))} className="rounded-lg border bg-white px-4 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-50">Önceki</Link><span className="text-sm">{page} / {totalPages}</span><Link aria-disabled={page >= totalPages} href={linkFor(Math.min(totalPages, page + 1))} className="rounded-lg border bg-white px-4 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-50">Sonraki</Link></nav> : null}
  </AdminShell>;
}
