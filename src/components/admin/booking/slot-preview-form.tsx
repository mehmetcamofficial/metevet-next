"use client";

import { useState } from "react";
import { previewSlots } from "@/app/admin/booking-settings/slot-preview/actions";
import type { EngineResponse } from "@/src/lib/admin/booking/availability-engine";
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
}: {
  services: Service[];
  veterinarians: Vet[];
  rules: RulesDisplay | null;
  initialService: string;
  initialVet: string;
  initialDate: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EngineResponse | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [calcDuration, setCalcDuration] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(
    services.find((s) => s.id === initialService) || null
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const serviceId = String(fd.get("serviceId") || "");
    const date = String(fd.get("date") || "");
    const vetId = String(fd.get("veterinarianId") || "") || undefined;
    const selService = services.find((s) => s.id === serviceId) || null;
    setSelectedService(selService);

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
    setLoading(true);
    setResult(null);
    setCalcDuration(null);

    try {
      const t0 = performance.now();
      const res = await previewSlots(serviceId, date, vetId);
      const t1 = performance.now();
      setCalcDuration(Math.round(t1 - t0));
      setResult(res);
    } catch {
      setResult({ reason: "Uygunluk hesaplanamadı." });
      setCalcDuration(null);
    } finally {
      setLoading(false);
    }
  }

  const totalSlots = result && !("reason" in result)
    ? result.veterinarians.reduce((sum, v) => sum + v.slots.length, 0)
    : 0;

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="sp-service" className="block text-sm font-medium">
            Hizmet
          </label>
          <select
            id="sp-service"
            name="serviceId"
            defaultValue={initialService}
            required
            onChange={(e) => setSelectedService(services.find((s) => s.id === e.target.value) || null)}
            className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
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
            className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
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
            Tarih
          </label>
          <input
            id="sp-date"
            name="date"
            type="date"
            defaultValue={initialDate}
            required
            className="mt-1 w-full rounded-lg border border-[#0d2922]/20 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#cda85f]"
          />
          {dateError && <p className="mt-1 text-sm text-red-700">{dateError}</p>}
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
          <div><dt className="font-semibold">Minimum Bildirim</dt><dd>{rules.minimumNoticeMinutes} dakika</dd></div>
          <div><dt className="font-semibold">Maksimum Ön Rezervasyon</dt><dd>{rules.maximumAdvanceDays} gün</dd></div>
          <div><dt className="font-semibold">Slot Aralığı</dt><dd>{rules.slotIntervalMinutes} dakika</dd></div>
          <div><dt className="font-semibold">Onay Modu</dt><dd>{confirmationModeLabels[rules.defaultConfirmationMode]}</dd></div>
        </dl>
      )}

      {result && (
        <div className="mt-6 border-t border-[#0d2922]/10 pt-6">
          {"reason" in result ? (
            <p className="text-sm text-amber-700">{result.reason}</p>
          ) : (
            <div>
              {/* Service and date summary */}
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-medium">
                  {selectedService?.name_tr || result.service.id} — {result.service.durationMinutes} dk
                  {result.service.bufferBeforeMinutes > 0 && ` (+${result.service.bufferBeforeMinutes} dk önce)`}
                  {result.service.bufferAfterMinutes > 0 && ` (+${result.service.bufferAfterMinutes} dk sonra)`}
                </span>
                <span className="text-[#526a64]">
                  {result.date} · Europe/Istanbul
                </span>
              </div>

              {/* Vet mode */}
              <div className="mb-3 text-xs text-[#526a64]">
                {result.veterinarians.length > 1
                  ? "İlk uygun veteriner modu"
                  : result.veterinarians.length === 1
                    ? `Seçilen veteriner: ${result.veterinarians[0].fullName}`
                    : "Veteriner seçilmemiş"}
              </div>

              {/* Diagnostics */}
              <div className="mb-3 rounded bg-[#f4f0e8] px-3 py-2 text-xs text-[#526a64]">
                <span>{totalSlots} uygun saat bulundu</span>
                {calcDuration != null && <span> · Hesaplama: {calcDuration}ms</span>}
              </div>

              {result.veterinarians.length === 0 && (
                <p className="text-sm text-[#526a64]">Uygun veteriner bulunamadı.</p>
              )}
              {result.veterinarians.map((vet) => (
                <div key={vet.veterinarianId} className="mb-4">
                  <h3 className="text-sm font-semibold">{vet.fullName}</h3>
                  {vet.slots.length === 0 ? (
                    <p className="text-sm text-[#526a64]">Bu veteriner için uygun saat yok. Neden: çalışma saati tanımlı değil, izinli veya tüm saatler dolu.</p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {vet.slots.map((slot) => (
                        <span
                          key={slot.startsAt}
                          className="rounded bg-[#dde9e3]/55 px-3 py-1 text-sm font-medium"
                        >
                          {slot.displayTime}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
