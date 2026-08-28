"use client";

import Link from "next/link";
import type { ClinicalAlert } from "@/src/lib/admin/clinical-alerts/clinical-alert-types";
import { SEVERITY_LABELS, SEVERITY_ICONS } from "@/src/lib/admin/clinical-alerts/clinical-alert-types";

function formatDueDate(dueAt: string | null | undefined): string {
  if (!dueAt) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(dueAt));
}

export function ClinicalAlertCard({ alert }: { alert: ClinicalAlert }) {
  return (
    <article className="rounded-xl border border-[#D1DBD5] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden="true">
            {SEVERITY_ICONS[alert.severity]}
          </span>
          <div>
            <h3 className="font-semibold">
              <span className="sr-only">{SEVERITY_LABELS[alert.severity]}: </span>
              {alert.title}
            </h3>
            <p className="mt-1 text-sm text-[#526a64]">{alert.description}</p>
            {alert.dueAt && (
              <p className="mt-1 text-xs text-[#526a64]">
                {alert.isOverdue ? "Gecikmiş: " : "Tarih: "}
                {formatDueDate(alert.dueAt)}
              </p>
            )}
          </div>
        </div>
        {alert.sourceRoute && (
          <Link
            href={alert.sourceRoute}
            className="shrink-0 rounded-lg border border-[#0d2922] px-3 py-1.5 text-sm font-medium text-[#0d2922] hover:bg-[#f4f0e8]"
          >
            {alert.actionLabel ?? "Detay"}
          </Link>
        )}
      </div>
    </article>
  );
}
