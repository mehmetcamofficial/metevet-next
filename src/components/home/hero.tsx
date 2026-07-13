import Image from "next/image";
import { PhoneCall, Sparkles } from "lucide-react";
import { getDictionary } from "@/src/lib/i18n";
import { siteConfig } from "@/src/data/site";
import type { Locale } from "@/types";
import { Reveal } from "@/src/components/ui/reveal";
import { ButtonLink } from "@/src/components/ui/button-link";

export function Hero({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <section className="px-6 py-16 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
        <Reveal className="max-w-2xl" delay={0.05}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#123A30]/10 bg-white/80 px-3 py-1 text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F] shadow-sm">
            <Sparkles size={14} />
            {dict.home.hero.eyebrow}
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-[#0D2922] sm:text-5xl lg:text-6xl">
            {dict.home.hero.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#687A75]">{dict.home.hero.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={locale === "tr" ? "/tr/randevu" : "/en/appointment"} variant="primary">
              {dict.home.hero.primaryCta}
            </ButtonLink>
            <ButtonLink href={`https://wa.me/${siteConfig.whatsappNumber}`} variant="secondary" external>
              {dict.home.hero.secondaryCta}
            </ButtonLink>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-[#687A75]">
            <div className="rounded-full border border-[#0D2922]/10 bg-white/80 px-4 py-2 shadow-sm">{siteConfig.location}</div>
            <a href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, "")}`} className="flex items-center gap-2 rounded-full border border-[#0D2922]/10 bg-white/80 px-4 py-2 shadow-sm transition hover:border-[#123A30] hover:text-[#123A30]">
              <PhoneCall size={16} className="text-[#123A30]" />
              {siteConfig.phone}
            </a>
          </div>
        </Reveal>

        <Reveal className="relative" delay={0.12}>
          <div className="absolute inset-0 rounded-[2rem] bg-[#CDA85F]/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-[#0D2922]/10 bg-white p-3 shadow-[0_24px_70px_rgba(13,41,34,0.12)]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem]">
              <Image
                src={siteConfig.doctorImage}
                alt={siteConfig.doctorName}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-[center_25%] transition duration-500 hover:scale-[1.03]"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
