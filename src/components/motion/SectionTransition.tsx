/**
 * MeteVet Global Motion Design System — SectionTransition
 *
 * Lightweight section-level enter animation. Prefer wrapping section content
 * rather than replacing semantic section tags when IDs/ARIA matter.
 */

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { DURATIONS, EASE_OUT, REVEAL_Y, SCROLL_START } from "./motion-config";
import { loadGsap } from "./load-gsap";
import { useReducedMotion } from "./useReducedMotion";

interface SectionTransitionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}

export function SectionTransition({
  children,
  className = "",
  delay = 0,
  once = true,
}: SectionTransitionProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (reduced) return;
    if (once && animated.current) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;

    loadGsap()
      .then(({ gsap }) => {
        if (cancelled || !ref.current) return;
        if (once && animated.current) return;

        const el = ref.current;
        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
        if (inView) {
          animated.current = true;
          return;
        }

        gsap.set(el, { autoAlpha: 0, y: REVEAL_Y });

        ctx = gsap.context(() => {
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: REVEAL_Y },
            {
              autoAlpha: 1,
              y: 0,
              duration: DURATIONS.reveal,
              delay,
              ease: EASE_OUT,
              immediateRender: false,
              clearProps: "opacity,visibility,transform",
              scrollTrigger: {
                trigger: el,
                start: SCROLL_START,
                once,
                invalidateOnRefresh: true,
              },
              onComplete: () => {
                animated.current = true;
              },
            },
          );
        }, ref);
      })
      .catch(() => {
        // Content remains visible.
      });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced, delay, once]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
