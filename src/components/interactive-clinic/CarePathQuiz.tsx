"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { getRoutePath } from "@/src/lib/routes";
import type { Locale } from "@/types";

export function CarePathQuiz({
  locale,
  question,
  options,
  disclaimer,
  suggestion,
  appointmentLabel,
  whatsappLabel,
}: {
  locale: Locale;
  question: string;
  options: readonly string[];
  disclaimer: string;
  suggestion: string;
  appointmentLabel: string;
  whatsappLabel: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <details className="pointer-events-auto w-[min(24rem,calc(100vw-3rem))] rounded-2xl border border-white/20 bg-[#0D2922]/82 p-4 text-white shadow-2xl backdrop-blur-md">
      <summary className="cursor-pointer text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F]">{question}</summary>
      <div className="mt-4 space-y-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={selected === option}
            onClick={() => setSelected(option)}
            className={`block w-full rounded-xl px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F] ${
              selected === option ? "bg-[#CDA85F] text-[#0D2922]" : "bg-white/8 text-white/85"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {selected ? (
        <p className="mt-4 text-sm leading-6 text-white/85">{suggestion}</p>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-[#DDE9E3]">{disclaimer}</p>
      <div className={`flex flex-wrap gap-2 ${selected ? "mt-4" : "mt-3"}`}>
        <Link href={getRoutePath("appointment", locale)} className="rounded-full bg-[#CDA85F] px-4 py-2 text-sm font-semibold text-[#0D2922] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          {appointmentLabel}
        </Link>
        <a href="https://wa.me/905065859155" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F]">
          <MessageCircle size={15} aria-hidden="true" />
          {whatsappLabel}
        </a>
      </div>
    </details>
  );
}
