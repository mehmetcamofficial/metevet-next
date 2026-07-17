# LOOP REPORT — Phase 3.2.1: Cinematic Homepage Scrollytelling

**Date:** 2026-07-26
**Methodology:** Loop Engineering
**Phase:** 3.2.1
**Status:** PASS WITH WARNINGS

---

## 1. Verdict

PASS WITH WARNINGS — Cinematic scrollytelling hero implemented with 151-frame canvas animation, GSAP pointer parallax, and poster fallback. 45/45 tests pass. Manual QA, deployment, and user validation unverified.

---

## 2. Objective

Replace the static Hero component with an immersive cinematic experience using pre-rendered JPG frames, scroll-driven canvas animation, and pointer-based parallax effects.

---

## 3. Existing Hero Analysis

**Previous implementation:**
- Static two-column layout (text + image)
- Reveal animation component
- Single hero image (clinic-exterior.png)
- No scroll interaction
- Functional but not immersive

**Decision:** Replace with cinematic scrollytelling while preserving all other homepage sections.

---

## 4. Cinematic Hero Architecture

**Component:** `src/components/cinematic/CinematicHero.tsx`

**Frame assets:**
- 151 JPG frames in `/public/images/cinematic-jpg/`
- Preloaded on mount with progress tracking
- Stored in `imagesRef` (HTMLImageElement array)

**Rendering pipeline:**
1. Preload 151 frames (parallel loading)
2. Track progress (0% → 100%)
3. Show loading overlay during preload
4. After load: activate scroll-driven canvas animation
5. Map scroll progress to frame index
6. Draw frame to canvas with object-fit cover math
7. Apply GSAP pointer parallax (desktop only)

**Fallback strategy:**
- Poster fallback for: reduced-motion, mobile, load failure
- Uses Next.js Image component
- Single frame (frame-001.jpg)

---

## 5. Canvas Rendering Design

**drawFrame function:**
- DPR scaling (capped at 2x)
- Manual object-fit cover math
- Aspect ratio comparison (img vs canvas)
- Zoom factor (1.18) for parallax headroom
- Centered positioning

**Performance optimizations:**
- requestAnimationFrame throttling
- Passive scroll listener
- lastFrameRef prevents redundant draws
- No layout thrashing

---

## 6. Scroll-Driven Animation

**Section structure:**
- 500vh section height (scroll range)
- Sticky viewport container (100vh)
- Scroll progress: 0 → 1 mapped to frame index: 0 → 150

**Scroll calculation:**
```
scrollStart = -viewportHeight
scrollEnd = sectionHeight - viewportHeight
scrollRange = scrollEnd - scrollStart
scrollProgress = (rect.top - scrollStart) / scrollRange
frameIndex = floor(scrollProgress * (TOTAL_FRAMES - 1))
```

**Optimization:**
- Only redraw if frameIndex changed
- rAF batching prevents excessive redraws
- Passive listener for smooth scrolling

---

## 7. GSAP Pointer Parallax

**Activation conditions:**
- Desktop only (viewport ≥ 768px)
- prefers-reduced-motion: false
- Frames loaded successfully

**Implementation:**
- Dynamic import (code splitting)
- Mouse position mapped to ±20px canvas translation
- 0.5s duration, power2.out easing
- Cleanup on unmount

---

## 8. Accessibility Design

**Screen reader:**
- Canvas: aria-hidden="true" (decorative)
- Single H1 preserved
- Semantic HTML structure

**Keyboard navigation:**
- Tab order: CTAs, links
- Enter activates
- No keyboard traps

**Reduced motion:**
- Disables canvas animation
- Disables GSAP parallax
- Shows static poster

**Touch targets:**
- 44px+ height (mobile accessibility)

---

## 9. Localization

**Dictionary usage:**
- `dict.home.hero.eyebrow`
- `dict.home.hero.title`
- `dict.home.hero.description`
- `dict.home.hero.primaryCta`
- `dict.home.hero.secondaryCta`

**Contact info:**
- `siteConfig.location`
- `siteConfig.phone`
- `siteConfig.whatsappNumber`

**Loading text:**
- Turkish: "Yükleniyor..."
- English: "Loading..."

---

## 10. Responsive Design

**Mobile (< 768px):**
- Poster fallback (no canvas)
- Single-column layout
- Stacked CTAs
- Text: 4xl

**Tablet (768px–1024px):**
- Canvas animation
- Text: 5xl
- Inline CTAs

**Desktop (> 1024px):**
- Canvas + GSAP parallax
- Text: 6xl

---

## 11. TypeScript Issues Resolved

**Issue 1: drawFrame accessed before declaration**
- Cause: Function declared after useEffect
- Fix: Moved drawFrame before useEffect hooks

**Issue 2: Image name collision**
- Cause: Next.js Image vs native Image
- Fix: Renamed import to NextImage

**Issue 3: GSAP type annotation**
- Cause: Explicit any type
- Fix: Dynamic import with proper typing

**Issue 4: img vs Image**
- Cause: Next.js warning
- Fix: Replaced with NextImage component

---

## 12. Security and Privacy

| Area | Status |
|------|--------|
| No PII exposure | ✅ |
| No API keys in client | ✅ |
| No external requests | ✅ |
| No user input handling | ✅ |
| No authentication required | ✅ |
| No data collection | ✅ |

---

## 13. Performance Review

| Area | Status |
|------|--------|
| Frame preloading | ✅ Parallel, with progress |
| Canvas rendering | ✅ DPR capped, rAF throttled |
| Scroll performance | ✅ Passive listener |
| GSAP loading | ✅ Dynamic import |
| Poster fallback | ✅ Next.js Image |
| Memory management | ✅ Cleanup on unmount |

---

## 14. Files Changed, Migration and Tests

**Files:**
| File | Change |
|------|--------|
| `src/components/cinematic/CinematicHero.tsx` | New component (new) |
| `app/[locale]/page.tsx` | Replaced Hero with CinematicHero (modified) |
| `tests/phase-3/cinematic-hero.test.ts` | 45 tests (new) |
| `docs/qa/phase-3-2-1-cinematic-hero-manual-qa.md` | QA checklist (new) |

**Migration:** No migration required. Client-side only.

**Tests:**
| Suite | Result |
|-------|--------|
| Cinematic hero | 45/45 pass |
| Phase 3 public booking | 127/127 pass |
| Phase 3 availability | 89/89 pass |
| Phase 4 EMR | 67/67 pass |
| Phase 3 reception | 66/66 pass |
| Phase 3 veterinarian | 65/65 pass |
| **Total** | **1027/1027 pass** |

---

## 15. Definition of Done, Production Readiness and Rollback

**DoD Score: 7/10** → PASS WITH WARNINGS

| Gate | Status |
|------|--------|
| 1. Feature complete | ✅ |
| 2. No migration required | ✅ |
| 3. RLS and authorization | ✅ N/A |
| 4. Automated tests | ✅ 1027/1027 |
| 5. Lint/TSC/build/diff | ✅ |
| 6. Performance/security | ✅ |
| 7. Journal | ✅ |
| 8. Vercel deployment | ❌ Not deployed |
| 9. Manual QA | ❌ Not performed |
| 10. User validation | ❌ Not performed |

**Production Readiness:** Cinematic hero implemented with accessibility, performance, and localization. Requires deployment and manual QA.

**Rollback:** Revert `app/[locale]/page.tsx` to use `<Hero>`. Remove CinematicHero component.

---

## 16. Journal, Commit Recommendation and Next Phase

**Journal:**
- `docs/engineering-journal/047-phase-3-2-1-cinematic-hero.md` (this file)
- `docs/engineering-journal/047-phase-3-2-1-loop-report.md` (new)
- `docs/engineering-journal/000-index.md` — updated

**Commit Recommendation:**
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

**Next Phase:** Phase 3.2.2 — Public booking wizard hardening (if needed) or Phase 4.3 — Weight trend analysis.

**Verdict: PASS WITH WARNINGS** — Cinematic hero implemented, but manual QA and deployment required.
