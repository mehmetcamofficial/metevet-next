import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const MOTION_DIR = new URL("../../src/components/motion/", import.meta.url);
const ROOT = new URL("../../", import.meta.url);

function readMotion(name: string) {
  return readFileSync(new URL(name, MOTION_DIR), "utf8");
}

function readRoot(rel: string) {
  return readFileSync(new URL(rel, ROOT), "utf8");
}

// ── Motion foundation files exist ──

test("1. Motion config file exists", () => {
  assert.ok(existsSync(new URL("motion-config.ts", MOTION_DIR)));
});

test("2. useReducedMotion hook exists", () => {
  assert.ok(existsSync(new URL("useReducedMotion.ts", MOTION_DIR)));
});

test("3. useInViewOnce hook exists", () => {
  assert.ok(existsSync(new URL("useInViewOnce.ts", MOTION_DIR)));
});

test("4. MotionProvider exists", () => {
  assert.ok(existsSync(new URL("MotionProvider.tsx", MOTION_DIR)));
});

test("5. Reveal component exists", () => {
  assert.ok(existsSync(new URL("Reveal.tsx", MOTION_DIR)));
});

test("6. BlurText component exists", () => {
  assert.ok(existsSync(new URL("BlurText.tsx", MOTION_DIR)));
});

test("7. StaggerGroup component exists", () => {
  assert.ok(existsSync(new URL("StaggerGroup.tsx", MOTION_DIR)));
});

test("8. SectionTransition component exists", () => {
  assert.ok(existsSync(new URL("SectionTransition.tsx", MOTION_DIR)));
});

test("9. ParallaxMedia component exists", () => {
  assert.ok(existsSync(new URL("ParallaxMedia.tsx", MOTION_DIR)));
});

test("10. CountUp component exists", () => {
  assert.ok(existsSync(new URL("CountUp.tsx", MOTION_DIR)));
});

test("11. MagneticLink component exists", () => {
  assert.ok(existsSync(new URL("MagneticLink.tsx", MOTION_DIR)));
});

test("12. load-gsap singleton exists", () => {
  assert.ok(existsSync(new URL("load-gsap.ts", MOTION_DIR)));
});

// ── Shared sources ──

const REVEAL_SRC = readMotion("Reveal.tsx");
const BLURTEXT_SRC = readMotion("BlurText.tsx");
const STAGGER_SRC = readMotion("StaggerGroup.tsx");
const PARALLAX_SRC = readMotion("ParallaxMedia.tsx");
const LOAD_GSAP_SRC = readMotion("load-gsap.ts");
const CONFIG_SRC = readMotion("motion-config.ts");
const INDEX_SRC = readMotion("index.ts");

test("13. Reveal uses useReducedMotion hook", () => {
  assert.match(REVEAL_SRC, /useReducedMotion\(\)/);
});

test("14. BlurText uses useReducedMotion hook", () => {
  assert.match(BLURTEXT_SRC, /useReducedMotion\(\)/);
});

test("15. StaggerGroup uses useReducedMotion hook", () => {
  assert.match(STAGGER_SRC, /useReducedMotion\(\)/);
});

test("16. loadGsap registers ScrollTrigger", () => {
  assert.match(LOAD_GSAP_SRC, /ScrollTrigger/);
  assert.match(LOAD_GSAP_SRC, /registerPlugin/);
});

test("17. No Lenis dependency in motion components", () => {
  assert.doesNotMatch(REVEAL_SRC, /lenis/i);
  assert.doesNotMatch(BLURTEXT_SRC, /lenis/i);
  assert.doesNotMatch(STAGGER_SRC, /lenis/i);
  assert.doesNotMatch(LOAD_GSAP_SRC, /lenis/i);
});

test("18. No Framer Motion in motion components", () => {
  assert.doesNotMatch(REVEAL_SRC, /from ['"]framer-motion['"]/);
  assert.doesNotMatch(BLURTEXT_SRC, /from ['"]framer-motion['"]/);
  assert.doesNotMatch(STAGGER_SRC, /from ['"]framer-motion['"]/);
});

test("19. Reveal has GSAP context cleanup", () => {
  assert.match(REVEAL_SRC, /ctx\?\.revert\(\)/);
  assert.match(REVEAL_SRC, /cancelled/);
});

test("20. BlurText has GSAP context cleanup", () => {
  assert.match(BLURTEXT_SRC, /ctx\?\.revert\(\)/);
});

test("21. StaggerGroup has GSAP context cleanup", () => {
  assert.match(STAGGER_SRC, /ctx\?\.revert\(\)/);
});

// ── Server homepage remains a Server Component ──

const HOME_PAGE_SRC = readRoot("app/[locale]/page.tsx");

test("22. Homepage is a Server Component (no 'use client')", () => {
  assert.doesNotMatch(HOME_PAGE_SRC, /^["']use client["']/m);
});

const CINEMATIC_HERO_SRC = readRoot("src/components/cinematic/CinematicHero.tsx");

test("23. CinematicHero is still a client component", () => {
  assert.match(CINEMATIC_HERO_SRC, /^["']use client["']/m);
});

test("24. CinematicHero still has 180 frames constant", () => {
  assert.match(
    readRoot("src/components/cinematic/cinematic.constants.ts"),
    /TOTAL_FRAMES\s*=\s*180/,
  );
});

test("25. Homepage has TrustStrip", () => {
  assert.match(HOME_PAGE_SRC, /TrustStrip/);
});

test("26. Homepage has ServicesPreview", () => {
  assert.match(HOME_PAGE_SRC, /ServicesPreview/);
});

test("27. Homepage has DoctorProfile", () => {
  assert.match(HOME_PAGE_SRC, /DoctorProfile/);
});

test("28. Homepage has GallerySection", () => {
  assert.match(HOME_PAGE_SRC, /GallerySection/);
});

test("29. Homepage has CarePhilosophy", () => {
  assert.match(HOME_PAGE_SRC, /CarePhilosophy/);
});

test("30. Homepage has AppointmentCTA", () => {
  assert.match(HOME_PAGE_SRC, /AppointmentCTA/);
});

test("31. Homepage has BlogPreview", () => {
  assert.match(HOME_PAGE_SRC, /BlogPreview/);
});

test("32. Homepage has Faq", () => {
  assert.match(HOME_PAGE_SRC, /Faq/);
});

test("33. Homepage has ContactPreview", () => {
  assert.match(HOME_PAGE_SRC, /ContactPreview/);
});

test("34. CinematicHero has single H1", () => {
  // The heading now lives in CinematicOverlay; the hero subtree must still
  // contribute exactly one H1 to the document.
  const heroSubtree =
    CINEMATIC_HERO_SRC + readRoot("src/components/cinematic/CinematicOverlay.tsx");
  const h1Matches = heroSubtree.match(/<h1/g);
  assert.equal(h1Matches?.length, 1, "Should have exactly one H1");
});

test("35. BlurText has sr-only fallback for screen readers", () => {
  assert.match(BLURTEXT_SRC, /sr-only/);
});

test("36. BlurText has aria-hidden on decorative wrapper", () => {
  assert.match(BLURTEXT_SRC, /aria-hidden="true"/);
});

test("37. Reveal does not hardcode initial opacity 0 in JSX", () => {
  assert.doesNotMatch(REVEAL_SRC, /style=\{\{[^}]*opacity:\s*0/);
  assert.doesNotMatch(REVEAL_SRC, /className=.*opacity-0/);
});

test("38. Reveal uses progressive enhancement guards", () => {
  assert.match(REVEAL_SRC, /immediateRender:\s*false/);
  assert.match(REVEAL_SRC, /isApproximatelyInView|getBoundingClientRect/);
});

const SERVICES_SRC = readRoot("src/components/home/services-preview.tsx");

test("39. ServicesPreview cards are article elements", () => {
  assert.match(SERVICES_SRC, /<article/);
});

test("40. ServicesPreview uses BlurText for heading", () => {
  assert.match(SERVICES_SRC, /BlurText/);
});

const NAVBAR_SRC = readRoot("src/components/layout/navbar.tsx");

test("41. Navbar is a client component", () => {
  assert.match(NAVBAR_SRC, /["']use client["']/);
});

test("42. Navbar has mobile menu button", () => {
  assert.match(NAVBAR_SRC, /xl:hidden/);
});

test("43. Navbar has scroll state for liquid-glass", () => {
  assert.match(NAVBAR_SRC, /scrolled/);
  assert.match(NAVBAR_SRC, /backdrop-blur/);
  assert.match(NAVBAR_SRC, /scrollY|addEventListener\(["']scroll["']/);
});

const FAQ_SRC = readRoot("src/components/home/faq.tsx");

test("44. FAQ has aria-expanded on button", () => {
  assert.match(FAQ_SRC, /aria-expanded/);
});

test("45. FAQ uses index state not indexOf", () => {
  assert.match(FAQ_SRC, /openIndex === index/);
  assert.doesNotMatch(FAQ_SRC, /indexOf\(item\)/);
});

test("46. FAQ accordion uses grid-rows animation", () => {
  assert.match(FAQ_SRC, /grid-rows-\[1fr\]/);
  assert.match(FAQ_SRC, /grid-rows-\[0fr\]/);
});

const GALLERY_SRC = readRoot("src/components/home/gallery-section.tsx");

test("47. GallerySection does not gate fundamental media visibility", () => {
  assert.doesNotMatch(GALLERY_SRC, /StaggerGroup/);
  assert.doesNotMatch(GALLERY_SRC, /opacity-0|invisible/);
});

test("48. GallerySection uses DepthMedia (immersive)", () => {
  assert.match(GALLERY_SRC, /DepthMedia/);
});

test("49. ParallaxMedia checks reduced motion", () => {
  assert.match(PARALLAX_SRC, /useReducedMotion\(\)/);
});

test("50. ParallaxMedia checks mobile breakpoint", () => {
  assert.match(PARALLAX_SRC, /BREAKPOINTS\.mobile|innerWidth/);
});

test("51. Reveal uses GSAP context (not React state for scroll)", () => {
  assert.match(REVEAL_SRC, /gsap\.context/);
  assert.doesNotMatch(REVEAL_SRC, /setScrollProgress|scrollProgress/);
});

const ADMIN_PAGE_SRC = readRoot("app/admin/page.tsx");

test("52. Admin dashboard exists unchanged", () => {
  assert.ok(ADMIN_PAGE_SRC.length > 0);
});

const GLOBALS_SRC = readRoot("app/globals.css");

test("53. glass-light utility exists", () => {
  assert.match(GLOBALS_SRC, /\.glass-light/);
});

test("54. glass-dark utility exists", () => {
  assert.match(GLOBALS_SRC, /\.glass-dark/);
});

test("55. glass-cta utility exists", () => {
  assert.match(GLOBALS_SRC, /\.glass-cta/);
});

test("56. glass-pill utility exists", () => {
  assert.match(GLOBALS_SRC, /\.glass-pill/);
});

test("57. glass-caption utility exists", () => {
  assert.match(GLOBALS_SRC, /\.glass-caption/);
});

test("58. backdrop-filter fallback exists", () => {
  assert.match(GLOBALS_SRC, /@supports not \(backdrop-filter/);
});

test("59. No horizontal overflow in motion components", () => {
  assert.doesNotMatch(REVEAL_SRC, /overflow-x-auto|whitespace-nowrap.*overflow/);
  assert.doesNotMatch(BLURTEXT_SRC, /overflow-x-auto|whitespace-nowrap.*overflow/);
});

const TRUST_SRC = readRoot("src/components/home/trust-strip.tsx");

test("60. TrustStrip uses StaggerGroup and hero handoff gradient", () => {
  assert.match(TRUST_SRC, /StaggerGroup/);
  assert.match(TRUST_SRC, /gradient|from-\[#0D2922\]/);
  assert.doesNotMatch(TRUST_SRC, /^["']use client["']/m);
});

test("61. Public API exports MagneticLink and loadGsap", () => {
  assert.match(INDEX_SRC, /MagneticLink/);
  assert.match(INDEX_SRC, /loadGsap/);
});

test("62. Motion config has calm clinical timings", () => {
  assert.match(CONFIG_SRC, /reveal:\s*0\.85/);
  assert.match(CONFIG_SRC, /stagger:\s*0\.0[68]/);
  assert.match(CONFIG_SRC, /pageTransition:\s*0\.35/);
});

test("63. No trailing whitespace in core motion files", () => {
  for (const content of [REVEAL_SRC, BLURTEXT_SRC, STAGGER_SRC, PARALLAX_SRC, LOAD_GSAP_SRC]) {
    const hasTrailing = content.split("\n").some((line) => /[ \t]$/.test(line));
    assert.ok(!hasTrailing, "Should not have trailing whitespace");
  }
});

const PAGE_TRANSITION_SRC = readRoot("src/components/ui/page-transition.tsx");

test("64. PageTransition skips admin routes", () => {
  assert.match(PAGE_TRANSITION_SRC, /\/admin/);
  assert.match(PAGE_TRANSITION_SRC, /useReducedMotion|reduced/);
});

test("65. PageTransition duration is in 250–450ms band", () => {
  assert.match(PAGE_TRANSITION_SRC, /DURATIONS\.pageTransition|0\.3[0-5]/);
});

const FOOTER_SRC = readRoot("src/components/layout/footer.tsx");

test("66. Footer uses Reveal enter animation", () => {
  assert.match(FOOTER_SRC, /Reveal/);
});

const DOCTOR_SRC = readRoot("src/components/home/doctor-profile.tsx");

test("67. DoctorProfile uses ParallaxMedia and complementary directions", () => {
  assert.match(DOCTOR_SRC, /ParallaxMedia/);
  assert.match(DOCTOR_SRC, /direction="left"/);
  assert.match(DOCTOR_SRC, /direction="right"/);
});

const APPOINTMENT_SRC = readRoot("src/components/home/appointment-cta.tsx");

test("68. AppointmentCTA uses BlurText and glass-cta", () => {
  assert.match(APPOINTMENT_SRC, /BlurText/);
  assert.match(APPOINTMENT_SRC, /glass-cta/);
});

test("69. package.json still includes gsap", () => {
  const pkg = readRoot("package.json");
  assert.match(pkg, /"gsap"/);
});

test("70. Homepage sections retain their intended motion primitives", () => {
  const sections = [
    ["src/components/home/trust-strip.tsx", /StaggerGroup/],
    ["src/components/home/services-preview.tsx", /Reveal[\s\S]*StaggerGroup/],
    ["src/components/home/doctor-profile.tsx", /Reveal[\s\S]*ParallaxMedia/],
    ["src/components/home/gallery-section.tsx", /Reveal[\s\S]*DepthMedia/],
    ["src/components/home/care-philosophy.tsx", /Reveal[\s\S]*StickyStory/],
    ["src/components/home/appointment-cta.tsx", /Reveal[\s\S]*BlurText/],
    ["src/components/home/blog-preview.tsx", /Reveal[\s\S]*StaggerGroup/],
    ["src/components/home/faq.tsx", /Reveal[\s\S]*StaggerGroup/],
    ["src/components/home/contact-preview.tsx", /Reveal/],
    ["src/components/layout/footer.tsx", /Reveal/],
  ] as const;
  for (const [path, pattern] of sections) assert.match(readRoot(path), pattern, path);
});
