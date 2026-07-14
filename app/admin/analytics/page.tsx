import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";
import { analyticsDateRange } from "@/src/lib/admin/analytics/date-range";
import { appointmentAnalytics } from "@/src/lib/admin/analytics/appointment-analytics";
import { preventiveCareAnalytics } from "@/src/lib/admin/analytics/preventive-care-analytics";
import { operationsAnalytics } from "@/src/lib/admin/analytics/operations-analytics";
import { canConfigureDashboardRange, canExportAnalytics, canViewClinicalAnalytics } from "@/src/lib/admin/analytics/analytics-permissions";
import { DateRangeFilter } from "@/src/components/admin/analytics/date-range-filter";
import { MetricGrid } from "@/src/components/admin/analytics/metric-grid";
import { AnalyticsSection } from "@/src/components/admin/analytics/analytics-section";
import { DonutChart } from "@/src/components/admin/analytics/donut-chart";
import { ExportButton } from "@/src/components/admin/analytics/export-button";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const session = await requireStaff(); const range = analyticsDateRange(await searchParams); const s = await createClient();
  if (!s) return <p role="alert">Analitik veriler yüklenemedi.</p>;
  let appointments: Awaited<ReturnType<typeof appointmentAnalytics>>;
  let clinical: [Awaited<ReturnType<typeof preventiveCareAnalytics>>, Awaited<ReturnType<typeof operationsAnalytics>>] | null = null;
  try {
    appointments = await appointmentAnalytics(s, range);
    if (canViewClinicalAnalytics(session.profile.role)) clinical = await Promise.all([preventiveCareAnalytics(s, range), operationsAnalytics(s, range)]);
  } catch { return <p role="alert" className="rounded-xl bg-white p-6">Analitik veriler güvenli şekilde yüklenemedi.</p>; }
  const metrics = [{label:"Toplam Randevu",value:appointments.total},{label:"Tamamlanma Oranı",value:`%${appointments.completionRate}`},{label:"İptal Oranı",value:`%${appointments.cancellationRate}`},{label:"No-show Oranı",value:`%${appointments.noShowRate}`},...(clinical?[{label:"Yaklaşan Koruyucu Bakım",value:clinical[0].upcomingWorkload},{label:"Başarısız Hatırlatma",value:clinical[1].failedReminders},{label:"Oluşturulan Belge",value:clinical[1].documentsGenerated},{label:"Eski Taslak Muayene",value:clinical[1].oldDrafts}]:[])];
  return <><div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-3xl font-semibold">Analitik</h1><p className="mt-2 text-[#526a64]">Gerçek klinik operasyon verilerinin özeti.</p></div>{canExportAnalytics(session.profile.role)?<ExportButton href={`/admin/analytics/export/appointments?range=${range.preset}&from=${range.startDate}&to=${range.endDate}`}/>:null}</div><div className="mt-6"><DateRangeFilter range={range} allowCustom={canConfigureDashboardRange(session.profile.role)}/></div><div className="mt-6"><MetricGrid items={metrics}/></div><div className="mt-6 grid gap-6 lg:grid-cols-3"><AnalyticsSection title="Tamamlanma"><DonutChart label="Randevu tamamlanma oranı" value={appointments.completionRate}/></AnalyticsSection><AnalyticsSection title="İptal"><DonutChart label="Randevu iptal oranı" value={appointments.cancellationRate}/></AnalyticsSection><AnalyticsSection title="No-show"><DonutChart label="Randevuya gelmeme oranı" value={appointments.noShowRate}/></AnalyticsSection></div></>;
}
