/**
 * MeteVet Global Motion Design System — MotionProvider
 *
 * Client Component that preloads GSAP + ScrollTrigger once.
 * Does NOT hijack scroll, intercept wheel/touch, or replace the scrollbar.
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { loadGsap } from "./load-gsap";

interface MotionProviderProps {
  children: ReactNode;
}

export function MotionProvider({ children }: MotionProviderProps) {
  useEffect(() => {
    let active = true;

    loadGsap().catch(() => {
      // Motion is progressive; failure leaves content static and visible.
    });

    return () => {
      active = false;
      // Kill only if still mounted teardown path completed load.
      void loadGsap().then(({ gsap }) => {
        if (!active) {
          // Provider unmounted — do not globally kill page-level tweens
          // owned by still-mounted children; they clean themselves up.
          void gsap;
        }
      });
    };
  }, []);

  return <>{children}</>;
}
