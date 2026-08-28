/**
 * Perspective card shell: outer perspective + optional desktop offset.
 * Does not apply hover CSS transforms to the same node as GSAP tilt.
 */

"use client";

import type { CSSProperties, ReactNode } from "react";
import { PointerTilt } from "./PointerTilt";
import { IMMERSIVE } from "./immersive-config";

type PerspectiveCardProps = {
  children: ReactNode;
  className?: string;
  /** Desktop-only vertical offset (px). */
  offsetY?: number;
  enableTilt?: boolean;
};

export function PerspectiveCard({
  children,
  className = "",
  offsetY = 0,
  enableTilt = true,
}: PerspectiveCardProps) {
  const style: CSSProperties | undefined =
    offsetY > 0
      ? ({
          ["--card-offset" as string]: `${offsetY}px`,
        } as CSSProperties)
      : undefined;

  const offsetClass =
    offsetY > 0 ? "md:translate-y-[var(--card-offset)]" : "";

  if (!enableTilt) {
    return (
      <div
        className={`relative overflow-visible ${className} ${offsetClass}`.trim()}
        style={{ perspective: `${IMMERSIVE.perspective}px`, ...style }}
      >
        {children}
      </div>
    );
  }

  return (
    <PointerTilt
      className={`relative overflow-visible ${className} ${offsetClass}`.trim()}
      style={style}
      maxRotateX={IMMERSIVE.maxRotateX}
      maxRotateY={IMMERSIVE.maxRotateY}
    >
      {children}
    </PointerTilt>
  );
}
