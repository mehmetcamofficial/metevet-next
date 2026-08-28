export const WEBGL_CONFIG = {
  desktopDpr: 1.5,
  mobileDpr: 1,
  mobileBreakpoint: 768,
  journeyHeight: "320vh",
  cameraDamping: 5,
  pointerInfluence: 0.12,
  journeyStageStarts: [0, 0.18, 0.38, 0.58, 0.78],
} as const;

export type WebGLSceneKind = "clinic" | "portrait" | "services" | "contact";
export type WebGLQuality = "high" | "medium" | "low";
