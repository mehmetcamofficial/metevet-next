"use client";

import { useState, useCallback } from "react";
import { previewSlots } from "@/app/admin/booking-settings/slot-preview/actions";
import type { EngineResponse } from "@/src/lib/admin/booking/availability-engine";
import { SlotPreviewForm } from "./slot-preview-form";
import { SlotPreviewResults } from "./slot-preview-results";

type Service = { id: string; name_tr: string; duration_minutes: number };
type Vet = { id: string; full_name: string };
type RulesDisplay = {
  minimumNoticeMinutes: number;
  maximumAdvanceDays: number;
  slotIntervalMinutes: number;
  defaultConfirmationMode: string;
};

export function SlotPreviewPageClient({
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
  const [calcDuration, setCalcDuration] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(
    services.find((s) => s.id === initialService) || null,
  );

  const handleCalculate = useCallback(
    async (serviceId: string, date: string, vetId?: string) => {
      const selService = services.find((s) => s.id === serviceId) || null;
      setSelectedService(selService);
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
    },
    [services],
  );

  return (
    <div className="mt-7 grid gap-6 lg:grid-cols-[340px_1fr]">
      {/* Left panel — form controls */}
      <div className="lg:sticky lg:top-8 lg:self-start lg:max-w-[380px]">
        <section className="rounded-2xl bg-white p-6">
          <h2 className="text-lg font-semibold">Hizmet ve Tarih Seçimi</h2>
          <SlotPreviewForm
            services={services}
            veterinarians={veterinarians}
            rules={rules}
            initialService={initialService}
            initialVet={initialVet}
            initialDate={initialDate}
            loading={loading}
            onCalculate={handleCalculate}
          />
        </section>
      </div>

      {/* Right panel — results */}
      <div className="min-w-0">
        <section
          className="rounded-2xl bg-white p-6"
          aria-live="polite"
          aria-label="Uygun saat sonuçları"
        >
          <SlotPreviewResults
            result={result}
            calcDuration={calcDuration}
            selectedService={selectedService}
            loading={loading}
            rules={rules}
          />
        </section>
      </div>
    </div>
  );
}
