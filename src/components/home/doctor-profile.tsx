import Image from "next/image";
import { GraduationCap, HeartPulse, ShieldCheck } from "lucide-react";
import { getDictionary } from "@/src/lib/i18n";
import { siteConfig } from "@/src/data/site";
import type { Locale } from "@/types";
import { ParallaxMedia, Reveal } from "@/src/components/motion";

export function DoctorProfile({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <section className="relative overflow-hidden px-6 py-20 sm:py-24 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute -left-28 top-24 h-80 w-80 rounded-full bg-[#123A30]/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-10 rounded-[2.2rem] border border-[#0D2922]/10 bg-white/95 p-8 shadow-[0_24px_70px_rgba(13,41,34,0.1)] lg:grid-cols-[0.92fr_1.08fr] lg:p-12">
        <Reveal
          className="group relative overflow-hidden rounded-[1.8rem] border border-[#0D2922]/10 bg-[#DDE9E3] p-3"
          delay={0.05}
          direction="left"
          distance={36}
        >
          <div aria-hidden="true" className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-[#CDA85F]/22 blur-2xl" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.3rem] [clip-path:inset(0_0_0_0_round_1.3rem)]">
            <ParallaxMedia maxDistance={18} className="h-full w-full">
              <Image
                src={siteConfig.doctorImage}
                alt="Veteriner Hekim Onur Metehan Çakır"
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover object-[center_25%] scale-[1.04] transition-transform duration-[1200ms] ease-out motion-safe:group-hover:scale-100 motion-reduce:scale-100"
              />
            </ParallaxMedia>
          </div>
          <div className="glass-pill absolute bottom-6 left-6 right-6 z-20 rounded-full px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#123A30] shadow-lg [transform:translateZ(36px)] sm:left-auto sm:right-6 sm:w-auto">
            {dict.home.doctor.label}
          </div>
        </Reveal>

        <Reveal className="flex flex-col justify-center" delay={0.1} direction="right" distance={28}>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">
            {dict.home.doctor.title}
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">
            {siteConfig.doctorName}
          </h2>
          <p className="mt-3 text-lg font-medium text-[#123A30]">{dict.home.doctor.label}</p>
          <p className="mt-6 text-lg leading-8 text-[#687A75]">{dict.home.doctor.biography}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.25rem] border border-[#0D2922]/10 bg-[#F4F0E8] p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
              <GraduationCap className="text-[#123A30]" size={18} />
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#CDA85F]">
                Eğitim
              </p>
              <p className="mt-2 text-sm leading-7 text-[#687A75]">{siteConfig.education}</p>
            </div>
            <div className="rounded-[1.25rem] border border-[#0D2922]/10 bg-[#F4F0E8] p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
              <ShieldCheck className="text-[#123A30]" size={18} />
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#CDA85F]">
                Tecrübe
              </p>
              <p className="mt-2 text-sm leading-7 text-[#687A75]">{siteConfig.experience}</p>
            </div>
          </div>

          <div className="glass-light mt-8 flex items-start gap-3 rounded-[1.4rem] p-5">
            <HeartPulse className="mt-1 shrink-0 text-[#123A30]" size={18} />
            <p className="text-sm leading-7 text-[#0D2922]">{dict.home.doctor.description}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
