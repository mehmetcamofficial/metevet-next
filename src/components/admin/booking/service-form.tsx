"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { BookingSettingsState } from "@/app/admin/booking-settings/actions";
import type { Database } from "@/src/types/database";

const SLUG_RE = /^[a-z][a-z0-9-]{1,58}[a-z0-9]$/;

export function ServiceForm({
  action,
  initial,
}: {
  action: (state: BookingSettingsState, formData: FormData) => Promise<BookingSettingsState>;
  initial?: Database["public"]["Tables"]["appointment_services"]["Insert"];
}) {
  const [state, formAction, pending] = useActionState(action, { message: null });

  function suggestSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.message && (
        <p aria-live="polite" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name_tr" className="block text-sm font-medium">
            Türkçe Ad <span className="text-red-700">*</span>
          </label>
          <input
            id="name_tr"
            name="name_tr"
            type="text"
            required
            defaultValue={initial?.name_tr ?? ""}
            onChange={(e) => {
              const slugInput = document.getElementById("slug") as HTMLInputElement;
              if (!slugInput.dataset.manual) slugInput.value = suggestSlug(e.target.value);
            }}
            className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
            aria-describedby={state.errors?.name_tr ? "name_tr_err" : undefined}
            aria-invalid={state.errors?.name_tr ? true : undefined}
          />
          {state.errors?.name_tr && <p id="name_tr_err" className="mt-1 text-sm text-red-700">{state.errors.name_tr}</p>}
        </div>

        <div>
          <label htmlFor="name_en" className="block text-sm font-medium">
            English Name <span className="text-red-700">*</span>
          </label>
          <input
            id="name_en"
            name="name_en"
            type="text"
            required
            defaultValue={initial?.name_en ?? ""}
            className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
            aria-describedby={state.errors?.name_en ? "name_en_err" : undefined}
            aria-invalid={state.errors?.name_en ? true : undefined}
          />
          {state.errors?.name_en && <p id="name_en_err" className="mt-1 text-sm text-red-700">{state.errors.name_en}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium">
          Slug <span className="text-red-700">*</span>
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          defaultValue={initial?.slug ?? ""}
          pattern={SLUG_RE.source}
          onBlur={(e) => {
            if (e.target.value !== suggestSlug("")) (e.target as HTMLInputElement).dataset.manual = "true";
          }}
          className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
          aria-describedby="slug_hint"
          aria-invalid={state.errors?.slug ? true : undefined}
        />
        <p id="slug_hint" className="mt-1 text-xs text-[#526a64]">URL için benzersiz tanımlayıcı. Küçük harf, rakam ve tire.</p>
        {state.errors?.slug && <p className="mt-1 text-sm text-red-700">{state.errors.slug}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="description_tr" className="block text-sm font-medium">Türkçe Açıklama</label>
          <textarea
            id="description_tr"
            name="description_tr"
            rows={3}
            defaultValue={initial?.description_tr ?? ""}
            maxLength={500}
            className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
          />
        </div>
        <div>
          <label htmlFor="description_en" className="block text-sm font-medium">English Description</label>
          <textarea
            id="description_en"
            name="description_en"
            rows={3}
            defaultValue={initial?.description_en ?? ""}
            maxLength={500}
            className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="duration_minutes" className="block text-sm font-medium">
            Süre (dakika) <span className="text-red-700">*</span>
          </label>
          <input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            required
            min={5}
            max={480}
            defaultValue={initial?.duration_minutes ?? 30}
            className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
          />
        </div>
        <div>
          <label htmlFor="buffer_before_minutes" className="block text-sm font-medium">Başlangıç Bekleme (dk)</label>
          <input
            id="buffer_before_minutes"
            name="buffer_before_minutes"
            type="number"
            min={0}
            max={180}
            defaultValue={initial?.buffer_before_minutes ?? 0}
            className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
          />
        </div>
        <div>
          <label htmlFor="buffer_after_minutes" className="block text-sm font-medium">Bitiş Bekleme (dk)</label>
          <input
            id="buffer_after_minutes"
            name="buffer_after_minutes"
            type="number"
            min={0}
            max={180}
            defaultValue={initial?.buffer_after_minutes ?? 0}
            className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={initial?.is_active ?? true}
            className="rounded border-[#0d2922]/20 accent-[#0d2922]"
          />
          Aktif
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_online_bookable"
            value="true"
            defaultChecked={initial?.is_online_bookable ?? false}
            className="rounded border-[#0d2922]/20 accent-[#0d2922]"
          />
          Online Randevuya Uygun
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="requires_manual_confirmation"
            value="true"
            defaultChecked={initial?.requires_manual_confirmation ?? false}
            className="rounded border-[#0d2922]/20 accent-[#0d2922]"
          />
          Manuel Onay Gerekli
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <Link
          href="/admin/booking-settings/services"
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
