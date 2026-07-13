import Image from "next/image";
import { GraduationCap, HeartPulse, ShieldCheck } from "lucide-react";
import { getDictionary } from "@/src/lib/i18n";
import { siteConfig } from "@/src/data/site";
import type { Locale } from "@/types";
import { Reveal } from "@/src/components/ui/reveal";

export function DoctorProfile({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <section className="px-6 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 rounded-[2.2rem] border border-[#0D2922]/10 bg-white p-8 shadow-[0_24px_70px_rgba(13,41,34,0.1)] lg:grid-cols-[0.92fr_1.08fr] lg:p-12">
        <Reveal className="relative overflow-hidden rounded-[1.8rem] border border-[#0D2922]/10 bg-[#DDE9E3] p-3" delay={0.05}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.3rem]">
            <Image
              src={siteConfig.doctorImage}
              alt="Veteriner Hekim Onur Metehan Çakır"
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover object-[center_25%] transition duration-500 hover:scale-[1.03]"
            />
          </div>
        </Reveal>

        <Reveal className="flex flex-col justify-center" delay={0.08}>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{dict.home.doctor.title}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">{siteConfig.doctorName}</h2>
          <p className="mt-3 text-lg font-medium text-[#123A30]">{dict.home.doctor.label}</p>
          <p className="mt-6 text-lg leading-8 text-[#687A75]">{dict.home.doctor.biography}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.25rem] border border-[#0D2922]/10 bg-[#F4F0E8] p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
              <GraduationCap className="text-[#123A30]" size={18} />
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#CDA85F]">Eğitim</p>
              <p className="mt-2 text-sm leading-7 text-[#687A75]">{siteConfig.education}</p>
            </div>
            <div className="rounded-[1.25rem] border border-[#0D2922]/10 bg-[#F4F0E8] p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
              <ShieldCheck className="text-[#123A30]" size={18} />
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#CDA85F]">Tecrübe</p>
              <p className="mt-2 text-sm leading-7 text-[#687A75]">{siteConfig.experience}</p>
            </div>
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-[1.4rem] border border-[#123A30]/10 bg-[#DDE9E3] p-5">
            <HeartPulse className="mt-1 text-[#123A30]" size={18} />
            <p className="text-sm leading-7 text-[#0D2922]">{dict.home.doctor.description}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
