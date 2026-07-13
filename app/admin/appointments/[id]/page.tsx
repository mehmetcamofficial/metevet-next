import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteAppointment } from "../actions";
import { AdminShell } from "@/src/components/admin/admin-shell";
import { ConfirmDialog } from "@/src/components/admin/confirm-dialog";
import { AppointmentStatusBadge } from "@/src/components/admin/appointments/appointment-status-badge";
import { AppointmentExamination } from "@/src/components/admin/examinations/appointment-examination";
import { appointmentDuration, serviceLabels, sourceLabels } from "@/src/lib/admin/appointments";
import { canPermanentlyDelete, canWriteClinicalRecords } from "@/src/lib/admin/permissions";
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";

const dt = (value: string) => new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const session = await requireStaff(); const supabase = await createClient(); if (!supabase) notFound();
  const [appointmentResult, logs] = await Promise.all([supabase.from("appointments").select("*").eq("id", id).single(), supabase.from("audit_logs").select("id, action, created_at").eq("entity_type", "appointment").eq("entity_id", id).order("created_at", { ascending: false }).limit(12)]);
  if (!appointmentResult.data) notFound(); const appointment = appointmentResult.data;
  const [owner, pet, assigned] = await Promise.all([supabase.from("owners").select("id, full_name, phone").eq("id", appointment.owner_id).single(), supabase.from("pets").select("id, name, species").eq("id", appointment.pet_id).single(), appointment.assigned_user_id ? supabase.from("profiles").select("full_name").eq("id", appointment.assigned_user_id).single() : Promise.resolve({ data: null })]);
  return <AdminShell session={session}>
    <Link href="/admin/appointments" className="underline">← Randevular</Link>
    <div className="mt-5 flex flex-wrap justify-between gap-4"><div className="flex items-center gap-3"><h1 className="text-3xl font-semibold">Randevu Detayı</h1><AppointmentStatusBadge status={appointment.status}/></div>{canWriteClinicalRecords(session.profile.role) ? <Link href={`/admin/appointments/${id}/edit`} className="rounded-lg bg-[#0d2922] px-4 py-2 text-white">Düzenle</Link> : null}</div>
    <section className="mt-7 grid gap-5 rounded-2xl bg-white p-6 sm:grid-cols-2 lg:grid-cols-3"><Item label="Tarih ve Saat">{dt(appointment.starts_at)} – {new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", timeStyle: "short" }).format(new Date(appointment.ends_at))} ({appointmentDuration(appointment.starts_at, appointment.ends_at)} dk.)</Item><Item label="Hayvan Sahibi">{owner.data ? <Link className="underline" href={`/admin/owners/${owner.data.id}`}>{owner.data.full_name} · {owner.data.phone}</Link> : "—"}</Item><Item label="Hayvan">{pet.data ? <Link className="underline" href={`/admin/pets/${pet.data.id}`}>{pet.data.name}</Link> : "—"}</Item><Item label="Hizmet">{serviceLabels[appointment.service_key] ?? appointment.service_key}</Item><Item label="Atanan Personel">{assigned.data?.full_name ?? "Atanmamış"}</Item><Item label="Kaynak">{sourceLabels[appointment.source]}</Item><Item label="Oluşturulma">{dt(appointment.created_at)}</Item><Item label="Güncellenme">{dt(appointment.updated_at)}</Item></section>
    <section className="mt-6 grid gap-6 lg:grid-cols-2"><div className="rounded-2xl bg-white p-6"><h2 className="font-semibold">Randevu Nedeni</h2><p className="mt-3 whitespace-pre-wrap text-sm text-[#526a64]">{appointment.reason ?? "Belirtilmemiş."}</p><h2 className="mt-6 font-semibold">Dahili Notlar</h2><p className="mt-3 whitespace-pre-wrap text-sm text-[#526a64]">{appointment.internal_notes ?? "Not yok."}</p></div><div className="rounded-2xl bg-white p-6"><h2 className="font-semibold">Audit Aktivitesi</h2><ul className="mt-3 space-y-2 text-sm">{logs.data?.map((log) => <li key={log.id} className="flex justify-between gap-3 border-b py-2"><span>{log.action}</span><time>{dt(log.created_at)}</time></li>)}</ul></div></section>
    <AppointmentExamination appointmentId={id} petId={appointment.pet_id} role={session.profile.role}/>
    {canPermanentlyDelete(session.profile.role) ? <section className="mt-6 rounded-2xl bg-white p-6"><ConfirmDialog danger title="Randevuyu kalıcı sil" description="Bu işlem geri alınamaz." triggerLabel="Kalıcı Sil" confirmLabel="Kalıcı Sil" action={deleteAppointment.bind(null, id)}/></section> : null}
  </AdminShell>;
}
function Item({ label, children }: { label: string; children: React.ReactNode }) { return <div><dt className="text-xs font-semibold uppercase text-[#526a64]">{label}</dt><dd className="mt-1">{children}</dd></div>; }
