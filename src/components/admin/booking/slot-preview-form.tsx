"use client";

import { useState, useCallback } from "react";
import { confirmationModeLabels } from "@/src/lib/admin/booking/booking-validation";

type Service = { id: string; name_tr: string; duration_minutes: number };
type Vet = { id: string; full_name: string };
type RulesDisplay = {
  minimumNoticeMinutes: number;
  maximumAdvanceDays: number;
  slotIntervalMinutes: number;
  defaultConfirmationMode: string;
};

export function SlotPreviewForm({
  services,
  veterinarians,
  rules,
  initialService,
  initialVet,
  initialDate,
  loading,
  onCalculate,
}: {
  services: Service[];
  veterinarians: Vet[];
  rules: RulesDisplay | null;
  initialService: string;
  initialVet: string;
  initialDate: string;
  loading: boolean;
  onCalculate: (serviceId: string, date: string, vetId?: string) => Promise<void>;
}) {
  const [dateError, setDateError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const serviceId = String(fd.get("serviceId") || "");
      const date = String(fd.get("date") || "");
      const vetId = String(fd.get("veterinarianId") || "") || undefined;

      if (!serviceId || !date) {
        setDateError("Hizmet ve tarih zorunlu.");
        return;
      }

      const selected = new Date(`${date}T00:00:00Z`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        setDateError("Geçmiş tarihler için uygunluk hesaplanamaz.");
        return;
      }

      setDateError(null);
      await onCalculate(serviceId, date, vetId);
    },
    [onCalculate],
  );

  const inputClass =
    "mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]";

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="sp-service" className="block text-sm font-medium">
            Hizmet <span className="text-red-700">*</span>
          </label>
          <select
            id="sp-service"
            name="serviceId"
            defaultValue={initialService}
            required
            className={inputClass}
          >
            <option value="">Seçin</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name_tr} ({s.duration_minutes} dk)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sp-vet" className="block text-sm font-medium">
            Veteriner (opsiyonel)
          </label>
          <select
            id="sp-vet"
            name="veterinarianId"
            defaultValue={initialVet}
            className={inputClass}
          >
            <option value="">Tüm veterinerler (ilk uygun)</option>
            {veterinarians.map((v) => (
              <option key={v.id} value={v.id}>
                {v.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sp-date" className="block text-sm font-medium">
            Tarih <span className="text-red-700">*</span>
          </label>
          <input
            id="sp-date"
            name="date"
            type="date"
            defaultValue={initialDate}
            required
            className={inputClass}
            aria-invalid={dateError ? true : undefined}
            aria-describedby={dateError ? "sp-date-error" : undefined}
          />
          {dateError && (
            <p id="sp-date-error" className="mt-1 text-sm text-red-700" role="alert">
              {dateError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#0d2922] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Hesaplanıyor..." : "Hesapla"}
        </button>
      </form>

      {rules && (
        <dl className="mt-4 space-y-2 border-t border-[#0d2922]/10 pt-4 text-xs text-[#526a64]">
          <div>
            <dt className="font-semibold">Min. Bildirim</dt>
            <dd>{rules.minimumNoticeMinutes} dakika</dd>
          </div>
          <div>
            <dt className="font-semibold">Maks. Ön Rezervasyon</dt>
            <dd>{rules.maximumAdvanceDays} gün</dd>
          </div>
          <div>
            <dt className="font-semibold">Slot Aralığı</dt>
            <dd>{rules.slotIntervalMinutes} dakika</dd>
          </div>
          <div>
            <dt className="font-semibold">Onay Modu</dt>
            <dd>{confirmationModeLabels[rules.defaultConfirmationMode]}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
