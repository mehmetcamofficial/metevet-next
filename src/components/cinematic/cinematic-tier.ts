import type { CinematicTier } from "./cinematic.constants";

export type CinematicCapabilities = {
  reducedMotion: boolean;
  saveData: boolean;
  effectiveType?: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  viewportWidth: number;
};

/**
 * Capability policy kept separate from browser APIs so mobile behavior can be
 * tested deterministically. Modern phones receive the animated lite tier.
 */
export function selectCinematicTier({
  reducedMotion,
  saveData,
  effectiveType,
  deviceMemory,
  hardwareConcurrency,
  viewportWidth,
}: CinematicCapabilities): CinematicTier {
  if (reducedMotion || saveData) return "static";
  if (effectiveType === "slow-2g" || effectiveType === "2g") return "static";
  if (effectiveType === "3g") return "lite";
  if (typeof deviceMemory === "number" && deviceMemory <= 4) return "lite";
  if (typeof hardwareConcurrency === "number" && hardwareConcurrency <= 4) return "lite";
  if (viewportWidth < 768) return "lite";
  if (viewportWidth < 1024) return "reduced";
  return "full";
}
