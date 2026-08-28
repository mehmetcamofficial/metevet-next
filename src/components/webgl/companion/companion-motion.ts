import {
  Camera,
  MathUtils,
  Plane,
  Quaternion,
  Raycaster,
  Vector2,
  Vector3,
} from "three";

export type CompanionPointer = { x: number; y: number; active: boolean };

export type CompanionGaze = { yaw: number; pitch: number };

export type WorldGaze = CompanionGaze & { distance: number };

export type GazeLimits = {
  yaw: number;
  pitchUp: number;
  pitchDown: number;
};

export type GazeProjectionWorkspace = {
  raycaster: Raycaster;
  ndc: Vector2;
  plane: Plane;
  planeNormal: Vector3;
};

export function createGazeProjectionWorkspace(): GazeProjectionWorkspace {
  return {
    raycaster: new Raycaster(),
    ndc: new Vector2(),
    plane: new Plane(),
    planeNormal: new Vector3(),
  };
}

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

/** Projects a screen pointer through the active camera onto the cat's depth. */
export function projectPointerToWorldTarget(
  pointer: CompanionPointer,
  camera: Camera,
  planePoint: Vector3,
  target: Vector3,
  workspace: GazeProjectionWorkspace,
): boolean {
  if (!pointer.active) return false;
  workspace.ndc.set(pointer.x, pointer.y);
  camera.getWorldDirection(workspace.planeNormal).normalize();
  workspace.plane.setFromNormalAndCoplanarPoint(
    workspace.planeNormal,
    planePoint,
  );
  workspace.raycaster.setFromCamera(workspace.ndc, camera);
  return workspace.raycaster.ray.intersectPlane(workspace.plane, target) !== null;
}

/** Converts a world target into yaw/pitch relative to the cat's model frame. */
export function worldTargetToGaze(
  target: Vector3,
  origin: Vector3,
  orientationWorldQuaternion: Quaternion,
  localDirection = new Vector3(),
  inverseOrientation = new Quaternion(),
): WorldGaze {
  localDirection.subVectors(target, origin);
  const distance = localDirection.length();
  if (distance <= Number.EPSILON) return { yaw: 0, pitch: 0, distance: 0 };

  inverseOrientation.copy(orientationWorldQuaternion).invert();
  localDirection.applyQuaternion(inverseOrientation).normalize();
  const horizontal = Math.hypot(localDirection.x, localDirection.z);
  return {
    yaw: Math.atan2(-localDirection.x, -localDirection.z),
    pitch: -Math.atan2(localDirection.y, horizontal),
    distance,
  };
}

/** Nearby targets stay restrained; distant targets may use the full clamp. */
export function getGazeDistanceInfluence(distance: number): number {
  const normalized = MathUtils.clamp((distance - 0.6) / 3.2, 0, 1);
  return 0.55 + MathUtils.smoothstep(normalized, 0, 1) * 0.45;
}

export function clampWorldGaze(
  gaze: CompanionGaze,
  limits: GazeLimits,
  influence = 1,
): CompanionGaze {
  const strength = MathUtils.clamp(influence, 0, 1);
  return {
    yaw: MathUtils.clamp(gaze.yaw * strength, -limits.yaw, limits.yaw),
    pitch: MathUtils.clamp(
      gaze.pitch * strength,
      -limits.pitchUp,
      limits.pitchDown,
    ),
  };
}

/** Delta-time-aware quaternion interpolation used by every gaze bone. */
export function slerpGazeQuaternion(
  current: Quaternion,
  target: Quaternion,
  damping: number,
  deltaSeconds: number,
): Quaternion {
  const alpha = 1 - Math.exp(-damping * Math.max(0, deltaSeconds));
  return current.slerp(target, MathUtils.clamp(alpha, 0, 1));
}

/** Deterministic, low-amplitude gaze used only on touch-only devices. */
export function getTouchIdleGaze(seconds: number): CompanionGaze {
  const cycle = ((seconds % 12) + 12) % 12;
  const envelope = Math.sin((cycle / 12) * Math.PI) ** 2;
  return {
    yaw: Math.sin(seconds * 0.52) * MathUtils.degToRad(6) * envelope,
    pitch: Math.sin(seconds * 0.31 + 1.1) * MathUtils.degToRad(2.5) * envelope,
  };
}

export function getCompanionTargetCssHeight(viewportHeight: number, compact: number, desktop: number) {
  return viewportHeight < 800 ? compact : desktop;
}
