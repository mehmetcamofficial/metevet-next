"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { BookingSettingsState } from "@/app/admin/booking-settings/actions";
import type { ClosureType } from "@/src/types/database";

type VeterinarianOption = { id: string; full_name: string };

type ClosureInitial = {
  title?: string;
  closure_type?: ClosureType;
  starts_at?: string;
  ends_at?: string;
  affects_all_veterinarians?: boolean;
  veterinarian_id?: string | null;
  notes?: string | null;
};

export function ClosureForm({
  action,
  veterinarians,
  initial,
}: {
  action: (state: BookingSettingsState, formData: FormData) => Promise<BookingSettingsState>;
  veterinarians: VeterinarianOption[];
  initial?: ClosureInitial | null;
}) {
  const [state, formAction, pending] = useActionState(action, { message: null });

  const [closureType, setClosureType] = useState<ClosureType>(
    initial?.closure_type ?? "full_day",
  );
  const [affectsAll, setAffectsAll] = useState<boolean>(
    initial?.affects_all_veterinarians ?? true,
  );
  const [vetId, setVetId] = useState<string>(initial?.veterinarian_id ?? "");

  // Derive affectsAll from closureType during render instead of useEffect
  const computedAffectsAll = closureType !== "veterinarian_leave" ? true : affectsAll;

  function handleClosureTypeChange(newType: ClosureType) {
    setClosureType(newType);
    if (newType === "veterinarian_leave") {
      setAffectsAll(false);
    } else {
      setAffectsAll(true);
      setVetId("");
    }
  }

  function toDatetimeLocal(iso: string | undefined): string {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const ist = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return ist.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.message && (
        <p aria-live="polite" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Başlık <span className="text-red-700">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          minLength={2}
          defaultValue={initial?.title ?? ""}
          className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
          aria-describedby={state.errors?.title ? "title_err" : undefined}
          aria-invalid={state.errors?.title ? true : undefined}
        />
        {state.errors?.title && (
          <p id="title_err" className="mt-1 text-sm text-red-700">{state.errors.title}</p>
        )}
      </div>

      {/* Closure Type */}
      <div>
        <label htmlFor="closure_type" className="block text-sm font-medium">
          Kapatma Türü <span className="text-red-700">*</span>
        </label>
        <select
          id="closure_type"
          name="closure_type"
          required
          value={closureType}
          onChange={(e) => handleClosureTypeChange(e.target.value as ClosureType)}
          className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
          aria-describedby={state.errors?.closure_type ? "closure_type_err" : undefined}
          aria-invalid={state.errors?.closure_type ? true : undefined}
        >
          <option value="full_day">Tam Gün Kapatma</option>
          <option value="half_day">Yarım Gün Kapatma</option>
          <option value="veterinarian_leave">Veteriner İzni</option>
        </select>
        {state.errors?.closure_type && (
          <p id="closure_type_err" className="mt-1 text-sm text-red-700">{state.errors.closure_type}</p>
        )}
      </div>

      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="starts_at" className="block text-sm font-medium">
            Başlangıç <span className="text-red-700">*</span>
          </label>
          <input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            required
            defaultValue={toDatetimeLocal(initial?.starts_at)}
            className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
            aria-describedby={state.errors?.starts_at ? "starts_at_err" : undefined}
            aria-invalid={state.errors?.starts_at ? true : undefined}
          />
          {state.errors?.starts_at && (
            <p id="starts_at_err" className="mt-1 text-sm text-red-700">{state.errors.starts_at}</p>
          )}
        </div>
        <div>
          <label htmlFor="ends_at" className="block text-sm font-medium">
            Bitiş <span className="text-red-700">*</span>
          </label>
          <input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            required
            defaultValue={toDatetimeLocal(initial?.ends_at)}
            className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
            aria-describedby={state.errors?.ends_at ? "ends_at_err" : undefined}
            aria-invalid={state.errors?.ends_at ? true : undefined}
          />
          {state.errors?.ends_at && (
            <p id="ends_at_err" className="mt-1 text-sm text-red-700">{state.errors.ends_at}</p>
          )}
        </div>
      </div>

      <p className="text-xs text-[#526a64]">
        Tarih ve saatler Avrupa/İstanbul (UTC+3) zaman dilimindedir.
      </p>

      {/* Affects All Veterinarians */}
      {closureType !== "veterinarian_leave" && (
        <input type="hidden" name="affects_all_veterinarians" value="true" />
      )}
      {closureType === "veterinarian_leave" && (
        <input type="hidden" name="affects_all_veterinarians" value={computedAffectsAll ? "true" : "false"} />
      )}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={computedAffectsAll}
          disabled={closureType !== "veterinarian_leave"}
          onChange={(e) => setAffectsAll(e.target.checked)}
          className="rounded border-[#0d2922]/20 accent-[#0d2922]"
        />
        Tüm Veterinerler Etkilenir
      </label>

      {/* Veterinarian Selector — only for veterinarian_leave */}
      {closureType === "veterinarian_leave" && (
        <div>
          <label htmlFor="veterinarian_id" className="block text-sm font-medium">
            Veteriner <span className="text-red-700">*</span>
          </label>
          <select
            id="veterinarian_id"
            name="veterinarian_id"
            required
            value={vetId}
            onChange={(e) => setVetId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
            aria-describedby={state.errors?.veterinarian_id ? "vet_err" : undefined}
            aria-invalid={state.errors?.veterinarian_id ? true : undefined}
          >
            <option value="">— Veteriner Seçin —</option>
            {veterinarians.map((v) => (
              <option key={v.id} value={v.id}>{v.full_name}</option>
            ))}
          </select>
          {state.errors?.veterinarian_id && (
            <p id="vet_err" className="mt-1 text-sm text-red-700">{state.errors.veterinarian_id}</p>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium">Notlar</label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          defaultValue={initial?.notes ?? ""}
          className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
          aria-describedby="notes_hint"
        />
        <p id="notes_hint" className="mt-1 text-xs text-[#526a64]">Klinik dışı notlar, en fazla 500 karakter.</p>
        {state.errors?.notes && (
          <p className="mt-1 text-sm text-red-700">{state.errors.notes}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link
          href="/admin/booking-settings/closures"
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Vazgeç
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#0d2922] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Kaydediliyor..." : initial ? "Güncelle" : "Oluştur"}
        </button>
      </div>
    </form>
  );
}
