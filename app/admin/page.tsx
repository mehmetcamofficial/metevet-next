import Link from "next/link";
import { EmptyState } from "@/src/components/admin/empty-state";
import { AppointmentStatusBadge } from "@/src/components/admin/appointments/appointment-status-badge";
import { canWriteClinicalRecords } from "@/src/lib/admin/permissions";
import { calendarRange, serviceLabels } from "@/src/lib/admin/appointments";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

export default async function AdminPage() {
  const session = await requireStaff();
  const supabase = await createClient();
  if (!supabase) return <p role="alert">Yönetim verileri yüklenemedi.</p>;

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  const todayRange = calendarRange(today, "day");
  const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
  const now = new Date().toISOString();
  const [todayResult, upcomingResult, pendingCount, ownerCount, petCount, vaccineCount, recentOwners, recentPets] = await Promise.all([
    supabase.from("appointments").select("id, starts_at, status, service_key, owner_id, pet_id").gte("starts_at", todayRange.start).lt("starts_at", todayRange.end).neq("status", "cancelled").order("starts_at").limit(8),
    supabase.from("appointments").select("id, starts_at, status, service_key, owner_id, pet_id").gte("starts_at", todayRange.end).lt("starts_at", weekEnd.toISOString()).neq("status", "cancelled").order("starts_at").limit(8),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("owners").select("id", { count: "exact", head: true }).is("archived_at", null),
    supabase.from("pets").select("id", { count: "exact", head: true }).is("archived_at", null),
    supabase.from("vaccine_records").select("id", { count: "exact", head: true }).gte("next_due_at", now),
    supabase.from("owners").select("id, full_name, phone, created_at").is("archived_at", null).order("created_at", { ascending: false }).limit(5),
    supabase.from("pets").select("id, name, species, created_at").is("archived_at", null).order("created_at", { ascending: false }).limit(5),
  ]);

  const appointments = [...(todayResult.data ?? []), ...(upcomingResult.data ?? [])];
  const ownerIds = [...new Set(appointments.map((item) => item.owner_id))];
  const petIds = [...new Set(appointments.map((item) => item.pet_id))];
  const [owners, pets] = await Promise.all([
    ownerIds.length ? supabase.from("owners").select("id, full_name").in("id", ownerIds) : Promise.resolve({ data: [] }),
    petIds.length ? supabase.from("pets").select("id, name").in("id", petIds) : Promise.resolve({ data: [] }),
  ]);
  const ownerMap = new Map(owners.data?.map((owner) => [owner.id, owner.full_name]));
  const petMap = new Map(pets.data?.map((pet) => [pet.id, pet.name]));
  const canCreate = canWriteClinicalRecords(session.profile.role);
  const metrics = [
    ["Bugünkü Randevular", todayResult.data?.length ?? 0], ["Bekleyen Randevular", pendingCount.count ?? 0],
    ["Aktif Hayvan Sahipleri", ownerCount.count ?? 0], ["Aktif Hayvanlar", petCount.count ?? 0],
    ["Bu Hafta Yaklaşan Randevular", upcomingResult.data?.length ?? 0], ["Yaklaşan Aşılar", vaccineCount.count ?? "Henüz veri yok"],
  ] as const;

  return <>
    <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a6c32]">MeteVet Yönetim Paneli</p><h1 className="mt-2 text-3xl font-semibold">Genel Bakış</h1><p className="mt-2 text-[#526a64]">Klinik operasyonlarının güncel özeti.</p></div>
    <section aria-label="Klinik özeti" className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([label, value]) => <article key={label} className="rounded-2xl border border-[#0d2922]/10 bg-white p-5"><p className="text-sm text-[#526a64]">{label}</p><p className="mt-3 text-3xl font-semibold">{value}</p></article>)}</section>
    <div className="mt-7 grid gap-6 xl:grid-cols-2"><AppointmentSection title="Bugünkü Randevular" items={todayResult.data ?? []} ownerMap={ownerMap} petMap={petMap}/><AppointmentSection title="Yaklaşan Randevular" items={upcomingResult.data ?? []} ownerMap={ownerMap} petMap={petMap}/></div>
    <section className="mt-7 rounded-2xl bg-white p-6"><h2 className="text-xl font-semibold">Hızlı İşlemler</h2><div className="mt-5 flex flex-wrap gap-3">{canCreate ? <><Quick href="/admin/owners/new">Yeni Hayvan Sahibi</Quick><Quick href="/admin/pets/new">Yeni Hayvan</Quick><Quick href="/admin/appointments/new">Yeni Randevu</Quick></> : null}<Quick href="/admin/calendar">Takvimi Aç</Quick></div></section>
    <div className="mt-7 grid gap-6 xl:grid-cols-2"><Recent title="Son Eklenen Hayvan Sahipleri" empty="Henüz hayvan sahibi kaydı yok." items={(recentOwners.data ?? []).map((owner) => ({ href: `/admin/owners/${owner.id}`, title: owner.full_name, detail: owner.phone }))}/><Recent title="Son Eklenen Hayvanlar" empty="Henüz hayvan kaydı yok." items={(recentPets.data ?? []).map((pet) => ({ href: `/admin/pets/${pet.id}`, title: pet.name, detail: pet.species }))}/></div>
  </>;
}

type AppointmentSummary = { id: string; starts_at: string; status: "pending"|"confirmed"|"completed"|"cancelled"|"no_show"; service_key: string; owner_id: string; pet_id: string };
function AppointmentSection({ title, items, ownerMap, petMap }: { title: string; items: AppointmentSummary[]; ownerMap: Map<string,string>; petMap: Map<string,string> }) { return <section className="rounded-2xl bg-white p-6"><h2 className="text-xl font-semibold">{title}</h2>{items.length ? <ul className="mt-4 divide-y">{items.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><Link href={`/admin/appointments/${item.id}`} className="font-semibold hover:underline">{petMap.get(item.pet_id) ?? "Hayvan"} · {ownerMap.get(item.owner_id) ?? "Hayvan sahibi"}</Link><p className="mt-1 text-sm text-[#526a64]">{new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "short", timeStyle: "short" }).format(new Date(item.starts_at))} · {serviceLabels[item.service_key] ?? item.service_key}</p></div><AppointmentStatusBadge status={item.status}/></li>)}</ul> : <div className="mt-4"><EmptyState title="Kayıt yok" description="Bu bölümde görüntülenecek randevu bulunmuyor."/></div>}</section>; }
function Quick({ href, children }: { href: string; children: React.ReactNode }) { return <Link href={href} className="rounded-lg border border-[#0d2922]/20 px-4 py-3 text-sm font-semibold transition hover:bg-[#0d2922] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cda85f]">{children}</Link>; }
function Recent({ title, empty, items }: { title: string; empty: string; items: Array<{href:string;title:string;detail:string}> }) { return <section className="rounded-2xl bg-white p-6"><h2 className="text-xl font-semibold">{title}</h2>{items.length ? <ul className="mt-4 divide-y">{items.map((item) => <li key={item.href} className="py-3"><Link href={item.href} className="font-medium hover:underline">{item.title}</Link><p className="text-sm text-[#526a64]">{item.detail}</p></li>)}</ul> : <p className="mt-4 text-sm text-[#526a64]">{empty}</p>}</section>; }
