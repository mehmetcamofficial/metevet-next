import { Navbar } from "@/src/components/layout/navbar";
import { Footer } from "@/src/components/layout/footer";
import { SkipLink } from "@/src/components/shared/skip-link";
import { Breadcrumbs } from "@/src/components/shared/breadcrumbs";
import { getDictionary, isLocale } from "@/src/lib/i18n";
import { buildMetadata } from "@/src/lib/metadata";
import { getRoutePath } from "@/src/lib/routes";
import { ImmersivePageHero, StickyStory } from "@/src/components/immersive";
import type { Locale } from "@/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { services } from "@/src/data/services";
import { WebGLProvider } from "@/src/components/webgl/WebGLProvider";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const resolvedLocale = locale as Locale;
  const dict = getDictionary(resolvedLocale);

  return buildMetadata({
    locale: resolvedLocale,
    title: `${dict.servicesPage.title} | MeteVet`,
    description: dict.servicesPage.description,
    path: resolvedLocale === "tr" ? "/hizmetler" : "/services",
  });
}

export default async function ServicesRoutePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const resolvedLocale = locale as Locale;
  const dict = getDictionary(resolvedLocale);
  const isTurkish = resolvedLocale === "tr";

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#0D2922]">
      <SkipLink />
      <Navbar locale={resolvedLocale} />
      <main id="main-content" className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs items={[{ label: isTurkish ? "Ana Sayfa" : "Home", href: getRoutePath("home", resolvedLocale) }, { label: dict.servicesPage.title }]} />

          <ImmersivePageHero
            kicker={dict.servicesPage.title}
            title={dict.servicesPage.description}
            imageSrc="/images/clinic/clinic-treatment-room.png"
            imageAlt={isTurkish ? "MeteVet modern tedavi odası" : "MeteVet modern treatment room"}
            chip={isTurkish ? "Klinik Hizmetler" : "Clinic Services"}
            tone="dark"
          />

          <StickyStory
            items={services.map((s, i) => ({
              id: String(i),
              title: s.title,
              description: s.description,
            }))}
            media={
              <WebGLProvider
                scene="services"
                poster="/images/clinic/clinic-treatment-room.png"
                posterAlt={isTurkish ? "MeteVet tedavi odası" : "MeteVet treatment room"}
              />
            }
            className="mt-16"
          />
        </div>
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
