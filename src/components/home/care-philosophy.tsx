import { HeartHandshake, Microscope, ShieldCheck, Sparkles } from "lucide-react";
import { getDictionary } from "@/src/lib/i18n";
import type { Locale } from "@/types";
import { Reveal } from "@/src/components/ui/reveal";

export function CarePhilosophy({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <section className="px-6 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#0D2922]/10 bg-[#DDE9E3]/70 p-8 shadow-[0_20px_60px_rgba(13,41,34,0.08)] lg:p-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{dict.home.philosophy.title}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">{dict.home.philosophy.description}</h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {dict.home.philosophy.items.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.04}>
              <div className="rounded-[1.4rem] border border-[#0D2922]/10 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4F0E8]">
                  {item.title.includes("Koruyucu") || item.title.includes("Preventive") ? <ShieldCheck className="text-[#123A30]" size={18} /> : item.title.includes("Bilimsel") || item.title.includes("Scientific") ? <Microscope className="text-[#123A30]" size={18} /> : item.title.includes("İletişim") || item.title.includes("Communication") ? <HeartHandshake className="text-[#123A30]" size={18} /> : <Sparkles className="text-[#123A30]" size={18} />}
                </div>
                <h3 className="mt-5 text-xl font-semibold text-[#0D2922]">{item.title}</h3>
                <p className="mt-3 text-base leading-8 text-[#687A75]">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
