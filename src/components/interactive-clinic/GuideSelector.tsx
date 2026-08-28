"use client";

import { Cat, Dog } from "lucide-react";
import type { GuideChoice } from "./interactive-clinic-config";

export function GuideSelector({
  label,
  catLabel,
  dogLabel,
  value,
  onChange,
}: {
  label: string;
  catLabel: string;
  dogLabel: string;
  value: GuideChoice;
  onChange: (guide: GuideChoice) => void;
}) {
  return (
    <fieldset className="pointer-events-auto rounded-2xl border border-white/20 bg-[#0D2922]/72 p-3 text-white shadow-xl backdrop-blur-md">
      <legend className="px-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#CDA85F]">{label}</legend>
      <div className="mt-2 flex gap-2">
        {([
          ["cat", catLabel, Cat],
          ["dog", dogLabel, Dog],
        ] as const).map(([guide, optionLabel, Icon]) => (
          <button
            key={guide}
            type="button"
            aria-pressed={value === guide}
            onClick={() => onChange(guide)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F] ${
              value === guide ? "bg-[#CDA85F] text-[#0D2922]" : "bg-white/10 text-white"
            }`}
          >
            <Icon size={16} aria-hidden="true" />
            {optionLabel}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

