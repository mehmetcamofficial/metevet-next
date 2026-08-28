"use client";

import { useEffect, useRef, type RefObject } from "react";
import { DEPTH_AMPLITUDE } from "./cinematic.constants";
import type { PointerState } from "./CinematicCanvas";

/**
 * Tracks the pointer as a normalised (-1..1) vector and counter-parallaxes the
 * overlay so the copy stays close to stationary while the plate moves beneath
 * it. The canvas reads the same ref to drive the plate and the cat's gaze.
 */
export function usePointerDepth(
  enabled: boolean,
  overlayRef: RefObject<HTMLElement | null>,
): RefObject<PointerState> {
  const pointerRef = useRef<PointerState>({ x: 0, y: 0, active: false });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const pointer = pointerRef.current;
    let disposed = false;
    let detach: (() => void) | undefined;

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
      pointer.active = true;
    };

    const onRelease = () => {
      pointer.active = false;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", onRelease);
    document.documentElement.addEventListener("mouseleave", onRelease);

    void import("gsap").then(({ gsap }) => {
      if (disposed || !overlayRef.current) return;
      const quickToX = gsap.quickTo(overlayRef.current, "x", {
        duration: 0.7,
        ease: "power2.out",
      });
      const quickToY = gsap.quickTo(overlayRef.current, "y", {
        duration: 0.7,
        ease: "power2.out",
      });

      let raf: number | null = null;
      const tick = () => {
        const factor = pointer.active ? 1 : 0;
        quickToX(-pointer.x * DEPTH_AMPLITUDE.ui * factor);
        quickToY(-pointer.y * DEPTH_AMPLITUDE.ui * factor);
        raf = window.requestAnimationFrame(tick);
      };
      raf = window.requestAnimationFrame(tick);

      detach = () => {
        if (raf !== null) window.cancelAnimationFrame(raf);
        gsap.set(overlayRef.current, { x: 0, y: 0 });
      };
    });

    return () => {
      disposed = true;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onRelease);
      document.documentElement.removeEventListener("mouseleave", onRelease);
      detach?.();
      pointer.active = false;
    };
  }, [enabled, overlayRef]);

  return pointerRef;
}
