import { getDictionary } from "@/src/lib/i18n";
import type { Locale } from "@/types";
import { StaggerGroup } from "@/src/components/motion";

export function TrustStrip({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <section className="relative px-6 lg:px-8">
      {/* Soft cinematic handoff from dark hero into warm ivory page */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-16 h-24 bg-gradient-to-b from-[#0D2922]/25 via-[#0D2922]/08 to-transparent sm:-top-20 sm:h-28"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#CDA85F]/40 to-transparent"
      />

      <StaggerGroup className="relative mx-auto grid max-w-7xl gap-4 rounded-[2rem] border border-[#0D2922]/10 bg-white/80 p-6 shadow-[0_18px_45px_rgba(13,41,34,0.08)] backdrop-blur-sm md:grid-cols-2 xl:grid-cols-4">
        {dict.home.trustStrip.map((item) => (
          <div
            key={item}
            className="rounded-[1.2rem] border border-[#0D2922]/10 bg-[#F4F0E8] p-5 text-center transition duration-300 hover:-translate-y-0.5 hover:bg-[#F7F3EA]"
          >
            <p className="text-lg font-semibold text-[#123A30]">{item}</p>
          </div>
        ))}
      </StaggerGroup>
    </section>
  );
}
