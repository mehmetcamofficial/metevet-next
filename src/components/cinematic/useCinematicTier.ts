"use client";

import { useSyncExternalStore } from "react";
import type { CinematicTier } from "./cinematic.constants";

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

type CapabilityNavigator = Navigator & {
  connection?: NetworkInformation;
  deviceMemory?: number;
};

function detectTier(): CinematicTier {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";

  const nav = navigator as CapabilityNavigator;
  if (nav.connection?.saveData) return "static";

  const effectiveType = nav.connection?.effectiveType;
  if (effectiveType === "slow-2g" || effectiveType === "2g") return "static";
  if (effectiveType === "3g") return "lite";

  const memory = nav.deviceMemory;
  if (typeof memory === "number" && memory <= 4) return "lite";
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return "lite";

  const width = window.innerWidth;
  if (width < 768) return "lite";
  if (width < 1024) return "reduced";
  return "full";
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
