"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faqs } from "@/src/data/faqs";
import { getDictionary } from "@/src/lib/i18n";
import type { Locale } from "@/types";
import { Reveal } from "@/src/components/ui/reveal";

export function Faq({ locale }: { locale: Locale }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const dict = getDictionary(locale);
  const items = faqs[locale];

  return (
    <section className="px-6 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#0D2922]/10 bg-white p-8 shadow-[0_20px_60px_rgba(13,41,34,0.08)] lg:p-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{dict.home.faq.title}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">{dict.home.faq.description}</h2>
        </div>
        <div className="mt-10 space-y-4">
          {items.map((item, index) => {
            const open = openIndex === index;
            return (
              <Reveal key={item.question} delay={index * 0.04}>
                <div className="rounded-[1.25rem] border border-[#0D2922]/10 bg-[#F4F0E8]">
                  <button
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                    onClick={() => setOpenIndex(open ? null : index)}
                    aria-expanded={open}
                  >
                    <span className="text-base font-semibold text-[#0D2922]">{item.question}</span>
                    <ChevronDown className={`shrink-0 text-[#123A30] transition ${open ? "rotate-180" : ""}`} size={18} />
                  </button>
                  {open ? <p className="px-5 pb-5 text-base leading-8 text-[#687A75]">{item.answer}</p> : null}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
