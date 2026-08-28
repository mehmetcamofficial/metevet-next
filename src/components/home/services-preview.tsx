import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getDictionary } from "@/src/lib/i18n";
import { getRoutePath } from "@/src/lib/routes";
import { serviceIcons, services } from "@/src/data/services";
import type { Locale } from "@/types";
import { BlurText, Reveal, StaggerGroup } from "@/src/components/motion";
import { LayeredScene, PerspectiveCard } from "@/src/components/immersive";

export function ServicesPreview({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <LayeredScene className="bg-[radial-gradient(circle_at_84%_20%,rgba(205,168,95,0.11),transparent_28%)]">
    <section className="relative px-6 py-20 sm:py-24 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute left-[8%] top-1/3 h-28 w-28 rounded-full border border-[#CDA85F]/20 md:translate-y-8" />
      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Reveal delay={0.02}>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">
                {dict.home.services.title}
              </p>
            </Reveal>
            <BlurText
              as="h2"
              className="mt-3 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl"
              delay={0.06}
            >
              {dict.home.services.description}
            </BlurText>
          </div>
          <Reveal delay={0.1}>
            <Link
              data-companion-hit-test="services-view-all"
              href={getRoutePath("services", locale)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#123A30] transition hover:gap-3 hover:text-[#0D2922] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30"
            >
              {dict.home.services.linkLabel}
              <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>

        <Reveal className="mt-10" delay={0.08}>
          <div className="group relative aspect-[16/7] overflow-hidden rounded-[1.7rem] border border-[#0D2922]/10 bg-white shadow-[0_12px_35px_rgba(13,41,34,0.07)]">
            <Image
              src="/images/clinic/clinic-treatment-room.png"
              alt="MeteVet modern tedavi odası"
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          </div>
        </Reveal>

        <StaggerGroup
          className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          alternateOffset={10}
        >
          {services.slice(0, 6).map((service, index) => {
            const Icon = serviceIcons[service.icon as keyof typeof serviceIcons];
            return (
              <PerspectiveCard key={service.title} enableTilt className={index === 1 ? "xl:-translate-y-5" : ""}>
              <article
                className={`group relative h-full min-h-72 overflow-hidden rounded-[1.7rem] border bg-white p-7 transition duration-300 hover:border-[#CDA85F]/35 ${
                  index === 1
                    ? "border-[#CDA85F]/25 shadow-[0_28px_65px_rgba(13,41,34,0.13)]"
                    : "border-[#0D2922]/10 shadow-[0_12px_35px_rgba(13,41,34,0.07)]"
                }`}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-0 transition duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(280px circle at 50% 0%, rgba(205,168,95,0.14), transparent 70%)",
                  }}
                />
                <div className="relative [transform:translateZ(18px)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DDE9E3] text-[#123A30] transition duration-300 [transform:translateZ(28px)] group-hover:scale-105">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-[#0D2922]">{service.title}</h3>
                  <p className="mt-3 text-base leading-8 text-[#687A75]">{service.description}</p>
                  <Link
                    data-companion-hit-test="service-learn-more"
                    href={getRoutePath("services", locale)}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#CDA85F] transition group-hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F]/40"
                  >
                    {dict.common.learnMore}
                    <ArrowRight size={16} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </article>
              </PerspectiveCard>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
    </LayeredScene>
  );
}
