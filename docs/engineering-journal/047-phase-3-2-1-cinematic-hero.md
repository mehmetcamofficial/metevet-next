# 047 — Phase 3.2.1: Cinematic Homepage Scrollytelling

**Date:** 2026-07-26
**Status:** PASS WITH WARNINGS — feature implemented, all tests pass; manual QA/deployment/user validation unverified
**Author:** Loop Engineering (autonomous cycle)

---

## Objective

Replace the static Hero component with a cinematic scrollytelling experience using 151 pre-rendered JPG frames, scroll-driven canvas animation, and GSAP pointer parallax.

---

## Existing Hero Findings

- Static two-column layout (text + image)
- Used Reveal animation component
- No scroll-driven interaction
- No cinematic storytelling
- Single hero image (clinic-exterior.png)
- Functional but not immersive

---

## Architecture

**Component:** `src/components/cinematic/CinematicHero.tsx` (client component)

**Frame assets:** 151 JPG frames in `/public/images/cinematic-jpg/`
- Naming: `frame-001.jpg` through `frame-151.jpg`
- Preloaded on mount with progress tracking
- Stored in `imagesRef` (HTMLImageElement array)

**Canvas rendering:**
- `drawFrame(frameIndex)` function
- Manual object-fit cover math (aspect ratio comparison)
- DPR scaling (capped at 2x for performance)
- Zoom factor (1.18) for parallax headroom
- requestAnimationFrame throttling

**Scroll-driven animation:**
- 500vh section height (scroll range)
- Sticky viewport container (100vh)
- Scroll progress mapped to frame index
- `lastFrameRef` prevents redundant draws
- Passive scroll listener for performance

**GSAP pointer parallax:**
- Desktop only (viewport ≥ 768px)
- Mouse position mapped to ±20px canvas translation
- 0.5s duration, power2.out easing
- Dynamic import to avoid SSR issues
- Respects prefers-reduced-motion

**Fallback strategy:**
- Poster fallback for: reduced-motion, mobile, load failure, slow network
- Uses Next.js Image component (optimized)
- Single frame (frame-001.jpg) with fill + object-cover
- Loading overlay with percentage counter

---

## Performance Design

**Frame preloading:**
- Parallel image loading (151 concurrent requests)
- Progress tracking: `loadedCount / TOTAL_FRAMES * 100`
- Failure threshold: >10% failures → poster fallback
- Cleanup on unmount: `imagesRef.current = []`

**Canvas optimization:**
- DPR capped at 2 (prevents 3x retina overhead)
- requestAnimationFrame batching
- No redundant draws (frame index comparison)
- Passive scroll listener (no layout thrashing)

**GSAP optimization:**
- Dynamic import (code splitting)
- Desktop-only activation
- Reduced-motion check
- Cleanup on unmount

---

## Accessibility Design

**Screen reader:**
- Canvas has `aria-hidden="true"` (decorative)
- Single H1 preserved (SEO + accessibility)
- Semantic HTML structure
- ARIA labels on interactive elements

**Keyboard navigation:**
- Tab order: eyebrow → title → description → primary CTA → secondary CTA → location → phone
- Enter activates links
- No keyboard traps

**Reduced motion:**
- `prefers-reduced-motion: reduce` check
- Disables canvas animation
- Disables GSAP parallax
- Shows static poster fallback

**Touch targets:**
- CTAs: 44px+ height (mobile accessibility)
- Phone link: tappable
- Location badge: tappable

---

## Localization

**Turkish (/tr):**
- Eyebrow: "Premium Veteriner Bakımı"
- Title: "MeteVet"
- Description: "Kuşadası'nın kalbinde..."
- Primary CTA: "Online Randevu"
- Secondary CTA: "WhatsApp"
- Loading: "Yükleniyor..."

**English (/en):**
- Eyebrow: "Premium Veterinary Care"
- Title: "MeteVet"
- Description: "In the heart of Kuşadası..."
- Primary CTA: "Book Online"
- Secondary CTA: "WhatsApp"
- Loading: "Loading..."

---

## Responsive Design

**Mobile (< 768px):**
- Poster fallback (no canvas animation)
- Single-column layout
- Stacked CTAs
- Smaller text (4xl)
- Touch-optimized targets

**Tablet (768px–1024px):**
- Canvas animation active
- Adjusted text sizes (5xl)
- Inline CTAs

**Desktop (> 1024px):**
- Canvas animation + GSAP parallax
- Full text size (6xl)
- Pointer parallax active

---

## Integration

**Homepage update:** `app/[locale]/page.tsx`
- Replaced `<Hero>` with `<CinematicHero>`
- Preserved all other sections (TrustStrip, ServicesPreview, etc.)
- Passes `locale` prop
- No changes to Navbar, Footer, or other components

**Old Hero component:** `src/components/home/hero.tsx`
- Still exists in codebase (not deleted)
- No longer imported or used
- Can be removed in future cleanup

---

## TypeScript Issues Resolved

**Issue 1:** `drawFrame` accessed before declaration
- **Cause:** Function declared after useEffect that references it
- **Fix:** Moved `drawFrame` declaration before useEffect hooks

**Issue 2:** `Image` name collision
- **Cause:** Next.js `Image` import collided with native `Image` constructor
- **Fix:** Renamed import to `NextImage`

**Issue 3:** GSAP type annotation
- **Cause:** Explicit `any` type on gsap variable
- **Fix:** Used dynamic import with proper typing (`mod.gsap`)

**Issue 4:** `<img>` vs `<Image />`
- **Cause:** Next.js warning about using native img element
- **Fix:** Replaced with NextImage component for poster fallback

---

## Security Review

| Area | Status |
|------|--------|
| No PII exposure | ✅ Only public info (location, phone) |
| No API keys in client | ✅ GSAP loaded from node_modules |
| No external requests | ✅ All assets local |
| No user input handling | ✅ Static content |
| No authentication required | ✅ Public homepage |
| No data collection | ✅ No analytics in component |

---

## Performance Review

| Area | Status |
|------|--------|
| Frame preloading | ✅ Parallel, with progress |
| Canvas rendering | ✅ DPR capped, rAF throttled |
| Scroll performance | ✅ Passive listener, no layout thrashing |
| GSAP loading | ✅ Dynamic import, code split |
| Poster fallback | ✅ Next.js Image optimized |
| Memory management | ✅ Cleanup on unmount |
| No N+1 queries | ✅ N/A (no data fetching) |
| No render-blocking | ✅ Client component |

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/cinematic/CinematicHero.tsx` | New component (267 lines) |
| `app/[locale]/page.tsx` | Replaced Hero with CinematicHero |
| `tests/phase-3/cinematic-hero.test.ts` | New test file (45 tests) |
| `docs/qa/phase-3-2-1-cinematic-hero-manual-qa.md` | New QA checklist |
| `docs/engineering-journal/047-phase-3-2-1-cinematic-hero.md` | This file |
| `docs/engineering-journal/047-phase-3-2-1-loop-report.md` | Loop report |
| `docs/engineering-journal/000-index.md` | Updated index |

**No migration required.**

**No modifications to:**
- Booking wizard
- Availability engine
- Admin workflows
- Clinical features
- Authentication
- Database schema

---

## Tests

| Suite | Result |
|-------|--------|
| Cinematic hero | 45/45 pass |
| Phase 3 public booking | 127/127 pass |
| Phase 3 availability | 89/89 pass |
| Phase 4 EMR | 67/67 pass |
| Phase 3 reception | 66/66 pass |
| Phase 3 veterinarian | 65/65 pass |
| **Total** | **1027/1027 pass** |

**Test coverage:**
- Component structure (client component, props, constants)
- Frame preloading (progress, failure handling, path pattern)
- Scroll animation (event listener, rAF, progress calculation)
- Canvas rendering (DPR, object-fit, zoom)
- GSAP parallax (dynamic import, desktop-only, pointer tracking)
- Accessibility (reduced-motion, poster fallback, aria-hidden)
- Localization (dictionary usage, CTAs, contact info)
- Layout (500vh section, sticky container, z-index)
- Integration (homepage import, section preservation)
- Performance (cleanup, passive listener)
- Regression (no modifications to existing features)

---

## Definition of Done, Production Readiness and Rollback

**DoD Score: 7/10** → PASS WITH WARNINGS

| Gate | Status |
|------|--------|
| 1. Feature complete | ✅ |
| 2. No migration required | ✅ |
| 3. RLS and authorization | ✅ N/A (public page) |
| 4. Automated tests | ✅ 1027/1027 |
| 5. Lint/TSC/build/diff | ✅ |
| 6. Performance/security | ✅ |
| 7. Journal | ✅ |
| 8. Vercel deployment | ❌ Not deployed |
| 9. Manual QA | ❌ Not performed |
| 10. User validation | ❌ Not performed |

**Production Readiness:** Cinematic hero implemented with accessibility, performance, and localization. Requires deployment and manual QA.

**Rollback:** Revert `app/[locale]/page.tsx` to use `<Hero>` instead of `<CinematicHero>`. Remove CinematicHero component file.

---

## Commit Recommendation

```
feat(homepage): implement cinematic scrollytelling hero

- Create CinematicHero component with 151-frame canvas animation
- Add scroll-driven frame sequencing (500vh section, sticky viewport)
- Implement GSAP pointer parallax (desktop only)
- Add poster fallback for reduced-motion/mobile/slow-network
- Integrate frame preloading with progress indicator
- Replace Hero component on homepage
- Add 45 tests for component structure and behavior
- Create manual QA checklist

No migration required. Client-side only.
```

---

## Next Phase

Phase 3.2.2 — Public booking wizard hardening (if needed) or Phase 4.3 — Weight trend analysis.

---

**Verdict: PASS WITH WARNINGS** — Cinematic hero implemented with full test coverage, but manual QA and deployment required.
