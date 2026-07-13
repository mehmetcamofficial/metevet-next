"use client";

import { useId, useRef } from "react";

export function ConfirmDialog({ title, description, triggerLabel, confirmLabel, action, danger = false }: { title: string; description: string; triggerLabel: string; confirmLabel: string; action: (formData: FormData) => void; danger?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId(); const descriptionId = useId();
  return <><button type="button" onClick={() => dialogRef.current?.showModal()} className="rounded-lg border border-[#0d2922]/20 px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d2922]">{triggerLabel}</button><dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={descriptionId} className="m-auto max-w-md rounded-2xl p-0 backdrop:bg-black/40"><form action={action} className="p-6" onSubmit={() => dialogRef.current?.close()}><h2 id={titleId} className="text-xl font-semibold">{title}</h2><p id={descriptionId} className="mt-3 text-sm leading-6 text-[#526a64]">{description}</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => dialogRef.current?.close()} className="rounded-lg border px-4 py-2">Vazgeç</button><button type="submit" className={`rounded-lg px-4 py-2 font-semibold text-white ${danger ? "bg-red-700" : "bg-[#0d2922]"}`}>{confirmLabel}</button></div></form></dialog></>;
}
