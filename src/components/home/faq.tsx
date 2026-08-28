"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { faqs } from "@/src/data/faqs";
import { getDictionary } from "@/src/lib/i18n";
import type { Locale } from "@/types";
import { BlurText, Reveal, StaggerGroup, useReducedMotion } from "@/src/components/motion";

export function Faq({ locale }: { locale: Locale }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const dict = getDictionary(locale);
  const items = faqs[locale];
  const baseId = useId();
  const reduced = useReducedMotion();

  return (
    <section className="px-6 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#0D2922]/10 bg-white p-8 shadow-[0_20px_60px_rgba(13,41,34,0.08)] lg:p-10">
        <div className="max-w-2xl">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">
              {dict.home.faq.title}
            </p>
          </Reveal>
          <BlurText
            as="h2"
            className="mt-3 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl"
            delay={0.04}
          >
            {dict.home.faq.description}
          </BlurText>
        </div>

        <StaggerGroup className="mt-10 space-y-4">
          {items.map((item, index) => {
            const open = openIndex === index;
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;

            return (
              <div
                key={item.question}
                className="rounded-[1.25rem] border border-[#0D2922]/10 bg-[#F4F0E8]"
              >
                <button
                  id={buttonId}
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#123A30]/30"
                  onClick={() => setOpenIndex(open ? null : index)}
                  aria-expanded={open}
                  aria-controls={panelId}
                >
                  <span className="text-base font-semibold text-[#0D2922]">{item.question}</span>
                  <ChevronDown
                    className={`shrink-0 text-[#123A30] transition-transform ${
                      reduced ? "" : "duration-300"
                    } ${open ? "rotate-180" : ""}`}
                    size={18}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`grid transition-[grid-template-rows] ${
                    reduced ? "duration-0" : "duration-300 ease-out"
                  } ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <p
                      className={`px-5 pb-5 text-base leading-8 text-[#687A75] transition-opacity ${
                        reduced ? "" : "duration-300"
                      } ${open ? "opacity-100" : "opacity-0"}`}
                    >
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}
