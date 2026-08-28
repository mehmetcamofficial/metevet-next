"use client";

import { useEffect, useState } from "react";
import { WEBGL_CONFIG, type WebGLQuality } from "./webgl-config";

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
};

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function useAdaptiveQuality() {
  const [quality, setQuality] = useState<WebGLQuality>("low");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const connection = (navigator as NavigatorWithConnection).connection;
      const saveData = connection?.saveData === true;
      const mobile = window.innerWidth < WEBGL_CONFIG.mobileBreakpoint;
      const lowPower = connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g";

      if (reduced || saveData || lowPower || mobile || !hasWebGL()) {
        setQuality("low");
      } else {
        setQuality(window.devicePixelRatio < 1.25 ? "medium" : "high");
      }
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return { quality, ready };
}
