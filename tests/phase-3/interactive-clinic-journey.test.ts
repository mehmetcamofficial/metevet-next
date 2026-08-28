import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const ROOT = new URL("../../", import.meta.url);
const INTERACTIVE = new URL("../../src/components/interactive-clinic/", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, ROOT), "utf8");
const interactive = (path: string) => readFileSync(new URL(path, INTERACTIVE), "utf8");

const contact = read("src/components/contact/contact-page.tsx");
const experience = interactive("ClinicJourneyExperience.tsx");
const config = interactive("interactive-clinic-config.ts");
const hotspot = interactive("DiscoveryHotspot.tsx");
const quiz = interactive("CarePathQuiz.tsx");
const completion = interactive("JourneyCompletion.tsx");
const clinicScene = read("src/components/webgl/ClinicJourneyScene.tsx");
const homepageCompanion = read("src/components/webgl/companion/HomepageCompanionLayer.tsx");
const packageJson = read("package.json");

test("Contact keeps one exterior composition and removes fake route", () => {
  assert.equal((contact.match(/clinic-exterior\.png/g) ?? []).length, 1);
  assert.doesNotMatch(contact, /<svg|strokeDasharray|stroke-dasharray|dashed route/i);
  assert.doesNotMatch(contact, /min-h-\[420px\]/);
  assert.match(contact, /mapsHref/);
});

test("Contact retains phone, WhatsApp, directions and booking actions", () => {
  assert.match(contact, /phoneHref/);
  assert.match(contact, /whatsappHref/);
  assert.match(contact, /mapsHref/);
  assert.match(contact, /getRoutePath\("appointment"/);
  assert.match(contact, /<ImmersivePageHero[\s\S]*?>[\s\S]*?phoneHref[\s\S]*?whatsappHref[\s\S]*?mapsHref[\s\S]*?<\/ImmersivePageHero>/);
});

test("interactive clinic component set exists and is lazy loaded", () => {
  for (const file of [
    "ClinicJourneyExperience.tsx", "GuideSelector.tsx", "AnimalGuideOverlay.tsx",
    "DiscoveryHotspot.tsx", "JourneyProgress.tsx", "CarePathQuiz.tsx",
    "JourneyCompletion.tsx", "interactive-clinic-config.ts",
  ]) assert.ok(existsSync(new URL(file, INTERACTIVE)), file);
  assert.match(interactive("InteractiveClinicLoader.tsx"), /dynamic\(\(\) => import\("\.\/ClinicJourneyExperience"\)/);
  assert.match(interactive("InteractiveClinicLoader.tsx"), /ssr:\s*false/);
});

test("interactive clinic clearly presents one animated cat guide", () => {
  assert.match(config, /Etkileşimli rehber: Kedi/);
  assert.match(config, /Interactive guide: Cat/);
  assert.match(experience, /copy\.interactiveCat/);
  assert.doesNotMatch(experience, /GuideSelector|metevet-guide-change/);
});

test("one companion replaces the procedural cat and dog in the live scene", () => {
  assert.match(homepageCompanion, /<CompanionController/);
  assert.doesNotMatch(clinicScene, /AnimalGuides/);
  assert.doesNotMatch(clinicScene, /CompanionController/);
  assert.doesNotMatch(experience, /fetch\(|supabase|localStorage/);
});

test("adaptive quality retains reduced-motion and mobile fallback gates", () => {
  assert.match(read("src/components/webgl/AdaptiveQuality.tsx"), /prefers-reduced-motion/);
  assert.match(read("src/components/webgl/AdaptiveQuality.tsx"), /saveData/);
});

test("four real localized discovery hotspots exist", () => {
  for (const id of ["examination", "preventive", "diagnosis", "recovery"]) {
    assert.match(config, new RegExp(`${id}:`));
  }
  assert.equal((config.match(/body:/g) ?? []).length, 8);
  assert.match(experience, /DISCOVERY_IDS/);
  assert.match(hotspot, /<button/);
  assert.match(hotspot, /role="dialog"/);
});

test("hotspots support Escape and restore trigger focus", () => {
  assert.match(hotspot, /event\.key === "Escape"/);
  assert.match(hotspot, /triggerRef\.current\?\.focus\(\)/);
  assert.match(hotspot, /aria-expanded/);
  assert.match(hotspot, /focus-visible:ring/);
});

test("progress is discovery-based and non-competitive", () => {
  assert.match(config, /Klinik keşfi/);
  assert.match(config, /Clinic discovery/);
  assert.match(experience, /discovered\.size/);
  assert.doesNotMatch(config + experience, /\bcoins?\b|\bbadges?\b|\bscore\b|\bpoints\b/i);
});

test("care path selector is explicitly non-diagnostic and local", () => {
  assert.match(config, /Bu yönlendirme tıbbi teşhis değildir/);
  assert.match(config, /This guidance is not a medical diagnosis/);
  assert.match(quiz, /useState/);
  assert.match(quiz, /aria-pressed/);
  assert.doesNotMatch(quiz, /fetch\(|supabase|localStorage|sessionStorage/);
  assert.match(quiz, /getRoutePath\("appointment"/);
  assert.match(quiz, /wa\.me/);
});

test("completion provides booking, WhatsApp and directions", () => {
  assert.match(config, /MeteVet Klinik Yolculuğu tamamlandı/);
  assert.match(config, /You completed the MeteVet clinic journey/);
  assert.match(completion, /getRoutePath\("appointment"/);
  assert.match(completion, /wa\.me/);
  assert.match(completion, /maps\.app\.goo\.gl/);
  assert.doesNotMatch(completion, /confetti|audio|sound|coins?|score/i);
});

test("no wheel interception, game dependency, or admin integration", () => {
  assert.doesNotMatch(experience, /preventDefault|wheel/);
  assert.doesNotMatch(packageJson, /phaser|pixi|matter-js|howler/);
  assert.doesNotMatch(read("app/admin/page.tsx"), /interactive-clinic|ClinicJourneyExperience/);
  assert.doesNotMatch(read("src/lib/supabase/server.ts"), /interactive-clinic|ClinicJourneyExperience/);
});

test("CinematicHero remains unchanged by interactive clinic code", () => {
  const hero = read("src/components/cinematic/CinematicHero.tsx");
  const constants = read("src/components/cinematic/cinematic.constants.ts");
  assert.match(constants, /TOTAL_FRAMES\s*=\s*180/);
  assert.doesNotMatch(hero, /interactive-clinic|ClinicJourneyExperience/);
});
