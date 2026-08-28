import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const ROOT = new URL("../../", import.meta.url);
const WEBGL = new URL("../../src/components/webgl/", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, ROOT), "utf8");
const webgl = (path: string) => readFileSync(new URL(path, WEBGL), "utf8");

const packageJson = JSON.parse(read("package.json"));
const provider = webgl("WebGLProvider.tsx");
const canvas = webgl("SceneCanvas.tsx");
const adaptive = webgl("AdaptiveQuality.tsx");
const scrollCamera = webgl("ScrollCamera.tsx");
const homepage = read("app/[locale]/page.tsx");

test("approved Three.js dependencies only and no physics engine", () => {
  const dependencies = Object.keys(packageJson.dependencies);
  assert.ok(dependencies.includes("three"));
  assert.ok(dependencies.includes("@react-three/fiber"));
  assert.ok(dependencies.includes("@react-three/drei"));
  assert.ok(!dependencies.some((name) => /cannon|rapier|ammo|oimo/i.test(name)));
});

test("all required WebGL architecture files exist", () => {
  for (const file of [
    "WebGLProvider.tsx", "SceneCanvas.tsx", "CameraRig.tsx", "ScrollCamera.tsx",
    "AdaptiveQuality.tsx", "SceneFallback.tsx", "ClinicJourneyScene.tsx",
    "PortraitDepthScene.tsx", "ServicesObjectScene.tsx", "ContactMapScene.tsx",
    "webgl-config.ts",
  ]) assert.ok(existsSync(new URL(file, WEBGL)), file);
});

test("canvas is dynamically loaded with SSR disabled and a static fallback", () => {
  assert.match(provider, /dynamic\(\(\) => import\("\.\/SceneCanvas"\)/);
  assert.match(provider, /ssr:\s*false/);
  assert.match(provider, /SceneFallback/);
});

test("reduced motion, save-data, mobile and WebGL failures use low fallback", () => {
  assert.match(adaptive, /prefers-reduced-motion/);
  assert.match(adaptive, /saveData/);
  assert.match(adaptive, /mobile/);
  assert.match(adaptive, /getContext\("webgl2"\)/);
  assert.match(provider, /quality !== "low"/);
});

test("one shared Canvas implementation is used", () => {
  assert.equal((canvas.match(/<Canvas/g) ?? []).length, 1);
  assert.equal((homepage.match(/<WebGLProvider/g) ?? []).length, 1);
});

test("CinematicHero remains a separate unchanged frame-sequence component", () => {
  const hero = read("src/components/cinematic/CinematicHero.tsx");
  const constants = read("src/components/cinematic/cinematic.constants.ts");
  assert.match(constants, /TOTAL_FRAMES\s*=\s*180/);
  assert.doesNotMatch(hero, /@react-three|three/);
});

test("camera is reversible scroll-driven, damped and does not intercept wheels", () => {
  assert.match(provider, /-rect\.top/);
  assert.match(scrollCamera, /damp3/);
  assert.match(scrollCamera, /progress/);
  assert.doesNotMatch(provider + scrollCamera, /preventDefault|wheel/);
});

test("localized clinic copy stays in HTML outside Canvas", () => {
  assert.match(homepage, /Her muayene dikkatle başlar/);
  assert.match(homepage, /Every examination begins with attention/);
  assert.doesNotMatch(canvas, /<h1|<h2|Her muayene|Every examination/);
});

test("DPR is capped and rendering pauses outside the viewport", () => {
  assert.match(webgl("webgl-config.ts"), /desktopDpr:\s*1\.5/);
  assert.match(webgl("webgl-config.ts"), /mobileDpr:\s*1/);
  assert.match(provider, /IntersectionObserver/);
  assert.match(canvas, /frameloop=\{active \? "demand" : "never"\}/);
});

test("texture cleanup and R3F declarative disposal are present", () => {
  assert.match(webgl("PortraitDepthScene.tsx"), /texture\.dispose\(\)/);
});

test("homepage scene has examination, treatment and recovery stages", () => {
  const scene = webgl("ClinicJourneyScene.tsx");
  assert.match(scene, /clinic-exterior\.png/);
  assert.match(scene, /clinic-exam-room\.png/);
  assert.match(scene, /clinic-treatment-room\.png/);
  assert.match(scene, /clinic-waiting\.png/);
  assert.doesNotMatch(scene, /RoundedBox|boxGeometry|planeGeometry args=\{\[8, 7\]\}/);
});

test("about, services and contact integrate their scenes", () => {
  assert.match(read("app/[locale]/about/page.tsx"), /scene="portrait"/);
  assert.match(read("app/[locale]/services/page.tsx"), /scene="services"/);
  assert.match(read("src/components/contact/contact-page.tsx"), /mapsHref/);
});

test("public routes and accessible contact map link remain intact", () => {
  for (const path of [
    "app/[locale]/page.tsx", "app/[locale]/about/page.tsx",
    "app/[locale]/services/page.tsx", "app/[locale]/contact/page.tsx",
  ]) assert.ok(existsSync(new URL(path, ROOT)));
  assert.match(read("src/components/contact/contact-page.tsx"), /mapsHref/);
});

test("admin, auth, Supabase and booking remain free of WebGL integration", () => {
  for (const path of ["app/admin/page.tsx", "src/lib/supabase/server.ts"]) {
    const source = read(path);
    assert.doesNotMatch(source, /components\/webgl|@react-three/);
  }
});

test("cat and dog guides use capped fine-pointer gaze and narrative waypoints", () => {
  const guides = webgl("AnimalGuides.tsx");
  assert.match(guides, /function DogGuide/);
  assert.match(guides, /function CatGuide/);
  assert.match(guides, /pointer: fine/);
  assert.match(guides, /degToRad\(10\)/);
  assert.match(guides, /degToRad\(3\)/);
  assert.match(guides, /DOG_WAYPOINTS/);
  assert.match(guides, /CAT_WAYPOINTS/);
  assert.match(guides, /MathUtils\.damp/);
  assert.doesNotMatch(guides, /useState|Math\.random|physics|rapier/i);
});

test("narrative stage copy aligns in Turkish and English", () => {
  for (const copy of [
    "MeteVet’in kapısından içeri adım atın.",
    "Her ziyaret, güven ve şefkatle karşılanır.",
    "Her muayene dikkatle başlar.",
    "Bilimsel yaklaşım, güvenli kararlar.",
    "İyileşme, huzurlu bir ortamda devam eder.",
    "Bize ulaşmak çok kolay.",
    "Step inside MeteVet.",
    "Every visit begins with trust and compassion.",
    "Finding us is easy.",
  ]) assert.ok(homepage.includes(copy), copy);
});

test("contact removes abstract WebGL board and preserves accessible directions", () => {
  const contact = read("src/components/contact/contact-page.tsx");
  assert.doesNotMatch(contact, /scene="contact"|WebGLProvider/);
  assert.match(contact, /mapsHref/);
  assert.doesNotMatch(contact, /<svg|strokeDasharray|stroke-dasharray/);
  assert.doesNotMatch(webgl("ContactMapScene.tsx"), /RoundedBox|planeGeometry|#e7dfd1/);
});

test("journey stages use unique ids and stable id keys", () => {
  const scene = webgl("ClinicJourneyScene.tsx");
  const ids = [...scene.matchAll(/\{ id: "([^"]+)", image:/g)].map((match) => match[1]);
  const images = [...scene.matchAll(/image: "([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 5);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(images.filter((image) => image.endsWith("clinic-exterior.png")).length, 1);
  assert.match(scene, /key=\{stage\.id\}/);
});

test("camera travel and photo depth remain shallow and bounded", () => {
  const scene = webgl("ClinicJourneyScene.tsx");
  assert.match(scrollCamera, /6\.4 - progress \* 0\.5/);
  assert.doesNotMatch(scrollCamera, /progress \* 24|24 - progress|-progress \* 24/);
  assert.match(scrollCamera, /camera\.lookAt\(0, 0, 0\)/);
  assert.match(scene, /isCurrent \? 0\.02 : isNext \? -0\.28 : -0\.4/);
  assert.doesNotMatch(scene, /-index \* [1-9]|position=\{\[0, 0, -index/);
});

test("only current and next photo planes participate in the blend", () => {
  const scene = webgl("ClinicJourneyScene.tsx");
  assert.match(scene, /const isCurrent/);
  assert.match(scene, /const isNext/);
  assert.match(scene, /isCurrent \? 1 - blendState\.blend : isNext \? blendState\.blend : 0/);
  assert.match(scene, /MathUtils\.smoothstep/);
});

test("inactive story cards cannot receive pointer interaction", () => {
  assert.match(provider, /aria-hidden=\{!isActive\}/);
  assert.match(provider, /isActive \? "pointer-events-auto" : "pointer-events-none"/);
  assert.match(provider, /Math\.min\(0\.12/);
});

test("animal guides remain clamped in front of the photo planes at stable scale", () => {
  const guides = webgl("AnimalGuides.tsx");
  assert.match(guides, /ANIMAL_Z_MIN = 0\.48/);
  assert.match(guides, /ANIMAL_Z_MAX = 0\.78/);
  assert.match(guides, /MathUtils\.clamp\(position\.z, ANIMAL_Z_MIN, ANIMAL_Z_MAX\)/);
  assert.match(guides, /DOG_SCALE = 0\.3/);
  assert.match(guides, /CAT_SCALE = 0\.26/);
  assert.doesNotMatch(guides, /<group[^>]+scale=\{0\}/);
});

test("animal palette has warm accents, rim light and no pure black primary material", () => {
  const guides = webgl("AnimalGuides.tsx");
  const scene = webgl("ClinicJourneyScene.tsx");
  assert.match(guides, /#a77d58|#b88b62/);
  assert.match(guides, /#789584|#86a392/);
  assert.match(guides, /#efe2ca|#e9dfc9/);
  assert.match(guides, /function ContactShadow/);
  assert.match(scene, /hemisphereLight/);
  assert.doesNotMatch(guides, /color=["']#000(?:000)?["']/i);
});

test("journey height is reduced to a calm 320vh", () => {
  assert.match(webgl("webgl-config.ts"), /journeyHeight:\s*"320vh"/);
});

test("journey opens on an interior and exterior is location-only", () => {
  const scene = webgl("ClinicJourneyScene.tsx");
  const stageLines = [...scene.matchAll(/\{ id: "([^"]+)", image: "([^"]+)" \}/g)];
  assert.equal(stageLines[0]?.[1], "welcome");
  assert.equal(stageLines[0]?.[2], "/images/clinic/clinic-waiting.png");
  assert.doesNotMatch(scene, /clinic-reception\.png/);
  assert.notEqual(stageLines[0]?.[2], "/images/clinic/clinic-exterior.png");
  const exteriorStages = stageLines.filter((match) => match[2].endsWith("clinic-exterior.png"));
  assert.equal(exteriorStages.length, 1);
  assert.equal(exteriorStages[0]?.[1], "location");
});

test("welcome-stage animal anchors are visible and bounded", () => {
  const guides = webgl("AnimalGuides.tsx");
  assert.match(guides, /\[-2\.8, -2, 0\.7\]/);
  assert.match(guides, /\[2\.6, -2\.05, 0\.72\]/);
  assert.match(guides, /<DogGuide/);
  assert.match(guides, /<CatGuide/);
  assert.match(guides, /position\.x = MathUtils\.clamp/);
  assert.match(guides, /position\.z = MathUtils\.clamp/);
});

test("pointer gaze is capped, passive and returns to neutral", () => {
  const guides = webgl("AnimalGuides.tsx");
  assert.match(guides, /pointer: fine/);
  assert.match(guides, /degToRad\(10\)/);
  assert.match(guides, /degToRad\(3\)/);
  assert.match(guides, /MAX_HEAD_ROTATION \* 0\.5/);
  assert.match(guides, /pointermove/);
  assert.match(guides, /resetPointer/);
  assert.match(guides, /pointer\.set\(0, 0\)/);
  assert.match(adaptive, /prefers-reduced-motion/);
});

test("doorway threshold separates CinematicHero from the interior journey", () => {
  assert.match(provider, /data-journey-threshold/);
  assert.match(provider, /duration-\[600ms\]/);
  assert.match(provider, /motion-reduce:!opacity-0/);
  assert.match(provider, /clipPath/);
});

test("five-stage timing preserves a longer welcome hold", () => {
  const config = webgl("webgl-config.ts");
  assert.match(config, /journeyStageStarts:\s*\[0, 0\.18, 0\.38, 0\.58, 0\.78\]/);
  assert.match(webgl("ClinicJourneyScene.tsx"), /smoothstep\(localProgress, 0\.68, 0\.95\)/);
});
