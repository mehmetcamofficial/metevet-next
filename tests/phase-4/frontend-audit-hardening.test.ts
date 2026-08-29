import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  clampWorldGaze,
  getCompanionTargetCssHeight,
  getGazeDistanceInfluence,
  getTouchIdleGaze,
  normalizeCompanionPointer,
} from "../../src/components/webgl/companion/companion-motion.ts";
import {
  CINEMATIC_SEGMENTS,
  LAST_USABLE_FRAME,
  getCinematicFrameWindow,
  getCinematicLifecycle,
  progressToFrame,
} from "../../src/components/cinematic/cinematic.constants.ts";

const GLOBALS_CSS = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const CINEMATIC_HERO = readFileSync(
  new URL("../../src/components/cinematic/CinematicHero.tsx", import.meta.url),
  "utf8",
);
const MOBILE_MENU = readFileSync(
  new URL("../../src/components/layout/mobile-menu.tsx", import.meta.url),
  "utf8",
);
const NAVBAR = readFileSync(new URL("../../src/components/layout/navbar.tsx", import.meta.url), "utf8");

// ═══════════════════════════════════════════════════════════════════
// Companion pointer/gaze pure logic — real imports, real assertions.
// ═══════════════════════════════════════════════════════════════════

test("normalizeCompanionPointer clamps to the NDC unit square regardless of input", () => {
  assert.deepEqual(normalizeCompanionPointer(0, 0, 1000, 1000), { x: -1, y: 1, active: true });
  assert.deepEqual(normalizeCompanionPointer(1000, 1000, 1000, 1000), { x: 1, y: -1, active: true });
  assert.deepEqual(normalizeCompanionPointer(500, 500, 1000, 1000), { x: 0, y: 0, active: true });

  // Coordinates far outside the viewport (e.g. a stale event during resize)
  // must still clamp into range instead of driving the gaze past its limits.
  const overshoot = normalizeCompanionPointer(-500, 5000, 1000, 1000);
  assert.ok(overshoot.x >= -1 && overshoot.x <= 1);
  assert.ok(overshoot.y >= -1 && overshoot.y <= 1);
});

test("normalizeCompanionPointer never divides by zero for a collapsed viewport", () => {
  const result = normalizeCompanionPointer(10, 10, 0, 0);
  assert.ok(Number.isFinite(result.x));
  assert.ok(Number.isFinite(result.y));
});

test("clampWorldGaze respects independent yaw and pitch limits", () => {
  const limits = { yaw: 0.2, pitchUp: 0.1, pitchDown: 0.05 };
  const clamped = clampWorldGaze({ yaw: 5, pitch: 5 }, limits);
  assert.equal(clamped.yaw, 0.2);
  assert.equal(clamped.pitch, 0.05);

  const clampedNegative = clampWorldGaze({ yaw: -5, pitch: -5 }, limits);
  assert.equal(clampedNegative.yaw, -0.2);
  assert.equal(clampedNegative.pitch, -0.1);
});

test("clampWorldGaze influence scales the target toward neutral, never past it", () => {
  const limits = { yaw: 1, pitchUp: 1, pitchDown: 1 };
  const full = clampWorldGaze({ yaw: 0.5, pitch: 0.5 }, limits, 1);
  const half = clampWorldGaze({ yaw: 0.5, pitch: 0.5 }, limits, 0.5);
  const none = clampWorldGaze({ yaw: 0.5, pitch: 0.5 }, limits, 0);
  assert.equal(full.yaw, 0.5);
  assert.equal(half.yaw, 0.25);
  assert.equal(none.yaw, 0);
});

test("getGazeDistanceInfluence stays within its documented [0.55, 1] range", () => {
  for (const distance of [-10, 0, 0.6, 2, 3.8, 100]) {
    const influence = getGazeDistanceInfluence(distance);
    assert.ok(influence >= 0.55 && influence <= 1, `distance ${distance} -> ${influence}`);
  }
  // Farther targets are allowed at least as much gaze travel as near ones.
  assert.ok(getGazeDistanceInfluence(4) >= getGazeDistanceInfluence(0.6));
});

test("getTouchIdleGaze is deterministic and bounded", () => {
  const a = getTouchIdleGaze(5);
  const b = getTouchIdleGaze(5);
  assert.deepEqual(a, b, "same input must produce the same idle gaze every time");

  // The envelope (a squared sine over a 12s window) returns to ~0 at every
  // window boundary, so idle motion never leaves the cat mid-glance when a
  // touch visitor starts interacting.
  const boundary = getTouchIdleGaze(12);
  assert.ok(Math.abs(boundary.yaw) < 1e-6);
  assert.ok(Math.abs(boundary.pitch) < 1e-6);

  for (let t = 0; t < 24; t += 0.5) {
    const gaze = getTouchIdleGaze(t);
    assert.ok(Math.abs(gaze.yaw) <= (6 * Math.PI) / 180 + 1e-9);
    assert.ok(Math.abs(gaze.pitch) <= (2.5 * Math.PI) / 180 + 1e-9);
  }
});

test("getCompanionTargetCssHeight picks the compact height under the 800px breakpoint", () => {
  assert.equal(getCompanionTargetCssHeight(799, 88, 112), 88);
  assert.equal(getCompanionTargetCssHeight(800, 88, 112), 112);
  assert.equal(getCompanionTargetCssHeight(1200, 88, 112), 112);
});

// ═══════════════════════════════════════════════════════════════════
// Cinematic scroll-progress mapping — real imports, real assertions.
// ═══════════════════════════════════════════════════════════════════

test("progressToFrame is clamped, monotonic and lands on the retimed segments", () => {
  assert.equal(progressToFrame(-1), progressToFrame(0));
  assert.equal(progressToFrame(2), progressToFrame(1));
  assert.equal(Math.round(progressToFrame(0)), 0);
  assert.equal(Math.round(progressToFrame(1)), LAST_USABLE_FRAME);

  let previous = progressToFrame(0);
  for (let p = 0.02; p <= 1; p += 0.02) {
    const frame = progressToFrame(p);
    assert.ok(frame >= previous - 1e-9, `frame should never move backwards near progress ${p}`);
    previous = frame;
  }
});

test("progressToFrame keeps every segment's frame range inside its own span", () => {
  for (const segment of CINEMATIC_SEGMENTS) {
    const frame = progressToFrame((segment.from + segment.to) / (2 * LAST_USABLE_FRAME));
    assert.ok(frame >= 0 && frame <= LAST_USABLE_FRAME);
  }
});

test("getCinematicLifecycle only reports released at full progress, and reverses cleanly", () => {
  assert.equal(getCinematicLifecycle(0), "active");
  assert.equal(getCinematicLifecycle(0.999), "active");
  assert.equal(getCinematicLifecycle(1), "released");
  // Scrolling back up must return to active — the lifecycle is a pure
  // function of progress, not a one-way latch.
  assert.equal(getCinematicLifecycle(0.5), "active");
});

test("getCinematicFrameWindow always stays within the valid frame range", () => {
  for (const tier of ["full", "reduced", "lite"] as const) {
    for (const centre of [0, 40, 90, LAST_USABLE_FRAME]) {
      const window = getCinematicFrameWindow(centre, tier);
      assert.ok(window.length > 0);
      for (const frame of window) {
        assert.ok(frame >= 0 && frame <= LAST_USABLE_FRAME);
      }
    }
  }
});

test("getCinematicFrameWindow degrades to a single static frame for the static tier", () => {
  assert.deepEqual(getCinematicFrameWindow(90, "static"), [0]);
});

// ═══════════════════════════════════════════════════════════════════
// Regression coverage for this pass's fixes.
// ═══════════════════════════════════════════════════════════════════

test("cinematic pinned viewport uses a same-property CSS cascade fallback, not two Tailwind height utilities", () => {
  // Two same-specificity arbitrary Tailwind classes (h-[100svh] h-[100dvh])
  // on one element have no guaranteed winner — Tailwind's generated rule
  // order is not tied to className order. A dedicated class with a real
  // vh -> svh -> dvh cascade fixes the mobile-Safari toolbar issue reliably.
  assert.match(GLOBALS_CSS, /\.cinematic-viewport\s*\{[\s\S]*height:\s*100vh;[\s\S]*height:\s*100svh;[\s\S]*height:\s*100dvh;[\s\S]*\}/);
  assert.match(CINEMATIC_HERO, /className="cinematic-viewport sticky top-0/);
  assert.doesNotMatch(CINEMATIC_HERO, /h-\[100svh\]\s+h-\[100dvh\]/);
});

test("the mobile navigation dialog traps focus, closes on Escape, and locks background scroll", () => {
  assert.match(MOBILE_MENU, /event\.key === "Escape"/);
  assert.match(MOBILE_MENU, /event\.key !== "Tab"/);
  assert.match(MOBILE_MENU, /document\.body\.style\.overflow = "hidden"/);
  assert.match(MOBILE_MENU, /document\.body\.style\.overflow = previousOverflow/);
  assert.match(MOBILE_MENU, /closeButtonRef\.current\?\.focus\(\)/);
  assert.match(MOBILE_MENU, /triggerRef\.current instanceof HTMLElement\) triggerRef\.current\.focus\(\)/);
});

test("the mobile menu trigger exposes its expanded/controls state to assistive tech", () => {
  assert.match(NAVBAR, /aria-haspopup="dialog"/);
  assert.match(NAVBAR, /aria-expanded=\{open\}/);
  assert.match(NAVBAR, /aria-controls="mobile-navigation"/);
  assert.match(MOBILE_MENU, /id="mobile-navigation"/);
});
