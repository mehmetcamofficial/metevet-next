/**
 * MeteVet Immersive Depth System — Shared Configuration
 *
 * Restrained CSS 3D values for a calm, clinical premium feel.
 * Keep rotations small to avoid motion sickness.
 */

export const IMMERSIVE = {
  /** Outer perspective (px) */
  perspective: 1200,
  /** Max rotateX (deg) — pointer tilt */
  maxRotateX: 3,
  /** Max rotateY (deg) — pointer tilt */
  maxRotateY: 4,
  /** TranslateZ for layered media (px) */
  translateZMin: 20,
  translateZMax: 60,
  /** Hover lift (px) */
  hoverLift: 6,
  /** Media scale on hover */
  mediaScale: 1.035,
  /** Scroll parallax range (px) */
  scrollParallaxMin: 16,
  scrollParallaxMax: 48,
  /** Pointer quickTo duration */
  tiltDuration: 0.45,
  /** Desktop breakpoint (match motion system) */
  mobile: 768,
  /** Gallery desktop vertical offsets */
  galleryOffsets: [0, 56, 18] as const,
} as const;

export const IMMERSIVE_EASE = "power2.out";
