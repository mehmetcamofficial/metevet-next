"use client";

import { useActionState, useState } from "react";
import type { VaccineState } from "@/app/admin/vaccines/actions";
import { OwnerPetFields } from "@/src/components/admin/owner-pet-fields";
import { preventiveStatuses, preventiveStatusLabels } from "@/src/lib/admin/preventive-care";

const cls = "mt-1 w-full rounded border p-2";
type Owner = { id: string; full_name: string };
type Pet = { id: string; owner_id: string; name: string };

export function VaccineForm({ action, owners, pets, vets, initial }: {
  action: (state: VaccineState, formData: FormData) => Promise<VaccineState>;
  owners: Owner[]; pets: Pet[]; vets: Array<{ id: string; full_name: string }>;
  initial?: Record<string, string | number | null>;
}) {
  const [state, formAction, pending] = useActionState(action, { message: null });
  const initialPet = pets.find((pet) => pet.id === initial?.petId);
  const [ownerId, setOwnerId] = useState(String(initial?.ownerId ?? initialPet?.owner_id ?? ""));
  const [petId, setPetId] = useState(initialPet?.id ?? "");
  const fields = [["vaccineName","Aşı Adı"],["manufacturer","Üretici"],["batchNumber","Parti Numarası"],["serialNumber","Seri Numarası"],["route","Uygulama Yolu"],["certificateNumber","Sertifika Numarası"]] as const;
  return <form action={formAction} className="space-y-5">
    <input type="hidden" name="appointmentId" value={String(initial?.appointmentId ?? "")} />
    <div className="grid gap-4 sm:grid-cols-2">
      <OwnerPetFields owners={owners} pets={pets} ownerId={ownerId} petId={petId} onOwnerChange={setOwnerId} onPetChange={setPetId} ownerError={state.errors?.ownerId} petError={state.errors?.petId} canCreatePet />
      <label>Veteriner<select name="veterinarianId" required defaultValue={String(initial?.veterinarianId ?? "")} disabled={vets.length === 0} className={cls}><option value="">Seçiniz</option>{vets.map((vet) => <option key={vet.id} value={vet.id}>{vet.full_name}</option>)}</select>{vets.length === 0 ? <span role="status" className="mt-2 block rounded bg-amber-50 p-3 text-sm text-amber-900">Atanabilir veteriner hekim profili bulunmuyor.</span> : null}</label>
      {fields.map(([name,label]) => <label key={name}>{label}<input name={name} defaultValue={String(initial?.[name] ?? "")} className={cls} /></label>)}
      <label>Doz<input name="doseNumber" type="number" min="1" defaultValue={String(initial?.doseNumber ?? 1)} className={cls} /></label>
      <label>Uygulama Tarihi<input name="administrationDate" type="datetime-local" defaultValue={String(initial?.administrationDate ?? "")} className={cls} /></label>
      <label>Sonraki Doz<input name="nextDueDate" type="datetime-local" defaultValue={String(initial?.nextDueDate ?? "")} className={cls} /></label>
      <label>Durum<select name="status" defaultValue={String(initial?.status ?? "completed")} className={cls}>{preventiveStatuses.map((status) => <option key={status} value={status}>{preventiveStatusLabels[status]}</option>)}</select></label>
    </div>
    <label>Notlar<textarea name="notes" defaultValue={String(initial?.notes ?? "")} className={cls} /></label><label>Dahili Notlar<textarea name="internalNotes" defaultValue={String(initial?.internalNotes ?? "")} className={cls} /></label>
    {state.message ? <p aria-live="polite" className="text-red-700">{state.message}</p> : null}
    <button disabled={pending || vets.length === 0 || !petId} className="rounded bg-[#0d2922] px-5 py-3 text-white disabled:opacity-60">Kaydet</button>
  </form>;
}
