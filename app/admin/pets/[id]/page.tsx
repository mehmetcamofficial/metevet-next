import Link from "next/link";
import { notFound } from "next/navigation";
import { archivePet, deletePet, restorePet } from "../actions";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { ConfirmDialog } from "@/src/components/admin/confirm-dialog";
import { StatusBadge } from "@/src/components/admin/status-badge";
import { canPermanentlyDelete, canWriteClinicalRecords } from "@/src/lib/admin/permissions";
import { formatPetAge, speciesLabels, type PetSpecies } from "@/src/lib/admin/records";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";
import { PetExaminationHistory } from "@/src/components/admin/examinations/pet-examination-history";
import { PetPreventiveCare } from "@/src/components/admin/vaccines/pet-preventive-care";
import { EntityReminders } from "@/src/components/admin/reminders/entity-reminders";
import { DocumentCreateLinks, RecentDocuments } from "@/src/components/admin/documents/entity-documents";

const date = (value: string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const sexLabels = { female: "Dişi", male: "Erkek", unknown: "Bilinmiyor" } as const;
export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const session = await requireStaff(); const supabase = await createClient(); if (!supabase) notFound(); const [petResult, auditResult] = await Promise.all([supabase.from("pets").select("*").eq("id", id).single(), supabase.from("audit_logs").select("id, action, created_at").eq("entity_type", "pet").eq("entity_id", id).order("created_at", { ascending: false }).limit(10)]); const pet = petResult.data; if (!pet) notFound(); const { data: owner } = await supabase.from("owners").select("id, full_name, phone").eq("id", pet.owner_id).single(); const canWrite = canWriteClinicalRecords(session.profile.role); const isAdmin = canPermanentlyDelete(session.profile.role);
  return <AdminShell session={session}><Link href="/admin/pets" className="text-sm underline">← Hayvanlar</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-3"><h1 className="text-3xl font-semibold">{pet.name}</h1><StatusBadge archived={Boolean(pet.archived_at)} /></div><p className="mt-2 text-[#526a64]">{speciesLabels[pet.species as PetSpecies] ?? pet.species}{pet.breed ? ` · ${pet.breed}` : ""}</p></div>{canWrite ? <Link href={`/admin/pets/${id}/edit`} className="rounded-lg bg-[#0d2922] px-4 py-2 text-white">Düzenle</Link> : null}</div>
    <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_0.8fr]"><section className="rounded-2xl bg-white p-6"><h2 className="text-xl font-semibold">Kimlik Bilgileri</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2"><Item label="Hayvan Sahibi">{owner ? <Link href={`/admin/owners/${owner.id}`} className="underline">{owner.full_name}</Link> : "—"}</Item><Item label="Cinsiyet">{sexLabels[pet.sex]}</Item><Item label="Yaş">{formatPetAge(pet.birth_date)}</Item><Item label="Doğum Tarihi">{pet.birth_date ? new Intl.DateTimeFormat("tr-TR").format(new Date(`${pet.birth_date}T00:00:00`)) : "—"}</Item><Item label="Mikroçip">{pet.microchip_number ?? "—"}</Item><Item label="Oluşturulma">{date(pet.created_at)}</Item><Item label="Güncellenme">{date(pet.updated_at)}</Item></dl><div className="mt-6 border-t pt-5"><h3 className="text-sm font-semibold">Notlar</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#526a64]">{pet.notes ?? "Not bulunmuyor."}</p></div></section>
    <section className="rounded-2xl bg-white p-6"><h2 className="text-xl font-semibold">Yaklaşan Modüller</h2><ul className="mt-5 space-y-3 text-sm text-[#526a64]"><li className="rounded-lg bg-[#f4f0e8] p-4">Randevular — sonraki aşamada</li><li className="rounded-lg bg-[#f4f0e8] p-4">Aşı kayıtları — sonraki aşamada</li><li className="rounded-lg bg-[#f4f0e8] p-4">Klinik kayıtlar — sonraki aşamada</li></ul></section></div>
    <section className="mt-6 rounded-2xl bg-white p-6"><h2 className="text-xl font-semibold">İşlem Geçmişi</h2>{auditResult.data?.length ? <ul className="mt-4 space-y-2 text-sm">{auditResult.data.map((entry) => <li key={entry.id} className="flex justify-between gap-4 border-b py-2"><span>{entry.action}</span><time>{date(entry.created_at)}</time></li>)}</ul> : <p className="mt-3 text-sm text-[#526a64]">Henüz audit kaydı yok.</p>}</section>
    {isAdmin ? <section className="mt-6 flex flex-wrap gap-3 rounded-2xl bg-white p-6">{pet.archived_at ? <ConfirmDialog title="Kaydı geri yükle" description="Hayvan yeniden aktif listede görünür." triggerLabel="Geri Yükle" confirmLabel="Geri Yükle" action={restorePet.bind(null, id)} /> : <ConfirmDialog title="Kaydı arşivle" description="Kayıt gizlenir fakat klinik veriler korunur." triggerLabel="Arşivle" confirmLabel="Arşivle" action={archivePet.bind(null, id)} />}{pet.archived_at ? <ConfirmDialog danger title="Kalıcı olarak sil" description="Bu işlem geri alınamaz. Bağlı klinik kayıtları varsa veritabanı silmeyi engeller." triggerLabel="Kalıcı Sil" confirmLabel="Kalıcı Sil" action={deletePet.bind(null, id)} /> : null}</section> : null}
    <PetExaminationHistory petId={id} role={session.profile.role} />
    <PetPreventiveCare petId={id} role={session.profile.role} />
    <EntityReminders ownerId={pet.owner_id} petId={id} />
    <DocumentCreateLinks links={[{label:"Aşı Karnesi Oluştur",type:"vaccination_card",source:id,preview:`/admin/documents/vaccine-card/${id}`},{label:"Koruyucu Sağlık Özeti",type:"preventive_care_history",source:id,preview:`/admin/documents/preventive-care/${id}`},{label:"Hayvan Sağlık Özeti",type:"pet_health_summary",source:id,preview:`/admin/documents/pet-summary/${id}`}]}/>
    <RecentDocuments petId={id} />
  </AdminShell>;
}
function Item({ label, children }: { label: string; children: React.ReactNode }) { return <div><dt className="text-xs font-semibold uppercase tracking-wider text-[#526a64]">{label}</dt><dd className="mt-1">{children}</dd></div>; }
