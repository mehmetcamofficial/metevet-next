export type CompanionPointer = { x: number; y: number; active: boolean };

export type CompanionGaze = { yaw: number; pitch: number };

export function normalizeCompanionPointer(
  clientX: number,
  clientY: number,
  viewportWidth: number,
  viewportHeight: number,
): CompanionPointer {
  const width = Math.max(1, viewportWidth);
  const height = Math.max(1, viewportHeight);
  return {
    x: Math.max(-1, Math.min(1, (clientX / width) * 2 - 1)),
    y: Math.max(-1, Math.min(1, -(clientY / height) * 2 + 1)),
    active: true,
  };
}

export function clampCompanionGaze(
  pointer: CompanionPointer,
  yawLimit: number,
  pitchLimit: number,
): CompanionGaze {
  if (!pointer.active) return { yaw: 0, pitch: 0 };
  return {
    yaw: Math.max(-yawLimit, Math.min(yawLimit, pointer.x * yawLimit)),
    pitch: Math.max(-pitchLimit, Math.min(pitchLimit, -pointer.y * pitchLimit)),
  };
}

export function getCompanionTargetCssHeight(viewportHeight: number, compact: number, desktop: number) {
  return viewportHeight < 800 ? compact : desktop;
}
