/**
 * MeteVet Global Motion Design System — CountUp
 *
 * Animated number counting, triggered once when in view.
 */

"use client";

import { useEffect, useRef } from "react";
import { DURATIONS, SCROLL_START } from "./motion-config";
import { loadGsap } from "./load-gsap";
import { useReducedMotion } from "./useReducedMotion";

interface CountUpProps {
  value: number;
  className?: string;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

function formatValue(val: number, decimals: number) {
  if (decimals > 0) return val.toFixed(decimals);
  return Math.round(val).toLocaleString();
}

export function CountUp({
  value,
  className = "",
  duration = DURATIONS.countUp,
  prefix = "",
  suffix = "",
  decimals = 0,
}: CountUpProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    if (reduced) {
      ref.current.textContent = `${prefix}${formatValue(value, decimals)}${suffix}`;
      return;
    }

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;

    loadGsap()
      .then(({ gsap }) => {
        if (cancelled || !ref.current) return;

        const obj = { val: 0 };
        const el = ref.current;

        ctx = gsap.context(() => {
          gsap.to(obj, {
            val: value,
            duration,
            ease: "power2.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: el,
              start: SCROLL_START,
              once: true,
            },
            onUpdate: () => {
              if (ref.current) {
                ref.current.textContent = `${prefix}${formatValue(obj.val, decimals)}${suffix}`;
              }
            },
          });
        }, ref);
      })
      .catch(() => {
        if (ref.current) {
          ref.current.textContent = `${prefix}${formatValue(value, decimals)}${suffix}`;
        }
      });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [value, reduced, duration, prefix, suffix, decimals]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatValue(value, decimals)}
      {suffix}
    </span>
  );
}
