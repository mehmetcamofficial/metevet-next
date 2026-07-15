import { requireAdmin } from "@/src/lib/auth/require-admin";
import { createClient } from "@/src/lib/supabase/server";
import { AdminShell } from "@/src/components/admin/admin-shell";
import {
  countOnlineBookableServices,
  countActiveVeterinarians,
  countVeterinariansWithAvailability,
  getBookingRules,
  getClinicBusinessHours,
} from "@/src/lib/admin/booking/booking-readers";
import { validateTurnstileEnv } from "@/src/lib/public-booking/env-validator";
import Link from "next/link";

export default async function PublicBookingReadinessPage() {
  const session = await requireAdmin();
  const s = await createClient();
  if (!s) return <p role="alert">Veri yüklenemedi.</p>;

  const [
    onlineCount,
    vetCount,
    vetWithAvailCount,
    rulesResult,
    businessHoursResult,
  ] = await Promise.all([
    countOnlineBookableServices(s),
    countActiveVeterinarians(s),
    countVeterinariansWithAvailability(s),
    getBookingRules(s),
    getClinicBusinessHours(s),
  ]);

  const rules = rulesResult.data;
  const businessHours = businessHoursResult.data;
  const turnstileStatus = validateTurnstileEnv();

  const hasRules = Boolean(rules);
  const hasBusinessHours = Boolean(businessHours);

  const turnstileLabel = !turnstileStatus.ok
    ? "Yapılandırma eksik"
    : turnstileStatus.enabled
      ? "Etkin ve yapılandırıldı"
      : "Devre dışı";

  const warnings: string[] = [];
  if (onlineCount === 0) warnings.push("Online randevuya uygun aktif hizmet yok.");
  if (vetCount === 0) warnings.push("Aktif veteriner hekim yok.");
  if (vetWithAvailCount === 0) warnings.push("Uygunluk tanımlı veteriner hekim yok.");
  if (!hasRules) warnings.push("Rezervasyon kuralları tanımlanmamış.");
  if (!hasBusinessHours) warnings.push("Klinik çalışma saatleri tanımlanmamış.");
  if (!turnstileStatus.ok) warnings.push("Turnstile yapılandırması eksik veya hatalı.");

  const isReady =
    onlineCount > 0 &&
    vetCount > 0 &&
    vetWithAvailCount > 0 &&
    hasRules &&
    hasBusinessHours &&
    turnstileStatus.ok;

  return (
    <AdminShell session={session}>
      <div>
        <h1 className="text-3xl font-semibold">Public Randevu Hazırlık Durumu</h1>
        <p className="mt-2 text-[#526a64]">Online randevu sisteminin public kullanıma hazırlık durumunu gösterir.</p>
      </div>

      <div className="mt-6">
        <div
          className={`rounded-2xl p-6 ${
            isReady
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <h2
            className={`text-xl font-semibold ${
              isReady ? "text-green-900" : "text-red-900"
            }`}
          >
            Genel Durum: {isReady ? "Hazır" : "Hazır Değil"}
          </h2>
          <p
            className={`mt-2 text-sm ${
              isReady ? "text-green-800" : "text-red-800"
            }`}
          >
            {isReady
              ? "Tüm gereksinimler karşılandı. Public randevu sistemi kullanılabilir."
              : "Eksik yapılandırmalar var. Lütfen aşağıdaki uyarıları inceleyin."}
          </p>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <h2 className="text-sm font-semibold text-amber-900">Kurulum Uyarıları</h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6">
          <h2 className="text-xl font-semibold">Hizmet Durumu</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase text-[#526a64]">
                Online Randevuya Uygun Hizmet
              </dt>
              <dd className="text-2xl font-bold">{onlineCount}</dd>
            </div>
          </dl>
          {onlineCount === 0 && (
            <p className="mt-3 text-sm text-amber-700">
              Online randevuya uygun hizmet tanımlanmalı.
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6">
          <h2 className="text-xl font-semibold">Veteriner Hekim Durumu</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase text-[#526a64]">
                Aktif Veteriner Hekim
              </dt>
              <dd className="text-2xl font-bold">{vetCount}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#526a64]">
                Uygunluk Tanımı Yapılmış
              </dt>
              <dd className="text-2xl font-bold">{vetWithAvailCount}</dd>
            </div>
          </dl>
          {vetWithAvailCount === 0 && (
            <p className="mt-3 text-sm text-amber-700">
              En az bir veteriner hekim için uygunluk tanımlanmalı.
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6">
          <h2 className="text-xl font-semibold">Yapılandırma Durumu</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase text-[#526a64]">
                Rezervasyon Kuralları
              </dt>
              <dd className="text-2xl font-bold">{hasRules ? "Evet" : "Hayır"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#526a64]">
                Klinik Çalışma Saatleri
              </dt>
              <dd className="text-2xl font-bold">{hasBusinessHours ? "Evet" : "Hayır"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#526a64]">
                Turnstile Durumu
              </dt>
              <dd className="text-2xl font-bold">{turnstileLabel}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl bg-white p-6">
          <h2 className="text-xl font-semibold">Migration Durumu</h2>
          <p className="mt-3 text-sm text-[#526a64]">
            Migration durumu güvenli şekilde tespit edilemiyor.
          </p>
          <p className="mt-2 text-sm text-[#526a64]">
            <code className="rounded bg-gray-100 px-2 py-1 text-xs">supabase migration list</code>{" "}
            komutu ile doğrulayın.
          </p>
        </section>
      </div>

      <div className="mt-6">
        <Link
          href="/admin/booking-settings"
          className="inline-block rounded-lg bg-[#0d2922] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cda85f]"
        >
          Randevu Ayarlarına Dön
        </Link>
      </div>
    </AdminShell>
  );
}
