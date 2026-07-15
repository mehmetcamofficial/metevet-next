import { Breadcrumbs } from "@/src/components/shared/breadcrumbs";
import { Footer } from "@/src/components/layout/footer";
import { Navbar } from "@/src/components/layout/navbar";
import { SkipLink } from "@/src/components/shared/skip-link";
import { getRoutePath } from "@/src/lib/routes";
import { getPublicServices, getPublicVeterinarians, getPublicBookingRules } from "@/src/lib/public-booking/availability";
import { PublicBookingWizardClient } from "@/src/components/public-booking/wizard-client";
import type { Locale } from "@/types";

export async function PublicBookingWizardPage({ locale }: { locale: Locale }) {
  const isTurkish = locale === "tr";
  const title = isTurkish ? "Online Randevu" : "Online Appointment";

  // Fetch data server-side
  const [services, veterinarians, rules] = await Promise.all([
    getPublicServices(),
    getPublicVeterinarians(),
    getPublicBookingRules(),
  ]);

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#0D2922]">
      <SkipLink />
      <Navbar locale={locale} />
      <main id="main-content" className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs
            items={[
              { label: isTurkish ? "Ana Sayfa" : "Home", href: getRoutePath("home", locale) },
              { label: title },
            ]}
          />

          <header className="mt-8 mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">
              {isTurkish ? "Online Randevu Sistemi" : "Online Booking System"}
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#687A75]">
              {isTurkish
                ? "Hizmet seçin, uygun bir zaman dilimi belirleyin ve randevu talebinizi oluşturun."
                : "Select a service, choose an available time, and submit your appointment request."}
            </p>
          </header>

          <PublicBookingWizardClient
            locale={locale}
            services={services}
            veterinarians={veterinarians}
            rules={rules}
          />
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
