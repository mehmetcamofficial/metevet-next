"use client";

import { useActionState, useState } from "react";
import type { ParasiteState } from "@/app/admin/parasites/actions";
import { OwnerPetFields } from "@/src/components/admin/owner-pet-fields";
import { preventiveStatuses, preventiveStatusLabels, treatmentLabels } from "@/src/lib/admin/preventive-care";

const cls = "mt-1 w-full rounded border p-2";
type Owner = { id: string; full_name: string };
type Pet = { id: string; owner_id: string; name: string };

export function ParasiteForm({ action, owners, pets, vets, initial }: {
  action: (state: ParasiteState, form: FormData) => Promise<ParasiteState>;
  owners: Owner[]; pets: Pet[]; vets: Array<{ id: string; full_name: string }>;
  initial?: Record<string, string | null>;
}) {
  const [state, formAction, pending] = useActionState(action, { message: null });
  const initialPet = pets.find((pet) => pet.id === initial?.petId);
  const [ownerId, setOwnerId] = useState(initial?.ownerId ?? initialPet?.owner_id ?? "");
  const [petId, setPetId] = useState(initialPet?.id ?? "");
  return <form action={formAction} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2">
    <OwnerPetFields owners={owners} pets={pets} ownerId={ownerId} petId={petId} onOwnerChange={setOwnerId} onPetChange={setPetId} ownerError={state.errors?.ownerId} petError={state.errors?.petId} canCreatePet />
    <label>Veteriner<select name="veterinarianId" required defaultValue={initial?.veterinarianId ?? ""} disabled={vets.length === 0} className={cls}><option value="">Seçiniz</option>{vets.map((vet) => <option key={vet.id} value={vet.id}>{vet.full_name}</option>)}</select>{vets.length === 0 ? <span role="status" className="mt-2 block rounded bg-amber-50 p-3 text-sm text-amber-900">Atanabilir veteriner hekim profili bulunmuyor.</span> : null}</label>
    <label>Tedavi Türü<select name="treatmentType" defaultValue={initial?.treatmentType ?? "combined"} className={cls}>{Object.entries(treatmentLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    <label>Ürün Adı<input name="productName" defaultValue={initial?.productName ?? ""} className={cls}/></label><label>Parti Numarası<input name="batchNumber" defaultValue={initial?.batchNumber ?? ""} className={cls}/></label><label>Uygulama Tarihi<input name="administrationDate" type="datetime-local" defaultValue={initial?.administrationDate ?? ""} className={cls}/></label><label>Sonraki Uygulama<input name="nextDueDate" type="datetime-local" defaultValue={initial?.nextDueDate ?? ""} className={cls}/></label><label>Durum<select name="status" defaultValue={initial?.status ?? "completed"} className={cls}>{preventiveStatuses.map((status) => <option key={status} value={status}>{preventiveStatusLabels[status]}</option>)}</select></label>
  </div><label>Notlar<textarea name="notes" defaultValue={initial?.notes ?? ""} className={cls}/></label><label>Dahili Notlar<textarea name="internalNotes" defaultValue={initial?.internalNotes ?? ""} className={cls}/></label>{state.message ? <p aria-live="polite" className="text-red-700">{state.message}</p> : null}<button disabled={pending || vets.length === 0 || !petId} className="rounded bg-[#0d2922] px-5 py-3 text-white disabled:opacity-60">Kaydet</button></form>;
}
