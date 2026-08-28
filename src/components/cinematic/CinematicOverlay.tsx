"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { PhoneCall, Sparkles } from "lucide-react";
import { ButtonLink } from "@/src/components/ui/button-link";
import { getDictionary } from "@/src/lib/i18n";
import { getRoutePath } from "@/src/lib/routes";
import { siteConfig } from "@/src/data/site";
import type { Locale } from "@/types";
import { CINEMATIC_SCENES, type SceneId } from "./cinematic.constants";

export type CinematicOverlayHandle = {
  update: (progress: number) => void;
};

type Props = {
  locale: Locale;
  /** Static tier shows the hero only — no scroll-driven narrative. */
  animated: boolean;
};

/**
 * Fades a scene in and out around its progress window. Scene one starts at
 * full strength so the hero is legible before any scrolling happens.
 */
function sceneOpacity(progress: number, start: number, end: number): number {
  const fade = Math.max(0.04, (end - start) * 0.32);
  if (progress >= start && progress <= end) return 1;
  if (progress < start) {
    if (start === 0) return 1;
    return Math.max(0, 1 - (start - progress) / fade);
  }
  return Math.max(0, 1 - (progress - end) / fade);
}

export const CinematicOverlay = forwardRef<CinematicOverlayHandle, Props>(
  function CinematicOverlay({ locale, animated }, ref) {
    const dict = getDictionary(locale);
    const copy = dict.home.cinematic;
    const sceneRefs = useRef<Partial<Record<SceneId, HTMLDivElement | null>>>({});

    useImperativeHandle(ref, () => ({
      update(progress) {
        for (const scene of CINEMATIC_SCENES) {
          const element = sceneRefs.current[scene.id];
          if (!element) continue;
          const opacity = sceneOpacity(progress, scene.start, scene.end);
          element.style.opacity = String(opacity);
          // Copy settles upward as it arrives and lifts away as it leaves.
          const offset = (1 - opacity) * 18;
          const blur = (1 - opacity) * 6;
          element.style.transform = `translate3d(0, ${offset}px, 0)`;
          element.style.filter = blur > 0.05 ? `blur(${blur}px)` : "none";
          element.style.visibility = opacity < 0.01 ? "hidden" : "visible";
          element.style.willChange = opacity > 0.01 ? "opacity, transform" : "auto";
        }
      },
    }));

    const assign = (id: SceneId) => (node: HTMLDivElement | null) => {
      sceneRefs.current[id] = node;
    };

    return (
      <div className="pointer-events-none relative z-10 flex h-full items-center justify-center px-6 lg:px-8">
        <div className="w-full max-w-4xl text-center">
          <div
            ref={assign("intro")}
            className="pointer-events-auto"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#0D2922]/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#E3C27E] backdrop-blur-sm sm:text-sm sm:tracking-[0.3em]">
              <Sparkles size={14} aria-hidden="true" />
              {dict.home.hero.eyebrow}
            </div>
            <h1 className="mt-5 text-[1.85rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white drop-shadow-[0_2px_18px_rgba(6,26,20,0.75)] sm:mt-6 sm:text-5xl sm:leading-[1.02] lg:text-6xl">
              {dict.home.hero.title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/90 drop-shadow-[0_1px_12px_rgba(6,26,20,0.7)] sm:mt-6 sm:text-lg sm:leading-8">
              {dict.home.hero.description}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center">
              <ButtonLink href={getRoutePath("appointment", locale)} variant="primary">
                {dict.home.hero.primaryCta}
              </ButtonLink>
              <ButtonLink
                href={`https://wa.me/${siteConfig.whatsappNumber}`}
                variant="secondary"
                external
              >
                {dict.home.hero.secondaryCta}
              </ButtonLink>
            </div>
            {/* Contact chips are supporting detail; on the shortest viewports
                they would collide with the floating WhatsApp control. */}
            <div className="mt-6 hidden flex-wrap justify-center gap-3 text-sm text-white/85 min-[430px]:flex sm:mt-8">
              <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
                {siteConfig.location}
              </div>
              <a
                href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, "")}`}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm transition hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F]"
              >
                <PhoneCall size={16} aria-hidden="true" />
                {siteConfig.phone}
              </a>
            </div>
          </div>

          {animated ? (
            <>
              <StoryLine
                ref={assign("trust")}
                title={copy.trust.title}
                supporting={copy.trust.supporting}
              />
              <StoryLine
                ref={assign("expertise")}
                title={copy.expertise.title}
                supporting={copy.expertise.supporting}
              />
              <StoryLine
                ref={assign("atmosphere")}
                title={copy.atmosphere.title}
                supporting={copy.atmosphere.supporting}
                muted
              />
              <StoryLine
                ref={assign("exit")}
                title={copy.exit.title}
                supporting={copy.exit.supporting}
              />
            </>
          ) : null}
        </div>
      </div>
    );
  },
);

const StoryLine = forwardRef<
  HTMLDivElement,
  { title: string; supporting?: string; muted?: boolean }
>(function StoryLine({ title, supporting, muted }, ref) {
  return (
    // Centred by flex rather than a translate utility: update() writes an
    // inline transform, which would otherwise clobber the centring.
    <div
      ref={ref}
      style={{ opacity: 0, visibility: "hidden" }}
      className="absolute inset-0 flex flex-col items-center justify-center px-6"
    >
      <p
        className={`mx-auto max-w-2xl font-semibold tracking-[-0.02em] text-white drop-shadow-[0_2px_20px_rgba(6,26,20,0.6)] ${
          muted ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl lg:text-5xl"
        }`}
      >
        {title}
      </p>
      {supporting ? (
        <p className="mx-auto mt-4 max-w-xl text-base text-white/85 drop-shadow-[0_1px_12px_rgba(6,26,20,0.5)] sm:text-lg">
          {supporting}
        </p>
      ) : null}
    </div>
  );
});
