import assert from "node:assert/strict";
import test from "node:test";
import {
  getCinematicFrameWindow,
  isCinematicReleased,
  LAST_USABLE_FRAME,
  TIER_FRAME_CACHE_LIMIT,
} from "../../src/components/cinematic/cinematic.constants.ts";
import { selectCinematicTier } from "../../src/components/cinematic/cinematic-tier.ts";
import {
  clampCompanionGaze,
  getCompanionTargetCssHeight,
  normalizeCompanionPointer,
} from "../../src/components/webgl/companion/companion-motion.ts";

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
  assert.equal(isCinematicReleased(0.999), true);
  assert.equal(isCinematicReleased(0.4), false);
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
