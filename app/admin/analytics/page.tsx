import Link from "next/link";
/* eslint-disable react-hooks/error-boundaries -- query failures are converted to a localized server response */
import { requireStaff } from "@/src/lib/auth/require-staff";
import { createClient } from "@/src/lib/supabase/server";
import { analyticsDateRange } from "@/src/lib/admin/analytics/date-range";
import { previousComparableRange } from "@/src/lib/admin/analytics/comparison-range";
import { appointmentAnalytics } from "@/src/lib/admin/analytics/appointment-analytics";
import { analyticsFilters } from "@/src/lib/admin/analytics/analytics-filters";
import { preventiveCareAnalytics } from "@/src/lib/admin/analytics/preventive-care-analytics";
import { operationsAnalytics } from "@/src/lib/admin/analytics/operations-analytics";
import { comparison } from "@/src/lib/admin/analytics/analytics-formatters";
import { operationalInsights } from "@/src/lib/admin/analytics/analytics-insights";
import {
  canConfigureDashboardRange,
  canExportAnalytics,
  canViewClinicalAnalytics,
} from "@/src/lib/admin/analytics/analytics-permissions";
import { DashboardFilters } from "@/src/components/admin/analytics/dashboard-filters";
import { MetricGrid } from "@/src/components/admin/analytics/metric-grid";
import { AnalyticsSection } from "@/src/components/admin/analytics/analytics-section";
import { BarChart } from "@/src/components/admin/analytics/bar-chart";
import { HeatmapChart } from "@/src/components/admin/analytics/heatmap-chart";
import { AlertList } from "@/src/components/admin/analytics/alert-list";
import { ExportButton } from "@/src/components/admin/analytics/export-button";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await requireStaff(),
    q = await searchParams,
    range = analyticsDateRange(q),
    previous = previousComparableRange(range),
    admin = session.profile.role === "admin",
    clinicalAllowed = canViewClinicalAnalytics(session.profile.role),
    filters = analyticsFilters(q, admin),
    s = await createClient();
  if (!s) return <p role="alert">Analitik veriler yüklenemedi.</p>;
  try {
    const [
      appointments,
      previousAppointments,
      clinical,
      operations,
      previousOperations,
      activeOwners,
      activePets,
      todayAppointments,
      personnel,
    ] = await Promise.all([
      appointmentAnalytics(s, range, filters),
      appointmentAnalytics(s, previous, filters),
      clinicalAllowed ? preventiveCareAnalytics(s, range) : null,
      clinicalAllowed ? operationsAnalytics(s, range) : null,
      clinicalAllowed ? operationsAnalytics(s, previous) : null,
      s
        .from("owners")
        .select("id", { count: "exact", head: true })
        .is("archived_at", null),
      s
        .from("pets")
        .select("id", { count: "exact", head: true })
        .is("archived_at", null),
      s
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .gte("starts_at", analyticsDateRange({ range: "today" }).start)
        .lt("starts_at", analyticsDateRange({ range: "today" }).end),
      admin
        ? s
            .from("profiles")
            .select("id,full_name")
            .eq("role", "veterinarian")
            .eq("status", "active")
            .limit(100)
        : Promise.resolve({ data: [] }),
    ]);
    const totalCmp = comparison(appointments.total, previousAppointments.total),
      examCmp = comparison(
        operations?.examinationsCreated ?? 0,
        previousOperations?.examinationsCreated ?? 0,
      ),
      docCmp = comparison(
        operations?.documentsGenerated ?? 0,
        previousOperations?.documentsGenerated ?? 0,
      ),
      metrics = [
        { label: "Bugünkü Randevular", value: todayAppointments.count ?? 0 },
        {
          label: "Dönem Randevuları",
          value: appointments.total,
          detail: totalCmp.label,
        },
        {
          label: "Tamamlanma Oranı",
          value: `%${appointments.completionRate}`,
          detail: previousAppointments.total
            ? `Önceki: %${previousAppointments.completionRate}`
            : "Karşılaştırma için yeterli veri yok",
        },
        {
          label: "İptal Oranı",
          value: `%${appointments.cancellationRate}`,
          detail: previousAppointments.total
            ? `Önceki: %${previousAppointments.cancellationRate}`
            : "Karşılaştırma için yeterli veri yok",
        },
        {
          label: "No-show Oranı",
          value: `%${appointments.noShowRate}`,
          detail: previousAppointments.total
            ? `Önceki: %${previousAppointments.noShowRate}`
            : "Karşılaştırma için yeterli veri yok",
        },
        { label: "Aktif Hayvan Sahipleri", value: activeOwners.count ?? 0 },
        { label: "Aktif Hayvanlar", value: activePets.count ?? 0 },
        ...(clinical && operations
          ? [
              {
                label: "Dönem Muayeneleri",
                value: operations.examinationsCreated,
                detail: examCmp.label,
              },
              { label: "Yaklaşan Aşılar", value: clinical.vaccinesDueSoon },
              { label: "Geciken Aşılar", value: clinical.vaccinesOverdue },
              { label: "Yaklaşan Parazit", value: clinical.parasitesDueSoon },
              { label: "Geciken Parazit", value: clinical.parasitesOverdue },
              {
                label: "Başarısız Hatırlatmalar",
                value: operations.failedReminders,
              },
              {
                label: "Üretilen Belgeler",
                value: operations.documentsGenerated,
                detail: docCmp.label,
              },
            ]
          : []),
      ];
    const insights = operationalInsights(
      {
        vaccinesDueSoon: clinical?.vaccinesDueSoon ?? 0,
        vaccinesOverdue: clinical?.vaccinesOverdue ?? 0,
        parasitesOverdue: clinical?.parasitesOverdue ?? 0,
        failedReminders: operations?.failedReminders ?? 0,
        oldDrafts: operations?.oldDrafts ?? 0,
        unassignedUpcoming: appointments.unassignedUpcoming,
        documentFailures: operations?.documentFailures ?? 0,
        noShowRate: appointments.noShowRate,
        previousNoShowRate: previousAppointments.noShowRate,
        weekdays: appointments.weekdays,
        hours: appointments.hours,
        sources: appointments.sources,
      },
      session.profile.role,
    );
    return (
      <>
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">
              Klinik Analitik ve İçgörü
            </h1>
            <p className="mt-2 text-[#526a64]">
              Gerçek Supabase verilerinden, operasyonel ve kişisel veri
              içermeyen özetler.
            </p>
          </div>
          {canExportAnalytics(session.profile.role) ? (
            <ExportButton
              href={`/admin/analytics/export/appointments?range=${range.preset}&from=${range.startDate}&to=${range.endDate}`}
            />
          ) : null}
        </div>
        <div className="mt-6">
          <DashboardFilters
            range={range}
            q={q}
            allowPersonnel={canConfigureDashboardRange(session.profile.role)}
            personnel={personnel.data ?? []}
          />
        </div>
        {appointments.truncated ? (
          <p role="status" className="mt-4 rounded bg-amber-50 p-3">
            Grafikler güvenli sorgu sınırı olan 5.000 kayıt üzerinden
            hesaplandı.
          </p>
        ) : null}
        <div className="mt-6">
          <MetricGrid items={metrics} />
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <AnalyticsSection title="Randevu Trendi">
            <BarChart
              title="Gün ve duruma göre randevular"
              data={appointments.trend}
            />
          </AnalyticsSection>
          <AnalyticsSection title="Randevu Durum Dağılımı">
            <BarChart title="Randevu durumları" data={appointments.statuses} />
          </AnalyticsSection>
          <AnalyticsSection title="Hizmet Dağılımı">
            <BarChart title="Hizmetler" data={appointments.services} />
          </AnalyticsSection>
          <AnalyticsSection title="Randevu Kaynakları">
            <BarChart title="Kaynaklar" data={appointments.sources} />
          </AnalyticsSection>
          {clinical ? (
            <AnalyticsSection title="Koruyucu Bakım">
              <BarChart
                title="Yaklaşan, geciken ve tamamlanan koruyucu bakım"
                data={{
                  "Yaklaşan aşı": clinical.vaccinesDueSoon,
                  "Geciken aşı": clinical.vaccinesOverdue,
                  "Tamamlanan aşı": clinical.vaccinesCompleted,
                  "Yaklaşan parazit": clinical.parasitesDueSoon,
                  "Geciken parazit": clinical.parasitesOverdue,
                  "Tamamlanan parazit": clinical.parasitesCompleted,
                }}
              />
            </AnalyticsSection>
          ) : null}
          {operations ? (
            <AnalyticsSection title="Hatırlatma Performansı">
              <BarChart
                title="Hatırlatma durumları"
                data={operations.reminderStatuses}
              />
            </AnalyticsSection>
          ) : null}
          {operations ? (
            <AnalyticsSection title="Klinik Aktivite Trendi">
              <BarChart
                title="Günlük yeni kayıt aktivitesi"
                data={operations.timeline}
              />
            </AnalyticsSection>
          ) : null}
          <AnalyticsSection title="Randevu Yoğunluk Haritası">
            <HeatmapChart data={appointments.heatmap} />
          </AnalyticsSection>
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <AnalyticsSection title="Eyleme Dönük İçgörüler">
            <AlertList
              items={insights.map((x) => ({
                label: `${x.label} — ${x.detail}`,
                count: x.count,
                href: x.href,
              }))}
            />
          </AnalyticsSection>
          <AnalyticsSection title="Yakın Dönem Aktivite Özeti">
            <ul className="space-y-2 text-sm">
              <li className="rounded border p-3">
                Randevu: <b>{appointments.total}</b>
              </li>
              {operations ? (
                <>
                  <li className="rounded border p-3">
                    Yeni hayvan sahibi: <b>{operations.newOwners}</b>
                  </li>
                  <li className="rounded border p-3">
                    Yeni hayvan: <b>{operations.newPets}</b>
                  </li>
                  <li className="rounded border p-3">
                    Muayene: <b>{operations.examinationsCreated}</b>
                  </li>
                </>
              ) : null}
            </ul>
            {admin ? (
              <Link href="/admin/audit-log" className="mt-4 inline-block underline">
                Yönetici audit geçmişine git
              </Link>
            ) : null}
          </AnalyticsSection>
        </div>
      </>
    );
  } catch {
    return (
      <p role="alert" className="rounded-xl bg-white p-6">
        Analitik veriler güvenli şekilde yüklenemedi.
      </p>
    );
  }
}
