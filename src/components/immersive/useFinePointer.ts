"use client";

import { useSyncExternalStore } from "react";
import { IMMERSIVE } from "./immersive-config";

const QUERY = "(pointer: fine)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  let frame: number | null = null;
  const onResize = () => {
    if (frame === null) frame = window.requestAnimationFrame(() => { frame = null; onChange(); });
  };
  mq.addEventListener("change", onChange);
  window.addEventListener("resize", onResize, { passive: true });
  return () => {
    mq.removeEventListener("change", onChange);
    window.removeEventListener("resize", onResize);
    if (frame !== null) window.cancelAnimationFrame(frame);
  };
}

function getSnapshot() {
  return (
    window.matchMedia(QUERY).matches && window.innerWidth >= IMMERSIVE.mobile
  );
}

function getServerSnapshot() {
  return false;
}

/** True only for desktop fine-pointer devices. */
export function useFinePointer(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
