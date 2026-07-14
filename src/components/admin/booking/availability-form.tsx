"use client";

import { useActionState, useState, useCallback } from "react";
import Link from "next/link";
import type { BookingSettingsState } from "@/app/admin/booking-settings/actions";

const WEEKDAYS: Array<{ wd: number; label: string }> = [
  { wd: 1, label: "Pazartesi" },
  { wd: 2, label: "Salı" },
  { wd: 3, label: "Çarşamba" },
  { wd: 4, label: "Perşembe" },
  { wd: 5, label: "Cuma" },
  { wd: 6, label: "Cumartesi" },
  { wd: 7, label: "Pazar" },
];

type Veterinarian = { id: string; full_name: string };
type AvailabilityRow = {
  id: string;
  weekday: number;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  break_start: string | null;
  break_end: string | null;
  effective_from: string | null;
  effective_until: string | null;
};

export function AvailabilityForm({
  action,
  veterinarians,
  selectedVetId,
  availabilityData,
  state: initialState,
}: {
  action: (state: BookingSettingsState, formData: FormData) => Promise<BookingSettingsState>;
  veterinarians: Veterinarian[];
  selectedVetId: string;
  availabilityData: AvailabilityRow[];
  state: BookingSettingsState;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  // Build day-level state from availabilityData
  const buildDayMap = useCallback(
    (vetId: string) => {
      const rows = vetId === selectedVetId ? availabilityData : [];
      const map: Record<number, AvailabilityRow & { isNew?: boolean }> = {};
      for (const wd of WEEKDAYS) {
        const existing = rows.find((r) => r.weekday === wd.wd);
        if (existing) {
          map[wd.wd] = { ...existing };
        } else {
          map[wd.wd] = {
            id: "",
            weekday: wd.wd,
            is_available: false,
            start_time: null,
            end_time: null,
            break_start: null,
            break_end: null,
            effective_from: null,
            effective_until: null,
            isNew: true,
          };
        }
      }
      return map;
    },
    [selectedVetId, availabilityData],
  );

  const [dayMap, setDayMap] = useState<Record<number, AvailabilityRow & { isNew?: boolean }>>(
    () => buildDayMap(selectedVetId),
  );

  const [currentVetId, setCurrentVetId] = useState(selectedVetId);
  const [copySource, setCopySource] = useState<number | "">("");

  // When vet selector changes, reset day data
  const handleVetChange = useCallback(
    (vetId: string) => {
      setCurrentVetId(vetId);
      setDayMap(buildDayMap(vetId));
      setCopySource("");
    },
    [buildDayMap],
  );

  // Toggle available/unavailable for a day
  const toggleAvailable = useCallback((wd: number, checked: boolean) => {
    setDayMap((prev) => {
      const day = prev[wd];
      return {
        ...prev,
        [wd]: {
          ...day,
          is_available: checked,
          // Clear times when marking unavailable
          start_time: checked ? day.start_time ?? "09:00" : null,
          end_time: checked ? day.end_time ?? "17:00" : null,
          break_start: checked ? day.break_start : null,
          break_end: checked ? day.break_end : null,
        },
      };
    });
  }, []);

  // Update a time field for a day
  const updateTime = useCallback((wd: number, field: keyof AvailabilityRow, value: string) => {
    setDayMap((prev) => ({
      ...prev,
      [wd]: { ...prev[wd], [field]: value || null },
    }));
  }, []);

  // Copy day values from source to selected targets
  const handleCopy = useCallback(
    (targetWds: number[]) => {
      if (!copySource) return;
      const source = dayMap[copySource as number];
      if (!source) return;
      setDayMap((prev) => {
        const next = { ...prev };
        for (const twd of targetWds) {
          next[twd] = {
            ...next[twd],
            is_available: source.is_available,
            start_time: source.start_time,
            end_time: source.end_time,
            break_start: source.break_start,
            break_end: source.break_end,
          };
        }
        return next;
      });
    },
    [copySource, dayMap],
  );

  const inputClass =
    "mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]";

  const disabledInputClass =
    "mt-1 w-full rounded-lg border border-[#0d2922]/10 px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed";

  return (
    <form action={formAction} className="space-y-6">
      {/* ── Global error ── */}
      {state.message && (
        <p aria-live="polite" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      {/* ── Hidden veterinarian_id ── */}
      <input type="hidden" name="veterinarian_id" value={currentVetId} />

      {/* ── Vet selector ── */}
      <div>
        <label htmlFor="vet_selector" className="block text-sm font-medium">
          Veteriner <span className="text-red-700">*</span>
        </label>
        <select
          id="vet_selector"
          value={currentVetId}
          onChange={(e) => handleVetChange(e.target.value)}
          className={inputClass}
          aria-describedby="vet_hint"
        >
          <option value="">-- Veteriner Seçin --</option>
          {veterinarians.map((v) => (
            <option key={v.id} value={v.id}>
              {v.full_name}
            </option>
          ))}
        </select>
        <p id="vet_hint" className="mt-1 text-xs text-[#526a64]">
          Sadece aktif veterinerler listelenir.
        </p>
      </div>

      {/* ── Timezone info ── */}
      <p className="text-xs text-[#526a64]">
        Tüm saat değerleri <strong>Europe/Istanbul (UTC+3)</strong> zaman diliminde
        kabul edilir. Saat giriş değerleri bu zaman dilimine göre yorumlanacaktır.
      </p>

      {/* ── Copy day feature ── */}
      <div className="flex items-center gap-3 rounded-lg border border-[#0d2922]/10 bg-[#0d2922]/5 px-4 py-3">
        <label htmlFor="copy_source" className="text-sm font-medium shrink-0">
          Gün Kopyala:
        </label>
        <select
          id="copy_source"
          value={copySource}
          onChange={(e) => setCopySource(Number(e.target.value) || "")}
          className="rounded-lg border border-[#0d2922]/20 px-3 py-1.5 text-sm"
        >
          <option value="">-- Kaynak Gün --</option>
          {WEEKDAYS.map((d) => (
            <option key={d.wd} value={d.wd}>
              {d.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-[#526a64] shrink-0">→</span>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.filter((d) => d.wd !== copySource).map((d) => (
            <button
              key={d.wd}
              type="button"
              onClick={() => handleCopy([d.wd])}
              disabled={!copySource}
              className="rounded-lg border border-[#0d2922]/20 px-2.5 py-1 text-xs font-medium hover:bg-[#0d2922]/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Weekday rows ── */}
      {WEEKDAYS.map(({ wd, label }) => {
        const day = dayMap[wd];
        const isAvail = day?.is_available ?? false;
        const dayError = state.errors?.[`weekday_${wd}`];

        return (
          <div key={wd} className="rounded-lg border border-[#0d2922]/15 p-4 space-y-3">
            {/* Hidden fields per weekday */}
            <input type="hidden" name="weekday" value={wd} />
            {day?.id && <input type="hidden" name={`id_${wd}`} value={day.id} />}
            <input
              type="hidden"
              name={`is_available_${wd}`}
              value={isAvail ? "true" : "false"}
            />
            {/* Hidden time fields for unavailable days so formData still has the keys */}
            {!isAvail && (
              <>
                <input type="hidden" name={`start_time_${wd}`} value="" />
                <input type="hidden" name={`end_time_${wd}`} value="" />
                <input type="hidden" name={`break_start_${wd}`} value="" />
                <input type="hidden" name={`break_end_${wd}`} value="" />
              </>
            )}

            {/* ── Day header + toggle ── */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{label}</h3>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvail}
                  onChange={(e) => toggleAvailable(wd, e.target.checked)}
                  className="rounded border-[#0d2922]/20 accent-[#0d2922]"
                />
                Müsait
              </label>
            </div>

            {/* ── Error for this weekday ── */}
            {dayError && (
              <p className="text-sm text-red-700">{dayError}</p>
            )}

            {/* ── Time inputs (visible only when available) ── */}
            {isAvail ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`start_time_${wd}`} className="block text-sm font-medium">
                      Başlangıç <span className="text-red-700">*</span>
                    </label>
                    <input
                      id={`start_time_${wd}`}
                      name={`start_time_${wd}`}
                      type="time"
                      required
                      value={day?.start_time ?? "09:00"}
                      onChange={(e) => updateTime(wd, "start_time", e.target.value)}
                      className={inputClass}
                      aria-invalid={dayError ? true : undefined}
                    />
                  </div>
                  <div>
                    <label htmlFor={`end_time_${wd}`} className="block text-sm font-medium">
                      Bitiş <span className="text-red-700">*</span>
                    </label>
                    <input
                      id={`end_time_${wd}`}
                      name={`end_time_${wd}`}
                      type="time"
                      required
                      value={day?.end_time ?? "17:00"}
                      onChange={(e) => updateTime(wd, "end_time", e.target.value)}
                      className={inputClass}
                      aria-invalid={dayError ? true : undefined}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`break_start_${wd}`} className="block text-sm font-medium">
                      Mola Başlangıç
                    </label>
                    <input
                      id={`break_start_${wd}`}
                      name={`break_start_${wd}`}
                      type="time"
                      value={day?.break_start ?? ""}
                      onChange={(e) => updateTime(wd, "break_start", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor={`break_end_${wd}`} className="block text-sm font-medium">
                      Mola Bitiş
                    </label>
                    <input
                      id={`break_end_${wd}`}
                      name={`break_end_${wd}`}
                      type="time"
                      value={day?.break_end ?? ""}
                      onChange={(e) => updateTime(wd, "break_end", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </>
            ) : (
              /* ── Disabled placeholders when unavailable ── */
              <div className="grid gap-4 sm:grid-cols-2 opacity-50">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Başlangıç</label>
                  <input
                    type="time"
                    disabled
                    value="09:00"
                    className={disabledInputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Bitiş</label>
                  <input
                    type="time"
                    disabled
                    value="17:00"
                    className={disabledInputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Mola Başlangıç</label>
                  <input
                    type="time"
                    disabled
                    value=""
                    className={disabledInputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Mola Bitiş</label>
                  <input
                    type="time"
                    disabled
                    value=""
                    className={disabledInputClass}
                  />
                </div>
              </div>
            )}

            {/* ── Effective date range ── */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`effective_from_${wd}`} className="block text-sm font-medium">
                  Başlangıç Tarihi
                </label>
                <input
                  id={`effective_from_${wd}`}
                  name={`effective_from_${wd}`}
                  type="date"
                  value={day?.effective_from ?? ""}
                  onChange={(e) => updateTime(wd, "effective_from", e.target.value)}
                  className={isAvail ? inputClass : disabledInputClass}
                  disabled={!isAvail}
                />
              </div>
              <div>
                <label htmlFor={`effective_until_${wd}`} className="block text-sm font-medium">
                  Bitiş Tarihi
                </label>
                <input
                  id={`effective_until_${wd}`}
                  name={`effective_until_${wd}`}
                  type="date"
                  value={day?.effective_until ?? ""}
                  onChange={(e) => updateTime(wd, "effective_until", e.target.value)}
                  className={isAvail ? inputClass : disabledInputClass}
                  disabled={!isAvail}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Footer ── */}
      <div className="flex justify-end gap-3">
        <Link
          href="/admin/booking-settings/availability"
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Vazgeç
        </Link>
        <button
          type="submit"
          disabled={pending || !currentVetId}
          className="rounded-lg bg-[#0d2922] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
