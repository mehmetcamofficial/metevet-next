import { requireAdmin } from "@/src/lib/auth/require-admin";
import { createClient } from "@/src/lib/supabase/server";
import { AdminShell } from "@/src/components/admin/admin-shell";
import {
  countActiveServices,
  countVeterinariansWithAvailability,
  countUpcomingClosures,
  getBookingRules,
} from "@/src/lib/admin/booking/booking-readers";
import { confirmationModeLabels } from "@/src/lib/admin/booking/booking-validation";

export default async function BookingSettingsPage() {
  const session = await requireAdmin();
  const s = await createClient();
  if (!s) return <p role="alert">Veri yüklenemedi.</p>;

  const [serviceCount, vetCount, closureCount, rulesResult] = await Promise.all([
    countActiveServices(s),
    countVeterinariansWithAvailability(s),
    countUpcomingClosures(s),
    getBookingRules(s),
  ]);

  const rules = rulesResult.data;

  return (
    <AdminShell session={session}>
      <div>
        <h1 className="text-3xl font-semibold">Randevu Ayarları</h1>
        <p className="mt-2 text-[#526a64]">Online randevu sistemi veri temeli ve yapılandırma.</p>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6">
          <h2 className="text-xl font-semibold">Hizmetler</h2>
          <p className="mt-3 text-2xl font-bold">{serviceCount}</p>
          <p className="text-sm text-[#526a64]">Aktif randevu hizmeti</p>
          <div className="mt-4 rounded-lg bg-[#f4f0e8] p-4 text-sm text-[#526a64]">
            <strong>Sonraki adım:</strong> Hizmet ekleme ve düzenleme sayfası (Phase 3.1.2)
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6">
          <h2 className="text-xl font-semibold">Veteriner Uygunluğu</h2>
          <p className="mt-3 text-2xl font-bold">{vetCount}</p>
          <p className="text-sm text-[#526a64]">Uygunluk tanımlı veteriner hekim</p>
          <div className="mt-4 rounded-lg bg-[#f4f0e8] p-4 text-sm text-[#526a64]">
            <strong>Sonraki adım:</strong> Veteriner haftalık uygunluk düzenleme (Phase 3.1.2)
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6">
          <h2 className="text-xl font-semibold">Klinik Kapatmaları</h2>
          <p className="mt-3 text-2xl font-bold">{closureCount}</p>
          <p className="text-sm text-[#526a64]">Planlı kapatma ve izin</p>
          <div className="mt-4 rounded-lg bg-[#f4f0e8] p-4 text-sm text-[#526a64]">
            <strong>Sonraki adım:</strong> Kapatma ekleme ve düzenleme sayfası (Phase 3.1.2)
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6">
          <h2 className="text-xl font-semibold">Rezervasyon Kuralları</h2>
          {rules ? (
            <dl className="mt-3 grid gap-3 text-sm">
              <div><dt className="text-xs font-semibold uppercase text-[#526a64]">Minimum Bildirim</dt><dd>{rules.minimum_notice_minutes} dakika</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-[#526a64]">Maksimum Ön Rezervasyon</dt><dd>{rules.maximum_advance_days} gün</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-[#526a64]">Slot Aralığı</dt><dd>{rules.slot_interval_minutes} dakika</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-[#526a64]">Onay Modu</dt><dd>{confirmationModeLabels[rules.default_confirmation_mode]}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-[#526a64]">Aynı Gün Randevu</dt><dd>{rules.allow_same_day_booking ? "Evet" : "Hayır"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-[#526a64]">İptal Bildirimi</dt><dd>{rules.cancellation_notice_minutes} dakika</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-[#526a64]">İlk Uygun Veteriner</dt><dd>{rules.allow_first_available_veterinarian ? "Evet" : "Hayır"}</dd></div>
            </dl>
          ) : <p className="mt-3 text-sm text-[#526a64]">Kurallar yüklenemedi.</p>}
          <div className="mt-4 rounded-lg bg-[#f4f0e8] p-4 text-sm text-[#526a64]">
            <strong>Sonraki adım:</strong> Kural düzenleme sayfası (Phase 3.1.2)
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-6">
        <h2 className="text-xl font-semibold">Uygulama Planı</h2>
        <ul className="mt-3 space-y-2 text-sm text-[#526a64]">
          <li className="flex items-center gap-2"><span className="rounded bg-[#0d2922] px-2 py-0.5 text-xs text-white">3.1.1</span> Veri temeli ve migration — <strong>tamamlandı</strong></li>
          <li className="flex items-center gap-2"><span className="rounded bg-[#526a64] px-2 py-0.5 text-xs text-white">3.1.2</span> Hizmet, uygunluk, kapatma ve kural düzenleme sayfaları</li>
          <li className="flex items-center gap-2"><span className="rounded bg-[#526a64] px-2 py-0.5 text-xs text-white">3.1.3</span> Uygunluk motoru ve slot hesaplama</li>
          <li className="flex items-center gap-2"><span className="rounded bg-[#526a64] px-2 py-0.5 text-xs text-white">3.2</span> Public randevu wizard</li>
          <li className="flex items-center gap-2"><span className="rounded bg-[#526a64] px-2 py-0.5 text-xs text-white">3.3</span> Google Calendar entegrasyonu</li>
        </ul>
      </section>
    </AdminShell>
  );
}
