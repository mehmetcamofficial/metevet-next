import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveOwner, deleteOwner, restoreOwner } from "../actions";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { ConfirmDialog } from "@/src/components/admin/confirm-dialog";
import { StatusBadge } from "@/src/components/admin/status-badge";
import { canPermanentlyDelete, canWriteClinicalRecords } from "@/src/lib/admin/permissions";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

const date = (value: string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
export default async function OwnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const session = await requireStaff(); const supabase = await createClient(); if (!supabase) notFound();
  const [ownerResult, petsResult, auditResult] = await Promise.all([
    supabase.from("owners").select("*").eq("id", id).single(),
    supabase.from("pets").select("id, name, species, archived_at").eq("owner_id", id).order("name"),
    supabase.from("audit_logs").select("id, action, created_at").eq("entity_type", "owner").eq("entity_id", id).order("created_at", { ascending: false }).limit(10),
  ]);
  const owner = ownerResult.data; if (!owner) notFound(); const canWrite = canWriteClinicalRecords(session.profile.role); const isAdmin = canPermanentlyDelete(session.profile.role);
  return <AdminShell session={session}><Link href="/admin/owners" className="text-sm underline">← Hayvan sahipleri</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-3"><h1 className="text-3xl font-semibold">{owner.full_name}</h1><StatusBadge archived={Boolean(owner.archived_at)} /></div><p className="mt-2 text-[#526a64]">Hayvan sahibi kaydı</p></div>{canWrite ? <Link href={`/admin/owners/${id}/edit`} className="rounded-lg bg-[#0d2922] px-4 py-2 text-white">Düzenle</Link> : null}</div>
    <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_0.8fr]"><section className="rounded-2xl bg-white p-6"><h2 className="text-xl font-semibold">İletişim ve Notlar</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2"><Item label="Telefon"><a href={`tel:${owner.phone}`} className="underline">{owner.phone}</a></Item><Item label="E-posta">{owner.email ? <a href={`mailto:${owner.email}`} className="underline">{owner.email}</a> : "—"}</Item><Item label="Oluşturulma">{date(owner.created_at)}</Item><Item label="Güncellenme">{date(owner.updated_at)}</Item></dl><div className="mt-6 border-t pt-5"><h3 className="text-sm font-semibold">Notlar</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#526a64]">{owner.notes ?? "Not bulunmuyor."}</p></div></section>
    <section className="rounded-2xl bg-white p-6"><h2 className="text-xl font-semibold">Bağlı Hayvanlar</h2>{petsResult.data?.length ? <ul className="mt-5 divide-y">{petsResult.data.map((pet) => <li key={pet.id} className="py-3"><Link href={`/admin/pets/${pet.id}`} className="font-medium hover:underline">{pet.name}</Link><span className="ml-2 text-sm text-[#526a64]">{pet.species}</span></li>)}</ul> : <p className="mt-4 text-sm text-[#526a64]">Bağlı hayvan kaydı yok.</p>}</section></div>
    <section className="mt-6 rounded-2xl bg-white p-6"><h2 className="text-xl font-semibold">İşlem Geçmişi</h2>{auditResult.data?.length ? <ul className="mt-4 space-y-2 text-sm">{auditResult.data.map((entry) => <li key={entry.id} className="flex justify-between gap-4 border-b py-2"><span>{entry.action}</span><time>{date(entry.created_at)}</time></li>)}</ul> : <p className="mt-3 text-sm text-[#526a64]">Henüz audit kaydı yok.</p>}</section>
    {isAdmin ? <section className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-[#0d2922]/10 bg-white p-6" aria-label="Kayıt işlemleri">{owner.archived_at ? <ConfirmDialog title="Kaydı geri yükle" description="Kayıt yeniden aktif listede görünür." triggerLabel="Geri Yükle" confirmLabel="Geri Yükle" action={restoreOwner.bind(null, id)} /> : <ConfirmDialog title="Kaydı arşivle" description="Kayıt listeden gizlenir fakat veriler korunur." triggerLabel="Arşivle" confirmLabel="Arşivle" action={archiveOwner.bind(null, id)} />}{owner.archived_at ? <ConfirmDialog danger title="Kalıcı olarak sil" description="Bu işlem geri alınamaz. Bağlı klinik kayıtları varsa veritabanı silmeyi engeller." triggerLabel="Kalıcı Sil" confirmLabel="Kalıcı Sil" action={deleteOwner.bind(null, id)} /> : null}</section> : null}
  </AdminShell>;
}
function Item({ label, children }: { label: string; children: React.ReactNode }) { return <div><dt className="text-xs font-semibold uppercase tracking-wider text-[#526a64]">{label}</dt><dd className="mt-1">{children}</dd></div>; }
