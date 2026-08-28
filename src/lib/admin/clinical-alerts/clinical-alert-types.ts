/**
 * Clinical Alert Types
 *
 * Normalized alert model for preventive care and operational alerts.
 * No PII, no diagnosis, no treatment details.
 */

export type ClinicalAlertSeverity = "info" | "attention" | "warning" | "critical";

export type ClinicalAlertCategory =
  | "vaccination"
  | "parasite"
  | "reminder"
  | "appointment"
  | "examination"
  | "pet_record"
  | "weight";

export type ClinicalAlert = {
  id: string;
  petId: string;
  category: ClinicalAlertCategory;
  severity: ClinicalAlertSeverity;
  title: string;
  description: string;
  occurredAt?: string | null;
  dueAt?: string | null;
  sourceType: string;
  sourceId?: string | null;
  sourceRoute?: string | null;
  actionLabel?: string | null;
  isOverdue: boolean;
  daysOverdue?: number | null;
  daysUntilDue?: number | null;
};

export const SEVERITY_ORDER: Record<ClinicalAlertSeverity, number> = {
  critical: 0,
  warning: 1,
  attention: 2,
  info: 3,
};

export const SEVERITY_LABELS: Record<ClinicalAlertSeverity, string> = {
  critical: "Öncelikli",
  warning: "Uyarı",
  attention: "Dikkat",
  info: "Bilgi",
};

export const SEVERITY_ICONS: Record<ClinicalAlertSeverity, string> = {
  critical: "🔴",
  warning: "🟠",
  attention: "🟡",
  info: "🔵",
};
