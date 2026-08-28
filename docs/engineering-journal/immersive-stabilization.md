# Immersive stabilization — engineering journal

## A. Observed problems

- The cinematic hero retained every fetched `HTMLImageElement`, even though it
  only explicitly decoded frames around the playhead. This allowed the browser
  to retain far more image memory than the intended decode window.
- The end of the cinematic sequence applied a 10% opacity handoff but left the
  element in sticky positioning. The sticky owner was never explicitly
  released, making the final frame vulnerable to leaking above later content
  in browsers with dynamic viewport changes.
- The cat's body destination was delayed by 350 ms, which made pointer
  response feel indirect. Its gaze limits were also too subtle for the model's
  apparent size.
- Fixed controls had incomplete safe-area support and several primary controls
  fell below the 44 px touch-target guidance.

## B. Root causes

1. `useCinematicFrames` loaded the complete planned sequence after its initial
   ladder. Browser image implementations may retain decoded surfaces for those
   elements, so decode-window bookkeeping alone was not a memory bound.
2. `CinematicHero` relied on the natural end of CSS sticky while retaining a
   transformed, partially visible child. The lifecycle needed a real transition
   from `position: sticky` to a section-bound `position: absolute` layer at
   the end boundary, and the transition needed to reverse when progress moves
   upward.
3. The companion controller normalized pointer coordinates correctly but used
   a long settle delay before a movement response. Head gaze had limited range
   and no independently testable normalization/clamping policy.

## C. Files changed

- `src/components/cinematic/cinematic.constants.ts`
- `src/components/cinematic/cinematic-tier.ts`
- `src/components/cinematic/useCinematicTier.ts`
- `src/components/cinematic/useCinematicFrames.ts`
- `src/components/cinematic/CinematicHero.tsx`
- `src/components/webgl/companion/companion-motion.ts`
- `src/components/webgl/companion/{companion-config,CompanionController,CompanionCat,HomepageCompanionLayer}.tsx`
- `src/components/{layout/navbar,shared/language-switcher,shared/whatsapp-button}.tsx`
- `tests/phase-3/{cinematic-hero,immersive-stabilization}.test.ts`

## D. Technical solution

- Frames are now requested through a bounded concurrent queue: frame zero,
  a sparse navigation ladder, and a playhead-centred window. The retained image
  cache is capped per quality tier and least-recently-used frames outside the
  active window release their source and bookkeeping.
- The hero uses `100svh`/`100dvh` sizing. At `progress >= 0.999` it transitions
  to a bottom-aligned absolute layer inside its own relative section, becomes
  fully transparent, and stops receiving pointers. Scrolling back above the
  boundary restores sticky ownership and keeps the existing canvas mounted so
  reverse motion does not restart from frame zero.
- Companion pointer calculations and gaze limits are pure exported helpers.
  The response delay is reduced to 120 ms, gaze limits are increased to 12°
  yaw and 7° pitch, and damping remains time-based. Desktop apparent height is
  reduced from 126 px to 112 px; compact height is reduced from 100 px to 88 px.

## E. Performance impact

- Full tier retains at most 52 image elements, reduced 40, and lite 28.
- Mobile lite continues to animate but uses a stride of three and a smaller
  cache; it does not preload all frames before first paint.
- Canvas backing-store allocation remains ResizeObserver-driven and capped at
  DPR 2. Rendering pauses after the cinematic section releases.

## F. Mobile behavior

- Capable phones at 375, 390, and 430 px select animated `lite`; 768 px selects
  `reduced`. Reduced motion, Save-Data, and 2G/slow-2G select `static`.
- The hero uses dynamic viewport-aware sizing. Header, language, booking,
  menu, greeting, and WhatsApp controls have 44 px minimum targets where
  interactive and fixed controls honour safe-area insets.

## G. Cat interaction changes

- Pointer coordinates are normalized and clamped to `[-1, 1]` before use.
- Gaze is clamped, damped, and returns to neutral when the fine pointer leaves.
- Touch devices do not enter constant pointer tracking; their low-quality
  companion fallback remains decorative and non-intercepting.

## H. Test results

- `npm run lint` — passed
- `npx tsc --noEmit` — passed
- Cinematic and stabilization Phase 3 tests — 102 passed
- Browser QA passed at 320×568, 360×800, 375×812, 390×844, 430×932,
  768×1024, 1024×768, 1366×768, 1440×900, and 1920×1080: no horizontal
  overflow or header-control collisions. The mobile release and reverse-scroll
  paths were also verified in the rendered page.

## I. Remaining known limitations

- Actual image decode time still depends on browser, connection, and image
  cache state. The bounded scheduler intentionally favours a nearby frame over
  a blank canvas when a requested frame is not ready.
- Safari viewport behaviour cannot be emulated perfectly in desktop Chrome;
  `svh`/`dvh` sizing and the explicit sticky release are in place to handle the
  relevant viewport transitions.
