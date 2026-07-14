import { requireAdmin } from "@/src/lib/auth/require-admin";
import { createClient } from "@/src/lib/supabase/server";
import { AdminShell } from "@/src/components/admin/admin-shell";
import {
  getOnlineBookableServices,
  getActiveVeterinarians,
  getBookingRules,
} from "@/src/lib/admin/booking/booking-readers";
import { SlotPreviewPageClient } from "@/src/components/admin/booking/slot-preview-page-client";
import Link from "next/link";

export default async function SlotPreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await requireAdmin();
  const params = await searchParams;
  const s = await createClient();
  if (!s) return <p role="alert">Veri yüklenemedi.</p>;

  const [servicesResult, vetsResult, rulesResult] = await Promise.all([
    getOnlineBookableServices(s),
    getActiveVeterinarians(s),
    getBookingRules(s),
  ]);

  const services = (servicesResult.data ?? []).map((s) => ({
    id: s.id,
    name_tr: s.name_tr,
    duration_minutes: s.duration_minutes,
  }));
  const vets = vetsResult.data ?? [];
  const rulesRaw = rulesResult.data;
  const rules = rulesRaw
    ? {
        minimumNoticeMinutes: rulesRaw.minimum_notice_minutes,
        maximumAdvanceDays: rulesRaw.maximum_advance_days,
        slotIntervalMinutes: rulesRaw.slot_interval_minutes,
        defaultConfirmationMode: rulesRaw.default_confirmation_mode,
      }
    : null;

  return (
    <AdminShell session={session}>
      <nav className="mb-4 text-sm text-[#526a64]" aria-label="Breadcrumb">
        <Link href="/admin/booking-settings" className="hover:text-[#0d2922]">
          Randevu Ayarları
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#0d2922]">Uygun Saat Önizleme</span>
      </nav>

      <div>
        <h1 className="text-3xl font-semibold">Uygun Saatleri Önizle</h1>
        <p className="mt-2 text-[#526a64]">
          Seçilen hizmet ve tarih için uygun randevu saatlerini görüntüleyin. Bu ekran yalnızca önizleme amaçlıdır; saat seçimi rezervasyon oluşturmaz.
        </p>
      </div>

      <SlotPreviewPageClient
        services={services}
        veterinarians={vets}
        rules={rules}
        initialService={params.serviceId || ""}
        initialVet={params.veterinarianId || ""}
        initialDate={params.date || ""}
      />
    </AdminShell>
  );
}
