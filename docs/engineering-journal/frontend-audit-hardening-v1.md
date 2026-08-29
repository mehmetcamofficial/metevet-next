# Frontend audit + hardening v1

Full frontend audit of the homepage, cinematic scrollytelling hero, WebGL
companion cat, navigation, forms, cards, buttons, and shared layout/CSS, with
fixes applied for the findings judged low-risk and in-scope. The cinematic
hero and companion cat have already been through two prior hardening passes
(`immersive-stabilization.md`, `052-phase-3-2-7-cinematic-hero-overhaul.md`);
this pass read those diffs and the current source before touching anything in
that area, to avoid regressing work that was already deliberately tuned.

## A. Audit findings by severity

### HIGH

1. **Mobile navigation dialog had no focus management.**
   `src/components/layout/mobile-menu.tsx` rendered `role="dialog"
   aria-modal="true"` but never moved focus into the panel, never trapped
   Tab/Shift+Tab inside it, had no Escape-to-close handler, and never
   returned focus to the trigger button on close. A keyboard user opening the
   menu kept tabbing through the page scrolling behind the (visually
   full-screen) overlay, and had no keyboard-only way to dismiss it. The
   trigger button in `navbar.tsx` also carried no `aria-expanded`,
   `aria-haspopup`, or `aria-controls`, so assistive tech had no way to know
   the dialog's state or which element it opened.
   **Root cause:** the dialog was built as a conditional render with ARIA
   role attributes but no accompanying focus-management effect — the most
   common gap between "looks like a dialog" and "behaves like one."
   **Fixed.**

### MEDIUM

2. **Cinematic hero's pinned-viewport sizing used two same-specificity
   Tailwind utilities on one element** (`h-[100svh] h-[100dvh]`).
   `src/components/cinematic/CinematicHero.tsx`. Two arbitrary-value
   utilities with identical specificity generate two separate CSS rules;
   which one wins depends on the order Tailwind emits them in the built
   stylesheet, which is tied to first-appearance-in-source scan order, not
   to the order the classes appear in this element's `className`. The intent
   (documented in the prior stabilization journal) was a `vh -> svh -> dvh`
   cascade fallback for mobile Safari's dynamic toolbar, but a fallback needs
   same-property cascade order, which two independent utility classes do not
   guarantee.
   **Root cause:** a CSS same-property fallback pattern implemented as two
   Tailwind utility classes instead of one CSS rule with ordered
   declarations.
   **Fixed** — replaced with a `.cinematic-viewport` rule in
   `app/globals.css` that declares `height` three times in the required
   order; unsupported units are dropped by the parser so the fallback chain
   is guaranteed regardless of build/scan order. Applied the same treatment
   to `body { min-height: 100vh }`, which had the identical latent issue.

### LOW (documented, not changed — see Deferred)

3. `HomepageCompanionLayer`'s WebGL canvas mounts once (`activated` never
   resets to `false`), and `CompanionCat.tsx` clones each mesh's material in
   a `useMemo` keyed on `gltf.scene` but never disposes those clones — only
   the debug-mode material swap is disposed. In the current app this mounts
   exactly once per page load and is never remounted, so it is not an active
   leak today, but it would become one if the component were ever made to
   remount (e.g. a future route-level unmount/remount). Documented rather
   than changed, per the task's caution against speculative render-loop
   changes without concrete evidence of a live leak.
4. `src/components/home/hero.tsx` (a static, non-cinematic homepage hero
   with its own `<h1>`) is dead code — not imported by any route; the
   homepage renders `CinematicHero` instead. No duplicate-`<h1>` bug exists
   on the live page, but the unused file should eventually be removed.
5. No missing `alt` text was found on homepage images (`next/image` usages
   all pass `alt`), and heading order at `/[locale]` is a single `<h1>`
   (inside `CinematicOverlay`) followed by `<h2>`s per section — no fix
   needed here, listed for completeness of the audit trail.

## B. Areas audited and found already sound (no changes)

These were read in full, against the priority list in the audit spec, before
deciding not to touch them:

- **Cinematic hero lifecycle** (`useCinematicScroll.ts`,
  `useCinematicFrames.ts`, `CinematicCanvas.tsx`, `usePointerDepth.ts`):
  rAF-throttled scroll listener with full listener cleanup; frame loader with
  a bounded concurrent queue, LRU eviction bounded per quality tier, and
  complete `onload`/`onerror`/`src` teardown on unmount; canvas resize is
  `ResizeObserver`-driven and only reallocates the backing store when the
  measured size actually changes; reduced-motion and Save-Data collapse to
  the `static` tier, which renders a plain `<Image>` with the full hero copy
  as a real, complete page (not a stripped-down fallback). Release from the
  pinned state is left to native CSS `sticky` (the current file's own
  comment: "Layout release itself is owned by CSS sticky containment"),
  which is simpler and correct for this case — an explicit `position:
  absolute` handoff was tried previously per the stabilization journal and
  the codebase has since settled on the simpler native-sticky approach; nothing
  here regresses reverse-scroll.
- **Companion cat pointer tracking** (`CompanionController.tsx`,
  `CompanionCat.tsx`, `companion-motion.ts`): pointer coordinates are
  normalized and clamped; gaze is computed via real world-space
  ray/plane projection onto the cat's head plane (not a flat screen-space
  offset), independently clamped per bone (neck/head/eyes) with distinct
  damping; touch-only devices fall back to `getTouchIdleGaze`, a
  deterministic idle-motion function, rather than pointer tracking; a
  `MutationObserver` + `ResizeObserver` keep a dynamic exclusion-zone list
  (header, open dialogs, focused controls) that the cat's walk target is
  clamped away from, so it never parks itself on top of interactive UI.
  This is materially the same design the two prior hardening PRs
  ("cinematic release and cat gaze", "immersive responsive performance")
  converged on; no regression risk was worth taking here without concrete
  evidence of a bug, per the task's explicit caution.
- **Forms** (`appointment-form.tsx`): every input has an associated
  `<label htmlFor>`, `aria-invalid`/`aria-describedby` wired to per-field
  error text, `aria-live` region for the overall error summary, focus is
  moved to the first invalid field on failed validation, the submit button
  is `disabled` while `isSubmitting`, and inputs use correct `type`/
  `inputMode`/`autoComplete`. No changes needed.
- **GSAP/ScrollTrigger cleanup** (`Reveal`, `StaggerGroup`, `ParallaxMedia`,
  `SectionTransition`, `BlurText`, `CountUp`): all use `gsap.context()` and
  call `.revert()` in the effect cleanup; `MagneticLink` uses React
  synthetic mouse events only (no listeners to leak).
- **Three.js disposal in the non-companion WebGL scenes**
  (`SceneCanvas.tsx`): uses `@react-three/fiber`'s default `dispose`
  behavior with `frameloop={active ? "demand" : "never"}`, which pauses
  rendering and disposes scene resources on unmount as R3F normally does.
- **Z-index usage**: only two arbitrary z-index values exist in the whole
  `src/` tree (`z-[1]`, `z-[9]`), both pre-existing and load-bearing for
  layering under a scrim; no new arbitrary values were introduced, per the
  task's constraint.
- **React keys**: `npm run lint` (which includes `react/jsx-key` via
  `eslint-config-next`) passes clean across the whole app; no missing-key
  warnings exist to fix.

## C. Files changed

- `app/globals.css` — added `.cinematic-viewport` (vh/svh/dvh cascade) and
  applied the same fallback to `body`'s `min-height`.
- `src/components/cinematic/CinematicHero.tsx` — pinned viewport now uses
  `.cinematic-viewport` instead of two competing Tailwind height utilities.
- `src/components/layout/mobile-menu.tsx` — added a real dialog focus
  lifecycle: initial focus on open, Tab/Shift+Tab focus trap scoped to the
  panel, Escape closes, background scroll is locked while open, and focus
  returns to whatever triggered the menu on close.
- `src/components/layout/navbar.tsx` — the menu trigger now announces
  `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` pointing at
  the panel's id.
- `tests/phase-3/cinematic-hero.test.ts`,
  `tests/phase-3/immersive-stabilization.test.ts` — updated the two
  assertions that matched the old `className="sticky top-0..."` string to
  match the new `cinematic-viewport` class (structural intent unchanged).
- `tests/phase-4/frontend-audit-hardening.test.ts` — new. Real unit tests
  against actual imports (not source-string greps) for the pure companion
  gaze/pointer math in `companion-motion.ts` and the pure scroll-progress
  math in `cinematic.constants.ts`, plus targeted regression tests for the
  two fixes above.

## D. Tests added

`tests/phase-4/frontend-audit-hardening.test.ts` (13 tests), covering:

- `normalizeCompanionPointer` clamps to `[-1, 1]` for out-of-viewport input
  and never divides by zero for a zero-sized viewport.
- `clampWorldGaze` respects independently-configured yaw/pitch limits and
  its `influence` parameter scales linearly toward neutral.
- `getGazeDistanceInfluence` stays within its documented `[0.55, 1]` range
  across near/far/negative distances.
- `getTouchIdleGaze` is deterministic for a given timestamp and its envelope
  returns to ~0 at each 12s window boundary (bounded, no visible snap).
- `getCompanionTargetCssHeight` switches at the 800px breakpoint.
- `progressToFrame` is clamped to `[0, 1]` input, monotonic non-decreasing
  across the whole scroll range (no visual reverse/stutter), and every
  segment resolves inside its own frame span.
- `getCinematicLifecycle` only reports `"released"` at `progress === 1` and
  is a pure function of progress (reverses cleanly on scroll-up).
- `getCinematicFrameWindow` never returns an out-of-range frame index for
  any tier, and degrades to `[0]` for the `static` tier.
- Regression checks that the viewport-height fix removed the duplicate
  Tailwind utilities and that the CSS fallback rule exists in the right
  declaration order.
- Regression checks that the mobile menu implements Escape/Tab-trap/
  scroll-lock/focus-return, and that the trigger's ARIA wiring is present.

## E. Performance observations

- No new render loops, timers, or listeners were added. The mobile menu's
  `keydown` listener and the body scroll lock are added only while the
  dialog is open and are removed in the effect cleanup on every `open`
  transition, matching the pattern already used throughout `src/components/
  cinematic` and `src/components/motion`.
- The CSS-only viewport fix has no runtime cost; it removes an unreliable,
  browser-dependent double-declaration rather than adding logic.

## F. Remaining known risks

- The mobile-menu focus trap uses `offsetParent !== null` to filter hidden
  focusable elements, which is a fast, standard check but does not detect
  `visibility: hidden` or `clip-path`-hidden elements; none of the current
  panel content uses those, so this is a theoretical edge case, not an
  observed bug.
- `docs/engineering-journal/immersive-stabilization.md` describes an
  earlier design where the cinematic hero transitioned to `position:
  absolute` at release; the current code (both before and after this pass)
  relies on native `position: sticky` release instead, which the codebase
  has since settled on. This journal entry does not resolve that
  discrepancy between the two journals — it is a historical record
  mismatch, not a bug in the current code, which was verified directly.

## G. Deferred items (with reasons)

- **Companion cat cloned-material disposal** (§A.3): not fixed. The
  component mounts exactly once for the lifetime of the page today, so
  there is no concrete, observable leak to point to — only a latent one if
  the mount lifecycle changes later. Fixing it would mean adding a dispose
  effect to a file the task explicitly flagged as sensitive and
  already-hardened, for a risk that isn't currently manifesting. Flagged
  for a future pass if/when the companion layer's mount lifecycle changes.
- **`src/components/home/hero.tsx` dead code removal**: not touched. It is
  unused (not imported anywhere) and therefore not a live bug, and deleting
  files that aren't part of a specific fix risks looking like scope creep
  beyond "audit + harden." Left for a dedicated cleanup pass.
- **Broader RAF/render-cadence changes**: not attempted anywhere, per the
  task's explicit instruction — no concrete evidence of a cadence problem
  was found in the cinematic or companion code; both already use
  `frameloop="demand"`/damped rAF loops with proper cleanup.
- **Admin-area component audit** (booking, calendar, analytics, documents,
  etc.): out of the stated priority scope (homepage, hero, cat, nav, forms,
  cards, buttons, loading/empty/error states) and explicitly not
  "unrelated backend/Supabase logic." `npm run lint` and `tsc --noEmit` are
  clean across that code, and it was left untouched.

## H. Validation results

All commands below were run after `npm ci` on this branch:

| Command | Result |
|---|---|
| `npm ci` | pass |
| `npm run lint` | pass, no warnings |
| `npx tsc --noEmit` | pass, no errors |
| `npm run test:phase2` | pass — 156/156 |
| `node --no-warnings --experimental-strip-types --test tests/phase-3/*.test.ts` | pass — 968/968 |
| `node --no-warnings --experimental-strip-types --test tests/phase-4/*.test.ts` | pass — 156/156 (13 new) |
| `npm run build` | pass — production build completes, all routes compile |
