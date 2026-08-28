import type { Vector3Tuple } from "three";

export const COMPANION_MODEL_PATH = "/models/animals/metevet-cat.glb";

export const COMPANION_CLIPS = {
  idle: "Idle",
  walk: "WalkClean",
  sit: "SitDown",
  sittingIdle: "SittingIdle",
  stand: "StandUp",
} as const;

export const COMPANION_CONFIG = {
  pointerSettleMs: 350,
  destinationDeadZone: 0.4,
  pointerOffset: 0.45,
  walkSpeed: 1.15,
  rotationDamping: 8,
  accelerationDamping: 6,
  arrivalRadius: 0.22,
  maximumDelta: 0.05,
  crossfadeSeconds: 0.22,
  idleReturnSeconds: 10,
  greetSeconds: 1.5,
  headYawRadians: (8 * Math.PI) / 180,
  headPitchRadians: (5 * Math.PI) / 180,
  orthographicHalfHeight: 3,
  targetCssHeight: 126,
  compactTargetCssHeight: 100,
  minimumNormalizedScale: 0.05,
  maximumNormalizedScale: 0.5,
  navigationNdc: { minX: -0.82, maxX: 0.82, minY: -0.78, maxY: -0.32 },
} as const;

// Dedicated fixed-canvas anchors in normalized device coordinates.
// They are intentionally distinct from the Clinic Journey's perspective-space
// coordinates and are projected through the orthographic companion camera.
export const COMPANION_SCREEN_ANCHORS = {
  welcome: [0.58, -0.7, 0],
  examination: [0.48, -0.7, 0],
  diagnosis: [0.66, -0.7, 0],
  recovery: [0.52, -0.7, 0],
  location: [0.62, -0.7, 0],
  journey: [0.58, -0.7, 0],
  trust: [0.64, -0.7, 0],
  services: [-0.62, -0.7, 0],
  doctor: [0.62, -0.7, 0],
  gallery: [-0.54, -0.7, 0],
  philosophy: [0.58, -0.7, 0],
  appointment: [-0.6, -0.7, 0],
  blog: [0.66, -0.7, 0],
  faq: [-0.66, -0.7, 0],
  contact: [0.56, -0.7, 0],
  footer: [-0.56, -0.7, 0],
} satisfies Record<string, Vector3Tuple>;

// Normalized viewport rectangles. Targets inside these UI regions are pushed
// to the nearest edge before the raycast is evaluated.
export const COMPANION_EXCLUSION_ZONES = [
  { id: "navbar", left: 0, top: 0, right: 1, bottom: 0.13 },
  { id: "story-card", left: 0, top: 0.5, right: 0.58, bottom: 1 },
  { id: "journey-controls", left: 0.7, top: 0.05, right: 1, bottom: 0.66 },
  { id: "quiz-completion", left: 0.48, top: 0.42, right: 1, bottom: 1 },
  { id: "whatsapp", left: 0.84, top: 0.78, right: 1, bottom: 1 },
] as const;
