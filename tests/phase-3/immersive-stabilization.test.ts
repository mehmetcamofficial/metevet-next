import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Euler, OrthographicCamera, Quaternion, Vector3 } from "three";
import {
  getCinematicFrameWindow,
  getCinematicLifecycle,
  isCinematicReleased,
  LAST_USABLE_FRAME,
  TIER_FRAME_CACHE_LIMIT,
} from "../../src/components/cinematic/cinematic.constants.ts";
import { selectCinematicTier } from "../../src/components/cinematic/cinematic-tier.ts";
import {
  clampCompanionGaze,
  clampWorldGaze,
  createGazeProjectionWorkspace,
  getTouchIdleGaze,
  getCompanionTargetCssHeight,
  normalizeCompanionPointer,
  projectPointerToWorldTarget,
  slerpGazeQuaternion,
  worldTargetToGaze,
} from "../../src/components/webgl/companion/companion-motion.ts";

const CINEMATIC_HERO = readFileSync(
  new URL("../../src/components/cinematic/CinematicHero.tsx", import.meta.url),
  "utf8",
);

test("capable phones receive the animated lite cinematic tier", () => {
  for (const viewportWidth of [375, 390, 430]) {
    assert.equal(
      selectCinematicTier({
        reducedMotion: false,
        saveData: false,
        deviceMemory: 8,
        hardwareConcurrency: 8,
        viewportWidth,
      }),
      "lite",
    );
  }
  assert.equal(
    selectCinematicTier({
      reducedMotion: false,
      saveData: false,
      deviceMemory: 8,
      hardwareConcurrency: 8,
      viewportWidth: 768,
    }),
    "reduced",
  );
});

test("reduced motion and constrained networks receive the static cinematic tier", () => {
  assert.equal(selectCinematicTier({ reducedMotion: true, saveData: false, viewportWidth: 390 }), "static");
  assert.equal(selectCinematicTier({ reducedMotion: false, saveData: true, viewportWidth: 390 }), "static");
  assert.equal(
    selectCinematicTier({ reducedMotion: false, saveData: false, effectiveType: "2g", viewportWidth: 390 }),
    "static",
  );
});

test("the sticky cinematic lifecycle releases and reactivates cleanly", () => {
  assert.equal(isCinematicReleased(0.998), false);
  assert.equal(isCinematicReleased(0.999), false);
  assert.equal(isCinematicReleased(1), true);
  assert.equal(isCinematicReleased(0.4), false);
  assert.equal(getCinematicLifecycle(1), "released");
  assert.equal(getCinematicLifecycle(0.4), "active");
  assert.match(CINEMATIC_HERO, /className="sticky top-0/);
  assert.match(CINEMATIC_HERO, /data-cinematic-visual/);
  assert.doesNotMatch(CINEMATIC_HERO, /style\.position\s*=|stickyRef/);
});

test("frame windows and retained cache stay bounded", () => {
  for (const tier of ["full", "reduced", "lite"] as const) {
    const frames = getCinematicFrameWindow(90, tier);
    assert.ok(frames.length <= TIER_FRAME_CACHE_LIMIT[tier]);
    assert.ok(frames.every((frame) => frame >= 0 && frame <= LAST_USABLE_FRAME));
  }
});

test("companion pointer normalization and gaze are clamped", () => {
  const pointer = normalizeCompanionPointer(5000, -100, 1000, 800);
  assert.deepEqual(pointer, { x: 1, y: 1, active: true });
  assert.deepEqual(clampCompanionGaze(pointer, 0.2, 0.12), { yaw: 0.2, pitch: -0.12 });
  assert.deepEqual(clampCompanionGaze({ x: 1, y: 1, active: false }, 0.2, 0.12), { yaw: 0, pitch: 0 });
});

test("companion sizing reduces visual footprint responsively", () => {
  assert.equal(getCompanionTargetCssHeight(900, 88, 112), 112);
  assert.equal(getCompanionTargetCssHeight(700, 88, 112), 88);
});

test("active-camera rays project screen regions onto a world-space gaze plane", () => {
  const camera = new OrthographicCamera(-2, 2, 2, -2, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  const workspace = createGazeProjectionWorkspace();
  const target = new Vector3();

  assert.equal(
    projectPointerToWorldTarget(
      { x: 0, y: 0, active: true },
      camera,
      new Vector3(0, 0, 3.2),
      target,
      workspace,
    ),
    true,
  );
  assert.ok(target.distanceTo(new Vector3(0, 0, 3.2)) < 1e-9);

  projectPointerToWorldTarget(
    { x: 0.75, y: 0.75, active: true },
    camera,
    new Vector3(0, 0, 3.2),
    target,
    workspace,
  );
  assert.ok(target.x > 0 && target.y > 0);
});

test("world gaze respects model orientation, asymmetric clamps and neutral return", () => {
  const wrapperOrientation = new Quaternion().setFromEuler(
    new Euler(0, Math.PI, 0),
  );
  const neutral = worldTargetToGaze(
    new Vector3(0, 0, 3.2),
    new Vector3(),
    wrapperOrientation,
  );
  assert.ok(Math.abs(neutral.yaw) < 1e-9);
  assert.ok(Math.abs(neutral.pitch) < 1e-9);

  const limited = clampWorldGaze(
    { yaw: 2, pitch: -2 },
    { yaw: 0.8, pitchUp: 0.45, pitchDown: 0.58 },
  );
  assert.deepEqual(limited, { yaw: 0.8, pitch: -0.45 });

  const current = new Quaternion();
  const target = new Quaternion().setFromEuler(new Euler(0, 0.6, 0));
  slerpGazeQuaternion(current, target, 8, 1 / 60);
  assert.ok(current.angleTo(new Quaternion()) > 0);
  assert.ok(current.angleTo(target) > 0);
  const beforeReturn = current.angleTo(new Quaternion());
  slerpGazeQuaternion(current, new Quaternion(), 2.6, 0.5);
  assert.ok(current.angleTo(new Quaternion()) < beforeReturn);
});

test("touch-only idle gaze is deterministic, subtle and periodically neutral", () => {
  assert.deepEqual(getTouchIdleGaze(0), { yaw: 0, pitch: 0 });
  const cycleEnd = getTouchIdleGaze(12);
  assert.ok(Math.abs(cycleEnd.yaw) < 1e-12);
  assert.ok(Math.abs(cycleEnd.pitch) < 1e-12);
  const sample = getTouchIdleGaze(5);
  assert.ok(Math.abs(sample.yaw) <= (6 * Math.PI) / 180);
  assert.ok(Math.abs(sample.pitch) <= (2.5 * Math.PI) / 180);
});
