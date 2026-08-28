import type { ClinicalAlert, ClinicalAlertSeverity } from "./clinical-alert-types";
import type { PreventiveRecord, ReminderRecord, AppointmentRecord } from "./clinical-alert-readers";

/**
 * Clinical Alert Engine
 *
 * Pure functions for deriving clinical alerts from existing data.
 * No Supabase queries, no side effects.
 */

function getIstanbulToday(): Date {
  const now = new Date();
  const istanbulStr = now.toLocaleString("en-CA", { timeZone: "Europe/Istanbul" });
  return new Date(istanbulStr);
}

function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((date2.getTime() - date1.getTime()) / msPerDay);
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toISOString().slice(0, 10) === date2.toISOString().slice(0, 10);
}

export function deriveVaccinationAlerts(
  vaccinations: PreventiveRecord[],
  today: Date,
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  for (const vac of vaccinations) {
    if (!vac.next_due_date) continue;

    const dueDate = new Date(vac.next_due_date);
    const daysUntilDue = daysBetween(today, dueDate);

    let severity: ClinicalAlertSeverity;
    let title: string;
    let description: string;
    let isOverdue = false;
    let daysOverdue: number | null = null;

    if (daysUntilDue < -30) {
      severity = "critical";
      title = "Aşı gecikmiş";
      description = "30 günden fazla gecikmiş";
      isOverdue = true;
      daysOverdue = Math.abs(daysUntilDue);
    } else if (daysUntilDue < 0) {
      severity = "warning";
      title = "Aşı gecikmiş";
      description = `${Math.abs(daysUntilDue)} gün gecikmiş`;
      isOverdue = true;
      daysOverdue = Math.abs(daysUntilDue);
    } else if (daysUntilDue === 0) {
      severity = "attention";
      title = "Aşı zamanı";
      description = "Bugün";
    } else if (daysUntilDue <= 7) {
      severity = "attention";
      title = "Aşı yaklaşıyor";
      description = `${daysUntilDue} gün içinde`;
    } else if (daysUntilDue <= 30) {
      severity = "info";
      title = "Aşı planlı";
      description = `${daysUntilDue} gün içinde`;
    } else {
      continue;
    }

    alerts.push({
      id: `vaccination:${vac.id}`,
      petId: vac.pet_id,
      category: "vaccination",
      severity,
      title,
      description,
      dueAt: vac.next_due_date,
      sourceType: "vaccination_records",
      sourceId: vac.id,
      sourceRoute: `/admin/vaccines/${vac.id}`,
      actionLabel: "Aşı Kaydı",
      isOverdue,
      daysOverdue,
      daysUntilDue: daysUntilDue > 0 ? daysUntilDue : null,
    });
  }

  return alerts;
}

export function deriveParasiteAlerts(
  parasiteRecords: PreventiveRecord[],
  today: Date,
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  for (const par of parasiteRecords) {
    if (!par.next_due_date) continue;

    const dueDate = new Date(par.next_due_date);
    const daysUntilDue = daysBetween(today, dueDate);

    let severity: ClinicalAlertSeverity;
    let title: string;
    let description: string;
    let isOverdue = false;
    let daysOverdue: number | null = null;

    if (daysUntilDue < -30) {
      severity = "critical";
      title = "Parazit tedavisi gecikmiş";
      description = "30 günden fazla gecikmiş";
      isOverdue = true;
      daysOverdue = Math.abs(daysUntilDue);
    } else if (daysUntilDue < 0) {
      severity = "warning";
      title = "Parazit tedavisi gecikmiş";
      description = `${Math.abs(daysUntilDue)} gün gecikmiş`;
      isOverdue = true;
      daysOverdue = Math.abs(daysUntilDue);
    } else if (daysUntilDue === 0) {
      severity = "attention";
      title = "Parazit tedavisi zamanı";
      description = "Bugün";
    } else if (daysUntilDue <= 7) {
      severity = "attention";
      title = "Parazit tedavisi yaklaşıyor";
      description = `${daysUntilDue} gün içinde`;
    } else if (daysUntilDue <= 30) {
      severity = "info";
      title = "Parazit tedavisi planlı";
      description = `${daysUntilDue} gün içinde`;
    } else {
      continue;
    }

    alerts.push({
      id: `parasite:${par.id}`,
      petId: par.pet_id,
      category: "parasite",
      severity,
      title,
      description,
      dueAt: par.next_due_date,
      sourceType: "parasite_records",
      sourceId: par.id,
      sourceRoute: `/admin/parasites/${par.id}`,
      actionLabel: "Parazit Kaydı",
      isOverdue,
      daysOverdue,
      daysUntilDue: daysUntilDue > 0 ? daysUntilDue : null,
    });
  }

  return alerts;
}

export function deriveReminderAlerts(
  reminders: ReminderRecord[],
  today: Date,
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  for (const rem of reminders) {
    if (!rem.pet_id) continue;

    const scheduledDate = new Date(rem.scheduled_for);
    const daysUntilDue = daysBetween(today, scheduledDate);

    let severity: ClinicalAlertSeverity;
    let title: string;
    let description: string;
    let isOverdue = false;
    let daysOverdue: number | null = null;

    if (daysUntilDue < 0) {
      severity = "warning";
      title = "Hatırlatıcı gecikmiş";
      description = `${Math.abs(daysUntilDue)} gün gecikmiş`;
      isOverdue = true;
      daysOverdue = Math.abs(daysUntilDue);
    } else if (daysUntilDue === 0) {
      severity = "attention";
      title = "Hatırlatıcı bugün";
      description = "Bugün";
    } else if (daysUntilDue <= 7) {
      severity = "info";
      title = "Hatırlatıcı yaklaşıyor";
      description = `${daysUntilDue} gün içinde`;
    } else {
      continue;
    }

    alerts.push({
      id: `reminder:${rem.id}`,
      petId: rem.pet_id,
      category: "reminder",
      severity,
      title,
      description,
      dueAt: rem.scheduled_for,
      sourceType: "reminders",
      sourceId: rem.id,
      sourceRoute: `/admin/reminders/${rem.id}`,
      actionLabel: "Hatırlatıcı",
      isOverdue,
      daysOverdue,
      daysUntilDue: daysUntilDue > 0 ? daysUntilDue : null,
    });
  }

  return alerts;
}

export function deriveAppointmentAlerts(
  appointments: AppointmentRecord[],
  today: Date,
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  for (const appt of appointments) {
    const apptDate = new Date(appt.starts_at);

    if (isSameDay(apptDate, today)) {
      alerts.push({
        id: `appointment:${appt.id}`,
        petId: appt.pet_id,
        category: "appointment",
        severity: "attention",
        title: "Randevu bugün",
        description: new Intl.DateTimeFormat("tr-TR", { timeStyle: "short" }).format(apptDate),
        occurredAt: appt.starts_at,
        sourceType: "appointments",
        sourceId: appt.id,
        sourceRoute: `/admin/appointments/${appt.id}`,
        actionLabel: "Randevu",
        isOverdue: false,
      });
    }
  }

  return alerts;
}

export function sortAlerts(alerts: ClinicalAlert[]): ClinicalAlert[] {
  return [...alerts].sort((a, b) => {
    // Severity first
    const severityOrder = { critical: 0, warning: 1, attention: 2, info: 3 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }

    // Overdue first
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;

    // Nearest due date
    if (a.dueAt && b.dueAt) {
      const dateCompare = new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      if (dateCompare !== 0) return dateCompare;
    }

    // Deterministic fallback
    return a.id.localeCompare(b.id);
  });
}

export function deriveAllAlerts(
  vaccinations: PreventiveRecord[],
  parasiteRecords: PreventiveRecord[],
  reminders: ReminderRecord[],
  appointments: AppointmentRecord[],
): ClinicalAlert[] {
  const today = getIstanbulToday();

  const allAlerts = [
    ...deriveVaccinationAlerts(vaccinations, today),
    ...deriveParasiteAlerts(parasiteRecords, today),
    ...deriveReminderAlerts(reminders, today),
    ...deriveAppointmentAlerts(appointments, today),
  ];

  return sortAlerts(allAlerts);
}
