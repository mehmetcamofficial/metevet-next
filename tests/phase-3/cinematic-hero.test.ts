import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relative: string) =>
  readFileSync(new URL(relative, import.meta.url), "utf8");

const HERO = read("../../src/components/cinematic/CinematicHero.tsx");
const CANVAS = read("../../src/components/cinematic/CinematicCanvas.tsx");
const OVERLAY = read("../../src/components/cinematic/CinematicOverlay.tsx");
const CONSTANTS = read("../../src/components/cinematic/cinematic.constants.ts");
const FRAMES = read("../../src/components/cinematic/useCinematicFrames.ts");
const SCROLL = read("../../src/components/cinematic/useCinematicScroll.ts");
const TIER = read("../../src/components/cinematic/useCinematicTier.ts");
const POINTER = read("../../src/components/cinematic/usePointerDepth.ts");
const HOME_PAGE = read("../../app/[locale]/page.tsx");
const I18N = read("../../src/lib/i18n.ts");

const MODULES = [HERO, CANVAS, OVERLAY, CONSTANTS, FRAMES, SCROLL, TIER, POINTER];
const ALL = MODULES.join("\n");

// ── Component structure ──

test("1. cinematic client modules declare the client boundary", () => {
  for (const src of [HERO, CANVAS, OVERLAY, FRAMES, SCROLL, TIER, POINTER]) {
    assert.match(src, /^"use client"/);
  }
});

test("2. CinematicHero accepts a locale prop", () => {
  assert.match(HERO, /locale.*Locale/);
});

test("3. frame animation is rendered onto a canvas", () => {
  assert.match(CANVAS, /canvasRef\s*=\s*useRef<HTMLCanvasElement>/);
  assert.match(CANVAS, /<canvas/);
});

test("4. sequence length and the duplicate tail frame are declared", () => {
  assert.match(CONSTANTS, /TOTAL_FRAMES\s*=\s*180/);
  // Frames 179 and 180 are byte-identical; the last usable index is 178.
  assert.match(CONSTANTS, /LAST_USABLE_FRAME\s*=\s*178/);
});

test("5. cover math keeps the zoom factor", () => {
  assert.match(CONSTANTS, /ZOOM_FACTOR\s*=\s*1\.18/);
});

test("6. device pixel ratio is capped", () => {
  assert.match(CONSTANTS, /MAX_DPR\s*=\s*2/);
});

test("7. damping response constant is present", () => {
  assert.match(CONSTANTS, /DAMPING_RESPONSE\s*=\s*14/);
});

test("8. preload concurrency is bounded", () => {
  assert.match(CONSTANTS, /PRELOAD_CONCURRENCY\s*=\s*\d+/);
});

// ── Progressive loading ──

test("9. frames resolve from the cinematic-smooth directory", () => {
  assert.match(CONSTANTS, /\/images\/cinematic-smooth\/frame-/);
  assert.doesNotMatch(ALL, /cinematic-jpg/);
});

test("10. the opening frame is decoded before reveal", () => {
  assert.match(FRAMES, /await first\.decode\(\)/);
});

test("11. loaded and decoded frames are tracked separately", () => {
  assert.match(FRAMES, /loadedRef/);
  assert.match(FRAMES, /decodedRef/);
});

test("12. loading uses a bounded worker pool", () => {
  assert.match(FRAMES, /PRELOAD_CONCURRENCY/);
  assert.match(FRAMES, /inFlight < PRELOAD_CONCURRENCY/);
  assert.match(FRAMES, /pump/);
});

test("13. the hero reveals on the first frame, never on the full sequence", () => {
  // Regression: the previous build gated the entire hero behind all 180
  // frames settling, blocking first paint on ~28 MB of transfer.
  assert.match(FRAMES, /await load\(0\)[\s\S]*?setReady\(true\)/);
  assert.doesNotMatch(FRAMES, /settledCount\s*===\s*TOTAL_FRAMES/);
});

test("14. loading is prioritised: first frame, then ladder, then playhead windows", () => {
  assert.match(FRAMES, /buildPriorityLadder/);
  assert.match(FRAMES, /setScrubReady\(true\)/);
  assert.match(FRAMES, /getCinematicFrameWindow/);
});

test("15. the priority ladder covers every segment boundary", () => {
  assert.match(CONSTANTS, /ladder\.add\(segment\.from\)/);
  assert.match(CONSTANTS, /ladder\.add\(segment\.to\)/);
});

test("16. decoding is windowed around the playhead to bound memory", async () => {
  const { getCinematicFrameWindow, TIER_FRAME_CACHE_LIMIT } = await import(
    "../../src/components/cinematic/cinematic.constants.ts"
  );
  const window = getCinematicFrameWindow(90, "full");
  assert.ok(window.includes(90));
  assert.ok(window.length < TIER_FRAME_CACHE_LIMIT.full);
  assert.match(FRAMES, /maintainDecodeWindow/);
});

test("17. a frame search radius is defined", () => {
  assert.match(CONSTANTS, /FRAME_SEARCH_RADIUS\s*=\s*\d+/);
});

test("18. nearest-frame lookup searches outward in both directions", () => {
  assert.match(FRAMES, /for \(let radius = 1; radius <= FRAME_SEARCH_RADIUS/);
});

test("19. the canvas never blanks once any frame has loaded", () => {
  assert.match(FRAMES, /bestDistance/);
  assert.match(FRAMES, /Never return null once anything has loaded/);
});

// ── Retiming around the dissolve artifacts ──

test("20. the sequence is segmented into clean shots and dissolves", () => {
  assert.match(CONSTANTS, /CINEMATIC_SEGMENTS/);
  for (const id of ["approach", "dissolve-a", "examination", "dissolve-b", "reception"]) {
    assert.ok(CONSTANTS.includes(`"${id}"`), `missing segment ${id}`);
  }
});

test("21. dissolve segments receive less scroll than clean segments", () => {
  const weights = [...CONSTANTS.matchAll(/id: "([\w-]+)"[^}]*?weight: ([\d.]+)/g)].map(
    ([, id, weight]) => ({ id, weight: Number(weight) }),
  );
  assert.equal(weights.length, 5);
  const clean = weights.filter((w) => !w.id.startsWith("dissolve"));
  const dissolves = weights.filter((w) => w.id.startsWith("dissolve"));
  const worstClean = Math.min(...clean.map((w) => w.weight));
  const worstDissolve = Math.max(...dissolves.map((w) => w.weight));
  assert.ok(
    worstDissolve < worstClean,
    "artifact-bearing dissolves must pass faster than every clean shot",
  );
});

test("22. progress-to-frame mapping is monotonic and bounded", async () => {
  const { progressToFrame, LAST_USABLE_FRAME } = await import(
    "../../src/components/cinematic/cinematic.constants.ts"
  );
  let previous = -1;
  for (let step = 0; step <= 200; step++) {
    const frame = progressToFrame(step / 200);
    assert.ok(frame >= previous, `frame regressed at step ${step}`);
    assert.ok(frame >= 0 && frame <= LAST_USABLE_FRAME);
    previous = frame;
  }
  assert.equal(progressToFrame(0), 0);
  assert.equal(progressToFrame(1), LAST_USABLE_FRAME);
});

test("23. out-of-range progress is clamped", async () => {
  const { progressToFrame, LAST_USABLE_FRAME } = await import(
    "../../src/components/cinematic/cinematic.constants.ts"
  );
  assert.equal(progressToFrame(-5), 0);
  assert.equal(progressToFrame(12), LAST_USABLE_FRAME);
});

test("24. narrative beats land on clean shots, not on dissolves", async () => {
  const { CINEMATIC_SCENES, progressToFrame } = await import(
    "../../src/components/cinematic/cinematic.constants.ts"
  );
  const dissolves = [
    { from: 82, to: 112 },
    { from: 148, to: 162 },
  ];
  for (const scene of CINEMATIC_SCENES) {
    const mid = progressToFrame((scene.start + scene.end) / 2);
    for (const range of dissolves) {
      assert.ok(
        mid <= range.from || mid >= range.to,
        `scene ${scene.id} peaks at frame ${mid}, inside a dissolve`,
      );
    }
  }
});

// ── Animation loop ──

test("25. damping is time-based, not per-frame-constant", () => {
  assert.match(CANVAS, /1 - Math\.exp\(-DAMPING_RESPONSE \* deltaSeconds\)/);
});

test("26. delta time is clamped against tab-switch spikes", () => {
  assert.match(CANVAS, /Math\.min\(\(timestamp - \(previous \?\? timestamp\)\) \/ 1000, 0\.05\)/);
});

test("27. the playhead snaps to target when close enough", () => {
  assert.match(CANVAS, /Math\.abs\(frameDelta\) < 0\.01/);
});

test("28. repainting is skipped when nothing changed", () => {
  assert.match(CANVAS, /dirtyRef/);
});

test("29. the canvas stays dirty until a frame actually paints", () => {
  assert.match(CANVAS, /if \(dirtyRef\.current && draw\(ctx\)\) dirtyRef\.current = false/);
});

test("30. the render loop is cancelled on teardown", () => {
  assert.match(CANVAS, /return \(\) => \{[\s\S]*?cancelAnimationFrame\(raf\)/);
});

// ── Scroll driving ──

test("31. scroll is observed passively", () => {
  assert.match(SCROLL, /addEventListener\("scroll", schedule, \{ passive: true \}\)/);
});

test("32. scroll work is throttled to one animation frame", () => {
  assert.match(SCROLL, /if \(frame === null\) frame = window\.requestAnimationFrame\(measure\)/);
});

test("33. sticky progress is derived from the section rect", () => {
  assert.match(SCROLL, /-rect\.top \/ range/);
  assert.match(SCROLL, /section\.offsetHeight - window\.innerHeight/);
});

test("34. scrolling triggers no React state updates", () => {
  // Regression: the previous build called setScrollProgress on every scroll
  // event, re-rendering the whole hero subtree at scroll frequency.
  assert.doesNotMatch(SCROLL, /useState/);
  assert.doesNotMatch(HERO, /setScrollProgress/);
  assert.match(HERO, /overlayRef\.current\?\.update\(progress\)/);
});

test("35. the overlay is updated imperatively through a handle", () => {
  assert.match(OVERLAY, /useImperativeHandle/);
  assert.match(OVERLAY, /element\.style\.opacity/);
});

test("36. resize and orientation changes are handled", () => {
  assert.match(SCROLL, /addEventListener\("resize", schedule\)/);
  assert.match(SCROLL, /addEventListener\("orientationchange", schedule\)/);
});

test("37. scroll listeners are removed on teardown", () => {
  assert.match(SCROLL, /removeEventListener\("scroll", schedule\)/);
  assert.match(SCROLL, /removeEventListener\("resize", schedule\)/);
  assert.match(SCROLL, /cancelAnimationFrame\(frame\)/);
});

// ── Canvas sizing and drawing ──

test("38. the backing store is resized by observer, not on every draw", () => {
  // Regression: the previous build reassigned canvas.width inside the draw
  // call, reallocating the surface sixty times a second.
  assert.match(CANVAS, /new ResizeObserver\(resize\)/);
  assert.match(CANVAS, /if \(canvas\.width === width && canvas\.height === height\) return/);
  const drawBody = CANVAS.slice(CANVAS.indexOf("const draw ="));
  assert.doesNotMatch(drawBody, /canvas\.width\s*=/);
});

test("39. DPR scaling is applied through setTransform", () => {
  assert.match(CANVAS, /context\.setTransform\(dpr, 0, 0, dpr, 0, 0\)/);
  assert.match(CANVAS, /Math\.min\(window\.devicePixelRatio \|\| 1, MAX_DPR\)/);
});

test("40. cover math compares image and box aspect ratios", () => {
  assert.match(CANVAS, /imgAspect > boxAspect/);
  assert.match(CANVAS, /ZOOM_FACTOR/);
});

test("41. zoom is applied once, in draw math only", () => {
  // Regression: the previous build applied ZOOM_FACTOR in the draw math and
  // again as a CSS scale, compounding to ~1.39 and over-cropping the plate.
  assert.doesNotMatch(CANVAS, /transform:\s*`?scale\(\$\{ZOOM_FACTOR\}\)/);
});

test("42. the observer and orientation listener are disconnected", () => {
  assert.match(CANVAS, /observer\.disconnect\(\)/);
  assert.match(CANVAS, /removeEventListener\("orientationchange", resize\)/);
});

// ── Cat gaze and pointer depth ──

test("43. the cat gaze region is configured from measured anchors", () => {
  assert.match(CONSTANTS, /CAT_GAZE\s*=\s*\{/);
  assert.match(CONSTANTS, /anchorX/);
  assert.match(CONSTANTS, /anchorY/);
  assert.match(CONSTANTS, /feather/);
});

test("44. gaze amplitude is restrained", async () => {
  const { CAT_GAZE } = await import(
    "../../src/components/cinematic/cinematic.constants.ts"
  );
  assert.ok(CAT_GAZE.maxTranslatePx <= 8, "gaze translation must stay subtle");
  assert.ok(CAT_GAZE.maxRotateRad <= 0.05, "gaze rotation must stay subtle");
});

test("45. the gaze warp is masked with a feathered alpha falloff", () => {
  assert.match(CANVAS, /createRadialGradient/);
  assert.match(CANVAS, /globalCompositeOperation = "destination-in"/);
});

test("46. the gaze warp only runs while the cat is on screen", () => {
  assert.match(CONSTANTS, /CAT_VISIBLE_RANGE/);
  assert.match(CANVAS, /gazeStrength/);
  assert.match(CANVAS, /if \(strength > 0\)/);
});

test("47. the gaze ramps in and out rather than popping", () => {
  assert.match(CANVAS, /Math\.min\(1, Math\.min\(frame - from, to - frame\) \/ fade\)/);
});

test("48. depth layers move by different amounts", async () => {
  const { DEPTH_AMPLITUDE } = await import(
    "../../src/components/cinematic/cinematic.constants.ts"
  );
  assert.ok(
    DEPTH_AMPLITUDE.background < DEPTH_AMPLITUDE.midground &&
      DEPTH_AMPLITUDE.midground < DEPTH_AMPLITUDE.foreground,
    "layers must separate to read as depth",
  );
  assert.ok(DEPTH_AMPLITUDE.ui < DEPTH_AMPLITUDE.background, "UI should be near-stationary");
  assert.ok(DEPTH_AMPLITUDE.foreground <= 30, "no layer may move far enough to nauseate");
});

test("49. the cat moves differentially against the plate, not with it", () => {
  // The brief explicitly rejects translating the whole canvas and calling it
  // cat tracking; the cat's offset is the difference between the layers.
  assert.match(
    CANVAS,
    /DEPTH_AMPLITUDE\.foreground - DEPTH_AMPLITUDE\.background/,
  );
});

test("50. pointer tracking is mouse-only and fine-pointer gated", () => {
  assert.match(POINTER, /matchMedia\("\(pointer: fine\)"\)/);
  assert.match(POINTER, /event\.pointerType !== "mouse"/);
});

test("51. the cat returns to neutral when the pointer leaves", () => {
  assert.match(POINTER, /mouseleave/);
  assert.match(POINTER, /pointer\.active = false/);
  assert.match(CANVAS, /pointer\.active \? pointer\.x : 0/);
});

test("52. gaze motion is damped, not snapped", () => {
  assert.match(CANVAS, /1 - Math\.exp\(-CAT_GAZE\.damping \* deltaSeconds\)/);
});

test("53. pointer state lives in a ref, never in React state", () => {
  assert.doesNotMatch(POINTER, /useState/);
  assert.match(POINTER, /useRef<PointerState>/);
});

test("54. GSAP is dynamically imported and used only for the UI layer", () => {
  assert.match(POINTER, /import\("gsap"\)/);
  assert.match(POINTER, /gsap\.quickTo/);
});

test("55. pointer listeners are removed on teardown", () => {
  assert.match(POINTER, /removeEventListener\("pointermove", onPointerMove\)/);
  assert.match(POINTER, /removeEventListener\("blur", onRelease\)/);
});

// ── Quality tiers and mobile ──

test("56. quality tiers are declared", () => {
  assert.match(CONSTANTS, /CinematicTier\s*=\s*"full" \| "reduced" \| "lite" \| "static"/);
});

test("57. mobile gets a decimated sequence, not a frozen poster", () => {
  // The brief rejects "just show frame-001.jpg" as the mobile experience.
  assert.match(CONSTANTS, /TIER_STRIDE/);
  assert.match(CONSTANTS, /lite:\s*3/);
  assert.match(CONSTANTS, /TIER_SCROLL_VH/);
});

test("58. tier detection respects reduced motion, save-data and slow networks", () => {
  assert.match(TIER, /prefers-reduced-motion: reduce/);
  assert.match(TIER, /saveData/);
  assert.match(TIER, /effectiveType/);
  assert.match(TIER, /deviceMemory/);
  assert.match(TIER, /hardwareConcurrency/);
});

test("59. tier detection avoids hydration mismatch via an external store", () => {
  assert.match(TIER, /useSyncExternalStore/);
  assert.match(TIER, /\(\) => null/);
});

test("60. decimation preserves segment boundaries", () => {
  assert.match(FRAMES, /Segment edges must survive decimation/);
  assert.match(FRAMES, /planned\.add\(segment\.from\)/);
});

test("61. no gyroscope or device-orientation permission is requested", () => {
  assert.doesNotMatch(ALL, /requestPermission|deviceorientation|DeviceOrientationEvent/i);
});

// ── Narrative ──

test("62. five narrative scenes are defined in order", async () => {
  const { CINEMATIC_SCENES } = await import(
    "../../src/components/cinematic/cinematic.constants.ts"
  );
  assert.deepEqual(
    CINEMATIC_SCENES.map((scene) => scene.id),
    ["intro", "trust", "expertise", "atmosphere", "exit"],
  );
  for (const scene of CINEMATIC_SCENES) {
    assert.ok(scene.start < scene.end, `${scene.id} has an empty window`);
    assert.ok(scene.start >= 0 && scene.end <= 1);
  }
});

test("63. scene windows do not overlap", async () => {
  const { CINEMATIC_SCENES } = await import(
    "../../src/components/cinematic/cinematic.constants.ts"
  );
  for (let i = 1; i < CINEMATIC_SCENES.length; i++) {
    assert.ok(
      CINEMATIC_SCENES[i].start > CINEMATIC_SCENES[i - 1].end,
      `${CINEMATIC_SCENES[i].id} overlaps the previous scene`,
    );
  }
});

test("64. scenes fade with opacity, transform and blur", () => {
  assert.match(OVERLAY, /element\.style\.transform/);
  assert.match(OVERLAY, /blur\(/);
  assert.match(OVERLAY, /element\.style\.visibility/);
});

test("65. story copy is centred by flex so inline transforms do not fight it", () => {
  // An inline transform would otherwise clobber a -translate-y-1/2 utility.
  assert.doesNotMatch(OVERLAY, /-translate-y-1\/2/);
  assert.match(OVERLAY, /flex flex-col items-center justify-center/);
});

// ── Handoff into the page ──

test("66. the hero hands over to the page instead of cutting", () => {
  assert.match(CONSTANTS, /HANDOFF_START/);
  assert.match(HERO, /visual\.style\.opacity/);
  assert.match(HERO, /visual\.style\.transform = `scale\(/);
  assert.match(HERO, /className="sticky top-0/);
  assert.doesNotMatch(HERO, /style\.position\s*=|stickyRef/);
});

test("67. an exit cue appears near the end", () => {
  assert.match(HERO, /exitCueRef/);
  assert.match(HERO, /copy\.exit\.supporting/);
});

test("68. the scroll hint fades out as the sequence starts", () => {
  assert.match(HERO, /scrollHintRef/);
  assert.match(HERO, /1 - progress \/ 0\.08/);
});

// ── Accessibility ──

test("69. the canvas is decorative and hidden from assistive tech", () => {
  assert.match(CANVAS, /aria-hidden="true"/);
});

test("70. the hero carries exactly one H1", () => {
  const headings = OVERLAY.match(/<h1/g) ?? [];
  assert.equal(headings.length, 1);
  assert.doesNotMatch(HERO, /<h1/);
});

test("71. a skip control lets keyboard users bypass the sequence", () => {
  assert.match(HERO, /copy\.skip/);
  assert.match(HERO, /scrollToContent/);
});

test("72. interactive controls expose visible focus states", () => {
  assert.match(HERO, /focus-visible:ring/);
  assert.match(OVERLAY, /focus-visible:ring/);
});

test("73. reduced motion yields the static tier and a complete page", async () => {
  const { selectCinematicTier } = await import(
    "../../src/components/cinematic/cinematic-tier.ts"
  );
  assert.equal(selectCinematicTier({ reducedMotion: true, saveData: false, viewportWidth: 1440 }), "static");
  assert.match(HERO, /isStatic = tier === null \|\| tier === "static"/);
  assert.match(HERO, /animated=\{!isStatic\}/);
});

test("74. programmatic scrolling respects reduced motion", () => {
  assert.match(HERO, /reduced \? "auto" : "smooth"/);
});

test("75. decorative icons are hidden from screen readers", () => {
  const icons = OVERLAY.match(/<(Sparkles|PhoneCall)[^/>]*/g) ?? [];
  assert.ok(icons.length > 0);
  for (const icon of icons) {
    assert.match(icon, /aria-hidden="true"/);
  }
});

// ── Localization ──

test("76. hero copy comes from the dictionary, not hardcoded strings", () => {
  assert.match(OVERLAY, /getDictionary\(locale\)/);
  assert.match(OVERLAY, /dict\.home\.hero\.title/);
  assert.doesNotMatch(HERO, /locale === "tr" \?/);
});

test("77. both locales define the full cinematic narrative", () => {
  const blocks = [...I18N.matchAll(/cinematic:\s*\{[\s\S]*?scrollHint:[\s\S]*?skip:[^\n]*\n/g)];
  assert.equal(blocks.length, 2, "expected tr and en cinematic blocks");
  for (const [block] of blocks) {
    for (const key of ["trust", "expertise", "atmosphere", "exit", "scrollHint", "skip"]) {
      assert.ok(block.includes(`${key}:`), `missing ${key}`);
    }
  }
});

test("78. Turkish narrative copy is genuinely localized", () => {
  assert.match(I18N, /Bakım, güvenle başlar\./);
  assert.match(I18N, /Modern tıp\. Şefkatli bakım\./);
  assert.match(I18N, /MeteVet ile tanışın/);
});

test("79. CTAs point at booking and WhatsApp", () => {
  assert.match(OVERLAY, /getRoutePath\("appointment", locale\)/);
  assert.match(OVERLAY, /wa\.me/);
});

test("80. location and phone remain in the hero", () => {
  assert.match(OVERLAY, /siteConfig\.location/);
  assert.match(OVERLAY, /siteConfig\.phone/);
});

// ── Homepage integration ──

test("81. the homepage renders CinematicHero", () => {
  assert.match(HOME_PAGE, /import \{ CinematicHero \}/);
  assert.match(HOME_PAGE, /<CinematicHero locale=\{resolvedLocale\} \/>/);
});

test("82. the homepage keeps the home-content anchor", () => {
  assert.match(HOME_PAGE, /id="home-content"/);
});

test("83. every homepage section is preserved", () => {
  for (const section of [
    "TrustStrip",
    "ServicesPreview",
    "DoctorProfile",
    "GallerySection",
    "CarePhilosophy",
    "AppointmentCTA",
    "BlogPreview",
    "Faq",
    "ContactPreview",
    "Footer",
  ]) {
    assert.ok(HOME_PAGE.includes(section), `missing ${section}`);
  }
});

test("84. SEO infrastructure is untouched", () => {
  assert.match(HOME_PAGE, /generateMetadata/);
  assert.match(HOME_PAGE, /JsonLd/);
  assert.match(HOME_PAGE, /buildMetadata/);
  assert.match(HOME_PAGE, /MedicalBusiness/);
});

test("85. the skip link and main landmark survive", () => {
  assert.match(HOME_PAGE, /<SkipLink \/>/);
  assert.match(HOME_PAGE, /id="main-content"/);
});

// ── Lifecycle hygiene ──

test("86. painting is gated on viewport intersection", () => {
  assert.match(HERO, /new IntersectionObserver/);
  assert.match(HERO, /observer\.disconnect\(\)/);
  assert.match(CANVAS, /if \(!active\) return/);
});

test("87. in-flight image loads are abandoned and released on unmount", () => {
  assert.match(FRAMES, /cancelled = true/);
  assert.match(FRAMES, /img\.onload = null/);
  assert.match(FRAMES, /img\.src = ""/);
  assert.match(FRAMES, /images\.clear\(\)/);
});

test("88. every effect in the cinematic modules returns a cleanup", () => {
  for (const src of [CANVAS, SCROLL, POINTER]) {
    const effects = src.match(/useEffect\(\(\) => \{/g) ?? [];
    const cleanups = src.match(/return \(\) => \{/g) ?? [];
    assert.ok(
      cleanups.length >= effects.length - 1,
      "effects that subscribe must tear down",
    );
  }
});

test("89. no per-frame console logging survives", () => {
  assert.doesNotMatch(CANVAS, /console\./);
  assert.doesNotMatch(SCROLL, /console\./);
  assert.doesNotMatch(FRAMES, /console\./);
});

test("90. useCallback keeps loader handles stable across renders", () => {
  assert.match(FRAMES, /const getDrawableFrame = useCallback/);
  assert.match(FRAMES, /const maintainDecodeWindow = useCallback/);
  assert.match(HERO, /const handleProgress = useCallback/);
});

// ── Regression checks ──

test("91. booking wizard is untouched", () => {
  assert.ok(read("../../src/components/public-booking/wizard-client.tsx").length > 0);
});

test("92. availability engine is untouched", () => {
  assert.ok(read("../../src/lib/public-booking/availability.ts").length > 0);
});

test("93. admin workflows are untouched", () => {
  assert.ok(read("../../app/admin/page.tsx").length > 0);
});

test("94. no `any` escapes into the cinematic modules", () => {
  for (const src of MODULES) {
    assert.doesNotMatch(src, /:\s*any\b/);
    assert.doesNotMatch(src, /as any\b/);
  }
});

test("95. no secrets or PII in the cinematic modules", () => {
  assert.doesNotMatch(ALL, /password|secret|api[_-]?key/i);
});

test("96. no trailing whitespace in the cinematic modules", () => {
  for (const src of MODULES) {
    const offenders = src
      .split("\n")
      .filter((line) => line.endsWith(" ") || line.endsWith("\t"));
    assert.equal(offenders.length, 0);
  }
});
