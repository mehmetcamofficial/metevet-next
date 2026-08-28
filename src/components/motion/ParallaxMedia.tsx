/**
 * MeteVet Global Motion Design System — ParallaxMedia
 *
 * Restrained scroll-linked vertical parallax for media.
 * - Desktop only
 * - Disabled for prefers-reduced-motion
 * - Transform-only (no layout thrash)
 * - No scroll hijacking
 */

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { BREAKPOINTS, PARALLAX_MAX } from "./motion-config";
import { loadGsap } from "./load-gsap";
import { useReducedMotion } from "./useReducedMotion";

interface ParallaxMediaProps {
  children: ReactNode;
  className?: string;
  /** Maximum parallax distance in px (default 24). */
  maxDistance?: number;
  /** Multiplier direction: 1 = moves with scroll feel, -1 = opposite. */
  direction?: 1 | -1;
}

export function ParallaxMedia({
  children,
  className = "",
  maxDistance = PARALLAX_MAX,
  direction = 1,
}: ParallaxMediaProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    if (typeof window === "undefined") return;
    if (window.innerWidth < BREAKPOINTS.mobile) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;

    loadGsap()
      .then(({ gsap }) => {
        if (cancelled || !ref.current) return;

        const el = ref.current;
        const distance = Math.min(Math.max(maxDistance, 12), 32) * direction;

        ctx = gsap.context(() => {
          gsap.fromTo(
            el,
            { y: -distance * 0.35 },
            {
              y: distance * 0.65,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            },
          );
        }, ref);
      })
      .catch(() => {
        // Static media remains.
      });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced, maxDistance, direction]);

  return (
    <div ref={ref} className={`relative ${className}`.trim()}>
      {children}
    </div>
  );
}
