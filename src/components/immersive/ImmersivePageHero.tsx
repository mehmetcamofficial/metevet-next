/**
 * Shared public page hero with layered media depth.
 * Distinct per page via image, chip, tone, and copy props.
 */

"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { BlurText, Reveal, useReducedMotion } from "@/src/components/motion";
import { FloatingChip } from "./FloatingChip";
import { LayeredScene } from "./LayeredScene";
import { PointerTilt } from "./PointerTilt";
import { DepthMedia } from "./DepthMedia";

export type ImmersivePageHeroProps = {
  kicker: string;
  title: string;
  description?: string;
  imageSrc: string;
  imageAlt: string;
  chip?: string;
  /** Visual tone of the overlay panel */
  tone?: "light" | "dark";
  children?: ReactNode;
  scrollCueLabel?: string;
};

export function ImmersivePageHero({
  kicker,
  title,
  description,
  imageSrc,
  imageAlt,
  chip,
  tone = "dark",
  children,
  scrollCueLabel,
}: ImmersivePageHeroProps) {
  const reduced = useReducedMotion();
  const isDark = tone === "dark";

  return (
    <LayeredScene className="mt-6 overflow-hidden rounded-[2rem] border border-[#0D2922]/10 shadow-[0_24px_70px_rgba(13,41,34,0.12)]">
      <div className="relative min-h-[min(68vh,580px)]">
        <div className="absolute inset-0">
          <PointerTilt className="h-full w-full">
            <DepthMedia className="absolute inset-0 h-full w-full" maxDistance={28} hoverScale={false}>
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </DepthMedia>
          </PointerTilt>
        </div>

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 ${
            isDark
              ? "bg-gradient-to-r from-[#0D2922]/88 via-[#0D2922]/55 to-[#0D2922]/25"
              : "bg-gradient-to-r from-[#F4F0E8]/92 via-[#F4F0E8]/72 to-transparent"
          }`}
        />

        <div className="relative z-[1] flex min-h-[min(68vh,580px)] flex-col justify-end px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <div className="max-w-3xl">
            {chip ? (
              <Reveal>
                <FloatingChip
                  className={
                    isDark
                      ? "!border-white/25 !bg-white/15 !text-white backdrop-blur-md"
                      : ""
                  }
                >
                  {chip}
                </FloatingChip>
              </Reveal>
            ) : null}
            <Reveal delay={0.04}>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.32em] text-[#CDA85F]">
                {kicker}
              </p>
            </Reveal>
            <BlurText
              as="h1"
              className={`mt-4 text-4xl font-semibold tracking-tight sm:text-5xl ${
                isDark ? "text-white" : "text-[#0D2922]"
              }`}
              delay={0.08}
            >
              {title}
            </BlurText>
            {description ? (
              <Reveal delay={0.12}>
                <p
                  className={`mt-5 max-w-2xl text-lg leading-8 ${
                    isDark ? "text-[#DDE9E3]" : "text-[#687A75]"
                  }`}
                >
                  {description}
                </p>
              </Reveal>
            ) : null}
            {children ? <div className="mt-7">{children}</div> : null}
          </div>

          {scrollCueLabel && !reduced ? (
            <p
              aria-hidden="true"
              className={`mt-10 text-xs font-semibold uppercase tracking-[0.28em] ${
                isDark ? "text-white/55" : "text-[#123A30]/50"
              }`}
            >
              {scrollCueLabel}
            </p>
          ) : null}
        </div>
      </div>
    </LayeredScene>
  );
}
