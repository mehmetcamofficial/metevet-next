/**
 * MeteVet Global Motion Design System — Shared Configuration
 *
 * Centralised durations, easings, thresholds and breakpoints
 * so every motion component speaks the same language.
 */

// ── Timing ──

export const DURATIONS = {
  /** Standard reveal (fade + y) */
  reveal: 0.85,
  /** Fast reveal for small elements (chips, icons) */
  revealFast: 0.55,
  /** BlurText word-by-word reveal */
  blurText: 0.6,
  /** Stagger delay between children (60–110 ms) */
  stagger: 0.08,
  /** Hover transition */
  hover: 0.35,
  /** Page transition (250–450 ms) */
  pageTransition: 0.35,
  /** Count-up animation */
  countUp: 1.8,
  /** FAQ accordion */
  accordion: 0.32,
} as const;

// ── Easing ──

export const EASE_OUT = "power3.out";
export const EASE_OUT_SMALL = "power2.out";
export const EASE_IN_OUT = "power1.inOut";

// ── Viewport ──

/** Trigger reveal when this fraction of the element is visible */
export const VIEWPORT_AMOUNT = 0.15;

/** Root margin for IntersectionObserver (negative bottom = trigger slightly later) */
export const VIEWPORT_MARGIN = "0px 0px -40px 0px";

/** ScrollTrigger start string (~15–20% visible) */
export const SCROLL_START = "top 85%";

// ── Motion values ──

export const REVEAL_Y = 30;
export const REVEAL_BLUR = 10;
export const PARALLAX_MAX = 24;
export const HOVER_CARD_RISE = 6;
export const HOVER_IMAGE_SCALE = 1.03;
export const HOVER_ARROW_X = 4;

// ── Breakpoints ──

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;

// ── Reduced motion ──

export const REDUCED_MOTION_OVERRIDE_DURATION = 0.01;
