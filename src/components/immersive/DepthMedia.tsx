/**
 * Nested media layer: outer layout, motion z-depth, inner scale.
 * GSAP owns scroll depth; CSS owns hover scale on the *inner* node only.
 */

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { loadGsap } from "@/src/components/motion/load-gsap";
import { useReducedMotion } from "@/src/components/motion";
import { IMMERSIVE } from "./immersive-config";
import { useFinePointer } from "./useFinePointer";

type DepthMediaProps = {
  children: ReactNode;
  className?: string;
  maxDistance?: number;
  direction?: 1 | -1;
  /** Apply hover scale on inner wrapper (CSS only). */
  hoverScale?: boolean;
};

export function DepthMedia({
  children,
  className = "",
  maxDistance = IMMERSIVE.scrollParallaxMin + 8,
  direction = 1,
  hoverScale = true,
}: DepthMediaProps) {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const motionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !fine) return;
    if (!motionRef.current) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;

    const distance = Math.min(
      Math.max(maxDistance, IMMERSIVE.scrollParallaxMin),
      IMMERSIVE.scrollParallaxMax,
    );

    loadGsap()
      .then(({ gsap }) => {
        if (cancelled || !motionRef.current) return;
        const el = motionRef.current;
        ctx = gsap.context(() => {
          gsap.fromTo(
            el,
            { y: -distance * 0.3 * direction },
            {
              y: distance * 0.55 * direction,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.65,
                invalidateOnRefresh: true,
              },
            },
          );
        }, motionRef);
      })
      .catch(() => {
        // Static media.
      });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced, fine, maxDistance, direction]);

  return (
    <div className={`relative z-0 overflow-hidden ${className}`.trim()}>
      <div ref={motionRef} className="absolute inset-0 z-0 scale-110 opacity-100 visible will-change-transform">
        <div
          className={`relative h-full w-full opacity-100 visible transition-transform duration-500 ease-out ${
            hoverScale ? "group-hover:scale-[1.035]" : ""
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
