# 048-R — Phase 3.2.2 Loop Report

**Date:** 2026-07-17  
**Phase:** 3.2.2 Global Motion Design System  
**Status:** PASS WITH WARNINGS

---

## 1. Mission

Review and harden the Laguna/Cline implementation of the global motion design system; fix defects; improve section choreography, navbar, page transitions, tests, and documentation until the work is production-credible pending real-browser QA.

## 2. Inspection summary

- Homepage remained a Server Component (`app/[locale]/page.tsx`).
- CinematicHero (180 frames) present and must not be rewritten.
- Prior motion folder used ScrollTrigger APIs without plugin registration.
- Sections had been thinly migrated from `@/src/components/ui/reveal` (motion/react) to unfinished GSAP wrappers.
- Navbar lacked scroll glass state; PageTransition was a no-op-ish motion/react shell; docs incomplete.

## 3. Defects fixed (cycle 1)

| Issue | Fix |
|-------|-----|
| ScrollTrigger unregistered | `load-gsap.ts` registers plugin once |
| Async cleanup race | `cancelled` flags + safe `ctx?.revert()` |
| Content can stay invisible | Progressive enhancement: no JSX opacity-0; skip if in view; hide only off-screen after JS |
| FAQ indexOf / weak a11y | Map `index`; `aria-controls` + region + grid-rows accordion |
| Thin choreography | Distinct treatments per section (see journal 048) |
| Missing MagneticLink | Added |
| Missing navbar glass | Scroll state + compact height |
| Missing page transition | GSAP 350ms enter; admin skip; reduced motion skip |
| Lint setState-in-effect | `useInViewOnce` microtask fallback |
| Missing QA/journal | Added 048 docs + index |

## 4. Defects fixed (cycle 2)

| Issue | Fix |
|-------|-----|
| Above-fold flash on ST immediate play | Skip animation when element already in viewport |
| Dead service card spotlight CSS vars | Replaced with static top bloom on hover |
| ParallaxMedia + Image `fill` | Default `relative` wrapper |
| Glass fallback incomplete | Solid fallbacks for CTA/caption |
| Unnecessary client boundaries | Sections without hooks remain Server Components |

## 5. Test results

| Suite | Result |
|-------|--------|
| global-motion-design-system | 69 pass |
| cinematic-hero | 100 pass |
| lint | pass |
| tsc --noEmit | pass |
| build | pass |
| git diff CinematicHero / page / package.json | no phase-breaking changes |

## 6. Untouched (confirmed)

- Admin / auth / Supabase / booking business logic (not modified for this phase)
- CinematicHero source (no rewrite)
- SEO metadata / JSON-LD structure on homepage
- package.json dependencies (gsap already installed)

## 7. Manual QA still required

See `docs/qa/phase-3-2-2-global-motion-design-system-manual-qa.md`.

## 8. Final status

**PASS WITH WARNINGS** — do not claim complete until browser matrix is signed off.  
No commit. No push.
