import { getDictionary } from "@/src/lib/i18n";
import type { Locale } from "@/types";
import { Reveal } from "@/src/components/ui/reveal";

export function TrustStrip({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <section className="px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 rounded-[2rem] border border-[#0D2922]/10 bg-white/80 p-6 shadow-[0_18px_45px_rgba(13,41,34,0.08)] md:grid-cols-2 xl:grid-cols-4">
        {dict.home.trustStrip.map((item, index) => (
          <Reveal key={item} delay={index * 0.04}>
            <div className="rounded-[1.2rem] border border-[#0D2922]/10 bg-[#F4F0E8] p-5 text-center transition hover:-translate-y-0.5 hover:bg-[#F7F3EA]">
              <p className="text-lg font-semibold text-[#123A30]">{item}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
