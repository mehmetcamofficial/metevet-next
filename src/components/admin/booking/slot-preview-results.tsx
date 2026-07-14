"use client";

import type { EngineResponse } from "@/src/lib/admin/booking/availability-engine";

type Service = { id: string; name_tr: string; duration_minutes: number };
type RulesDisplay = {
  minimumNoticeMinutes: number;
  maximumAdvanceDays: number;
  slotIntervalMinutes: number;
  defaultConfirmationMode: string;
};

/**
 * Format a YYYY-MM-DD date into Turkish display format.
 */
function formatTurkishDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00.000Z`);
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(d);
}

export function SlotPreviewResults({
  result,
  calcDuration,
  selectedService,
  loading,
  rules,
}: {
  result: EngineResponse | null;
  calcDuration: number | null;
  selectedService: Service | null;
  loading: boolean;
  rules: RulesDisplay | null;
}) {
  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#526a64]">
        <svg
          className="mr-3 h-5 w-5 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Uygun saatler hesaplanıyor…</span>
      </div>
    );
  }

  // ── Pre-calculation empty state ──
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-[#526a64]">
        <span className="mb-3 text-4xl">📋</span>
        <h3 className="text-base font-semibold">Uygun Saat Önizleme</h3>
        <p className="mt-2 max-w-sm text-sm">
          Bir hizmet, veteriner ve tarih seçerek uygun saatleri hesaplayın.
        </p>
      </div>
    );
  }

  // ── Error state ──
  if ("reason" in result) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700" role="alert">
        <span className="font-semibold">Hata: </span>
        {result.reason}
      </div>
    );
  }

  // ── Success: has result ──
  const totalSlots = result.veterinarians.reduce((sum, v) => sum + v.slots.length, 0);
  const formattedDate = formatTurkishDate(result.date);

  // Determine vet display string
  const vetDisplay =
    result.veterinarians.length > 1
      ? "İlk uygun veteriner"
      : result.veterinarians.length === 1
        ? result.veterinarians[0].fullName
        : "";

  return (
    <div className="space-y-5">
      {/* Preview warning */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Önemli:</strong> Bu ekran yalnızca uygunluk önizlemesidir. Gösterilen saatler rezervasyon oluşturmaz ve kesin müsaitlik garantisi değildir.
      </div>

      {/* Result header */}
      <div>
        <h3 className="text-lg font-semibold">
          {selectedService?.name_tr || result.service.id} · {result.service.durationMinutes} dk
        </h3>
        <p className="mt-1 text-sm text-[#526a64]">
          {formattedDate} · Europe/Istanbul
        </p>
        <p className="text-sm text-[#526a64]">{vetDisplay}</p>
        <p className="mt-1 text-xs text-[#526a64]">
          {totalSlots > 0 ? (
            <>{totalSlots} uygun saat · {calcDuration != null ? `${calcDuration} ms` : ""}</>
          ) : (
            "Uygun saat bulunamadı"
          )}
        </p>
      </div>

      {/* Diagnostic cards */}
      <DiagnosticSummary
        rules={rules}
        result={result}
      />

      {/* No-slot empty state */}
      {totalSlots === 0 && (
        <NoSlotsMessage result={result} />
      )}

      {/* Slot grid */}
      {totalSlots > 0 && (
        <SlotPreviewGrid result={result} />
      )}
    </div>
  );
}

function DiagnosticSummary({
  rules,
  result,
}: {
  rules: RulesDisplay | null;
  result: NonNullable<Extract<EngineResponse, { veterinarians: unknown[] }>>;
}) {
  const diags: Array<{ label: string; value: string | number }> = [];

  if (result.service.durationMinutes) {
    diags.push({ label: "Hizmet süresi", value: `${result.service.durationMinutes} dk` });
  }
  if (result.service.bufferBeforeMinutes > 0) {
    diags.push({ label: "Buffer (başlangıç)", value: `${result.service.bufferBeforeMinutes} dk` });
  }
  if (result.service.bufferAfterMinutes > 0) {
    diags.push({ label: "Buffer (bitiş)", value: `${result.service.bufferAfterMinutes} dk` });
  }
  if (rules) {
    diags.push({ label: "Slot aralığı", value: `${rules.slotIntervalMinutes} dk` });
    diags.push({ label: "Minimum bildirim", value: `${rules.minimumNoticeMinutes} dk` });
  }

  if (diags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {diags.map((d) => (
        <span
          key={d.label}
          className="inline-flex items-center gap-1 rounded-full bg-[#f4f0e8] px-3 py-1 text-xs text-[#526a64]"
        >
          <span className="font-medium">{d.label}:</span> {d.value}
        </span>
      ))}
    </div>
  );
}

function NoSlotsMessage({ result }: { result: NonNullable<Extract<EngineResponse, { veterinarians: unknown[] }>> }) {
  // Decide on a safe Turkish reason based on the engine result shape.
  // We don't have a specific reason from a slot-less result, but we can inspect
  // the veterinarians to give contextual hints.
  const allEmpty = result.veterinarians.every((v) => v.slots.length === 0);

  if (!allEmpty) {
    return (
      <p className="text-sm text-[#526a64]">
        Bazı veterinerler için uygun saat bulunamadı.
      </p>
    );
  }

  // General "no slots" with possible reasons
  return (
    <div className="rounded-lg border border-[#0d2922]/10 bg-[#f4f0e8] px-5 py-4 text-sm text-[#526a64]">
      <p className="font-medium">Seçilen tarihte uygun saat yok.</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
        <li>çalışma saati tanımlı değil</li>
        <li>klinik o gün kapalı</li>
        <li>veteriner izinli</li>
        <li>minimum bildirim süresi nedeniyle uygun saat yok</li>
        <li>seçilen tarih rezervasyon aralığı dışında</li>
      </ul>
    </div>
  );
}

function SlotPreviewGrid({ result }: { result: NonNullable<Extract<EngineResponse, { veterinarians: unknown[] }>> }) {
  return (
    <div className="space-y-6">
      {result.veterinarians.map((vet) => (
        <div key={vet.veterinarianId}>
          <h4 className="mb-2 text-sm font-semibold">{vet.fullName}</h4>
          <SlotTimeGrid slots={vet.slots} vetName={vet.fullName} />
        </div>
      ))}
    </div>
  );
}

type SlotDisplay = {
  startsAt: string;
  endsAt: string;
  displayTime: string;
  effectiveStart: string;
  effectiveEnd: string;
};

type TimeGroup = "sabah" | "ogle" | "ogleden-sonra";

function getTimeGroup(displayTime: string): TimeGroup {
  const [h] = displayTime.split(":").map(Number);
  if (h < 12) return "sabah";
  if (h < 14) return "ogle";
  return "ogleden-sonra";
}

const TIME_GROUP_LABELS: Record<TimeGroup, string> = {
  sabah: "Sabah",
  ogle: "Öğle",
  "ogleden-sonra": "Öğleden Sonra",
};

function SlotTimeGrid({ slots, vetName }: { slots: SlotDisplay[]; vetName: string }) {
  // Group slots by time period
  const groups: Record<TimeGroup, SlotDisplay[]> = {
    sabah: [],
    ogle: [],
    "ogleden-sonra": [],
  };

  for (const slot of slots) {
    groups[getTimeGroup(slot.displayTime)].push(slot);
  }

  const hasAnyGroup = Object.values(groups).some((g) => g.length > 0);
  if (!hasAnyGroup) return null;

  return (
    <div className="space-y-4">
      {(["sabah", "ogle", "ogleden-sonra"] as const).map((groupKey) => {
        const groupSlots = groups[groupKey];
        if (groupSlots.length === 0) return null;

        return (
          <div key={groupKey}>
            <h5 className="mb-2 text-xs font-medium uppercase tracking-wider text-[#526a64]">
              {TIME_GROUP_LABELS[groupKey]}
            </h5>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
              {groupSlots.map((slot) => (
                <button
                  key={slot.startsAt}
                  type="button"
                  disabled
                  className="min-h-[44px] cursor-default rounded-lg border border-[#0d2922]/15 bg-[#dde9e3]/55 px-2 py-2 text-center text-sm font-medium text-[#0d2922] focus-visible:outline-2 focus-visible:outline-[#cda85f] focus-visible:outline-offset-1"
                  aria-label={`${slot.displayTime} — ${vetName} — Önizleme`}
                  title={`${slot.displayTime} — Önizleme`}
                >
                  {slot.displayTime}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
