import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const ROOT = new URL("../../", import.meta.url);
const COMPANION = new URL("../../src/components/webgl/companion/", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, ROOT), "utf8");
const companion = (path: string) => readFileSync(new URL(path, COMPANION), "utf8");

const config = companion("companion-config.ts");
const cat = companion("CompanionCat.tsx");
const controller = companion("CompanionController.tsx");
const machine = companion("CompanionAnimationMachine.ts");
const provider = read("src/components/webgl/WebGLProvider.tsx");
const clinicScene = read("src/components/webgl/ClinicJourneyScene.tsx");
const homepageLayer = companion("HomepageCompanionLayer.tsx");
const homepage = read("app/[locale]/page.tsx");
const quality = read("src/components/webgl/AdaptiveQuality.tsx");
const packageJson = read("package.json");

test("companion architecture and verified model exist", () => {
  for (const file of [
    "CompanionCat.tsx",
    "CompanionController.tsx",
    "CompanionAnimationMachine.ts",
    "CompanionGround.tsx",
    "CompanionCamera.tsx",
    "companion-config.ts",
  ]) assert.ok(existsSync(new URL(file, COMPANION)), file);
  assert.ok(existsSync(new URL("../../public/models/animals/metevet-cat.glb", import.meta.url)));
  assert.match(config, /"\/models\/animals\/metevet-cat\.glb"/);
});

test("only exact verified clips are mapped", () => {
  for (const mapping of [
    /idle:\s*"Idle"/,
    /walk:\s*"WalkClean"/,
    /sit:\s*"SitDown"/,
    /sittingIdle:\s*"SittingIdle"/,
    /stand:\s*"StandUp"/,
  ]) assert.match(config, mapping);
  assert.doesNotMatch(config + cat, /Groom|CleanPaw|Wave/);
});

test("animation state machine has guarded transitions", () => {
  for (const state of ["IDLE", "MOVING", "ARRIVING", "SITTING", "SEATED_IDLE", "STANDING"]) {
    assert.match(machine, new RegExp(`"${state}"`));
  }
  assert.match(machine, /ALLOWED_TRANSITIONS/);
  assert.match(controller, /transition\("ARRIVING"/);
  assert.match(controller, /transition\("SITTING"/);
  assert.match(controller, /transition\("SEATED_IDLE"/);
  assert.match(controller, /transition\("MOVING"/);
});

test("one-shots, loops and crossfades use the verified actions", () => {
  assert.match(cat, /useGLTF\(COMPANION_MODEL_PATH\)/);
  assert.match(cat, /useAnimations\(gltf\.animations, clonedScene\)/);
  assert.match(cat, /LoopOnce/);
  assert.match(cat, /LoopRepeat/);
  assert.match(cat, /clampWhenFinished = isOneShot/);
  assert.match(cat, /fadeIn\(COMPANION_CONFIG\.crossfadeSeconds\)/);
  assert.match(cat, /fadeOut\(COMPANION_CONFIG\.crossfadeSeconds\)/);
});

test("pointer destination settles, raycasts, offsets and clamps", () => {
  assert.match(controller, /pointer: fine/);
  assert.match(controller, /setTimeout/);
  assert.match(config, /pointerSettleMs:\s*120/);
  assert.match(config, /destinationDeadZone:\s*0\.4/);
  assert.match(config, /pointerOffset:\s*0\.45/);
  assert.match(controller, /raycaster\.setFromCamera/);
  assert.match(controller, /intersectObject/);
  assert.match(controller, /COMPANION_EXCLUSION_ZONES/);
  assert.match(controller, /MathUtils\.clamp/);
});

test("movement is delta-time based and sitting requires standing before departure", () => {
  assert.match(config, /walkSpeed:\s*1\.15/);
  assert.match(config, /arrivalRadius:\s*0\.22/);
  assert.match(config, /maximumDelta:\s*0\.05/);
  assert.match(controller, /Math\.min\(frameDelta, COMPANION_CONFIG\.maximumDelta\)/);
  assert.match(controller, /addScaledVector/);
  assert.match(machine, /SEATED_IDLE:\s*\["STANDING"\]/);
  assert.match(machine, /STANDING:\s*\["MOVING"\]/);
  const frameBody = controller.slice(controller.indexOf("useFrame("));
  assert.doesNotMatch(frameBody, /\bset[A-Z]\w*\(/);
});

test("model bounds derive scale and normalize the paws to ground", () => {
  assert.match(cat, /new Box3\(\)\.setFromObject\(clonedScene\)/);
  assert.match(cat, /desiredWorldHeight \/ rawSize\.y/);
  assert.match(cat, /minimumNormalizedScale/);
  assert.match(cat, /maximumNormalizedScale/);
  assert.match(cat, /-rawBox\.min\.y \* normalizedScale/);
  assert.doesNotMatch(cat, /scale=\{0\.19\}/);
});

test("skinned model uses one skeleton-safe clone for rendering and animation", () => {
  assert.match(
    cat,
    /import \{ clone \} from "three\/examples\/jsm\/utils\/SkeletonUtils\.js"/,
  );
  assert.match(cat, /const clonedScene = useMemo/);
  assert.match(cat, /clone\(gltf\.scene\)/);
  assert.match(cat, /useAnimations\(gltf\.animations, clonedScene\)/);
  assert.match(cat, /<primitive object=\{clonedScene\} dispose=\{null\}/);
  assert.doesNotMatch(cat, /gltf\.scene\.clone\(|scene\.clone\(/);
  assert.match(cat, /skeletonBindings/);
  assert.match(cat, /allBonesPresent/);
});

test("one live cat replaces both procedural guides", () => {
  assert.match(homepageLayer, /<CompanionController/);
  assert.equal((homepageLayer.match(/<CompanionController/g) ?? []).length, 1);
  assert.doesNotMatch(clinicScene, /CompanionController/);
  assert.doesNotMatch(clinicScene, /AnimalGuides/);
  assert.equal((controller.match(/<CompanionCat/g) ?? []).length, 1);
});

test("head greeting uses only the verified head and semantic control", () => {
  assert.match(cat, /getObjectByName\("Head_22"\)/);
  assert.match(config, /headYawRadians:\s*\(12 \* Math\.PI\)/);
  assert.match(config, /headPitchRadians:\s*\(7 \* Math\.PI\)/);
  assert.match(homepageLayer, /<button/);
  assert.match(homepageLayer, /Kediye merhaba de/);
  assert.match(homepageLayer, /Greet the cat/);
  assert.match(homepageLayer, /metevet-cat-greet/);
});

test("mobile, reduced-motion, Save-Data and WebGL failures avoid model loading", () => {
  assert.match(quality, /prefers-reduced-motion/);
  assert.match(quality, /saveData/);
  assert.match(quality, /mobile/);
  assert.match(quality, /!hasWebGL\(\)/);
  assert.match(provider, /quality !== "low"/);
  assert.match(homepageLayer, /data-companion-fallback/);
  assert.match(controller, /useGLTF\.preload\(COMPANION_MODEL_PATH\)/);
});

test("homepage owns one fixed transparent canvas after the journey threshold", () => {
  assert.match(homepage, /<HomepageCompanionLayer/);
  assert.match(homepageLayer, /data-homepage-companion-canvas/);
  assert.match(homepageLayer, /pointer-events-none fixed inset-0/);
  assert.match(homepageLayer, /className="pointer-events-none"/);
  assert.match(homepageLayer, /style=\{\{ pointerEvents: "none" \}\}/);
  assert.match(homepageLayer, /gl=\{\{[\s\S]*alpha:\s*true/);
  assert.match(homepageLayer, /frameloop="demand"/);
  assert.match(homepageLayer, /orthographic/);
  assert.match(homepageLayer, /<CompanionCamera/);
  assert.match(homepageLayer, /z-20/);
  assert.match(provider, /scene !== "clinic"/);
  assert.doesNotMatch(provider, /metevet-cat-greet/);
});

test("dedicated camera projects fixed-canvas anchors inside NDC", () => {
  const camera = companion("CompanionCamera.tsx");
  assert.match(camera, /OrthographicCamera/);
  assert.match(camera, /orthographicHalfHeight/);
  assert.match(camera, /companionCamera\.updateProjectionMatrix\(\)/);
  assert.match(camera, /insideNdc/);
  assert.match(config, /COMPANION_SCREEN_ANCHORS/);
  assert.match(controller, /\.unproject\(camera\)/);
  assert.match(controller, /navigationNdc/);
});

test("verified orientation wrapper and production lighting remain visible", () => {
  assert.match(cat, /name="CompanionOrientation"/);
  assert.match(cat, /rotation=\{\[0, Math\.PI, 0\]\}/);
  assert.match(cat, /name="CompanionNormalization"/);
  assert.match(homepageLayer, /ambientLight/);
  assert.match(homepageLayer, /hemisphereLight/);
  assert.match(homepageLayer, /directionalLight/);
  assert.match(homepageLayer, /bg-transparent/);
});

test("greet readiness requires valid projected model geometry", () => {
  assert.match(cat, /boundsValid[\s\S]*projectedOnScreen/);
  assert.match(cat, /allParentsVisible/);
  assert.match(cat, /canvasReady/);
  assert.match(cat, /gl\.domElement\.isConnected/);
  assert.match(cat, /onModelVisibleReady\(modelVisibleReady\)/);
  assert.match(homepageLayer, /visible && modelVisibleReady/);
  assert.match(homepageLayer, /modelChecked && !modelVisibleReady/);
  assert.match(homepageLayer, /safe-area-inset-bottom/);
  assert.match(homepageLayer, /safe-area-inset-left/);
  assert.match(homepageLayer, /pointer-events-auto[\s\S]*rounded-full/);
});

test("development diagnostics and marker expose render visibility", () => {
  assert.match(cat, /render diagnostics/);
  assert.match(cat, /rawBoundingBox/);
  assert.match(cat, /projectedModelCenter/);
  assert.match(cat, /parentVisibility/);
  assert.match(homepageLayer, /companionDebug/);
  assert.match(homepageLayer, /CAT POSITION/);
  assert.match(cat, /MeshBasicMaterial/);
  assert.match(cat, /DoubleSide/);
  assert.match(cat, /cssPixelBounds/);
  assert.match(cat, /meshCount/);
  assert.match(cat, /material\.opacity/);
  assert.match(controller, /process\.env\.NODE_ENV === "development"/);
  assert.match(controller, /sphereGeometry/);
  assert.match(controller, /axesHelper/);
  assert.match(controller, /NODE_ENV === "development" && debugMode/);
  assert.match(cat, /if \(debugMode\)[\s\S]*action.*\.stop\(\)/);
});

test("debug DOM label and WebGL helpers are gated by companionDebug", () => {
  assert.match(homepageLayer, /debugMode \? \(/);
  assert.match(homepageLayer, /CAT POSITION/);
  assert.match(homepageLayer, /companionDebug/);
  assert.doesNotMatch(
    homepageLayer,
    /process\.env\.NODE_ENV === "development" \?[\s\S]*CAT POSITION/,
  );
});

test("decorative overlays cannot intercept homepage links", () => {
  assert.match(homepageLayer, /pointer-events-none fixed inset-0/);
  assert.doesNotMatch(
    homepageLayer,
    /pointer-events-auto fixed inset-0|fixed inset-0 pointer-events-auto/,
  );
  assert.match(homepageLayer, /document\.elementFromPoint/);
  assert.match(homepageLayer, /closest\("a,button"\)/);
  const blog = read("src/components/home/blog-preview.tsx");
  const services = read("src/components/home/services-preview.tsx");
  assert.match(blog, /<Link[\s\S]*data-companion-hit-test="blog-view-all"/);
  assert.equal((blog.match(/data-companion-hit-test="blog-read-more"/g) ?? []).length, 1);
  assert.match(services, /data-companion-hit-test="service-learn-more"/);
});

test("companion meshes cannot be culled or hidden behind journey planes", () => {
  assert.match(cat, /object\.frustumCulled = false/);
  assert.match(cat, /object\.renderOrder = 100/);
  assert.match(cat, /material\.depthTest = false/);
  assert.match(cat, /material\.transparent/);
  assert.match(cat, /clippingPlanes/);
});

test("companion persists through blog, FAQ, contact and footer sections", () => {
  for (const section of [
    "journey", "trust", "services", "doctor", "gallery", "philosophy",
    "appointment", "blog", "faq", "contact", "footer",
  ]) {
    assert.match(homepage, new RegExp(`data-home-section="${section}"`));
    assert.match(config, new RegExp(`${section}:`));
  }
  assert.match(homepageLayer, /IntersectionObserver/);
  assert.match(homepageLayer, /setActiveSection/);
});

test("DOM exclusion zones are measured on layout changes", () => {
  assert.match(controller, /getBoundingClientRect\(\)/);
  assert.match(controller, /MutationObserver/);
  assert.match(controller, /window\.addEventListener\("resize"/);
  assert.match(controller, /window\.addEventListener\("focusin"/);
  assert.match(controller, /dynamicExclusions/);
});

test("no physics dependency or CinematicHero integration was added", () => {
  assert.doesNotMatch(packageJson, /cannon|rapier|ammo|matter-js/);
  const hero = read("src/components/cinematic/CinematicHero.tsx");
  assert.doesNotMatch(hero, /CompanionCat|metevet-cat|companion/);
});
