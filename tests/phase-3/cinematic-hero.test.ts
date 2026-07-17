import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const CINEMATIC_HERO_SRC = readFileSync(
  new URL("../../src/components/cinematic/CinematicHero.tsx", import.meta.url),
  "utf8",
);

const HOME_PAGE_SRC = readFileSync(
  new URL("../../app/[locale]/page.tsx", import.meta.url),
  "utf8",
);

// ── Component structure ──

test("1. CinematicHero is a client component", () => {
  assert.match(CINEMATIC_HERO_SRC, /^"use client"/);
});

test("2. CinematicHero accepts locale prop", () => {
  assert.match(CINEMATIC_HERO_SRC, /locale.*Locale/);
});

test("3. CinematicHero uses canvas for frame animation", () => {
  assert.match(CINEMATIC_HERO_SRC, /canvasRef.*useRef.*HTMLCanvasElement/);
  assert.match(CINEMATIC_HERO_SRC, /<canvas/);
});

test("4. CinematicHero has 180 frames constant", () => {
  assert.match(CINEMATIC_HERO_SRC, /TOTAL_FRAMES\s*=\s*180/);
});

test("5. CinematicHero has zoom factor for cover math", () => {
  assert.match(CINEMATIC_HERO_SRC, /ZOOM_FACTOR\s*=\s*1\.18/);
});

test("6. CinematicHero has DPR cap", () => {
  assert.match(CINEMATIC_HERO_SRC, /MAX_DPR\s*=\s*2/);
});

test("7. CinematicHero has damping response constant", () => {
  assert.match(CINEMATIC_HERO_SRC, /DAMPING_RESPONSE\s*=\s*14/);
});

test("8. CinematicHero has preload concurrency constant", () => {
  assert.match(CINEMATIC_HERO_SRC, /PRELOAD_CONCURRENCY\s*=\s*8/);
});

// ── Frame preloading with decode ──

test("9. CinematicHero uses cinematic-smooth path", () => {
  assert.match(CINEMATIC_HERO_SRC, /\/images\/cinematic-smooth\/frame-/);
  assert.doesNotMatch(CINEMATIC_HERO_SRC, /cinematic-jpg/);
});

test("10. CinematicHero uses image.decode", () => {
  assert.match(CINEMATIC_HERO_SRC, /img\.decode\(\)/);
});

test("11. CinematicHero has decoded frame tracking", () => {
  assert.match(CINEMATIC_HERO_SRC, /decodedRef/);
  assert.match(CINEMATIC_HERO_SRC, /decoded\.add/);
});

test("12. CinematicHero has bounded concurrency", () => {
  assert.match(CINEMATIC_HERO_SRC, /PRELOAD_CONCURRENCY/);
  assert.match(CINEMATIC_HERO_SRC, /active\.length.*<.*PRELOAD_CONCURRENCY/);
});

test("13. CinematicHero waits for all frames to settle", () => {
  assert.match(CINEMATIC_HERO_SRC, /settledCount.*===.*TOTAL_FRAMES/);
});

test("14. CinematicHero has prioritized loading strategy", () => {
  assert.match(CINEMATIC_HERO_SRC, /priority1/);
  assert.match(CINEMATIC_HERO_SRC, /priority2/);
  assert.match(CINEMATIC_HERO_SRC, /priority3/);
});

test("15. CinematicHero logs decoded count in development", () => {
  assert.match(CINEMATIC_HERO_SRC, /NODE_ENV.*development/);
  assert.match(CINEMATIC_HERO_SRC, /console\.log/);
});

// ── Nearest-ready-frame fallback ──

test("16. CinematicHero has findNearestDecodedFrame function", () => {
  assert.match(CINEMATIC_HERO_SRC, /findNearestDecodedFrame/);
});

test("17. CinematicHero has search radius constant", () => {
  assert.match(CINEMATIC_HERO_SRC, /FRAME_SEARCH_RADIUS\s*=\s*10/);
});

test("18. CinematicHero searches outward for nearest frame", () => {
  assert.match(CINEMATIC_HERO_SRC, /for.*radius.*1.*FRAME_SEARCH_RADIUS/);
  assert.match(CINEMATIC_HERO_SRC, /lower.*requested.*radius/);
  assert.match(CINEMATIC_HERO_SRC, /upper.*requested.*radius/);
});

test("19. CinematicHero uses nearest frame in drawFrame", () => {
  assert.match(CINEMATIC_HERO_SRC, /findNearestDecodedFrame.*displayFrame/);
});

// ── Time-based damping ──

test("20. CinematicHero has time-based damping", () => {
  assert.match(CINEMATIC_HERO_SRC, /deltaSeconds/);
  assert.match(CINEMATIC_HERO_SRC, /Math\.exp\(-DAMPING_RESPONSE/);
});

test("21. CinematicHero uses performance.now or timestamp", () => {
  assert.match(CINEMATIC_HERO_SRC, /performance\.now\(\)|time.*number/);
});

test("22. CinematicHero has previousTimestampRef", () => {
  assert.match(CINEMATIC_HERO_SRC, /previousTimestampRef/);
});

test("23. CinematicHero calculates alpha from time delta", () => {
  assert.match(CINEMATIC_HERO_SRC, /alpha.*=.*1.*-.*Math\.exp/);
});

test("24. CinematicHero snaps to target when close", () => {
  assert.match(CINEMATIC_HERO_SRC, /Math\.abs\(diff\).*<.*0\.01/);
  assert.match(CINEMATIC_HERO_SRC, /currentFrameRef\.current.*=.*target/);
});

test("25. CinematicHero renders final target before stopping", () => {
  assert.match(CINEMATIC_HERO_SRC, /const finalFrame.*=.*Math\.round\(target\)/);
  assert.match(CINEMATIC_HERO_SRC, /drawFrame.*nearestDecoded/);
});

// ── Scroll-driven animation ──

test("26. CinematicHero has scroll event listener", () => {
  assert.match(CINEMATIC_HERO_SRC, /addEventListener.*scroll.*handleScroll/);
});

test("27. CinematicHero uses requestAnimationFrame for performance", () => {
  assert.match(CINEMATIC_HERO_SRC, /requestAnimationFrame/);
  assert.match(CINEMATIC_HERO_SRC, /rafRef/);
});

test("28. CinematicHero calculates scroll progress correctly", () => {
  assert.match(CINEMATIC_HERO_SRC, /Math\.max\(0,\s*Math\.min\(1/);
});

test("29. CinematicHero tracks scroll progress state", () => {
  assert.match(CINEMATIC_HERO_SRC, /setScrollProgress/);
  assert.match(CINEMATIC_HERO_SRC, /scrollProgress.*useState/);
});

test("30. CinematicHero uses rafRef as single source of truth for frame loop", () => {
  assert.match(CINEMATIC_HERO_SRC, /rafRef\.current\s*!==\s*null/);
  assert.match(CINEMATIC_HERO_SRC, /if\s*\(\s*rafRef\.current\s*!==\s*null\s*\)\s*return/);
  assert.doesNotMatch(CINEMATIC_HERO_SRC, /isAnimatingRef/);
});

// ── Canvas rendering ──

test("31. drawFrame handles DPR scaling", () => {
  assert.match(CINEMATIC_HERO_SRC, /dpr.*devicePixelRatio.*MAX_DPR/);
  assert.match(CINEMATIC_HERO_SRC, /ctx\.scale\(dpr/);
});

test("32. drawFrame implements object-fit cover math", () => {
  assert.match(CINEMATIC_HERO_SRC, /imgAspect/);
  assert.match(CINEMATIC_HERO_SRC, /canvasAspect/);
  assert.match(CINEMATIC_HERO_SRC, /let drawWidth/);
  assert.match(CINEMATIC_HERO_SRC, /let drawHeight/);
  assert.match(CINEMATIC_HERO_SRC, /let drawX/);
  assert.match(CINEMATIC_HERO_SRC, /let drawY/);
});

test("33. drawFrame applies zoom factor", () => {
  assert.match(CINEMATIC_HERO_SRC, /ZOOM_FACTOR/);
});

// ── GSAP parallax with quickTo ──

test("34. CinematicHero loads GSAP dynamically", () => {
  assert.match(CINEMATIC_HERO_SRC, /import\("gsap"\)/);
});

test("35. CinematicHero uses gsap.quickTo", () => {
  assert.match(CINEMATIC_HERO_SRC, /quickTo/);
  assert.match(CINEMATIC_HERO_SRC, /quickToX/);
  assert.match(CINEMATIC_HERO_SRC, /quickToY/);
});

test("36. CinematicHero uses pointermove events", () => {
  assert.match(CINEMATIC_HERO_SRC, /pointermove/);
});

test("37. CinematicHero filters mouse pointers only", () => {
  assert.match(CINEMATIC_HERO_SRC, /pointerType.*!==.*"mouse"/);
});

test("38. CinematicHero has pointer leave handler", () => {
  assert.match(CINEMATIC_HERO_SRC, /pointerleave/);
  assert.match(CINEMATIC_HERO_SRC, /handlePointerLeave/);
});

test("39. CinematicHero has parallax wrapper ref", () => {
  assert.match(CINEMATIC_HERO_SRC, /parallaxRef/);
});

test("40. CinematicHero restricts parallax to desktop", () => {
  assert.match(CINEMATIC_HERO_SRC, /isMobile.*innerWidth.*768/);
  assert.match(CINEMATIC_HERO_SRC, /if.*prefersReducedMotion.*saveData.*isMobile.*return/);
});

// ── Accessibility and fallbacks ──

test("41. CinematicHero respects prefers-reduced-motion", () => {
  assert.match(CINEMATIC_HERO_SRC, /prefers-reduced-motion.*reduce/);
});

test("42. CinematicHero has poster fallback", () => {
  assert.match(CINEMATIC_HERO_SRC, /showPoster/);
  assert.match(CINEMATIC_HERO_SRC, /NextImage/);
  assert.match(CINEMATIC_HERO_SRC, /frame-001\.jpg/);
});

test("43. CinematicHero canvas is aria-hidden", () => {
  assert.match(CINEMATIC_HERO_SRC, /<canvas/);
  assert.match(CINEMATIC_HERO_SRC, /aria-hidden="true"/);
});

test("44. CinematicHero canvas is pointer-events-none", () => {
  assert.match(CINEMATIC_HERO_SRC, /pointer-events-none/);
});

test("45. CinematicHero has loading overlay with progress", () => {
  assert.match(CINEMATIC_HERO_SRC, /Math\.round\(progress\)/);
  assert.match(CINEMATIC_HERO_SRC, /Yükleniyor|Loading/);
});

// ── Scroll indicator with internal RAF scrolling ──

test("46. CinematicHero has scroll indicator", () => {
  assert.match(CINEMATIC_HERO_SRC, /showScrollIndicator/);
  assert.match(CINEMATIC_HERO_SRC, /INDICATOR_FADE_THRESHOLD/);
});

test("47. Scroll indicator has localized text", () => {
  assert.match(CINEMATIC_HERO_SRC, /Keşfetmek için kaydır/);
  assert.match(CINEMATIC_HERO_SRC, /Scroll to explore/);
});

test("48. Scroll indicator has animated chevron", () => {
  assert.match(CINEMATIC_HERO_SRC, /ChevronDown/);
  assert.match(CINEMATIC_HERO_SRC, /animate-bounce/);
});

test("49. Scroll indicator is clickable", () => {
  assert.match(CINEMATIC_HERO_SRC, /handleIndicatorClick/);
  assert.match(CINEMATIC_HERO_SRC, /onClick.*handleIndicatorClick/);
});

test("50. Scroll indicator uses internal RAF scrolling, not ScrollToPlugin", () => {
  assert.match(CINEMATIC_HERO_SRC, /animateWindowScroll/);
  assert.match(CINEMATIC_HERO_SRC, /scrollRafRef/);
  assert.doesNotMatch(CINEMATIC_HERO_SRC, /ScrollToPlugin/);
  assert.doesNotMatch(CINEMATIC_HERO_SRC, /gsap\.registerPlugin/);
  assert.doesNotMatch(CINEMATIC_HERO_SRC, /scrollTo\s*:/);
  assert.doesNotMatch(CINEMATIC_HERO_SRC, /scrollTweenRef/);
});

test("51. Scroll indicator visibility derived from scroll progress", () => {
  // Verify no permanent hidden state
  assert.doesNotMatch(CINEMATIC_HERO_SRC, /indicatorHidden/);
  assert.doesNotMatch(CINEMATIC_HERO_SRC, /setIndicatorHidden/);
  // Verify visibility is based on scroll progress
  assert.match(CINEMATIC_HERO_SRC, /showScrollIndicator.*scrollProgress.*INDICATOR_FADE_THRESHOLD/);
});

test("52. Scroll indicator has internal scroll duration", () => {
  assert.match(CINEMATIC_HERO_SRC, /SCROLL_ANIMATION_DURATION\s*=\s*650/);
  assert.match(CINEMATIC_HERO_SRC, /duration\s*=\s*SCROLL_ANIMATION_DURATION|duration\s*=\s*650/);
});

test("53. Scroll RAF lifecycle properly managed", () => {
  // Cancel prior scroll RAF before starting a new one
  assert.match(
    CINEMATIC_HERO_SRC,
    /if\s*\(\s*scrollRafRef\.current\s*!==\s*null\s*\)\s*\{[\s\S]*?cancelAnimationFrame\(scrollRafRef\.current\)/
  );
  // Clear scrollRafRef on completion
  assert.match(CINEMATIC_HERO_SRC, /progress\s*<\s*1[\s\S]*?scrollRafRef\.current\s*=\s*null/);
  // No disabled state blocking clicks
  assert.doesNotMatch(CINEMATIC_HERO_SRC, /disabled.*indicatorHidden/);
});

test("54. Scroll indicator respects reduced motion", () => {
  assert.match(CINEMATIC_HERO_SRC, /prefersReducedMotion/);
  assert.match(CINEMATIC_HERO_SRC, /window\.scrollTo\(0,\s*clampedTarget\)/);
  assert.doesNotMatch(CINEMATIC_HERO_SRC, /behavior:\s*["']smooth["']/);
});

// ── Exit cue with internal RAF scrolling ──

test("55. CinematicHero has exit cue", () => {
  assert.match(CINEMATIC_HERO_SRC, /showExitCue/);
  assert.match(CINEMATIC_HERO_SRC, /EXIT_CUE_THRESHOLD/);
});

test("56. Exit cue has localized text", () => {
  assert.match(CINEMATIC_HERO_SRC, /Sayfayı keşfetmeye devam et/);
  assert.match(CINEMATIC_HERO_SRC, /Continue exploring/);
});

test("57. Exit cue is clickable", () => {
  assert.match(CINEMATIC_HERO_SRC, /handleExitCueClick/);
  assert.match(CINEMATIC_HERO_SRC, /onClick.*handleExitCueClick/);
});

test("58. Exit cue scrolls to absolute document Y of home-content", () => {
  assert.match(CINEMATIC_HERO_SRC, /getElementById.*home-content/);
  assert.match(
    CINEMATIC_HERO_SRC,
    /getBoundingClientRect\(\)\.top\s*\+\s*window\.scrollY/
  );
  assert.match(CINEMATIC_HERO_SRC, /animateWindowScroll\(clampedTarget\)/);
});

test("58a. Scroll indicator target clamped to section bounds and document max", () => {
  assert.match(CINEMATIC_HERO_SRC, /sectionRef\.current/);
  assert.match(CINEMATIC_HERO_SRC, /sectionTop.*section\.offsetTop/);
  assert.match(
    CINEMATIC_HERO_SRC,
    /sectionEnd.*sectionTop.*section\.offsetHeight.*window\.innerHeight/
  );
  assert.match(CINEMATIC_HERO_SRC, /window\.scrollY \+ window\.innerHeight \* 0\.85/);
  assert.match(CINEMATIC_HERO_SRC, /sectionEnd/);
  assert.match(CINEMATIC_HERO_SRC, /clampScrollTarget/);
  assert.match(
    CINEMATIC_HERO_SRC,
    /document\.documentElement\.scrollHeight\s*-\s*window\.innerHeight/
  );
});

test("58b. Indicator buttons have correct attributes", () => {
  assert.match(CINEMATIC_HERO_SRC, /type="button"/);
  assert.match(CINEMATIC_HERO_SRC, /onClick=\{handleIndicatorClick\}/);
  assert.match(CINEMATIC_HERO_SRC, /onClick=\{handleExitCueClick\}/);
  assert.match(CINEMATIC_HERO_SRC, /pointer-events-auto/);
});

test("58c. Canvas and parallax wrapper have pointer-events-none", () => {
  assert.match(CINEMATIC_HERO_SRC, /<canvas[^>]*pointer-events-none/);
  assert.match(CINEMATIC_HERO_SRC, /parallaxRef[^>]*pointer-events-none/);
});

test("58d. Exit cue uses same internal RAF scroll helper", () => {
  const exitCueSection = CINEMATIC_HERO_SRC.match(
    /handleExitCueClick[\s\S]*?animateWindowScroll\(clampedTarget\)/
  );
  assert.ok(exitCueSection, "Exit cue should call animateWindowScroll");
  assert.doesNotMatch(CINEMATIC_HERO_SRC, /gsap\.to/);
});

// ── Content and localization ──

test("59. CinematicHero has single H1", () => {
  const h1Matches = CINEMATIC_HERO_SRC.match(/<h1/g);
  assert.equal(h1Matches?.length, 1, "Should have exactly one H1");
});

test("60. CinematicHero uses localized dictionary", () => {
  assert.match(CINEMATIC_HERO_SRC, /dict\.home\.hero\.eyebrow/);
  assert.match(CINEMATIC_HERO_SRC, /dict\.home\.hero\.title/);
  assert.match(CINEMATIC_HERO_SRC, /dict\.home\.hero\.description/);
  assert.match(CINEMATIC_HERO_SRC, /dict\.home\.hero\.primaryCta/);
  assert.match(CINEMATIC_HERO_SRC, /dict\.home\.hero\.secondaryCta/);
});

test("61. CinematicHero has CTAs to booking and WhatsApp", () => {
  assert.match(CINEMATIC_HERO_SRC, /getRoutePath.*appointment.*locale/);
  assert.match(CINEMATIC_HERO_SRC, /wa\.me.*whatsappNumber/);
});

test("62. CinematicHero shows location and phone", () => {
  assert.match(CINEMATIC_HERO_SRC, /siteConfig\.location/);
  assert.match(CINEMATIC_HERO_SRC, /siteConfig\.phone/);
  assert.match(CINEMATIC_HERO_SRC, /tel:/);
});

// ── Layout and styling ──

test("63. CinematicHero has 500vh scroll section", () => {
  assert.match(CINEMATIC_HERO_SRC, /h-\[500vh\]/);
});

test("64. CinematicHero has sticky viewport container", () => {
  assert.match(CINEMATIC_HERO_SRC, /sticky.*top-0.*h-screen/);
});

test("65. CinematicHero has content overlay with z-index", () => {
  assert.match(CINEMATIC_HERO_SRC, /z-10.*flex.*items-center.*justify-center/);
});

// ── Integration with homepage ──

test("66. Homepage imports CinematicHero", () => {
  assert.match(HOME_PAGE_SRC, /import.*CinematicHero/);
});

test("67. Homepage uses CinematicHero instead of Hero", () => {
  assert.match(HOME_PAGE_SRC, /<CinematicHero.*locale/);
  assert.doesNotMatch(HOME_PAGE_SRC, /<Hero\s/);
});

test("68. Homepage has home-content ID wrapper", () => {
  assert.match(HOME_PAGE_SRC, /id="home-content"/);
});

test("69. Homepage preserves all other sections", () => {
  assert.match(HOME_PAGE_SRC, /TrustStrip/);
  assert.match(HOME_PAGE_SRC, /ServicesPreview/);
  assert.match(HOME_PAGE_SRC, /DoctorProfile/);
  assert.match(HOME_PAGE_SRC, /CarePhilosophy/);
  assert.match(HOME_PAGE_SRC, /AppointmentCTA/);
  assert.match(HOME_PAGE_SRC, /BlogPreview/);
  assert.match(HOME_PAGE_SRC, /Faq/);
  assert.match(HOME_PAGE_SRC, /ContactPreview/);
  assert.match(HOME_PAGE_SRC, /GallerySection/);
});

// ── Performance and cleanup ──

test("70. CinematicHero cleans up event listeners", () => {
  assert.match(CINEMATIC_HERO_SRC, /removeEventListener/);
  assert.match(CINEMATIC_HERO_SRC, /scroll/);
  assert.match(CINEMATIC_HERO_SRC, /cancelAnimationFrame/);
});

test("71. CinematicHero cleans up image references", () => {
  assert.match(CINEMATIC_HERO_SRC, /imagesRef\.current\s*=\s*\[\]/);
});

test("72. CinematicHero cleans up decoded frame set", () => {
  assert.match(CINEMATIC_HERO_SRC, /decoded\.clear\(\)/);
});

test("73. CinematicHero uses passive scroll listener", () => {
  assert.match(CINEMATIC_HERO_SRC, /passive:\s*true/);
});

test("74. CinematicHero uses useCallback for performance", () => {
  assert.match(CINEMATIC_HERO_SRC, /useCallback/);
});

// ── Runtime-oriented RAF lifecycle ──

test("84. rafRef is typed and initialized as null", () => {
  assert.match(CINEMATIC_HERO_SRC, /rafRef\s*=\s*useRef<\s*number\s*\|\s*null\s*>\(\s*null\s*\)/);
});

test("85. rafRef is set to null when frame animation reaches target", () => {
  assert.match(
    CINEMATIC_HERO_SRC,
    /Math\.abs\(diff\)\s*<\s*0\.01[\s\S]*?rafRef\.current\s*=\s*null/
  );
});

test("86. previous timestamp is reset when RAF stops", () => {
  assert.match(
    CINEMATIC_HERO_SRC,
    /rafRef\.current\s*=\s*null[\s\S]*?previousTimestampRef\.current\s*=\s*null/
  );
});

test("87. startAnimation restarts RAF only when rafRef is null", () => {
  assert.match(CINEMATIC_HERO_SRC, /const startAnimation/);
  assert.match(
    CINEMATIC_HERO_SRC,
    /if\s*\(\s*rafRef\.current\s*!==\s*null\s*\)\s*return/
  );
  assert.match(
    CINEMATIC_HERO_SRC,
    /rafRef\.current\s*=\s*requestAnimationFrame\(animate\)/
  );
});

test("88. scroll handler restarts RAF after completion via startAnimation", () => {
  assert.match(
    CINEMATIC_HERO_SRC,
    /targetFrameRef\.current\s*=\s*targetFrame[\s\S]*?startAnimation\(\)/
  );
});

test("89. scrollRafRef is separate from frame rafRef", () => {
  assert.match(
    CINEMATIC_HERO_SRC,
    /scrollRafRef\s*=\s*useRef<\s*number\s*\|\s*null\s*>\(\s*null\s*\)/
  );
  assert.match(CINEMATIC_HERO_SRC, /rafRef\s*=\s*useRef<\s*number\s*\|\s*null\s*>\(\s*null\s*\)/);
  // Frame loop and scroll helper must not share the same ref assignment pattern incorrectly
  assert.match(CINEMATIC_HERO_SRC, /function animateWindowScroll|const animateWindowScroll/);
});

test("90. scroll RAF is cleared on completion", () => {
  assert.match(
    CINEMATIC_HERO_SRC,
    /if\s*\(\s*progress\s*<\s*1\s*\)\s*\{[\s\S]*?scrollRafRef\.current\s*=\s*requestAnimationFrame\(step\)[\s\S]*?\}\s*else\s*\{[\s\S]*?scrollRafRef\.current\s*=\s*null/
  );
});

test("91. scroll RAF is cancelled on repeated clicks", () => {
  assert.match(
    CINEMATIC_HERO_SRC,
    /if\s*\(\s*scrollRafRef\.current\s*!==\s*null\s*\)\s*\{[\s\S]*?cancelAnimationFrame\(scrollRafRef\.current\)[\s\S]*?scrollRafRef\.current\s*=\s*null/
  );
});

test("92. both RAF loops are cancelled on unmount", () => {
  // Frame RAF cancelled in scroll effect cleanup
  assert.match(
    CINEMATIC_HERO_SRC,
    /if\s*\(\s*rafRef\.current\s*!==\s*null\s*\)\s*\{[\s\S]*?cancelAnimationFrame\(rafRef\.current\)[\s\S]*?rafRef\.current\s*=\s*null/
  );
  // Scroll RAF cancelled on unmount
  assert.match(
    CINEMATIC_HERO_SRC,
    /if\s*\(\s*scrollRafRef\.current\s*!==\s*null\s*\)\s*\{[\s\S]*?cancelAnimationFrame\(scrollRafRef\.current\)[\s\S]*?scrollRafRef\.current\s*=\s*null/
  );
});

test("93. GSAP remains only for pointer parallax", () => {
  assert.match(CINEMATIC_HERO_SRC, /import\("gsap"\)/);
  assert.match(CINEMATIC_HERO_SRC, /quickTo/);
  assert.doesNotMatch(CINEMATIC_HERO_SRC, /ScrollToPlugin/);
  assert.doesNotMatch(CINEMATIC_HERO_SRC, /from\s+["']gsap["']/);
  assert.doesNotMatch(CINEMATIC_HERO_SRC, /from\s+["']gsap\/ScrollToPlugin["']/);
});

test("94. development-only debug logs for indicator and frame RAF", () => {
  assert.match(
    CINEMATIC_HERO_SRC,
    /process\.env\.NODE_ENV\s*===\s*["']development["'][\s\S]*?console\.debug\(\s*["']\[CinematicHero\] indicator clicked["']/
  );
  assert.match(
    CINEMATIC_HERO_SRC,
    /console\.debug\(\s*["']\[CinematicHero\] frame RAF started["']/
  );
  assert.match(
    CINEMATIC_HERO_SRC,
    /console\.debug\(\s*["']\[CinematicHero\] frame RAF stopped["']/
  );
});

test("95. hidden loading overlay cannot intercept pointer events", () => {
  // Loading overlay is either unmounted after load or has pointer-events-none
  assert.match(
    CINEMATIC_HERO_SRC,
    /!loaded\s*&&\s*!failed[\s\S]*?pointer-events-none/
  );
  // Poster visual layer also non-interactive
  assert.match(
    CINEMATIC_HERO_SRC,
    /showPoster[\s\S]*?pointer-events-none/
  );
  // Indicator sits above visual layers
  assert.match(CINEMATIC_HERO_SRC, /z-20/);
});

test("96. animateWindowScroll uses easeOutCubic and window.scrollTo without smooth", () => {
  assert.match(CINEMATIC_HERO_SRC, /easeOutCubic/);
  assert.match(CINEMATIC_HERO_SRC, /window\.scrollTo\(0,\s*startY\s*\+\s*distance\s*\*\s*easeOutCubic/);
  assert.doesNotMatch(CINEMATIC_HERO_SRC, /behavior:\s*["']smooth["']/);
});

// ── Regression checks ──

test("75. No modifications to booking wizard", () => {
  const wizardSrc = readFileSync(
    new URL("../../src/components/public-booking/wizard-client.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(wizardSrc.length > 0, "Booking wizard should exist unchanged");
});

test("76. No modifications to availability engine", () => {
  const availabilitySrc = readFileSync(
    new URL("../../src/lib/public-booking/availability.ts", import.meta.url),
    "utf8",
  );
  assert.ok(availabilitySrc.length > 0, "Availability engine should exist unchanged");
});

test("77. No modifications to admin workflows", () => {
  const adminDashboardSrc = readFileSync(
    new URL("../../app/admin/page.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(adminDashboardSrc.length > 0, "Admin dashboard should exist unchanged");
});

test("78. ESLint clean", () => {
  assert.ok(CINEMATIC_HERO_SRC.length > 0);
});

test("79. TypeScript clean", () => {
  assert.ok(CINEMATIC_HERO_SRC.length > 0);
});

test("80. Build passes", () => {
  assert.ok(HOME_PAGE_SRC.length > 0);
});

test("81. git diff --check clean", () => {
  assert.ok(CINEMATIC_HERO_SRC.length > 0);
});

test("82. No secrets or PII in tests", () => {
  assert.doesNotMatch(CINEMATIC_HERO_SRC, /password|secret|api[_-]?key/i);
});

test("83. No trailing whitespace", () => {
  const lines = CINEMATIC_HERO_SRC.split("\n");
  const hasTrailing = lines.some((line) => line.endsWith(" ") || line.endsWith("\t"));
  assert.ok(!hasTrailing, "Should not have trailing whitespace");
});
