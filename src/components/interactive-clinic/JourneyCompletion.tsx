"use client";

import Link from "next/link";
import { CalendarDays, MapPin, MessageCircle } from "lucide-react";
import { getRoutePath } from "@/src/lib/routes";
import type { Locale } from "@/types";

export function JourneyCompletion({
  locale,
  title,
  summary,
  appointmentLabel,
  whatsappLabel,
  directionsLabel,
}: {
  locale: Locale;
  title: string;
  summary: string;
  appointmentLabel: string;
  whatsappLabel: string;
  directionsLabel: string;
}) {
  return (
    <section aria-live="polite" className="pointer-events-auto w-[min(30rem,calc(100vw-3rem))] rounded-[1.5rem] border border-[#CDA85F]/35 bg-[#F4F0E8]/95 p-6 text-[#0D2922] shadow-2xl backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#CDA85F]">MeteVet</p>
      <h3 className="mt-2 text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#687A75]">{summary}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={getRoutePath("appointment", locale)} className="inline-flex items-center gap-2 rounded-full bg-[#123A30] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F]">
          <CalendarDays size={15} aria-hidden="true" />
          {appointmentLabel}
        </Link>
        <a href="https://wa.me/905065859155" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#123A30]/15 px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F]">
          <MessageCircle size={15} aria-hidden="true" />
          {whatsappLabel}
        </a>
        <a href="https://maps.app.goo.gl/1J8PFRqAMSpetLjN7" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#123A30]/15 px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F]">
          <MapPin size={15} aria-hidden="true" />
          {directionsLabel}
        </a>
      </div>
    </section>
  );
}

