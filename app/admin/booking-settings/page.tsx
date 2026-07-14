import { requireAdmin } from "@/src/lib/auth/require-admin";
import { createClient } from "@/src/lib/supabase/server";
import { AdminShell } from "@/src/components/admin/admin-shell";
import {
  countActiveServices,
  countOnlineBookableServices,
  countVeterinariansWithAvailability,
  countActiveVeterinarians,
  countUpcomingClosures,
  getBookingRules,
  getCurrentlyActiveClosures,
} from "@/src/lib/admin/booking/booking-readers";
import { closureTypeLabels, confirmationModeLabels } from "@/src/lib/admin/booking/booking-validation";
import Link from "next/link";

export default async function BookingSettingsPage() {
  const session = await requireAdmin();
  const s = await createClient();
  if (!s) return <p role="alert">Veri yüklenemedi.</p>;

  const [
    serviceCount,
    onlineCount,
    vetCount,
    vetWithAvailCount,
    closureCount,
    rulesResult,
    activeClosuresResult,
  ] = await Promise.all([
    countActiveServices(s),
    countOnlineBookableServices(s),
    countActiveVeterinarians(s),
    countVeterinariansWithAvailability(s),
    countUpcomingClosures(s),
    getBookingRules(s),
    getCurrentlyActiveClosures(s),
  ]);

  const rules = rulesResult.data;
  const activeClosures = activeClosuresResult.data ?? [];
  const vetsWithoutAvail = vetCount - vetWithAvailCount;

  const warnings: string[] = [];
  if (onlineCount === 0) warnings.push("Online randevuya uygun aktif hizmet yok.");
  if (vetsWithoutAvail > 0) warnings.push(`${vetsWithoutAvail} veteriner hekim uygunluk tanımı eksik.`);
  if (!rules) warnings.push("Rezervasyon kuralları tanımlanmamış.");
  if (activeClosures.length > 0) warnings.push("Klinik şu anda kapatma durumunda.");

  return (
    <AdminShell session={session}>
      <div>
        <h1 className="text-3xl font-semibold">Randevu Ayarları</h1>
        <p className="mt-2 text-[#526a64]">Online randevu sistemi yapılandırma ve yönetim.</p>
      </div>

      {warnings.length > 0 && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <h2 className="text-sm font-semibold text-amber-900">Uyarılar</h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6">
          <h2 className="text-xl font-semibold">Hizmetler</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div><dt className="text-xs font-semibold uppercase text-[#526a64]">Aktif Hizmetler</dt><dd className="text-2xl font-bold">{serviceCount}</dd></div>
            <div><dt className="text-xs font-semibold uppercase text-[#526a64]">Online Randevuya Uygun</dt><dd className="text-2xl font-bold">{onlineCount}</dd></div>
          </dl>
          {onlineCount === 0 && (
            <p className="mt-3 text-sm text-amber-700">Online randevuya uygun hizmet tanımlanmalı.</p>
          )}
          <Link
            href="/admin/booking-settings/services"
            className="mt-4 inline-block rounded-lg bg-[#0d2922] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cda85f]"
          >
            Hizmetleri Yönet
          </Link>
        </section>

        <section className="rounded-2xl bg-white p-6">
          <h2 className="text-xl font-semibold">Veteriner Uygunluğu</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div><dt className="text-xs font-semibold uppercase text-[#526a64]">Aktif Veteriner Hekim</dt><dd className="text-2xl font-bold">{vetCount}</dd></div>
            <div><dt className="text-xs font-semibold uppercase text-[#526a64]">Uygunluk Tanımlı</dt><dd className="text-2xl font-bold">{vetWithAvailCount}</dd></div>
            {vetsWithoutAvail > 0 && (
              <div><dt className="text-xs font-semibold uppercase text-amber-700">Eksik Tanım</dt><dd className="text-2xl font-bold text-amber-700">{vetsWithoutAvail}</dd></div>
            )}
          </dl>
          <Link
            href="/admin/booking-settings/availability"
            className="mt-4 inline-block rounded-lg bg-[#0d2922] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cda85f]"
          >
            Çalışma Saatlerini Yönet
          </Link>
        </section>

        <section className="rounded-2xl bg-white p-6">
          <h2 className="text-xl font-semibold">Klinik Kapatmaları</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div><dt className="text-xs font-semibold uppercase text-[#526a64]">Planli Kapatma</dt><dd className="text-2xl font-bold">{closureCount}</dd></div>
            {activeClosures.length > 0 && (
              <div>
                <dt className="text-xs font-semibold uppercase text-red-700">Aktif Kapatma</dt>
                <dd className="text-sm font-bold text-red-700">
                  {activeClosures.map((c) => `${c.title} (${closureTypeLabels[c.closure_type] ?? c.closure_type})`).join(", ")}
                </dd>
              </div>
            )}
          </dl>
          <Link
            href="/admin/booking-settings/closures"
            className="mt-4 inline-block rounded-lg bg-[#0d2922] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cda85f]"
          >
            Kapatmaları Yönet
          </Link>
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
          ) : (
            <p className="mt-3 text-sm text-amber-700">Kurallar tanımlanmamış.</p>
          )}
          <Link
            href="/admin/booking-settings/rules"
            className="mt-4 inline-block rounded-lg bg-[#0d2922] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cda85f]"
          >
            Kuralları Düzenle
          </Link>
        </section>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-6">
        <h2 className="text-xl font-semibold">Uygulama Planı</h2>
        <ul className="mt-3 space-y-2 text-sm text-[#526a64]">
          <li className="flex items-center gap-2"><span className="rounded bg-[#0d2922] px-2 py-0.5 text-xs text-white">3.1.1</span> Veri temeli ve migration — <strong>tamamlandı</strong></li>
          <li className="flex items-center gap-2"><span className="rounded bg-[#0d2922] px-2 py-0.5 text-xs text-white">3.1.2</span> Hizmet, uygunluk, kapatma ve kural düzenleme sayfaları — <strong>yayında</strong></li>
          <li className="flex items-center gap-2"><span className="rounded bg-[#526a64] px-2 py-0.5 text-xs text-white">3.1.3</span> Uygunluk motoru ve slot hesaplama</li>
          <li className="flex items-center gap-2"><span className="rounded bg-[#526a64] px-2 py-0.5 text-xs text-white">3.2</span> Public randevu wizard</li>
          <li className="flex items-center gap-2"><span className="rounded bg-[#526a64] px-2 py-0.5 text-xs text-white">3.3</span> Google Calendar entegrasyonu</li>
        </ul>
      </section>
    </AdminShell>
  );
}
