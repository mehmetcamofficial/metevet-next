"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import type { ExaminationFormState } from "@/app/admin/examinations/actions";
import { OwnerPetFields } from "@/src/components/admin/owner-pet-fields";
import { visitTypeLabels, visitTypes } from "@/src/lib/admin/examinations";

import { VitalsFields } from "./vitals-fields";

type Owner = { id: string; full_name: string };
type Pet = { id: string; owner_id: string; name: string };
type Vet = { id: string; full_name: string };
type Appointment = { id: string; pet_id: string; starts_at: string };
type Initial = Record<string, unknown> & { ownerId: string; petId: string; appointmentId: string | null; veterinarianId: string; visitType: string };
const initialState = { message: null };
const cls = "mt-2 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#cda85f]/50";

export function ExaminationForm({ action, owners, pets, veterinarians, appointments, initial }: {
  action: (state: ExaminationFormState, form: FormData) => Promise<ExaminationFormState>;
  owners: Owner[]; pets: Pet[]; veterinarians: Vet[]; appointments: Appointment[]; initial?: Initial;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [ownerId, setOwnerId] = useState(initial?.ownerId ?? "");
  const [petId, setPetId] = useState(initial?.petId ?? "");
  const [appointmentId, setAppointmentId] = useState(initial?.appointmentId ?? "");
  const appointmentOptions = useMemo(() => appointments.filter((appointment) => appointment.pet_id === petId), [appointments, petId]);
  useEffect(() => { const first = Object.keys(state.errors ?? {})[0]; if (first) document.getElementById(first)?.focus(); }, [state.errors]);
  const textFields = [["chiefComplaint","Başlıca Şikâyet"],["history","Öykü"],["examinationFindings","Muayene Bulguları"],["assessment","Değerlendirme"],["diagnosis","Tanı"],["procedures","Uygulanan İşlemler"],["treatmentPlan","Tedavi Planı"],["medicationsNotes","İlaç Notları"],["recommendations","Öneriler"],["internalNotes","Dahili Notlar"]] as const;
  return <form action={formAction} className="space-y-7" noValidate>
    <div className="grid gap-5 sm:grid-cols-2">
      <OwnerPetFields owners={owners} pets={pets} ownerId={ownerId} petId={petId} onOwnerChange={setOwnerId} onPetChange={(nextPet) => { setPetId(nextPet); setAppointmentId(""); }} ownerError={state.errors?.ownerId} petError={state.errors?.petId} canCreatePet />
      <Field id="appointmentId" label="Bağlı Randevu" error={state.errors?.appointmentId}><select id="appointmentId" name="appointmentId" className={cls} value={appointmentId} onChange={(event) => setAppointmentId(event.target.value)}><option value="">Bağlantı yok</option>{appointmentOptions.map((appointment) => <option key={appointment.id} value={appointment.id}>{new Intl.DateTimeFormat("tr-TR",{dateStyle:"short",timeStyle:"short",timeZone:"Europe/Istanbul"}).format(new Date(appointment.starts_at))}</option>)}</select></Field>
      <Field id="veterinarianId" label="Veteriner Hekim" error={state.errors?.veterinarianId}><select id="veterinarianId" name="veterinarianId" required className={cls} defaultValue={initial?.veterinarianId ?? ""} disabled={veterinarians.length === 0}><option value="">Seçiniz</option>{veterinarians.map((vet) => <option key={vet.id} value={vet.id}>{vet.full_name}</option>)}</select>{veterinarians.length === 0 ? <p role="status" className="mt-2 rounded bg-amber-50 p-3 text-sm text-amber-900">Atanabilir veteriner hekim profili bulunmuyor. Önce veteriner rolüne sahip bir profil oluşturun.</p> : null}</Field>
      <Field id="visitType" label="Ziyaret Türü" error={state.errors?.visitType}><select id="visitType" name="visitType" className={cls} defaultValue={initial?.visitType ?? "general_exam"}>{visitTypes.map((visit) => <option key={visit} value={visit}>{visitTypeLabels[visit]}</option>)}</select></Field>
      <Field id="followUpAt" label="Kontrol Tarihi"><input id="followUpAt" name="followUpAt" type="datetime-local" className={cls} defaultValue={String(initial?.followUpAt ?? "")} /></Field>
    </div>
    <VitalsFields initial={initial as Record<string,number|null>|undefined} errors={state.errors}/>
    <div className="grid gap-5 lg:grid-cols-2">{textFields.map(([name,label]) => <Field key={name} id={name} label={label}><textarea id={name} name={name} className={`${cls} min-h-28`} defaultValue={String(initial?.[name] ?? "")} /></Field>)}</div>
    <section className="rounded-xl border border-amber-300 bg-amber-50 p-4"><h2 className="font-semibold">Finalizasyon Özeti</h2><p className="mt-2 text-sm">Finalizasyon sonrası kayıt salt okunur olur. Hayvan, veteriner, ziyaret türü ve klinik bölümlerini kontrol edin.</p></section>
    {state.message ? <p aria-live="polite" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.message}</p> : null}
    <div className="flex flex-wrap gap-3"><button name="intent" value="draft" disabled={pending || veterinarians.length === 0 || !petId} className="rounded-lg border px-5 py-3 font-semibold">Taslak Kaydet</button><button name="intent" value="finalize" disabled={pending || veterinarians.length === 0 || !petId} onClick={(event) => { if (!window.confirm("Kaydı final hale getirmek istediğinize emin misiniz?")) event.preventDefault(); }} className="rounded-lg bg-[#0d2922] px-5 py-3 font-semibold text-white disabled:opacity-60">Final Kaydet</button></div>
  </form>;
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return <div><label htmlFor={id} className="text-sm font-medium">{label}</label>{children}{error ? <p id={`${id}-error`} className="mt-1 text-sm text-red-700">{error}</p> : null}</div>;
}
