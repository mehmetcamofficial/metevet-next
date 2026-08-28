/**
 * Subtle cursor-following highlight via CSS variables (no React setState).
 * Fine pointer + reduced-motion aware.
 */

"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { useReducedMotion } from "@/src/components/motion";
import { useFinePointer } from "./useFinePointer";

type SpotlightSurfaceProps = {
  children: ReactNode;
  className?: string;
  intensity?: number;
} & HTMLAttributes<HTMLDivElement>;

export function SpotlightSurface({
  children,
  className = "",
  intensity = 0.14,
  ...rest
}: SpotlightSurfaceProps) {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !fine) return;
    const el = ref.current;
    if (!el) return;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--spot-x", `${x}%`);
      el.style.setProperty("--spot-y", `${y}%`);
    };

    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, [reduced, fine]);

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden ${className}`.trim()}
      style={
        {
          "--spot-x": "50%",
          "--spot-y": "20%",
          "--spot-a": String(intensity),
        } as CSSProperties
      }
      {...rest}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 opacity-70 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(320px circle at var(--spot-x) var(--spot-y), rgba(205,168,95,var(--spot-a)), transparent 60%)",
        }}
      />
      <div className="relative z-0 h-full w-full">{children}</div>
    </div>
  );
}
