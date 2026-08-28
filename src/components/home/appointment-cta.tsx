"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { CalendarDays, PhoneCall, MessageCircleMore, ArrowRight } from "lucide-react";
import { getDictionary } from "@/src/lib/i18n";
import { getRoutePath } from "@/src/lib/routes";
import { siteConfig } from "@/src/data/site";
import type { Locale } from "@/types";
import { BlurText, Reveal, useReducedMotion } from "@/src/components/motion";
import { BREAKPOINTS } from "@/src/components/motion/motion-config";

export function AppointmentCTA({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const reduced = useReducedMotion();
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    if (typeof window === "undefined") return;
    if (window.innerWidth < BREAKPOINTS.mobile) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const el = glowRef.current;
    if (!el) return;

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--glow-x", `${x}%`);
      el.style.setProperty("--glow-y", `${y}%`);
    };

    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, [reduced]);

  return (
    <section className="px-6 pb-20 sm:pb-24 lg:px-8">
      <Reveal>
        <div
          ref={glowRef}
          className="relative mx-auto min-h-[360px] max-w-7xl overflow-hidden rounded-[2.2rem] border border-[#0D2922]/10 bg-[#0D2922] p-6 text-white shadow-[0_30px_90px_rgba(13,41,34,0.22)] sm:p-10 lg:p-14"
          style={
            {
              "--glow-x": "70%",
              "--glow-y": "30%",
            } as CSSProperties
          }
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                "radial-gradient(420px circle at var(--glow-x) var(--glow-y), rgba(205,168,95,0.28), transparent 55%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#CDA85F]/20 blur-3xl"
          />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-[45%] border-[56px] border-white/[0.045] [transform:rotate(-18deg)]" />
          <div aria-hidden="true" className="pointer-events-none absolute left-[42%] top-10 h-20 w-20 rounded-full border border-[#CDA85F]/20" />

          <div className="relative z-10 flex min-h-[248px] flex-col justify-between gap-8 rounded-[1.7rem] border border-white/10 bg-white/[0.055] p-6 shadow-[0_22px_55px_rgba(0,0,0,0.16)] backdrop-blur-sm sm:p-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">
                {dict.home.appointment.title}
              </p>
              <BlurText
                as="h2"
                className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
                delay={0.04}
              >
                {dict.home.appointment.description}
              </BlurText>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, "")}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <PhoneCall size={16} />
                {dict.home.appointment.phoneLabel}
              </a>
              <a
                href={`https://wa.me/${siteConfig.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#CDA85F] px-5 py-3 text-sm font-semibold text-[#0D2922] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F]/50"
              >
                <MessageCircleMore size={16} />
                {dict.home.appointment.whatsappLabel}
              </a>
              <Link
                href={getRoutePath("appointment", locale)}
                className="glass-cta group inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[#0D2922] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F]/50"
              >
                <CalendarDays size={16} />
                {dict.home.appointment.pageLabel}
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
