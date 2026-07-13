"use client";

import { useActionState } from "react";
import type { VaccineState } from "@/app/admin/vaccines/actions";
import { preventiveStatuses, preventiveStatusLabels } from "@/src/lib/admin/preventive-care";

const cls = "mt-1 w-full rounded border p-2";

export function VaccineForm({ action, pets, vets, initial }: {
  action: (state: VaccineState, formData: FormData) => Promise<VaccineState>;
  pets: Array<{ id: string; name: string }>;
  vets: Array<{ id: string; full_name: string }>;
  initial?: Record<string, string | number | null>;
}) {
  const [state, formAction, pending] = useActionState(action, { message: null });
  const fields = [
    ["vaccineName", "Aşı Adı"], ["manufacturer", "Üretici"],
    ["batchNumber", "Parti Numarası"], ["serialNumber", "Seri Numarası"],
    ["route", "Uygulama Yolu"], ["certificateNumber", "Sertifika Numarası"],
  ] as const;

  return <form action={formAction} className="space-y-5">
    <input type="hidden" name="appointmentId" value={String(initial?.appointmentId ?? "")} />
    <div className="grid gap-4 sm:grid-cols-2">
      <label>Hayvan<select name="petId" defaultValue={String(initial?.petId ?? "")} className={cls}><option value="">Seçiniz</option>{pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></label>
      <label>Veteriner<select name="veterinarianId" defaultValue={String(initial?.veterinarianId ?? "")} className={cls}><option value="">Seçiniz</option>{vets.map((vet) => <option key={vet.id} value={vet.id}>{vet.full_name}</option>)}</select></label>
      {fields.map(([name, label]) => <label key={name}>{label}<input name={name} defaultValue={String(initial?.[name] ?? "")} className={cls} /></label>)}
      <label>Doz<input name="doseNumber" type="number" min="1" defaultValue={String(initial?.doseNumber ?? 1)} className={cls} /></label>
      <label>Uygulama Tarihi<input name="administrationDate" type="datetime-local" defaultValue={String(initial?.administrationDate ?? "")} className={cls} /></label>
      <label>Sonraki Doz<input name="nextDueDate" type="datetime-local" defaultValue={String(initial?.nextDueDate ?? "")} className={cls} /></label>
      <label>Durum<select name="status" defaultValue={String(initial?.status ?? "completed")} className={cls}>{preventiveStatuses.map((status) => <option key={status} value={status}>{preventiveStatusLabels[status]}</option>)}</select></label>
    </div>
    <label>Notlar<textarea name="notes" defaultValue={String(initial?.notes ?? "")} className={cls} /></label>
    <label>Dahili Notlar<textarea name="internalNotes" defaultValue={String(initial?.internalNotes ?? "")} className={cls} /></label>
    {state.message ? <p aria-live="polite" className="text-red-700">{state.message}</p> : null}
    <button disabled={pending} className="rounded bg-[#0d2922] px-5 py-3 text-white">Kaydet</button>
  </form>;
}
