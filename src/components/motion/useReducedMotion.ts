/**
 * MeteVet Global Motion Design System — Reduced Motion Hook
 *
 * Wraps window.matchMedia("prefers-reduced-motion: reduce")
 * and listens for runtime changes via useSyncExternalStore.
 */

"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onStoreChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  // Prefer full motion on SSR to avoid hydration mismatches;
  // client will correct immediately if reduced motion is preferred.
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Imperative check — client only. Returns false during SSR. */
export function isReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(QUERY).matches;
}
