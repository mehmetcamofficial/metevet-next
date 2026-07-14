"use client";

import { useActionState } from "react";
import type { PetFormState } from "@/app/admin/pets/actions";
import { speciesLabels, speciesOptions } from "@/src/lib/admin/records";
import type { PetSex } from "@/src/types/database";

type Pet = { owner_id: string; name: string; species: string; breed: string | null; sex: PetSex; birth_date: string | null; microchip_number: string | null; notes: string | null };
type OwnerOption = { id: string; full_name: string; phone: string };
const initialState: PetFormState = { message: null };
const fieldClass = "mt-2 min-h-11 w-full rounded-lg border border-[#0d2922]/20 bg-white px-3 py-2 focus:border-[#0d2922] focus:outline-none focus:ring-2 focus:ring-[#cda85f]/40";

export function PetForm({ action, pet, owners, submitLabel, initialOwnerId }: { action: (state: PetFormState, formData: FormData) => Promise<PetFormState>; pet?: Pet; owners: OwnerOption[]; submitLabel: string; initialOwnerId?: string }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className="space-y-6" noValidate>
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Hayvan Sahibi" name="ownerId" error={state.errors?.ownerId}><select className={fieldClass} id="ownerId" name="ownerId" defaultValue={pet?.owner_id ?? initialOwnerId ?? ""} required><option value="">Seçiniz</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name} · {owner.phone}</option>)}</select></Field>
      <Field label="Hayvan Adı" name="name" error={state.errors?.name}><input className={fieldClass} id="name" name="name" defaultValue={pet?.name} required /></Field>
      <Field label="Tür" name="species" error={state.errors?.species}><select className={fieldClass} id="species" name="species" defaultValue={pet?.species ?? ""} required><option value="">Seçiniz</option>{speciesOptions.map((species) => <option key={species} value={species}>{speciesLabels[species]}</option>)}</select></Field>
      <Field label="Irk (isteğe bağlı)" name="breed"><input className={fieldClass} id="breed" name="breed" defaultValue={pet?.breed ?? ""} /></Field>
      <Field label="Cinsiyet" name="sex"><select className={fieldClass} id="sex" name="sex" defaultValue={pet?.sex ?? "unknown"}><option value="unknown">Bilinmiyor</option><option value="female">Dişi</option><option value="male">Erkek</option></select></Field>
      <Field label="Doğum Tarihi" name="birthDate" error={state.errors?.birthDate}><input className={fieldClass} id="birthDate" name="birthDate" type="date" defaultValue={pet?.birth_date ?? ""} /></Field>
      <Field label="Mikroçip Numarası" name="microchipNumber" error={state.errors?.microchipNumber}><input className={fieldClass} id="microchipNumber" name="microchipNumber" defaultValue={pet?.microchip_number ?? ""} aria-invalid={Boolean(state.errors?.microchipNumber)} /></Field>
    </div>
    <Field label="Notlar (isteğe bağlı)" name="notes"><textarea className={`${fieldClass} min-h-32`} id="notes" name="notes" defaultValue={pet?.notes ?? ""} /></Field>
    {state.message ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900" aria-live="polite">{state.message}</p> : null}
    <button type="submit" disabled={pending || owners.length === 0} className="rounded-lg bg-[#0d2922] px-5 py-3 font-semibold text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cda85f]">{pending ? "Kaydediliyor…" : submitLabel}</button>
  </form>;
}
function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: React.ReactNode }) { return <div><label htmlFor={name} className="text-sm font-medium">{label}</label>{children}{error ? <p id={`${name}-error`} className="mt-2 text-sm text-red-700">{error}</p> : null}</div>; }
