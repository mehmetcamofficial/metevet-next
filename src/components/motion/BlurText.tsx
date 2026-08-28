/**
 * MeteVet Global Motion Design System — BlurText
 *
 * Word-by-word blur-to-clear reveal using real semantic HTML.
 * Screen readers get a single sr-only string; visual words are aria-hidden
 * to avoid duplicate announcement.
 */

"use client";

import { useEffect, useRef } from "react";
import { DURATIONS, EASE_OUT, REVEAL_BLUR, SCROLL_START } from "./motion-config";
import { loadGsap } from "./load-gsap";
import { useReducedMotion } from "./useReducedMotion";

interface BlurTextProps {
  children: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  once?: boolean;
}

function isApproximatelyInView(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || 0;
  return rect.top < vh * 0.92 && rect.bottom > 0;
}

export function BlurText({
  children,
  as: Tag = "span",
  className = "",
  delay = 0,
  duration = DURATIONS.blurText,
  stagger = 0.045,
  once = true,
}: BlurTextProps) {
  const reduced = useReducedMotion();
  const visualRef = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (reduced) return;
    if (once && animated.current) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;

    loadGsap()
      .then(({ gsap }) => {
        if (cancelled || !visualRef.current) return;
        if (once && animated.current) return;

        const words = visualRef.current.querySelectorAll<HTMLElement>(".blur-word");
        if (!words.length) return;

        if (isApproximatelyInView(visualRef.current)) {
          animated.current = true;
          return;
        }

        const fromVars = {
          autoAlpha: 0,
          y: 12,
          filter: `blur(${REVEAL_BLUR}px)`,
        };

        gsap.set(words, fromVars);

        ctx = gsap.context(() => {
          gsap.fromTo(words, fromVars, {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration,
            delay,
            stagger,
            ease: EASE_OUT,
            immediateRender: false,
            clearProps: "opacity,visibility,transform,filter",
            scrollTrigger: {
              trigger: visualRef.current,
              start: SCROLL_START,
              once,
              invalidateOnRefresh: true,
            },
            onComplete: () => {
              animated.current = true;
            },
          });
        }, visualRef);
      })
      .catch(() => {
        // Content remains readable.
      });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced, children, duration, stagger, delay, once]);

  const words = children.trim().split(/\s+/).filter(Boolean);

  return (
    <Tag className={className}>
      <span className="sr-only">{children}</span>
      <span ref={visualRef} className="inline" aria-hidden="true">
        {words.map((word, i) => (
          <span
            key={`${i}-${word}`}
            className="blur-word inline-block will-change-[filter,transform,opacity]"
          >
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </span>
        ))}
      </span>
    </Tag>
  );
}
