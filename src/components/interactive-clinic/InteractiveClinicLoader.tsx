"use client";

import dynamic from "next/dynamic";
import type { Locale } from "@/types";

const ClinicJourneyExperience = dynamic(() => import("./ClinicJourneyExperience"), {
  ssr: false,
  loading: () => null,
});

export function InteractiveClinicLoader({ locale }: { locale: Locale }) {
  return <ClinicJourneyExperience locale={locale} />;
}

