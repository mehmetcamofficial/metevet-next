/**
 * MeteVet Global Motion Design System — StaggerGroup
 *
 * Staggered reveal for direct children (single ScrollTrigger for the group).
 */

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  DURATIONS,
  EASE_OUT,
  REVEAL_Y,
  SCROLL_START,
} from "./motion-config";
import { loadGsap } from "./load-gsap";
import { useReducedMotion } from "./useReducedMotion";

interface StaggerGroupProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  duration?: number;
  delay?: number;
  once?: boolean;
  /** Extra y offset applied alternately on desktop for visual rhythm. */
  alternateOffset?: number;
}

function isApproximatelyInView(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || 0;
  return rect.top < vh * 0.92 && rect.bottom > 0;
}

export function StaggerGroup({
  children,
  className = "",
  stagger = DURATIONS.stagger,
  duration = DURATIONS.reveal,
  delay = 0,
  once = true,
  alternateOffset = 0,
}: StaggerGroupProps) {
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
        const childrenEls = Array.from(el.children) as HTMLElement[];
        if (!childrenEls.length) return;

        if (isApproximatelyInView(el)) {
          animated.current = true;
          return;
        }

        const desktopAlt =
          alternateOffset > 0 && window.innerWidth >= 768 ? alternateOffset : 0;

        gsap.set(childrenEls, { autoAlpha: 0, y: REVEAL_Y });

        ctx = gsap.context(() => {
          gsap.fromTo(
            childrenEls,
            { autoAlpha: 0, y: REVEAL_Y },
            {
              autoAlpha: 1,
              y: (i: number) => (desktopAlt && i % 2 === 1 ? desktopAlt : 0),
              duration,
              stagger,
              delay,
              ease: EASE_OUT,
              immediateRender: false,
              clearProps: "opacity,visibility",
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
        if (!ref.current) return;
        for (const child of Array.from(ref.current.children) as HTMLElement[]) {
          child.style.opacity = "";
          child.style.visibility = "";
          child.style.transform = "";
        }
      });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced, stagger, duration, delay, once, alternateOffset]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
