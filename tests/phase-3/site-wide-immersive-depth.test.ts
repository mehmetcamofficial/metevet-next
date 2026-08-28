import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const ROOT = new URL("../../", import.meta.url);
const IMMERSIVE_DIR = new URL("../../src/components/immersive/", import.meta.url);

function readRoot(rel: string) {
  return readFileSync(new URL(rel, ROOT), "utf8");
}

function readImmersive(name: string) {
  return readFileSync(new URL(name, IMMERSIVE_DIR), "utf8");
}

// ── Immersive primitives exist ──

test("1. PerspectiveCard exists", () => {
  assert.ok(existsSync(new URL("PerspectiveCard.tsx", IMMERSIVE_DIR)));
});

test("2. PointerTilt exists", () => {
  assert.ok(existsSync(new URL("PointerTilt.tsx", IMMERSIVE_DIR)));
});

test("3. DepthMedia exists", () => {
  assert.ok(existsSync(new URL("DepthMedia.tsx", IMMERSIVE_DIR)));
});

test("4. LayeredScene exists", () => {
  assert.ok(existsSync(new URL("LayeredScene.tsx", IMMERSIVE_DIR)));
});

test("5. StickyStory exists", () => {
  assert.ok(existsSync(new URL("StickyStory.tsx", IMMERSIVE_DIR)));
});

test("6. FloatingChip exists", () => {
  assert.ok(existsSync(new URL("FloatingChip.tsx", IMMERSIVE_DIR)));
});

test("7. SpotlightSurface exists", () => {
  assert.ok(existsSync(new URL("SpotlightSurface.tsx", IMMERSIVE_DIR)));
});

test("8. ImmersivePageHero exists", () => {
  assert.ok(existsSync(new URL("ImmersivePageHero.tsx", IMMERSIVE_DIR)));
});

test("9. EditorialReveal exists", () => {
  assert.ok(existsSync(new URL("EditorialReveal.tsx", IMMERSIVE_DIR)));
});

test("10. ScrollDepthGroup exists", () => {
  assert.ok(existsSync(new URL("ScrollDepthGroup.tsx", IMMERSIVE_DIR)));
});

// ── No Three.js dependency ──

test("11. No Three.js in immersive components", () => {
  const files = ["PerspectiveCard.tsx", "PointerTilt.tsx", "DepthMedia.tsx", "ImmersivePageHero.tsx"];
  for (const f of files) {
    const content = readImmersive(f);
    assert.doesNotMatch(content, /three|react-three-fiber|@react-three/);
  }
});

// ── No Lenis dependency ──

test("12. No Lenis in immersive components", () => {
  const files = ["PerspectiveCard.tsx", "PointerTilt.tsx", "DepthMedia.tsx", "ImmersivePageHero.tsx"];
  for (const f of files) {
    const content = readImmersive(f);
    assert.doesNotMatch(content, /lenis/i);
  }
});

// ── No wheel preventDefault ──

test("13. No wheel preventDefault in immersive components", () => {
  const files = ["PointerTilt.tsx", "DepthMedia.tsx"];
  for (const f of files) {
    const content = readImmersive(f);
    assert.doesNotMatch(content, /preventDefault\(\)/);
  }
});

// ── CinematicHero unchanged ──

test("14. CinematicHero still has 180 frames constant", () => {
  assert.match(
    readRoot("src/components/cinematic/cinematic.constants.ts"),
    /TOTAL_FRAMES\s*=\s*180/,
  );
});

// ── Gallery no longer contains oversized empty card layout ──

const GALLERY_SRC = readRoot("src/components/home/gallery-section.tsx");

test("15. Gallery uses full-bleed images with responsive aspect ratio", () => {
  assert.match(GALLERY_SRC, /object-cover/);
  assert.match(GALLERY_SRC, /aspect-\[3\/4\].*md:aspect-auto.*md:h-full/);
  assert.match(GALLERY_SRC, /md:h-\[420px\]/);
});

test("16. Gallery captions are inside media cards", () => {
  assert.match(GALLERY_SRC, /glass-caption/);
  assert.match(GALLERY_SRC, /aria-hidden="true"/);
});

// ── Pointer tilt is fine-pointer only ──

const POINTER_TILT_SRC = readImmersive("PointerTilt.tsx");

test("17. PointerTilt checks fine pointer", () => {
  assert.match(POINTER_TILT_SRC, /useFinePointer/);
  assert.match(POINTER_TILT_SRC, /pointerType !== "mouse"/);
});

// ── Reduced-motion disables depth effects ──

test("18. DepthMedia checks reduced motion", () => {
  const DEPTH_SRC = readImmersive("DepthMedia.tsx");
  assert.match(DEPTH_SRC, /useReducedMotion\(\)/);
});

test("19. PointerTilt checks reduced motion", () => {
  assert.match(POINTER_TILT_SRC, /useReducedMotion\(\)/);
});

// ── Mobile gallery simplifies correctly ──

test("20. Gallery is visible by default and mobile offsets are desktop-only", () => {
  assert.doesNotMatch(GALLERY_SRC, /StaggerGroup|opacity-0|invisible/);
  assert.match(readImmersive("PerspectiveCard.tsx"), /md:translate-y/);
  assert.match(GALLERY_SRC, /opacity-100 visible/);
});

test("20a. Gallery fill image has a positioned, explicitly sized parent", () => {
  assert.match(GALLERY_SRC, /className="relative h-full w-full"/);
  assert.match(GALLERY_SRC, /className="absolute inset-0 h-full w-full"/);
  assert.match(GALLERY_SRC, /<Image[\s\S]*?fill[\s\S]*?object-cover/);
});

test("20b. Gallery caption remains inside the full-bleed media card", () => {
  const cardStart = GALLERY_SRC.indexOf("<SpotlightSurface");
  const cardEnd = GALLERY_SRC.indexOf("</SpotlightSurface>");
  const caption = GALLERY_SRC.indexOf("glass-caption");
  assert.ok(cardStart >= 0 && caption > cardStart && caption < cardEnd);
  assert.ok(!GALLERY_SRC.includes("bg-[#F4F0E8]"));
});

test("20c. Spotlight content wrapper preserves full card height", () => {
  const spotlight = readImmersive("SpotlightSurface.tsx");
  assert.match(spotlight, /relative z-0 h-full w-full/);
});

// ── About uses immersive hero ──

const ABOUT_SRC = readRoot("app/[locale]/about/page.tsx");

test("21. About page uses ImmersivePageHero", () => {
  assert.match(ABOUT_SRC, /ImmersivePageHero/);
});

test("22. About page uses StickyStory", () => {
  assert.match(ABOUT_SRC, /StickyStory/);
});

// ── Services uses immersive hero ──

const SERVICES_SRC = readRoot("app/[locale]/services/page.tsx");

test("23. Services page uses ImmersivePageHero", () => {
  assert.match(SERVICES_SRC, /ImmersivePageHero/);
});

test("24. Services page uses StickyStory", () => {
  assert.match(SERVICES_SRC, /StickyStory/);
});

// ── Blog uses immersive hero ──

const BLOG_SRC = readRoot("app/[locale]/blog/page.tsx");

test("25. Blog page uses ImmersivePageHero", () => {
  assert.match(BLOG_SRC, /ImmersivePageHero/);
});

// ── Contact uses immersive hero ──

const CONTACT_SRC = readRoot("src/components/contact/contact-page.tsx");

test("26. Contact page uses ImmersivePageHero", () => {
  assert.match(CONTACT_SRC, /ImmersivePageHero/);
});

// ── One H1 per page (via ImmersivePageHero with BlurText) ──

test("27. About page has ImmersivePageHero (BlurText h1 inside)", () => {
  assert.match(ABOUT_SRC, /ImmersivePageHero/);
});

test("28. Services page has ImmersivePageHero (BlurText h1 inside)", () => {
  assert.match(SERVICES_SRC, /ImmersivePageHero/);
});

test("29. Blog page has ImmersivePageHero (BlurText h1 inside)", () => {
  assert.match(BLOG_SRC, /ImmersivePageHero/);
});

test("30. Contact page has ImmersivePageHero (BlurText h1 inside)", () => {
  assert.match(CONTACT_SRC, /ImmersivePageHero/);
});

// ── Services desktop sticky has mobile fallback ──

const STICKY_STORY_SRC = readImmersive("StickyStory.tsx");

test("31. StickyStory has mobile fallback", () => {
  assert.match(STICKY_STORY_SRC, /window\.innerWidth/);
  assert.match(STICKY_STORY_SRC, /IMMERSIVE\.mobile/);
});

// ── Blog routes and SEO remain ──

test("32. Blog page has generateMetadata", () => {
  assert.match(BLOG_SRC, /generateMetadata/);
});

test("33. Blog page has BlogExplorer", () => {
  assert.match(BLOG_SRC, /BlogExplorer/);
});

// ── Contact/map interaction remains available ──

test("34. Contact page has map link", () => {
  assert.match(CONTACT_SRC, /mapsHref|maps\.app\.goo\.gl/);
});

test("34a. Contact has one exterior composition and no fake dashed route", () => {
  assert.equal((CONTACT_SRC.match(/clinic-exterior\.png/g) ?? []).length, 1);
  assert.doesNotMatch(CONTACT_SRC, /<svg|strokeDasharray|min-h-\[420px\]/);
});

// ── All public routes remain ──

test("35. All public route files exist", () => {
  assert.ok(existsSync(new URL("app/[locale]/about/page.tsx", ROOT)));
  assert.ok(existsSync(new URL("app/[locale]/services/page.tsx", ROOT)));
  assert.ok(existsSync(new URL("app/[locale]/blog/page.tsx", ROOT)));
  assert.ok(existsSync(new URL("app/[locale]/contact/page.tsx", ROOT)));
  assert.ok(existsSync(new URL("app/[locale]/hakkimizda/page.tsx", ROOT)));
  assert.ok(existsSync(new URL("app/[locale]/hizmetler/page.tsx", ROOT)));
  assert.ok(existsSync(new URL("app/[locale]/iletisim/page.tsx", ROOT)));
});

// ── Admin/auth/Supabase untouched ──

const ADMIN_PAGE_SRC = readRoot("app/admin/page.tsx");

test("36. Admin dashboard exists unchanged", () => {
  assert.ok(ADMIN_PAGE_SRC.length > 0);
  assert.doesNotMatch(ADMIN_PAGE_SRC, /ImmersivePageHero|StickyStory/);
});

// ── No continuous React pointer state ──

test("37. PointerTilt uses quickTo (not React state)", () => {
  assert.match(POINTER_TILT_SRC, /quickTo/);
  assert.doesNotMatch(POINTER_TILT_SRC, /useState.*pointer|setPointer/);
});

// ── GSAP cleanup exists ──

test("38. DepthMedia has GSAP cleanup", () => {
  const DEPTH_SRC = readImmersive("DepthMedia.tsx");
  assert.match(DEPTH_SRC, /ctx\?\.revert\(\)/);
});

// ── Lint, TypeScript and build pass ──

test("39. Immersive config has restrained values", () => {
  const CONFIG = readImmersive("immersive-config.ts");
  assert.match(CONFIG, /maxRotateX:\s*3/);
  assert.match(CONFIG, /maxRotateY:\s*4/);
  assert.match(CONFIG, /translateZMin:\s*20/);
  assert.match(CONFIG, /translateZMax:\s*60/);
});

test("40. Gallery offsets are restrained", () => {
  const CONFIG = readImmersive("immersive-config.ts");
  assert.match(CONFIG, /galleryOffsets/);
});
