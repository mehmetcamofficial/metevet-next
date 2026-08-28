import { Navbar } from "@/src/components/layout/navbar";
import { Footer } from "@/src/components/layout/footer";
import { SkipLink } from "@/src/components/shared/skip-link";
import { Breadcrumbs } from "@/src/components/shared/breadcrumbs";
import { getDictionary, isLocale } from "@/src/lib/i18n";
import { buildMetadata } from "@/src/lib/metadata";
import { getRoutePath } from "@/src/lib/routes";
import { siteConfig } from "@/src/data/site";
import { ImmersivePageHero, StickyStory } from "@/src/components/immersive";
import { StaggerGroup } from "@/src/components/motion";
import type { Locale } from "@/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WebGLProvider } from "@/src/components/webgl/WebGLProvider";

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

export default async function AboutRoutePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const resolvedLocale = locale as Locale;
  const dict = getDictionary(resolvedLocale);
  const isTurkish = resolvedLocale === "tr";

  const storyItems = isTurkish
    ? [
        { id: "scientific", title: "Bilimsel Yaklaşım", description: "Veteriner hekimlikte en güncel bilimsel bulgular ve klinik yöntemlerle tedavi planları." },
        { id: "compassionate", title: "Şefkatli Bakım", description: "Her evcil hayvanın hak ettiği saygınlık ve özenle muayene edilir." },
        { id: "trust", title: "Güven ve Süreklilik", description: "Uzun vadeli sağlık takibi ve sahipler ile doğrudan iletişim." },
      ]
    : [
        { id: "scientific", title: "Scientific Approach", description: "Treatment plans based on the latest scientific findings and clinical methods." },
        { id: "compassionate", title: "Compassionate Care", description: "Every companion animal receives respectful, attentive examination." },
        { id: "trust", title: "Trust & Continuity", description: "Long-term health monitoring and direct communication with pet owners." },
      ];

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#0D2922]">
      <SkipLink />
      <Navbar locale={resolvedLocale} />
      <main id="main-content" className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs items={[{ label: isTurkish ? "Ana Sayfa" : "Home", href: getRoutePath("home", resolvedLocale) }, { label: dict.about.title }]} />

          <ImmersivePageHero
            kicker={dict.about.title}
            title={dict.about.description}
            description={dict.about.intro}
            imageSrc="/images/clinic/clinic-reception.png"
            imageAlt={isTurkish ? "MeteVet klinik resepsiyonu" : "MeteVet clinic reception"}
            chip={isTurkish ? "Veteriner Hekim" : "Veterinarian"}
            tone="dark"
          />

          <StickyStory
            items={storyItems}
            media={
              <WebGLProvider
                scene="portrait"
                poster={siteConfig.doctorImage}
                posterAlt="Veteriner Hekim Onur Metehan Çakır"
              />
            }
            className="mt-16"
          />

          <StaggerGroup className="mt-16 grid gap-6 md:grid-cols-3">
            {dict.about.bullets.map((bullet) => (
              <div key={bullet.title} className="rounded-[1.3rem] border border-[#0D2922]/10 bg-white p-6 shadow-[0_12px_35px_rgba(13,41,34,0.06)]">
                <h2 className="text-xl font-semibold text-[#0D2922]">{bullet.title}</h2>
                <p className="mt-3 text-base leading-8 text-[#687A75]">{bullet.description}</p>
              </div>
            ))}
          </StaggerGroup>
        </div>
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
