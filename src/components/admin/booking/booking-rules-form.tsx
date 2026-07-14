"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { BookingSettingsState } from "@/app/admin/booking-settings/actions";

type BookingRulesRow = {
  id: boolean;
  minimum_notice_minutes: number;
  maximum_advance_days: number;
  slot_interval_minutes: number;
  default_confirmation_mode: "pending" | "confirmed";
  allow_same_day_booking: boolean;
  require_email: boolean;
  require_phone: boolean;
  allow_first_available_veterinarian: boolean;
  cancellation_notice_minutes: number;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

const SLOT_INTERVAL_OPTIONS = [
  { value: 5, label: "5 dakika" },
  { value: 10, label: "10 dakika" },
  { value: 15, label: "15 dakika" },
  { value: 20, label: "20 dakika" },
  { value: 30, label: "30 dakika" },
  { value: 60, label: "60 dakika" },
];

const CONFIRMATION_MODE_OPTIONS = [
  { value: "pending", label: "Klinik onayı gerekli" },
  { value: "confirmed", label: "Otomatik onay" },
];

function splitMinutes(totalMinutes: number): { hours: number; minutes: number } {
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

export function BookingRulesForm({
  action,
  initial,
}: {
  action: (state: BookingSettingsState, formData: FormData) => Promise<BookingSettingsState>;
  initial?: BookingRulesRow;
}) {
  const [state, formAction, pending] = useActionState(action, { message: null });

  const minimumNotice = splitMinutes(initial?.minimum_notice_minutes ?? 60);
  const cancellationNotice = splitMinutes(initial?.cancellation_notice_minutes ?? 60);

  function handleDurationSplitSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;

    // Combine hours + minutes into hidden fields for minimum_notice_minutes
    const minNoticeHours = Number((form.querySelector("#minimum_notice_hours") as HTMLInputElement)?.value ?? 0);
    const minNoticeMinutes = Number((form.querySelector("#minimum_notice_mins") as HTMLInputElement)?.value ?? 0);
    const minNoticeHidden = form.querySelector("input[name='minimum_notice_minutes']") as HTMLInputElement;
    if (minNoticeHidden) minNoticeHidden.value = String(minNoticeHours * 60 + minNoticeMinutes);

    // Combine hours + minutes into hidden fields for cancellation_notice_minutes
    const cancelNoticeHours = Number((form.querySelector("#cancellation_notice_hours") as HTMLInputElement)?.value ?? 0);
    const cancelNoticeMinutes = Number((form.querySelector("#cancellation_notice_mins") as HTMLInputElement)?.value ?? 0);
    const cancelNoticeHidden = form.querySelector("input[name='cancellation_notice_minutes']") as HTMLInputElement;
    if (cancelNoticeHidden) cancelNoticeHidden.value = String(cancelNoticeHours * 60 + cancelNoticeMinutes);
  }

  return (
    <form
      action={formAction}
      onSubmit={handleDurationSplitSubmit}
      className="space-y-6"
    >
      {state.message && (
        <p aria-live="polite" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      {/* ── Minimum Notice ── */}
      <div>
        <label className="block text-sm font-medium">
          Minimum Randevu Bildirim Süresi <span className="text-red-700">*</span>
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            id="minimum_notice_hours"
            type="number"
            min={0}
            max={72}
            defaultValue={minimumNotice.hours}
            className="w-20 rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
            aria-label="Saat"
          />
          <span className="text-sm text-[#526a64]">saat</span>
          <input
            id="minimum_notice_mins"
            type="number"
            min={0}
            max={59}
            defaultValue={minimumNotice.minutes}
            className="w-20 rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
            aria-label="Dakika"
          />
          <span className="text-sm text-[#526a64]">dakika</span>
        </div>
        <input type="hidden" name="minimum_notice_minutes" defaultValue={initial?.minimum_notice_minutes ?? 60} />
        <p className="mt-1 text-xs text-[#526a64]">
          Randevu almak için en az bu süre öncesinden bildirim gerekir.
        </p>
        {state.errors?.minimum_notice_minutes && (
          <p className="mt-1 text-sm text-red-700">{state.errors.minimum_notice_minutes}</p>
        )}
      </div>

      {/* ── Maximum Advance Days ── */}
      <div>
        <label htmlFor="maximum_advance_days" className="block text-sm font-medium">
          Maksimum İleri Gün Sayısı <span className="text-red-700">*</span>
        </label>
        <input
          id="maximum_advance_days"
          name="maximum_advance_days"
          type="number"
          required
          min={1}
          max={365}
          defaultValue={initial?.maximum_advance_days ?? 30}
          className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
          aria-describedby="maximum_advance_days_hint"
          aria-invalid={state.errors?.maximum_advance_days ? true : undefined}
        />
        <p id="maximum_advance_days_hint" className="mt-1 text-xs text-[#526a64]">
          Randevu en fazla bu kadar gün önceden alınabilir.
        </p>
        {state.errors?.maximum_advance_days && (
          <p className="mt-1 text-sm text-red-700">{state.errors.maximum_advance_days}</p>
        )}
      </div>

      {/* ── Slot Interval ── */}
      <div>
        <label htmlFor="slot_interval_minutes" className="block text-sm font-medium">
          Slot Aralığı <span className="text-red-700">*</span>
        </label>
        <select
          id="slot_interval_minutes"
          name="slot_interval_minutes"
          required
          defaultValue={initial?.slot_interval_minutes ?? 15}
          className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
          aria-describedby="slot_interval_hint"
          aria-invalid={state.errors?.slot_interval_minutes ? true : undefined}
        >
          {SLOT_INTERVAL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <p id="slot_interval_hint" className="mt-1 text-xs text-[#526a64]">
          Randevu zaman dilimlerinin dakika aralığı.
        </p>
        {state.errors?.slot_interval_minutes && (
          <p className="mt-1 text-sm text-red-700">{state.errors.slot_interval_minutes}</p>
        )}
      </div>

      {/* ── Default Confirmation Mode ── */}
      <div>
        <label htmlFor="default_confirmation_mode" className="block text-sm font-medium">
          Varsayılan Onay Modu <span className="text-red-700">*</span>
        </label>
        <select
          id="default_confirmation_mode"
          name="default_confirmation_mode"
          required
          defaultValue={initial?.default_confirmation_mode ?? "pending"}
          className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
          aria-describedby="confirmation_mode_hint"
          aria-invalid={state.errors?.default_confirmation_mode ? true : undefined}
        >
          {CONFIRMATION_MODE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <p id="confirmation_mode_hint" className="mt-1 text-xs text-[#526a64]">
          Yeni randevuların varsayılan onay davranışı.
        </p>
        {state.errors?.default_confirmation_mode && (
          <p className="mt-1 text-sm text-red-700">{state.errors.default_confirmation_mode}</p>
        )}
      </div>

      {/* ── Checkbox Group ── */}
      <div className="space-y-4">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="allow_same_day_booking"
            value="true"
            defaultChecked={initial?.allow_same_day_booking ?? true}
            className="mt-0.5 rounded border-[#0d2922]/20 accent-[#0d2922]"
          />
          <div>
            <span className="font-medium">Aynı gün randevu alabilir</span>
            <p className="text-xs text-[#526a64]">Müşteriler bugün için randevu oluşturabilir.</p>
          </div>
        </label>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="require_email"
            value="true"
            defaultChecked={initial?.require_email ?? true}
            className="mt-0.5 rounded border-[#0d2922]/20 accent-[#0d2922]"
          />
          <div>
            <span className="font-medium">E-posta zorunlu</span>
            <p className="text-xs text-[#526a64]">Randevu oluştururken e-posta alanı zorunlu olur.</p>
          </div>
        </label>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="require_phone"
            value="true"
            defaultChecked={initial?.require_phone ?? true}
            className="mt-0.5 rounded border-[#0d2922]/20 accent-[#0d2922]"
          />
          <div>
            <span className="font-medium">Telefon zorunlu</span>
            <p className="text-xs text-[#526a64]">Randevu oluştururken telefon alanı zorunlu olur.</p>
          </div>
        </label>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="allow_first_available_veterinarian"
            value="true"
            defaultChecked={initial?.allow_first_available_veterinarian ?? false}
            className="mt-0.5 rounded border-[#0d2922]/20 accent-[#0d2922]"
          />
          <div>
            <span className="font-medium">İlk uygun veteriner seçimi</span>
            <p className="text-xs text-[#526a64]">Müşteriler belirli veteriner seçmek yerine ilk uygun veterineri seçebilir.</p>
          </div>
        </label>
      </div>

      {/* ── Cancellation Notice ── */}
      <div>
        <label className="block text-sm font-medium">
          İptal Bildirim Süresi <span className="text-red-700">*</span>
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            id="cancellation_notice_hours"
            type="number"
            min={0}
            max={72}
            defaultValue={cancellationNotice.hours}
            className="w-20 rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
            aria-label="Saat"
          />
          <span className="text-sm text-[#526a64]">saat</span>
          <input
            id="cancellation_notice_mins"
            type="number"
            min={0}
            max={59}
            defaultValue={cancellationNotice.minutes}
            className="w-20 rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
            aria-label="Dakika"
          />
          <span className="text-sm text-[#526a64]">dakika</span>
        </div>
        <input type="hidden" name="cancellation_notice_minutes" defaultValue={initial?.cancellation_notice_minutes ?? 60} />
        <p className="mt-1 text-xs text-[#526a64]">
          Randevu iptali için en az bu süre öncesinden bildirim gerekir.
        </p>
        {state.errors?.cancellation_notice_minutes && (
          <p className="mt-1 text-sm text-red-700">{state.errors.cancellation_notice_minutes}</p>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex justify-end gap-3">
        <Link
          href="/admin/booking-settings/rules"
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Vazgeç
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#0d2922] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Kaydediliyor..." : "Kuralları Güncelle"}
        </button>
      </div>
    </form>
  );
}
