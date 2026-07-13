import Link from "next/link";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { EmptyState } from "@/src/components/admin/empty-state";
import { PetList } from "@/src/components/admin/pets/pet-list";
import type { PetListItem } from "@/src/components/admin/pets/pet-card";
import { canWriteClinicalRecords } from "@/src/lib/admin/permissions";
import { PAGE_SIZE, safePage, speciesLabels, speciesOptions } from "@/src/lib/admin/records";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

type Props = { searchParams: Promise<{ q?: string; species?: string; owner?: string; page?: string; archived?: string }> };
export default async function PetsPage({ searchParams }: Props) {
  const session = await requireStaff(); const params = await searchParams; const supabase = await createClient(); const page = safePage(params.page); const q = (params.q ?? "").trim().replace(/[,()%_]/g, ""); const species = speciesOptions.includes(params.species as never) ? params.species! : ""; const ownerId = params.owner ?? ""; const showArchived = params.archived === "true";
  let pets: PetListItem[] = []; let count = 0; let hasError = !supabase; let owners: Array<{ id: string; full_name: string }> = [];
  if (supabase) {
    const ownersResult = await supabase.from("owners").select("id, full_name").is("archived_at", null).order("full_name"); owners = ownersResult.data ?? [];
    let query = supabase.from("pets").select("id, name, species, breed, archived_at, owner_id", { count: "exact" }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1).order("created_at", { ascending: false });
    query = showArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null); if (q) query = query.ilike("name", `%${q}%`); if (species) query = query.eq("species", species); if (ownerId) query = query.eq("owner_id", ownerId);
    const result = await query; count = result.count ?? 0; hasError = Boolean(result.error); const ownerMap = new Map(owners.map((owner) => [owner.id, owner.full_name])); pets = (result.data ?? []).map((pet) => ({ ...pet, owner: ownerMap.has(pet.owner_id) ? { full_name: ownerMap.get(pet.owner_id)! } : null }));
  }
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE)); const linkFor = (target: number) => `/admin/pets?${new URLSearchParams({ ...(q ? { q } : {}), ...(species ? { species } : {}), ...(ownerId ? { owner: ownerId } : {}), ...(showArchived ? { archived: "true" } : {}), page: String(target) })}`;
  return <AdminShell session={session}><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold">Hayvanlar</h1><p className="mt-2 text-sm text-[#526a64]">{count} kayıt</p></div>{canWriteClinicalRecords(session.profile.role) ? <Link href="/admin/pets/new" className="rounded-lg bg-[#0d2922] px-4 py-3 font-semibold text-white">Yeni Hayvan</Link> : null}</div>
    <form className="my-6 grid gap-3 rounded-xl bg-white p-4 md:grid-cols-[1fr_auto_auto_auto_auto]"><label className="sr-only" htmlFor="pet-search">Hayvan adı ara</label><input id="pet-search" name="q" defaultValue={q} placeholder="Hayvan adı ara" className="rounded-lg border px-3 py-2"/><select name="species" defaultValue={species} aria-label="Tür filtresi" className="rounded-lg border px-3 py-2"><option value="">Tüm türler</option>{speciesOptions.map((item) => <option key={item} value={item}>{speciesLabels[item]}</option>)}</select><select name="owner" defaultValue={ownerId} aria-label="Hayvan sahibi filtresi" className="max-w-56 rounded-lg border px-3 py-2"><option value="">Tüm sahipler</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name}</option>)}</select><label className="flex items-center gap-2 px-2 text-sm"><input type="checkbox" name="archived" value="true" defaultChecked={showArchived}/> Arşiv</label><button className="rounded-lg border px-4 py-2 font-medium">Filtrele</button></form>
    {hasError ? <div role="alert" className="rounded-xl bg-red-50 p-5 text-red-800">Kayıtlar yüklenemedi. Lütfen tekrar deneyin.</div> : pets.length ? <PetList pets={pets} /> : <EmptyState title="Kayıt bulunamadı" description={q ? "Arama ölçütlerinizi değiştirin." : "Henüz görüntülenecek hayvan yok."} />}
    {totalPages > 1 ? <nav aria-label="Sayfalama" className="mt-6 flex items-center justify-between"><Link aria-disabled={page <= 1} href={linkFor(Math.max(1, page - 1))} className="rounded-lg border bg-white px-4 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-50">Önceki</Link><span>{page} / {totalPages}</span><Link aria-disabled={page >= totalPages} href={linkFor(Math.min(totalPages, page + 1))} className="rounded-lg border bg-white px-4 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-50">Sonraki</Link></nav> : null}
  </AdminShell>;
}
