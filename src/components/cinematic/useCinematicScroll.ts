"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Drives the hero from scroll position without any per-frame React state.
 *
 * The callback receives raw sticky-section progress (0–1) and is invoked at
 * most once per animation frame. Consumers write to refs and paint; the only
 * component state the hero keeps is the active narrative scene, which changes
 * five times across the whole sequence.
 */
export function useCinematicScroll(
  sectionRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  onProgress: (progress: number) => void,
) {
  const callbackRef = useRef(onProgress);

  useEffect(() => {
    callbackRef.current = onProgress;
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let frame: number | null = null;

    const measure = () => {
      frame = null;
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const range = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / range));
      callbackRef.current(progress);
    };

    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(measure);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("orientationchange", schedule, { passive: true });
    measure();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [sectionRef, enabled]);
}
