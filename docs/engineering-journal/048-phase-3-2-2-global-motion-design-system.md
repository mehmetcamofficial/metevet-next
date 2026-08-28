# 048 — Phase 3.2.2: Global Motion Design System

**Date:** 2026-07-17  
**Status:** PASS WITH WARNINGS — automated gates green; real-browser manual QA still required  
**Author:** Review + harden loop (prior Laguna implementation corrected)

---

## Objective

Create a reusable MeteVet motion design system (GSAP-based) and apply coherent, calm choreography to every homepage section below the completed CinematicHero — without scroll hijacking, without destabilizing the hero, and without converting the localized homepage into a Client Component.

---

## Prior implementation findings (review)

The first implementation landed primitives and light section wrappers, but had material defects:

1. **ScrollTrigger never registered** — reveal timelines used `scrollTrigger` options without `gsap.registerPlugin(ScrollTrigger)`, so scroll-driven motion was non-functional or error-prone.
2. **Async import race** — cleanup could run before the dynamic import finished (`ctx` still undefined).
3. **Progressive enhancement claim was false** — `gsap.set(..., { opacity: 0 })` on mount could leave content invisible if animation failed; above-fold flash risk.
4. **Section choreography was shallow** — mostly “swap Reveal import”; missing BlurText, glass usage, trust handoff, gallery parallax, CTA glow, FAQ height animation, navbar glass, docs.
5. **FAQ regression** — used `items.indexOf(item)` instead of map index; weak accordion a11y (`aria-controls` / region).
6. **Unnecessary `"use client"`** on pure composition sections (later restored to Server Components where hooks are not required).
7. **Missing deliverables** — MagneticLink, manual QA doc, journal 048, index update.

---

## Architecture decisions

| Decision | Rationale |
|----------|-----------|
| `load-gsap.ts` singleton | Register ScrollTrigger once; share one module promise |
| GSAP + ScrollTrigger (not Lenis) | No scroll hijack; native scrolling preserved |
| Skip animation if already in view | Prevent above-fold flash; progressive enhancement |
| Hide off-screen only after JS confirms | No-JS content remains fully visible |
| Server homepage + client islands | `app/[locale]/page.tsx` stays a Server Component |
| CinematicHero untouched | Phase 3.2.1 asset/path preserved |
| Glass utilities in CSS | Bounded blur surfaces; solid fallbacks without `backdrop-filter` |

---

## Files

### New — `src/components/motion/`

- `load-gsap.ts`, `motion-config.ts`, `useReducedMotion.ts`, `useInViewOnce.ts`
- `MotionProvider.tsx`, `Reveal.tsx`, `BlurText.tsx`, `StaggerGroup.tsx`
- `SectionTransition.tsx`, `ParallaxMedia.tsx`, `CountUp.tsx`, `MagneticLink.tsx`
- `index.ts`

### Updated sections / chrome

- Homepage sections under `src/components/home/*` (choreography)
- `src/components/layout/navbar.tsx` (scroll liquid-glass)
- `src/components/layout/footer.tsx` (Reveal + underline links)
- `src/components/ui/page-transition.tsx` (fast GSAP enter; skip admin)
- `app/globals.css` (glass utilities + link underline)

### Tests / docs

- `tests/phase-3/global-motion-design-system.test.ts` (69 tests)
- `docs/phase-3/global-motion-design-system.md`
- `docs/qa/phase-3-2-2-global-motion-design-system-manual-qa.md`
- `docs/engineering-journal/048-*.md` + index update

---

## Reduced motion

All motion primitives consult `useReducedMotion()` (`useSyncExternalStore` + media query). Navbar transitions and FAQ grid animation shorten/disable under reduced motion. Parallax is desktop-only and reduced-motion-off.

---

## Validation (automated)

- `node --test tests/phase-3/global-motion-design-system.test.ts` — 69/69 pass  
- `node --test tests/phase-3/cinematic-hero.test.ts` — 100/100 pass  
- `npm run lint` — pass  
- `npx tsc --noEmit` — pass  
- `npm run build` — pass  
- `git diff -- src/components/cinematic/CinematicHero.tsx` — empty  
- `git diff -- package.json` — empty (gsap already present)

---

## Warnings / compromises

1. Manual QA not executed in real browsers in this loop.  
2. PageTransition animates on client pathname changes only (skips first paint) — intentional to avoid fighting SSR/`loading.tsx`.  
3. MagneticLink is available but not forced onto every homepage CTA (hover CSS + MagneticLink API both valid).  
4. Unrelated untracked Phase 4.2 clinical-alerts files may exist in the working tree; they were not part of this phase’s edits.  
5. Navbar transparent home-top state is measured post-mount (no SSR scrollY) to avoid hydration mismatch.

---

## Final status

**PASS WITH WARNINGS**
