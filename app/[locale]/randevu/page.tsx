import { Navbar } from "@/src/components/layout/navbar";
import { Footer } from "@/src/components/layout/footer";
import { SkipLink } from "@/src/components/shared/skip-link";
import { Breadcrumbs } from "@/src/components/shared/breadcrumbs";
import { AppointmentForm } from "@/src/components/appointment/appointment-form";
import { getDictionary, isLocale } from "@/src/lib/i18n";
import { buildMetadata } from "@/src/lib/metadata";
import type { Locale } from "@/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const resolvedLocale = locale as Locale;
  const dict = getDictionary(resolvedLocale);

  return buildMetadata({
    locale: resolvedLocale,
    title: `${dict.appointmentPage.title} | MeteVet`,
    description: dict.appointmentPage.description,
    path: resolvedLocale === "tr" ? "/randevu" : "/appointment",
  });
}

export default async function AppointmentRoutePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const resolvedLocale = locale as Locale;
  const dict = getDictionary(resolvedLocale);

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#0D2922]">
      <SkipLink />
      <Navbar locale={resolvedLocale} />
      <main id="main-content" className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs items={[{ label: resolvedLocale === "tr" ? "Ana Sayfa" : "Home", href: resolvedLocale === "tr" ? "/tr" : "/en" }, { label: dict.appointmentPage.title }]} />
          <div className="mt-8 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[2rem] border border-[#0D2922]/10 bg-white p-8 shadow-[0_20px_60px_rgba(13,41,34,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{dict.appointmentPage.title}</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">{dict.appointmentPage.description}</h1>
              <p className="mt-5 text-lg leading-8 text-[#687A75]">{dict.appointmentPage.notice}</p>
            </div>
            <div className="rounded-[2rem] border border-[#0D2922]/10 bg-[#DDE9E3]/80 p-8 shadow-[0_20px_60px_rgba(13,41,34,0.08)]">
              <AppointmentForm locale={resolvedLocale} />
            </div>
          </div>
        </div>
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
