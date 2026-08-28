/**
 * MeteVet Global Motion Design System — Reveal
 *
 * Scroll-triggered fade + translate using GSAP + ScrollTrigger.
 * - gsap.context() for cleanup
 * - prefers-reduced-motion skips animation (content stays visible)
 * - Animates once by default
 * - Markup never starts at opacity:0 (progressive enhancement)
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

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  duration?: number;
  once?: boolean;
  /** Optional blur in px (0 = none). */
  blur?: number;
  as?: "div" | "section" | "article" | "header" | "footer";
}

function isApproximatelyInView(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || 0;
  return rect.top < vh * 0.92 && rect.bottom > 0;
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = REVEAL_Y,
  duration = DURATIONS.reveal,
  once = true,
  blur = 0,
  as: Tag = "div",
}: RevealProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
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

        // Above-the-fold content stays static — no hide/show flash on first paint.
        if (isApproximatelyInView(el)) {
          animated.current = true;
          return;
        }

        if (process.env.NODE_ENV === "development") {
          console.info("[Reveal] trigger initialized", el);
        }

        const x =
          direction === "left" ? distance : direction === "right" ? -distance : 0;
        const y =
          direction === "up" ? distance : direction === "down" ? -distance : 0;

        const fromVars = {
          autoAlpha: 0,
          x,
          y,
          filter: blur > 0 ? `blur(${blur}px)` : "blur(0px)",
        };

        gsap.set(el, fromVars);

        ctx = gsap.context(() => {
          gsap.fromTo(el, fromVars, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            filter: "blur(0px)",
            duration,
            delay,
            ease: EASE_OUT,
            immediateRender: false,
            clearProps: "opacity,visibility,transform,filter",
            scrollTrigger: {
              trigger: el,
              start: SCROLL_START,
              once,
              invalidateOnRefresh: true,
            },
            onComplete: () => {
              animated.current = true;
            },
          });
        }, ref);
      })
      .catch(() => {
        if (ref.current) {
          ref.current.style.opacity = "";
          ref.current.style.visibility = "";
          ref.current.style.transform = "";
          ref.current.style.filter = "";
        }
      });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced, direction, distance, duration, delay, once, blur]);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
