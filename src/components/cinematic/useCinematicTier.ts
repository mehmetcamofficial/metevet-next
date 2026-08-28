"use client";

import { useSyncExternalStore } from "react";
import type { CinematicTier } from "./cinematic.constants";
import { selectCinematicTier } from "./cinematic-tier";

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

type CapabilityNavigator = Navigator & {
  connection?: NetworkInformation;
  deviceMemory?: number;
};

function detectTier(): CinematicTier {
  const nav = navigator as CapabilityNavigator;
  return selectCinematicTier({
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: nav.connection?.saveData === true,
    effectiveType: nav.connection?.effectiveType,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    viewportWidth: window.innerWidth,
  });
}

function subscribe(onChange: () => void): () => void {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  motionQuery.addEventListener("change", onChange);
  window.addEventListener("resize", onChange);
  window.addEventListener("orientationchange", onChange);
  return () => {
    motionQuery.removeEventListener("change", onChange);
    window.removeEventListener("resize", onChange);
    window.removeEventListener("orientationchange", onChange);
  };
}

/**
 * Resolves the cinematic quality tier from device capability.
 *
 * Modelled as an external store: resize fires constantly but the snapshot is
 * a plain string, so React only re-renders when the tier genuinely changes.
 * The server snapshot is null, which renders the poster — also the correct
 * output for the `static` tier.
 */
export function useCinematicTier(): CinematicTier | null {
  return useSyncExternalStore(subscribe, detectTier, () => null);
}
