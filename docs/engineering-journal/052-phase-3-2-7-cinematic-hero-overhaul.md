# 052 — Phase 3.2.7: Cinematic Hero Overhaul

**Date:** 2026-08-12
**Status:** PASS WITH WARNINGS (asset limitations documented below)

## Objective

Turn the homepage cinematic hero into a premium, progressively-loaded,
scroll-narrated experience with genuine pointer interaction, without
sacrificing performance, accessibility, SEO or localization.

## Audit findings

Problems found in the pre-existing `CinematicHero.tsx` (single 581-line file):

1. **Blocking first paint on the entire sequence.** `setLoaded(true)` only fired
   once all 180 frames had settled. Nothing rendered until ~28 MB had
   transferred — roughly 140 s on a 1.6 Mbps connection, behind a `42%` overlay.
2. **Backing store reallocated every painted frame.** `drawFrame` assigned
   `canvas.width`/`canvas.height` on each call, reallocating the surface ~60×/s.
3. **Compounded zoom.** `ZOOM_FACTOR` was applied in the draw math *and* again as
   a CSS `scale()`, yielding an effective 1.39× crop.
4. **React re-render per scroll event.** `setScrollProgress` ran on every scroll
   tick, re-rendering the whole hero subtree.
5. **Mobile was a frozen poster** (`frame-001.jpg`), explicitly rejected by the brief.
6. **"Cat tracking" was a whole-canvas ±20 px translate**, also explicitly rejected.
7. **No narrative** — one static title across 500vh — and a hard cut into the page.
8. All 180 decoded frames retained; force-decoding the sequence at 1600×894
   pins on the order of a gigabyte of RGBA surfaces.

Two further defects were found outside the hero:

9. **`CompanionCat` disabled WebGL rendering entirely.** It called
   `useFrame(cb, 1)`; R3F skips its automatic `gl.render()` whenever any
   subscriber has priority > 0 (`react-three-fiber.esm.js:16060`), and nothing
   rendered manually. The shared companion/journey canvas never drew.
10. **Head gaze was a no-op-ish accumulator.** `rotation.y += damp(0, target, 7, dt)`
    applies a fixed ~11% of the target each frame instead of converging on it,
    and is frame-rate dependent.

## Asset limitations (unresolved by design)

The 180 frames are AI-generated (KlingAI 3.0) and carry a **burned-in
"KlingAI 3.0 / Genspark" watermark** in the bottom-right of every frame. Per
product decision the frames are left untouched; clean footage is to be swapped
in later. The `ZOOM_FACTOR` cover crop hides the mark at most aspect ratios but
this is incidental, not a guarantee.

The sequence is three shots joined by two cross-dissolves that contain
double-exposure ghosting (translucent faces). Measured by frame-to-frame RMSE:

| Frames | Content | State |
|--------|---------|-------|
| 0–82 | Exterior approach | clean |
| 82–112 | dissolve A (peak artifacts ~104) | ghosting |
| 112–148 | Vet examining the Somali cat | clean |
| 148–162 | dissolve B (peak ~160) | ghosting |
| 162–178 | Reception interior | clean |

Frames 179 and 180 are byte-identical duplicates; `LAST_USABLE_FRAME` is 178.

**The photographic cat cannot be made to follow the pointer.** It appears in
only ~36 of 178 frames, always in one fixed pose, and cannot be isolated from
the plate. Options A (transparent cat layers) and B (directional pose frames)
from the brief are both unavailable. See the interaction section below for what
was implemented instead.

## Architecture

`src/components/cinematic/` replaces the single file:

| Module | Responsibility |
|--------|----------------|
| `cinematic.constants.ts` | Segments, retiming, scene beats, tiers, gaze config |
| `useCinematicFrames.ts` | Progressive load, decode window, nearest-frame lookup |
| `useCinematicScroll.ts` | rAF-throttled scroll → progress, zero React state |
| `useCinematicTier.ts` | Capability detection via `useSyncExternalStore` |
| `usePointerDepth.ts` | Pointer ref + counter-parallaxed UI layer |
| `CinematicCanvas.tsx` | Painting, cover math, cat gaze warp |
| `CinematicOverlay.tsx` | Five narrative beats, driven imperatively |
| `CinematicHero.tsx` | Composition, handoff, cues |

### Scroll retiming

Scroll progress maps piecewise onto frame indices. Dissolve segments get 10%
and 7% of scroll for 30 and 14 frames respectively, so the ghosting whips past;
clean shots get 30/28/25%. Narrative beats are placed in the gaps such that
**no copy is ever on screen while a dissolve plays**.

### Cat / pointer interaction

Two mechanisms, both honest:

1. **In the hero — localized anatomical gaze warp.** A feathered elliptical
   region around the cat's head (anchor measured at 0.545/0.60 of the source,
   radius 12% of width, 45% feather) is resampled into an offscreen canvas,
   offset and rotated independently, alpha-masked with a radial gradient and
   composited back over the plate. The cat's displacement is the *difference*
   between the foreground and background depth amplitudes, so it moves against
   the photograph rather than with it. Capped at 5 px and 0.022 rad, damped,
   and ramped in/out over the frames where the cat is on screen. This is the
   brief's Option C, implemented as real differential motion — not a
   whole-canvas translate.
2. **Across the rest of the page — real skeletal head tracking.** The rigged
   Somali cat GLB (breed-matched to the footage) has a `Head_22` bone driven by
   yaw/pitch/tilt from the pointer. Fixed here (see defects 9 and 10) so it
   actually renders and actually converges.

### Tiers

| Tier | Trigger | Stride | Frames | Scroll |
|------|---------|--------|--------|--------|
| full | ≥1024px, capable | 1 | 179 | 500vh |
| reduced | 768–1023px | 2 | ~94 | 420vh |
| lite | <768px, ≤4 GB RAM/cores, 3G | 3 | 64 | 320vh |
| static | reduced-motion, save-data, 2G | — | 1 | 100vh |

Mobile keeps a genuine scroll-driven sequence. Only reduced-motion/save-data
users get the poster, and they still get the complete hero copy and CTAs.

## Verification

- `npm run lint` — clean. `npx tsc --noEmit` — clean. `npm run build` — success.
- Tests: phase-2 156/156, phase-3 959/959, phase-4 141/141.
  `cinematic-hero.test.ts` rewritten (96 tests) against the new modules.
- Browser (Chromium) at 375/430/768/1024/1440/1920: one `<h1>`, canvas active at
  every width, no horizontal overflow, no console errors, no 4xx, `tr` and `en`
  both render.
- Throttled 1.6 Mbps: hero paints a real frame after **1 image (0.2 MB)**.
- Transfer: desktop 179 frames / 27.9 MB; mobile 64 frames / 10.2 MB (−64%).

## Incidental fix

`navbar.tsx` rendered **both** logo variants below 640px: `Logo`'s root sets
`inline-flex`, which beat the caller's `hidden` in Tailwind's cascade. Display
now lives on wrapper spans. Verified: exactly one mark at every width.

## Warnings

- Watermarked frames ship as-is by product decision.
- Frames remain JPEG at 1600×894; no AVIF/WebP derivative pipeline was added,
  since the source assets are expected to be replaced.
- The gaze anchor is a constant tuned to the examination shot; replacing the
  footage requires re-measuring `CAT_GAZE.anchorX/anchorY`.
