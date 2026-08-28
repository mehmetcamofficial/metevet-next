"use client";

import { Cat, Dog } from "lucide-react";
import type { GuideChoice } from "./interactive-clinic-config";

export function AnimalGuideOverlay({ guide, label }: { guide: GuideChoice; label: string }) {
  const Icon = guide === "cat" ? Cat : Dog;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute bottom-5 right-5 rounded-full border border-white/20 bg-[#0D2922]/70 p-3 text-[#CDA85F] shadow-lg backdrop-blur-md md:hidden">
      <Icon size={24} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

