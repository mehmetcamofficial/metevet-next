"use client";

import type { ClinicalAlert } from "@/src/lib/admin/clinical-alerts/clinical-alert-types";
import { ClinicalAlertCard } from "./clinical-alert-card";

export function ClinicalAlertsPanel({
  alerts,
  maxVisible = 5,
}: {
  alerts: ClinicalAlert[];
  maxVisible?: number;
}) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-xl bg-[#f4f0e8] p-4 text-center text-sm text-[#526a64]">
        Şu anda uyarı bulunmuyor.
      </div>
    );
  }

  const visibleAlerts = alerts.slice(0, maxVisible);
  const hiddenCount = alerts.length - maxVisible;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Klinik Uyarıları ({alerts.length})</h2>
      <div className="space-y-2">
        {visibleAlerts.map((alert) => (
          <ClinicalAlertCard key={alert.id} alert={alert} />
        ))}
      </div>
      {hiddenCount > 0 && (
        <p className="text-center text-sm text-[#526a64]">
          ve {hiddenCount} uyarı daha...
        </p>
      )}
    </div>
  );
}
