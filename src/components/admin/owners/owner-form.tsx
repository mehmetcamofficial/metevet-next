"use client";

import { useActionState } from "react";
import type { OwnerFormState } from "@/app/admin/owners/actions";

type Owner = { full_name: string; phone: string; email: string | null; notes: string | null };
const initialState: OwnerFormState = { message: null };
const fieldClass = "mt-2 min-h-11 w-full rounded-lg border border-[#0d2922]/20 bg-white px-3 py-2 focus:border-[#0d2922] focus:outline-none focus:ring-2 focus:ring-[#cda85f]/40";

export function OwnerForm({ action, owner, submitLabel }: { action: (state: OwnerFormState, formData: FormData) => Promise<OwnerFormState>; owner?: Owner; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const described = (name: string) => state.errors?.[name] ? `${name}-error` : undefined;
  return <form action={formAction} className="space-y-6" noValidate>
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Ad Soyad" name="fullName" error={state.errors?.fullName}><input className={fieldClass} defaultValue={owner?.full_name} id="fullName" name="fullName" required aria-invalid={Boolean(state.errors?.fullName)} aria-describedby={described("fullName")} /></Field>
      <Field label="Telefon" name="phone" error={state.errors?.phone}><input className={fieldClass} defaultValue={owner?.phone} id="phone" name="phone" type="tel" required placeholder="05XX XXX XX XX" aria-invalid={Boolean(state.errors?.phone)} aria-describedby={described("phone")} /></Field>
      <Field label="E-posta (isteğe bağlı)" name="email" error={state.errors?.email}><input className={fieldClass} defaultValue={owner?.email ?? ""} id="email" name="email" type="email" aria-invalid={Boolean(state.errors?.email)} aria-describedby={described("email")} /></Field>
    </div>
    <Field label="Notlar (isteğe bağlı)" name="notes"><textarea className={`${fieldClass} min-h-32`} defaultValue={owner?.notes ?? ""} id="notes" name="notes" /></Field>
    {state.message ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900" aria-live="polite">{state.message}</p> : null}
    <button type="submit" disabled={pending} className="rounded-lg bg-[#0d2922] px-5 py-3 font-semibold text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cda85f]">{pending ? "Kaydediliyor…" : submitLabel}</button>
  </form>;
}

function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: React.ReactNode }) {
  return <div><label htmlFor={name} className="text-sm font-medium">{label}</label>{children}{error ? <p id={`${name}-error`} className="mt-2 text-sm text-red-700">{error}</p> : null}</div>;
}
