"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { ChevronDown } from "lucide-react";
import { getDictionary } from "@/src/lib/i18n";
import type { Locale } from "@/types";
import {
  HANDOFF_START,
  TIER_SCROLL_VH,
  frameUrl,
  isCinematicReleased,
  progressToFrame,
} from "./cinematic.constants";
import { CinematicCanvas } from "./CinematicCanvas";
import { CinematicOverlay, type CinematicOverlayHandle } from "./CinematicOverlay";
import { useCinematicFrames } from "./useCinematicFrames";
import { useCinematicScroll } from "./useCinematicScroll";
import { useCinematicTier } from "./useCinematicTier";
import { usePointerDepth } from "./usePointerDepth";

export function CinematicHero({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const copy = dict.home.cinematic;

  const tier = useCinematicTier();
  // Until the tier resolves, and for the static tier, the hero is a single
  // poster frame with the full hero copy — a complete, usable page.
  const isStatic = tier === null || tier === "static";
  const effectiveTier = tier ?? "static";

  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<CinematicOverlayHandle>(null);
  const overlayBoxRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const exitCueRef = useRef<HTMLDivElement>(null);
  const targetFrameRef = useRef(0);

  const [inView, setInView] = useState(true);
  const [released, setReleased] = useState(false);
  const releasedRef = useRef(false);

  const { ready, failed, getDrawableFrame, maintainDecodeWindow } =
    useCinematicFrames(effectiveTier);

  const pointerRef = usePointerDepth(!isStatic && ready && !failed, overlayBoxRef);

  const handleProgress = useCallback((progress: number) => {
    const shouldRelease = isCinematicReleased(progress);
    if (releasedRef.current !== shouldRelease) {
      releasedRef.current = shouldRelease;
      setReleased(shouldRelease);
    }
    targetFrameRef.current = progressToFrame(progress);
    overlayRef.current?.update(progress);

    // The navbar sits in normal flow above the hero, so before the section
    // pins, the sticky box hangs below the fold by exactly that much. Lift
    // the bottom cues by the overshoot so they are never clipped.
    const section = sectionRef.current;
    const overshoot = section ? Math.max(0, section.getBoundingClientRect().top) : 0;

    const hint = scrollHintRef.current;
    if (hint) {
      const opacity = Math.max(0, 1 - progress / 0.08);
      hint.style.opacity = String(opacity);
      hint.style.pointerEvents = opacity < 0.05 ? "none" : "auto";
      hint.style.transform = `translate(-50%, ${-overshoot}px)`;
    }

    const exitCue = exitCueRef.current;
    if (exitCue) {
      const opacity = Math.max(0, Math.min(1, (progress - 0.86) / 0.06));
      exitCue.style.opacity = String(opacity);
      exitCue.style.pointerEvents = opacity < 0.05 ? "none" : "auto";
      exitCue.style.transform = `translate(-50%, ${-overshoot}px)`;
    }

    // Hand the screen over to the page below instead of cutting to it.
    const sticky = stickyRef.current;
    if (sticky) {
      const handoff = Math.max(0, (progress - HANDOFF_START) / (1 - HANDOFF_START));
      sticky.style.opacity = shouldRelease ? "0" : String(1 - handoff * 0.9);
      sticky.style.transform = `scale(${1 - handoff * 0.05})`;
      sticky.style.pointerEvents = shouldRelease ? "none" : "";
    }
  }, []);

  useCinematicScroll(sectionRef, !isStatic && !failed, handleProgress);

  // Paint only while the hero occupies part of the viewport.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || isStatic) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "10% 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [isStatic]);

  const scrollToContent = useCallback(() => {
    const target = document.getElementById("home-content");
    if (!target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, []);

  const showCanvas = !isStatic && ready && !failed;
  const scrollVh = isStatic ? TIER_SCROLL_VH.static : TIER_SCROLL_VH[effectiveTier];

  return (
    <section
      ref={sectionRef}
      data-cinematic-state={released ? "released" : "active"}
      className="relative"
      style={{ height: `${scrollVh}vh` }}
      aria-label={dict.home.hero.eyebrow}
    >
      <div
        ref={stickyRef}
        className={`${released ? "absolute inset-x-0 bottom-0" : "sticky top-0"} h-[100svh] h-[100dvh] w-full overflow-hidden bg-[#0D2922] will-change-[opacity,transform]`}
      >
        {showCanvas ? (
          <CinematicCanvas
            targetFrameRef={targetFrameRef}
            pointerRef={pointerRef}
            active={inView && !released}
            getDrawableFrame={getDrawableFrame}
            maintainDecodeWindow={maintainDecodeWindow}
          />
        ) : (
          <NextImage
            src={frameUrl(0)}
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}

        {/* Legibility scrim. The plate is bright daylight photography, so the
            copy needs a real key behind it: a vertical wash that anchors the
            navbar and the lower edge, plus a soft centre pool under the text. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,26,20,0.62)_0%,rgba(6,26,20,0.24)_26%,rgba(6,26,20,0.34)_60%,rgba(6,26,20,0.86)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(72%_58%_at_50%_47%,rgba(6,26,20,0.58)_0%,rgba(6,26,20,0.32)_46%,rgba(6,26,20,0)_78%)]"
        />

        <div ref={overlayBoxRef} className="absolute inset-0">
          <CinematicOverlay ref={overlayRef} locale={locale} animated={!isStatic} />
        </div>

        {!isStatic ? (
          <>
            <div
              ref={scrollHintRef}
              style={{ transform: "translate(-50%, 0)" }}
              className="absolute bottom-8 left-1/2 z-20"
            >
              <button
                type="button"
                onClick={scrollToContent}
                className="flex flex-col items-center gap-2 text-white/85 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D2922]"
              >
                <span className="text-xs font-medium uppercase tracking-wider">
                  {copy.scrollHint}
                </span>
                <ChevronDown size={24} aria-hidden="true" className="animate-bounce" />
              </button>
            </div>

            <div
              ref={exitCueRef}
              style={{ opacity: 0, pointerEvents: "none", transform: "translate(-50%, 0)" }}
              className="absolute bottom-8 left-1/2 z-20"
            >
              <button
                type="button"
                onClick={scrollToContent}
                className="flex flex-col items-center gap-2 text-white/85 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D2922]"
              >
                <span className="text-xs font-medium uppercase tracking-wider">
                  {copy.exit.supporting}
                </span>
                <ChevronDown size={24} aria-hidden="true" />
              </button>
            </div>

            {/* Keyboard users should not have to traverse five viewports. */}
            <button
              type="button"
              onClick={scrollToContent}
              className="absolute left-1/2 top-6 z-30 -translate-x-1/2 rounded-full border border-white/25 bg-[#0D2922]/85 px-4 py-2 text-sm font-semibold text-white opacity-0 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDA85F]"
            >
              {copy.skip}
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
