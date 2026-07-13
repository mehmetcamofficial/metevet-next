import Link from "next/link";
import { AppointmentList } from "@/src/components/admin/appointments/appointment-list";
import type { AppointmentItem } from "@/src/components/admin/appointments/appointment-card";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { EmptyState } from "@/src/components/admin/empty-state";
import { appointmentSources, appointmentStatuses, serviceLabels, sourceLabels, statusLabels } from "@/src/lib/admin/appointments";
import { canWriteClinicalRecords } from "@/src/lib/admin/permissions";
import { PAGE_SIZE, safePage } from "@/src/lib/admin/records";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function AppointmentsPage({ searchParams }: Props) {
  const session = await requireStaff();
  const params = await searchParams;
  const supabase = await createClient();
  const page = safePage(params.page);
  let items: AppointmentItem[] = [];
  let count = 0;
  let hasError = !supabase;
  let profiles: Array<{ id: string; full_name: string }> = [];

  if (supabase) {
    const [ownersResult, petsResult, profilesResult] = await Promise.all([
      supabase.from("owners").select("id, full_name"),
      supabase.from("pets").select("id, name"),
      supabase.from("profiles").select("id, full_name"),
    ]);
    profiles = profilesResult.data ?? [];
    const owners = ownersResult.data ?? [];
    const pets = petsResult.data ?? [];
    let query = supabase.from("appointments").select("*", { count: "exact" }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (params.from) query = query.gte("starts_at", `${params.from}T00:00:00+03:00`);
    if (params.to) query = query.lte("starts_at", `${params.to}T23:59:59+03:00`);
    if (appointmentStatuses.includes(params.status as never)) query = query.eq("status", params.status as never);
    if (appointmentSources.includes(params.source as never)) query = query.eq("source", params.source as never);
    if (params.assigned) query = query.eq("assigned_user_id", params.assigned);
    if (serviceLabels[params.service ?? ""]) query = query.eq("service_key", params.service!);
    if (params.owner) {
      const ids = owners.filter((owner) => owner.full_name.toLocaleLowerCase("tr").includes(params.owner!.toLocaleLowerCase("tr"))).map((owner) => owner.id);
      query = ids.length ? query.in("owner_id", ids) : query.eq("owner_id", "00000000-0000-0000-0000-000000000000");
    }
    if (params.pet) {
      const ids = pets.filter((pet) => pet.name.toLocaleLowerCase("tr").includes(params.pet!.toLocaleLowerCase("tr"))).map((pet) => pet.id);
      query = ids.length ? query.in("pet_id", ids) : query.eq("pet_id", "00000000-0000-0000-0000-000000000000");
    }
    query = params.sort === "newest" ? query.order("created_at", { ascending: false }) : query.order("starts_at");
    const result = await query;
    count = result.count ?? 0;
    hasError = Boolean(result.error);
    const ownerMap = new Map(owners.map((owner) => [owner.id, owner.full_name]));
    const petMap = new Map(pets.map((pet) => [pet.id, pet.name]));
    const staffMap = new Map(profiles.map((profile) => [profile.id, profile.full_name]));
    items = (result.data ?? []).map((appointment) => ({ ...appointment, owner: ownerMap.get(appointment.owner_id) ?? "—", pet: petMap.get(appointment.pet_id) ?? "—", assigned: appointment.assigned_user_id ? staffMap.get(appointment.assigned_user_id) ?? "—" : null }));
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const pageHref = (target: number) => `/admin/appointments?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([key, value]) => key !== "page" && value).map(([key, value]) => [key, value!])), page: String(target) })}`;

  return <AdminShell session={session}>
    <div className="flex justify-between gap-4"><div><h1 className="text-3xl font-semibold">Randevular</h1><p className="mt-2 text-sm text-[#526a64]">{count} kayıt</p></div>{canWriteClinicalRecords(session.profile.role) ? <Link href="/admin/appointments/new" className="rounded-lg bg-[#0d2922] px-4 py-3 text-white">Yeni Randevu</Link> : null}</div>
    <form className="my-6 grid gap-3 rounded-xl bg-white p-4 md:grid-cols-4 xl:grid-cols-6">
      <input name="from" type="date" defaultValue={params.from} aria-label="Başlangıç tarihi" className="rounded-lg border p-2"/><input name="to" type="date" defaultValue={params.to} aria-label="Bitiş tarihi" className="rounded-lg border p-2"/>
      <select name="status" defaultValue={params.status ?? ""} aria-label="Durum" className="rounded-lg border p-2"><option value="">Tüm durumlar</option>{appointmentStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select>
      <select name="source" defaultValue={params.source ?? ""} aria-label="Kaynak" className="rounded-lg border p-2"><option value="">Tüm kaynaklar</option>{appointmentSources.map((source) => <option key={source} value={source}>{sourceLabels[source]}</option>)}</select>
      <select name="assigned" defaultValue={params.assigned ?? ""} aria-label="Personel" className="rounded-lg border p-2"><option value="">Tüm personel</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name}</option>)}</select>
      <select name="service" defaultValue={params.service ?? ""} aria-label="Hizmet" className="rounded-lg border p-2"><option value="">Tüm hizmetler</option>{Object.entries(serviceLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <input name="owner" defaultValue={params.owner} placeholder="Sahip ara" aria-label="Hayvan sahibi ara" className="rounded-lg border p-2"/><input name="pet" defaultValue={params.pet} placeholder="Hayvan ara" aria-label="Hayvan ara" className="rounded-lg border p-2"/>
      <select name="sort" defaultValue={params.sort ?? "upcoming"} aria-label="Sıralama" className="rounded-lg border p-2"><option value="upcoming">Yaklaşan</option><option value="newest">En yeni kayıt</option></select><button className="rounded-lg border p-2 font-medium">Filtrele</button>
    </form>
    {hasError ? <p role="alert" className="rounded-xl bg-red-50 p-5">Randevular yüklenemedi.</p> : items.length ? <AppointmentList items={items}/> : <EmptyState title="Randevu bulunamadı" description="Filtreleri değiştirin veya yeni randevu oluşturun."/>}
    {totalPages > 1 ? <nav aria-label="Sayfalama" className="mt-6 flex justify-between"><Link aria-disabled={page === 1} className="rounded-lg border bg-white px-4 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-50" href={pageHref(Math.max(1, page - 1))}>Önceki</Link><span>{page} / {totalPages}</span><Link aria-disabled={page >= totalPages} className="rounded-lg border bg-white px-4 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-50" href={pageHref(Math.min(totalPages, page + 1))}>Sonraki</Link></nav> : null}
  </AdminShell>;
}
