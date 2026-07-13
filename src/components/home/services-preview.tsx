import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDictionary } from "@/src/lib/i18n";
import { getRoutePath } from "@/src/lib/routes";
import { serviceIcons, services } from "@/src/data/services";
import type { Locale } from "@/types";
import { Reveal } from "@/src/components/ui/reveal";
import Image from "next/image";

export function ServicesPreview({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <section className="px-6 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{dict.home.services.title}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">{dict.home.services.description}</h2>
          </div>
          <Link href={getRoutePath("services", locale)} className="inline-flex items-center gap-2 text-sm font-semibold text-[#123A30] transition hover:text-[#0D2922]">
            {dict.home.services.linkLabel}
            <ArrowRight size={16} />
          </Link>
        </div>

        <Reveal className="mt-10" delay={0.04}>
          <div className="relative aspect-[16/7] overflow-hidden rounded-[1.7rem] border border-[#0D2922]/10 bg-white shadow-[0_12px_35px_rgba(13,41,34,0.07)]">
            <Image
              src="/images/clinic/clinic-treatment-room.png"
              alt="MeteVet modern tedavi odası"
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.slice(0, 6).map((service, index) => {
            const Icon = serviceIcons[service.icon as keyof typeof serviceIcons];
            return (
              <Reveal key={service.title} delay={0.04 * index}>
                <article className="group h-full rounded-[1.7rem] border border-[#0D2922]/10 bg-white p-7 shadow-[0_12px_35px_rgba(13,41,34,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(13,41,34,0.1)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DDE9E3] text-[#123A30] transition group-hover:scale-105">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-[#0D2922]">{service.title}</h3>
                  <p className="mt-3 text-base leading-8 text-[#687A75]">{service.description}</p>
                  <Link href={getRoutePath("services", locale)} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#CDA85F] transition group-hover:gap-3">
                    {dict.common.learnMore}
                    <ArrowRight size={16} />
                  </Link>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
