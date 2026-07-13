import { Navbar } from "@/src/components/layout/navbar";
import { Footer } from "@/src/components/layout/footer";
import { SkipLink } from "@/src/components/shared/skip-link";
import { Breadcrumbs } from "@/src/components/shared/breadcrumbs";
import { getDictionary, isLocale } from "@/src/lib/i18n";
import { buildMetadata } from "@/src/lib/metadata";
import { getRoutePath } from "@/src/lib/routes";
import type { Locale } from "@/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const resolvedLocale = locale as Locale;
  const dict = getDictionary(resolvedLocale);

  return buildMetadata({
    locale: resolvedLocale,
    title: `${dict.about.title} | MeteVet`,
    description: dict.about.description,
    path: resolvedLocale === "tr" ? "/hakkimizda" : "/about",
  });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
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
          <Breadcrumbs items={[{ label: resolvedLocale === "tr" ? "Ana Sayfa" : "Home", href: getRoutePath("home", resolvedLocale) }, { label: dict.about.title }]} />
          <div className="mt-8 rounded-[2rem] border border-[#0D2922]/10 bg-white p-8 shadow-[0_20px_60px_rgba(13,41,34,0.08)] lg:p-10">
            <div className="relative mb-8 aspect-[16/7] overflow-hidden rounded-[1.5rem]">
              <Image src="/images/clinic/clinic-reception.png" alt="MeteVet klinik resepsiyonu" fill sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{dict.about.title}</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">{dict.about.description}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#687A75]">{dict.about.intro}</p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {dict.about.bullets.map((bullet) => (
                <div key={bullet.title} className="rounded-[1.3rem] border border-[#0D2922]/10 bg-[#F4F0E8] p-6">
                  <h2 className="text-xl font-semibold text-[#0D2922]">{bullet.title}</h2>
                  <p className="mt-3 text-base leading-8 text-[#687A75]">{bullet.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
