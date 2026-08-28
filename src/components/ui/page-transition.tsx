"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DURATIONS, EASE_OUT, useReducedMotion } from "@/src/components/motion";
import { loadGsap } from "@/src/components/motion/load-gsap";

/**
 * Lightweight public route enter transition.
 * - Does not block back/forward navigation
 * - Skips admin routes
 * - Reduced motion shows content immediately
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const isAdmin = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (isAdmin || reduced) return;
    if (!ref.current) return;

    // Skip the very first paint to avoid fighting SSR hydration / loading.tsx.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tween: any;

    loadGsap()
      .then(({ gsap }) => {
        if (cancelled || !ref.current) return;
        tween = gsap.fromTo(
          ref.current,
          { autoAlpha: 0.001, y: 10, filter: "blur(4px)" },
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: DURATIONS.pageTransition,
            ease: EASE_OUT,
            clearProps: "opacity,visibility,transform,filter",
          },
        );
      })
      .catch(() => {
        // Content already visible.
      });

    return () => {
      cancelled = true;
      tween?.kill?.();
    };
  }, [pathname, reduced, isAdmin]);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div ref={ref} className="min-h-0">
      {children}
    </div>
  );
}
