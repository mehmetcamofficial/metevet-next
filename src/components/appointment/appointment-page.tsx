import { Breadcrumbs } from "@/src/components/shared/breadcrumbs";
import { AppointmentForm } from "@/src/components/appointment/appointment-form";
import { Footer } from "@/src/components/layout/footer";
import { Navbar } from "@/src/components/layout/navbar";
import { SkipLink } from "@/src/components/shared/skip-link";
import { services } from "@/src/data/services";
import { getRoutePath } from "@/src/lib/routes";
import type { Locale } from "@/types";

function getTomorrowInIstanbul() {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(tomorrow);
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${value.year}-${value.month}-${value.day}`;
}

export function AppointmentPage({ locale }: { locale: Locale }) {
  const isTurkish = locale === "tr";
  const title = isTurkish ? "Randevu Talebi Oluştur" : "Request an Appointment";
  const serviceOptions = services.map((service) => ({
    value: service.icon,
    label: isTurkish ? service.title : (service.titleEn ?? service.title),
  }));

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#0D2922]">
      <SkipLink />
      <Navbar locale={locale} />
      <main id="main-content" className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs items={[
            { label: isTurkish ? "Ana Sayfa" : "Home", href: getRoutePath("home", locale) },
            { label: title },
          ]} />

          <header className="mt-8 rounded-[2rem] border border-[#0D2922]/10 bg-white p-8 shadow-[0_20px_60px_rgba(13,41,34,0.08)] lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{isTurkish ? "Randevu Talebi" : "Appointment Request"}</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">{title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#687A75]">
              {isTurkish
                ? "Bilgileri doldurun; talebinizi WhatsApp üzerinden kliniğe iletmeniz için hazır bir mesaj oluşturalım."
                : "Complete the details and we will prepare a WhatsApp message for you to send to the clinic."}
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6F531C]">
              {isTurkish
                ? "Talep edilen tarih ve zaman kesin değildir. Randevu yalnızca klinik teyidinden sonra kesinleşir."
                : "The requested date and time are not final. The appointment becomes final only after clinic confirmation."}
            </p>
          </header>

          <div className="mt-8">
            <AppointmentForm
              locale={locale}
              minimumDate={getTomorrowInIstanbul()}
              serviceOptions={serviceOptions}
            />
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
