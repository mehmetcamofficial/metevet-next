/**
 * Restrained pointer tilt using GSAP quickTo (no React state per frame).
 * Disabled for reduced-motion, coarse pointers, and mobile widths.
 */

"use client";

import { useEffect, useRef, type ReactNode, type HTMLAttributes } from "react";
import { loadGsap } from "@/src/components/motion/load-gsap";
import { useReducedMotion } from "@/src/components/motion";
import { IMMERSIVE, IMMERSIVE_EASE } from "./immersive-config";
import { useFinePointer } from "./useFinePointer";

type PointerTiltProps = {
  children: ReactNode;
  className?: string;
  maxRotateX?: number;
  maxRotateY?: number;
  disabled?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export function PointerTilt({
  children,
  className = "",
  maxRotateX = IMMERSIVE.maxRotateX,
  maxRotateY = IMMERSIVE.maxRotateY,
  disabled = false,
  ...rest
}: PointerTiltProps) {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const outerRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled || reduced || !fine) return;
    const outer = outerRef.current;
    const motion = motionRef.current;
    if (!outer || !motion) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let quickX: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let quickY: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let quickZ: any;
    let onMove: ((event: PointerEvent) => void) | undefined;
    let onLeave: (() => void) | undefined;

    loadGsap()
      .then(({ gsap }) => {
        if (cancelled || !motionRef.current || !outerRef.current) return;

        gsap.set(motion, { transformPerspective: IMMERSIVE.perspective, force3D: true });

        quickX = gsap.quickTo(motion, "rotateX", {
          duration: IMMERSIVE.tiltDuration,
          ease: IMMERSIVE_EASE,
        });
        quickY = gsap.quickTo(motion, "rotateY", {
          duration: IMMERSIVE.tiltDuration,
          ease: IMMERSIVE_EASE,
        });
        quickZ = gsap.quickTo(motion, "z", {
          duration: IMMERSIVE.tiltDuration,
          ease: IMMERSIVE_EASE,
        });

        onMove = (event: PointerEvent) => {
          if (event.pointerType !== "mouse") return;
          const rect = outer.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          quickY?.(px * maxRotateY * 2);
          quickX?.(-py * maxRotateX * 2);
          quickZ?.(IMMERSIVE.translateZMin);
        };

        onLeave = () => {
          quickX?.(0);
          quickY?.(0);
          quickZ?.(0);
        };

        outer.addEventListener("pointermove", onMove);
        outer.addEventListener("pointerleave", onLeave);
      })
      .catch(() => {
        // Static card remains.
      });

    return () => {
      cancelled = true;
      quickX?.kill();
      quickY?.kill();
      quickZ?.kill();
      if (onMove) outer.removeEventListener("pointermove", onMove);
      if (onLeave) outer.removeEventListener("pointerleave", onLeave);
      if (motion) motion.style.transform = "";
    };
  }, [disabled, reduced, fine, maxRotateX, maxRotateY]);

  return (
    <div
      ref={outerRef}
      className={`relative overflow-visible ${className}`.trim()}
      style={{ perspective: `${IMMERSIVE.perspective}px` }}
      {...rest}
    >
      <div
        ref={motionRef}
        className="relative h-full w-full will-change-transform [transform-style:preserve-3d]"
      >
        {children}
      </div>
    </div>
  );
}
