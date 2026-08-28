/**
 * Singleton GSAP + ScrollTrigger loader.
 * Registers plugins once and reuses the same module promise.
 */

import type { gsap as GsapNS } from "gsap";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";

export type GsapBundle = {
  gsap: typeof GsapNS;
  ScrollTrigger: typeof ScrollTriggerType;
};

let loadPromise: Promise<GsapBundle> | null = null;

export function loadGsap(): Promise<GsapBundle> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("GSAP is client-only"));
  }

  if (!loadPromise) {
    loadPromise = Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([gsapModule, scrollTriggerModule]) => {
        const gsap = gsapModule.gsap;
        const ScrollTrigger = scrollTriggerModule.ScrollTrigger;

        gsap.registerPlugin(ScrollTrigger);
        gsap.config({
          autoSleep: 60,
          force3D: true,
          nullTargetWarn: false,
        });

        return { gsap, ScrollTrigger };
      },
    );
  }

  return loadPromise;
}
