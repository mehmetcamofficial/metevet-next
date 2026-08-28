import { Sparkles } from "lucide-react";
import { getDictionary } from "@/src/lib/i18n";
import type { Locale } from "@/types";
import { BlurText, Reveal } from "@/src/components/motion";
import { StickyStory } from "@/src/components/immersive";

export function CarePhilosophy({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <section className="relative px-6 py-20 sm:py-24 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-16 h-56 w-56 -translate-x-1/2 rounded-full bg-[#CDA85F]/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 right-[12%] h-40 w-40 rounded-full bg-[#123A30]/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl rounded-[2rem] border border-[#0D2922]/10 bg-[#DDE9E3]/70 p-8 shadow-[0_20px_60px_rgba(13,41,34,0.08)] lg:p-10">
        <div className="max-w-3xl">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">
              {dict.home.philosophy.title}
            </p>
          </Reveal>
          <BlurText
            as="h2"
            className="mt-4 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl"
            delay={0.05}
          >
            {dict.home.philosophy.description}
          </BlurText>
        </div>

        <StickyStory
          className="mt-10"
          items={dict.home.philosophy.items.map((item, index) => ({
            id: `philosophy-${index}`,
            title: item.title,
            description: item.description,
          }))}
          media={
            <div className="relative min-h-72 overflow-hidden rounded-[1.8rem] bg-[#123A30] p-8 text-white shadow-[0_24px_60px_rgba(13,41,34,0.18)] lg:min-h-[430px]">
              <div aria-hidden="true" className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[48px] border-[#CDA85F]/15" />
              <div aria-hidden="true" className="absolute bottom-8 left-8 h-24 w-24 rounded-full bg-[#CDA85F]/20 blur-2xl" />
              <div className="relative flex h-full min-h-56 flex-col justify-between lg:min-h-[366px]">
                <Sparkles className="text-[#CDA85F]" size={28} />
                <p className="max-w-sm text-2xl font-semibold leading-snug">
                  {dict.home.philosophy.description}
                </p>
              </div>
            </div>
          }
        />
      </div>
    </section>
  );
}
