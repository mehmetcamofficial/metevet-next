/**
 * Children enter with staggered depth (opacity + y + slight z feel via scale).
 * Reuses StaggerGroup timing concepts without duplicating reduced-motion logic.
 */

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { loadGsap } from "@/src/components/motion/load-gsap";
import { useReducedMotion, DURATIONS, EASE_OUT, SCROLL_START } from "@/src/components/motion";

type ScrollDepthGroupProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
};

export function ScrollDepthGroup({
  children,
  className = "",
  stagger = DURATIONS.stagger,
}: ScrollDepthGroupProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !ref.current) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;

    loadGsap()
      .then(({ gsap }) => {
        if (cancelled || !ref.current) return;
        const kids = Array.from(ref.current.children) as HTMLElement[];
        if (!kids.length) return;

        const rect = ref.current.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) return;

        gsap.set(kids, { autoAlpha: 0, y: 28, scale: 0.985 });

        ctx = gsap.context(() => {
          gsap.to(kids, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: DURATIONS.reveal,
            stagger,
            ease: EASE_OUT,
            clearProps: "opacity,visibility,transform",
            scrollTrigger: {
              trigger: ref.current,
              start: SCROLL_START,
              once: true,
            },
          });
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
  }, [reduced, stagger]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
