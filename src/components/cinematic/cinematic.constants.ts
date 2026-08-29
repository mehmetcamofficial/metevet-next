/**
 * MeteVet Cinematic Hero — shared configuration.
 *
 * The source sequence is three separate shots joined by two cross-dissolves.
 * The dissolve ranges contain double-exposure ghosting artifacts, so scroll
 * progress is retimed to linger on the clean shots and pass quickly through
 * the dissolves. See CINEMATIC_SEGMENTS.
 */

export const TOTAL_FRAMES = 180;

/** Frames 179 and 180 are byte-identical duplicates; never target the last one. */
export const LAST_USABLE_FRAME = 178;

export const FRAME_PATH_PREFIX = "/images/cinematic-smooth/frame-";

export function frameUrl(index: number): string {
  return `${FRAME_PATH_PREFIX}${String(index + 1).padStart(3, "0")}.jpg`;
}

/**
 * Piecewise scroll retiming.
 *
 * `weight` is the share of scroll distance the segment receives; `from`/`to`
 * are frame indices. Dissolve segments cover many frames in little scroll,
 * so their artifacts flick past instead of being parked on.
 */
export type CinematicSegment = {
  id: "approach" | "dissolve-a" | "examination" | "dissolve-b" | "reception";
  from: number;
  to: number;
  weight: number;
  clean: boolean;
};

export const CINEMATIC_SEGMENTS: readonly CinematicSegment[] = [
  { id: "approach", from: 0, to: 82, weight: 0.3, clean: true },
  { id: "dissolve-a", from: 82, to: 112, weight: 0.1, clean: false },
  { id: "examination", from: 112, to: 148, weight: 0.28, clean: true },
  { id: "dissolve-b", from: 148, to: 162, weight: 0.07, clean: false },
  { id: "reception", from: 162, to: LAST_USABLE_FRAME, weight: 0.25, clean: true },
] as const;

const TOTAL_WEIGHT = CINEMATIC_SEGMENTS.reduce((sum, s) => sum + s.weight, 0);

/** Maps scroll progress (0–1) to a fractional frame index. */
export function progressToFrame(progress: number): number {
  const clamped = Math.max(0, Math.min(1, progress));
  let travelled = 0;

  for (const segment of CINEMATIC_SEGMENTS) {
    const share = segment.weight / TOTAL_WEIGHT;
    if (clamped <= travelled + share || segment.id === "reception") {
      const local = share === 0 ? 0 : (clamped - travelled) / share;
      const bounded = Math.max(0, Math.min(1, local));
      return segment.from + (segment.to - segment.from) * bounded;
    }
    travelled += share;
  }

  return LAST_USABLE_FRAME;
}

/**
 * Frames that must be available early for scrubbing to feel responsive.
 * Segment boundaries plus a coarse ladder across the whole sequence.
 */
export function buildPriorityLadder(): number[] {
  const ladder = new Set<number>([0]);
  for (const segment of CINEMATIC_SEGMENTS) {
    ladder.add(segment.from);
    ladder.add(segment.to);
  }
  for (let i = 0; i <= LAST_USABLE_FRAME; i += 12) ladder.add(i);
  return [...ladder].sort((a, b) => a - b);
}

// ── Quality tiers ──

export type CinematicTier = "full" | "reduced" | "lite" | "static";

/**
 * Frame stride per tier. A stride of 3 means every third frame is fetched,
 * cutting transfer and decoded-bitmap memory to a third while keeping the
 * sequence scroll-driven rather than falling back to a still image.
 */
export const TIER_STRIDE: Record<CinematicTier, number> = {
  full: 1,
  reduced: 2,
  lite: 3,
  static: 0,
};

/** Scroll height of the pinned section per tier, in viewport heights. */
export const TIER_SCROLL_VH: Record<CinematicTier, number> = {
  full: 500,
  reduced: 420,
  lite: 320,
  static: 100,
};

export const PRELOAD_CONCURRENCY = 6;

/**
 * Upper bound for retained HTMLImageElements. Decoding is windowed too, but
 * retaining every fetched image can still leave browsers holding decoded
 * surfaces. These limits keep the scrolling experience smooth without making
 * the sequence an all-at-once memory allocation.
 */
export const TIER_FRAME_CACHE_LIMIT: Record<CinematicTier, number> = {
  full: 52,
  reduced: 40,
  lite: 28,
  static: 1,
};

export const FRAME_WINDOW = { behind: 10, ahead: 16 } as const;

/** Pure, testable window used for both frame prefetching and eviction. */
export function getCinematicFrameWindow(index: number, tier: CinematicTier): number[] {
  const stride = TIER_STRIDE[tier];
  if (stride <= 0) return [0];

  const centre = Math.max(0, Math.min(LAST_USABLE_FRAME, Math.round(index)));
  const frames = new Set<number>();
  for (let frame = centre - FRAME_WINDOW.behind; frame <= centre + FRAME_WINDOW.ahead; frame++) {
    if (frame < 0 || frame > LAST_USABLE_FRAME) continue;
    if (frame % stride === 0) frames.add(frame);
  }
  frames.add(0);
  frames.add(LAST_USABLE_FRAME);
  for (const segment of CINEMATIC_SEGMENTS) {
    if (segment.from >= centre - FRAME_WINDOW.behind && segment.from <= centre + FRAME_WINDOW.ahead) {
      frames.add(segment.from);
    }
    if (segment.to >= centre - FRAME_WINDOW.behind && segment.to <= centre + FRAME_WINDOW.ahead) {
      frames.add(segment.to);
    }
  }
  return [...frames].sort((a, b) => a - b);
}

export type CinematicLifecycle = "active" | "released";

/**
 * Diagnostic lifecycle state. Layout release itself is owned by CSS sticky
 * containment, so this value never toggles positioning or visibility.
 */
export function getCinematicLifecycle(progress: number): CinematicLifecycle {
  return progress >= 1 ? "released" : "active";
}

export function isCinematicReleased(progress: number): boolean {
  return getCinematicLifecycle(progress) === "released";
}

/**
 * Hand-off visual state for the sticky hero plate as scroll progress crosses
 * HANDOFF_START. Must reach fully transparent (opacity 0) and non-interactive
 * by progress 1 — the sticky viewport keeps the plate within the layout for
 * roughly one more viewport height after release, so anything short of full
 * transparency here shows up as a lingering ghost over the next section.
 */
export type CinematicHandoff = {
  opacity: number;
  scale: number;
  pointerEvents: "auto" | "none";
};

export function getCinematicHandoff(progress: number): CinematicHandoff {
  const handoff = Math.max(0, Math.min(1, (progress - HANDOFF_START) / (1 - HANDOFF_START)));
  return {
    opacity: 1 - handoff,
    scale: 1 - handoff * 0.05,
    pointerEvents: handoff >= 1 ? "none" : "auto",
  };
}

// ── Rendering ──

export const ZOOM_FACTOR = 1.18;
export const MAX_DPR = 2;
export const DAMPING_RESPONSE = 14;
export const FRAME_SEARCH_RADIUS = 24;

// ── Pointer depth ──

/** Peak pointer travel in px for each depth layer. Deliberately restrained. */
export const DEPTH_AMPLITUDE = {
  background: 6,
  midground: 14,
  foreground: 22,
  ui: 3,
} as const;

/**
 * Local gaze warp applied to the cat's head during the examination shot.
 *
 * The cat cannot be isolated from the photography, so a small feathered
 * region around its head is redrawn with an independent offset. Amplitudes
 * are intentionally tiny — this must read as the animal shifting, never as
 * the image tearing.
 */
export const CAT_GAZE = {
  /** Head centre as a fraction of the source image, measured from frames 114–149. */
  anchorX: 0.545,
  anchorY: 0.6,
  /** Radius of the warped region as a fraction of source width. */
  radius: 0.12,
  /** Fraction of the radius used for the alpha falloff. */
  feather: 0.45,
  maxTranslatePx: 5,
  maxRotateRad: 0.022,
  damping: 6,
} as const;

/** Frame range over which the cat is on screen and the gaze warp is active. */
export const CAT_VISIBLE_RANGE = { from: 112, to: 150 } as const;

// ── Narrative beats ──

export type SceneId = "intro" | "trust" | "expertise" | "atmosphere" | "exit";

export type CinematicScene = {
  id: SceneId;
  /** Scroll progress window during which the scene is fully visible. */
  start: number;
  end: number;
};

/**
 * Beats are placed against the retimed segment boundaries, which fall at
 * 0.30 / 0.40 / 0.68 / 0.75 of scroll. Each beat sits wholly inside a clean
 * shot, and the gaps between them are exactly where the dissolves play — so
 * the ghosting passes with no copy on screen to draw the eye to it.
 */
export const CINEMATIC_SCENES: readonly CinematicScene[] = [
  { id: "intro", start: 0, end: 0.15 },
  { id: "trust", start: 0.18, end: 0.28 },
  { id: "expertise", start: 0.44, end: 0.64 },
  { id: "atmosphere", start: 0.78, end: 0.86 },
  { id: "exit", start: 0.89, end: 1 },
] as const;

/** Progress past which the hero begins handing off to the page below. */
export const HANDOFF_START = 0.9;
