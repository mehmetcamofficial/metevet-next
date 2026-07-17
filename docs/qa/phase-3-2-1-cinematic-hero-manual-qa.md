# Phase 3.2.1 — Cinematic Homepage Scrollytelling Manual QA

**Date:** 2026-07-26
**Phase:** 3.2.1 — Cinematic Homepage Scrollytelling
**Status:** Not performed — requires human tester
**Migration:** None required

Do not mark items automatically. Check each box only after live verification.

---

## Prerequisites

- [ ] 151 JPG frame assets present in `/public/images/cinematic-jpg/` (frame-001.jpg through frame-151.jpg)
- [ ] GSAP installed (`npm list gsap`)
- [ ] Dev server running (`npm run dev`)
- [ ] Browser: Chrome, Safari, Firefox available
- [ ] Mobile device or responsive dev tools
- [ ] Network throttling enabled (Fast 3G) for loading tests

---

## Initial load — Desktop (Chrome)

- [ ] Navigate to `/tr` (Turkish homepage)
- [ ] Loading overlay appears with percentage counter (0% → 100%)
- [ ] Progress text shows "Yükleniyor..."
- [ ] Overlay background is semi-transparent dark green (#0D2922/80)
- [ ] Loading completes within 5-10 seconds on fast connection
- [ ] After loading, overlay disappears
- [ ] First frame (frame-001.jpg) visible as canvas background
- [ ] Hero content overlay visible: eyebrow, title, description, CTAs, location, phone

---

## Scroll-driven animation — Desktop

- [ ] Page has tall scroll area (500vh section height)
- [ ] Sticky viewport container keeps hero visible during scroll
- [ ] Scrolling down advances frames smoothly (frame-001 → frame-151)
- [ ] Animation feels cinematic, not janky
- [ ] No frame skipping or stuttering on mid-range hardware
- [ ] Scroll back up reverses animation (frame-151 → frame-001)
- [ ] Frame transitions are seamless (no flicker)
- [ ] requestAnimationFrame prevents excessive redraws (check DevTools Performance)

---

## GSAP pointer parallax — Desktop only

- [ ] Move mouse across viewport
- [ ] Canvas follows pointer with subtle parallax effect (±20px)
- [ ] Animation is smooth (0.5s duration, power2.out easing)
- [ ] Parallax only active on desktop (viewport ≥ 768px)
- [ ] No parallax on mobile (viewport < 768px)

---

## Poster fallback — Reduced motion

- [ ] Enable "Reduce motion" in OS accessibility settings
- [ ] Reload page
- [ ] Canvas animation does NOT play
- [ ] Static poster image (frame-001.jpg) displayed instead
- [ ] Poster uses Next.js Image component (check DevTools)
- [ ] Poster has `fill` and `object-cover` styling
- [ ] Hero content overlay still visible and functional

---

## Poster fallback — Mobile

- [ ] Open page on mobile device (or responsive dev tools < 768px)
- [ ] Canvas animation does NOT play
- [ ] Static poster image displayed
- [ ] Hero content visible and readable
- [ ] CTAs are tappable (44px+ touch targets)
- [ ] Text is legible on small screens

---

## Poster fallback — Slow network / failure

- [ ] Enable "Slow 3G" network throttling
- [ ] Reload page
- [ ] Loading overlay shows progress
- [ ] If >10% of frames fail to load, poster fallback activates
- [ ] Poster image loads (it's prioritized)
- [ ] User can still access CTAs and content

---

## Accessibility — Screen reader

- [ ] Enable VoiceOver (macOS) or NVDA (Windows)
- [ ] Navigate to homepage
- [ ] Canvas has `aria-hidden="true"` (not announced)
- [ ] Single H1 is announced: "MeteVet" (or localized title)
- [ ] Eyebrow text announced (decorative badge)
- [ ] Description announced
- [ ] Primary CTA announced: "Online Randevu" (or localized)
- [ ] Secondary CTA announced: "WhatsApp"
- [ ] Location badge announced
- [ ] Phone link announced with tel: URI
- [ ] Tab key navigates through interactive elements in logical order

---

## Accessibility — Keyboard navigation

- [ ] Tab to primary CTA (Online Randevu)
- [ ] Press Enter — navigates to `/tr/randevu`
- [ ] Tab to secondary CTA (WhatsApp)
- [ ] Press Enter — opens WhatsApp link in new tab
- [ ] Tab to phone link
- [ ] Press Enter — initiates phone call (or shows tel: dialog)
- [ ] No keyboard traps

---

## Localization — Turkish

- [ ] Navigate to `/tr`
- [ ] Eyebrow text in Turkish
- [ ] Title in Turkish
- [ ] Description in Turkish
- [ ] Primary CTA: "Online Randevu"
- [ ] Secondary CTA: "WhatsApp"
- [ ] Loading text: "Yükleniyor..."
- [ ] Location: "Kuşadası, Aydın"
- [ ] Phone: "+90 506 585 91 55"

---

## Localization — English

- [ ] Navigate to `/en`
- [ ] Eyebrow text in English
- [ ] Title in English
- [ ] Description in English
- [ ] Primary CTA: "Book Online"
- [ ] Secondary CTA: "WhatsApp"
- [ ] Loading text: "Loading..."
- [ ] Location: "Kuşadası, Aydın"
- [ ] Phone: "+90 506 585 91 55"

---

## Performance — DevTools audit

- [ ] Open Chrome DevTools → Performance tab
- [ ] Record scroll interaction (5 seconds)
- [ ] No long tasks (> 50ms) during scroll
- [ ] Frame rate stays above 55 FPS on mid-range hardware
- [ ] Memory usage stable (no leaks after 10 scroll cycles)
- [ ] Canvas rendering uses GPU acceleration (check Layers panel)
- [ ] No layout thrashing (no forced reflows)

---

## Performance — Lighthouse

- [ ] Run Lighthouse audit (Performance category)
- [ ] Performance score ≥ 90
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Total Blocking Time (TBT) < 200ms
- [ ] No render-blocking resources

---

## Responsive design — Breakpoints

- [ ] Mobile (< 768px): Poster fallback, single-column layout
- [ ] Tablet (768px–1024px): Canvas animation, adjusted text sizes
- [ ] Desktop (> 1024px): Canvas animation + GSAP parallax
- [ ] Text scales appropriately (4xl → 5xl → 6xl)
- [ ] CTAs stack on mobile, inline on desktop
- [ ] Location/phone badges wrap gracefully

---

## Integration — Other homepage sections

- [ ] Scroll past cinematic hero
- [ ] TrustStrip section visible and functional
- [ ] ServicesPreview section visible
- [ ] DoctorProfile section visible
- [ ] GallerySection visible
- [ ] CarePhilosophy visible
- [ ] AppointmentCTA visible
- [ ] BlogPreview visible
- [ ] Faq visible
- [ ] ContactPreview visible
- [ ] Navbar sticky and functional
- [ ] Footer visible at bottom
- [ ] WhatsApp button floating

---

## Regression — Existing functionality

- [ ] Old Hero component no longer used (check source)
- [ ] No console errors or warnings
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Build passes (`npm run build`)
- [ ] All existing tests pass (`npm test`)
- [ ] No modifications to booking wizard
- [ ] No modifications to availability engine
- [ ] No modifications to admin workflows

---

## Cross-browser testing

- [ ] Chrome 120+ (macOS/Windows)
- [ ] Safari 17+ (macOS/iOS)
- [ ] Firefox 121+ (macOS/Windows)
- [ ] Edge 120+ (Windows)
- [ ] Samsung Internet (Android)

---

## Edge cases

- [ ] Resize browser during animation — canvas adapts
- [ ] Rotate mobile device — poster fallback persists
- [ ] Disable JavaScript — poster fallback (or SSR fallback)
- [ ] Block image loading — loading overlay shows, then fails gracefully
- [ ] Very slow connection — loading overlay shows progress
- [ ] Ad blocker active — no impact on hero
- [ ] Dark mode OS setting — hero unaffected (custom colors)

---

## Sign-off

- [ ] All critical paths verified
- [ ] No regressions in existing functionality
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Performance benchmarks met
- [ ] Cross-browser compatibility confirmed
- [ ] Localization verified (TR/EN)
- [ ] Ready for production deployment

**Tester:** _______________
**Date:** _______________
**Result:** ☐ PASS ☐ PASS WITH WARNINGS ☐ FAIL

**Notes:**

