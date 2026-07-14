"use client";

import { useActionState } from "react";

import type { ReminderFormState } from "@/app/admin/reminders/actions";
import type { ReminderChannel } from "@/src/types/database";

import { reminderTypeLabels } from "./reminder-type-badge";

const field = "mt-1 w-full rounded-lg border p-2.5 focus-visible:outline-2 focus-visible:outline-[#cda85f]";

export function ReminderForm({ action, owners, pets, initial }: {
  action: (state: ReminderFormState, form: FormData) => Promise<ReminderFormState>;
  owners: Array<{ id: string; full_name: string }>;
  pets: Array<{ id: string; name: string; owner_id: string }>;
  initial?: Record<string, string | null>;
}) {
  const [state, formAction, pending] = useActionState(action, { message: null });
  const channels: ReminderChannel[] = ["whatsapp", "sms", "email", "internal"];
  return <form action={formAction} className="mt-6 space-y-5 rounded-2xl bg-white p-6">
    <div className="grid gap-4 sm:grid-cols-2">
      <label>Hayvan Sahibi *<select required name="ownerId" defaultValue={initial?.ownerId ?? ""} className={field}><option value="">Seçiniz</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name}</option>)}</select></label>
      <label>Hayvan<select name="petId" defaultValue={initial?.petId ?? ""} className={field}><option value="">Seçiniz</option>{pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></label>
      <label>Tür *<input type="hidden" name="reminderType" value="custom" /><select value="custom" disabled className={field}><option value="custom">{reminderTypeLabels.custom}</option></select></label>
      <label>Kanal *<select required name="channel" defaultValue={initial?.channel ?? "whatsapp"} className={field}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></label>
      <label>Planlanan Zaman *<input required type="datetime-local" name="scheduledFor" defaultValue={initial?.scheduledFor ?? ""} className={field} /></label>
    </div>
    <label className="block">Mesaj<textarea name="renderedMessage" rows={7} defaultValue={initial?.renderedMessage ?? ""} className={field} /></label>
    {state.message ? <p role="alert" aria-live="polite" className="text-red-700">{state.message}</p> : null}
    <button disabled={pending} className="rounded-lg bg-[#0d2922] px-5 py-3 text-white disabled:opacity-50">{pending ? "Kaydediliyor…" : "Kaydet"}</button>
  </form>;
}
