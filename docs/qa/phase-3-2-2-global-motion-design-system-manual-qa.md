# Phase 3.2.2 — Global Motion Design System Manual QA

**Status:** REQUIRED before claiming complete  
**Automated tests:** PASS (not sufficient alone)  
**Final phase status until this checklist is done:** **PASS WITH WARNINGS**

## Environment matrix

| Environment | Check |
|-------------|-------|
| Desktop Chrome (latest) | ☐ |
| Desktop Safari (latest) | ☐ |
| Mobile responsive mode (Chrome DevTools) | ☐ |
| iPhone Safari | ☐ |
| `prefers-reduced-motion: reduce` | ☐ |
| Keyboard only | ☐ |
| Screen reader (VoiceOver / NVDA sample) | ☐ |

## Global checks

| # | Check | Pass |
|---|-------|------|
| 1 | Native scroll works; no wheel/touch interception | ☐ |
| 2 | No custom scrollbar / Lenis-style hijack | ☐ |
| 3 | No horizontal overflow on 375 / 768 / 1280 / 1440 | ☐ |
| 4 | Refresh keeps content readable immediately | ☐ |
| 5 | Client navigation (TR ↔ EN, home → services → back) feels fast (~250–450 ms) | ☐ |
| 6 | Browser back/forward restores scroll reasonably | ☐ |
| 7 | One semantic H1 (CinematicHero) only | ☐ |
| 8 | No layout shift from motion wrappers | ☐ |
| 9 | Admin routes unchanged (no public page transition jank on `/admin`) | ☐ |

## Navbar

| # | Check | Pass |
|---|-------|------|
| 1 | Home top: transparent / non-blocking over page start | ☐ |
| 2 | After scroll: compact liquid-glass surface + blur | ☐ |
| 3 | Logo and links remain readable in both states | ☐ |
| 4 | Active route remains clear | ☐ |
| 5 | Mobile menu opens/closes; focus not trapped incorrectly | ☐ |
| 6 | No hydration flicker (transparent → glass snap is intentional post-mount) | ☐ |

## Sections (homepage below CinematicHero)

| Section | Checks | Pass |
|---------|--------|------|
| TrustStrip | Soft handoff from hero; staggered chips; compact | ☐ |
| ServicesPreview | Kicker → BlurText heading → cards stagger; hover rise ≤ ~6–8px; keyboard focus on links | ☐ |
| DoctorProfile | Image/text complementary directions; credentials readable; face not cropped | ☐ |
| GallerySection | Mobile: simple grid + reveals; desktop: restrained parallax; alts present | ☐ |
| CarePhilosophy | Statements readable; soft blooms decorative only (`aria-hidden`) | ☐ |
| AppointmentCTA | Strong CTA moment; phone + WhatsApp + booking links work; glass CTA hover restrained | ☐ |
| BlogPreview | Cards stagger; metadata stable; focus styles visible | ☐ |
| FAQ | `aria-expanded`, keyboard toggle, panel open/close; reduced-motion opens without lag | ☐ |
| ContactPreview | Calm dual-column reveal; glass detail chips; CTAs work | ☐ |
| Footer | Single enter reveal; links work; legal/staff login present | ☐ |

## Reduced motion

| # | Check | Pass |
|---|-------|------|
| 1 | OS or DevTools `prefers-reduced-motion: reduce` | ☐ |
| 2 | Reveals / blur text / parallax / page transition skipped | ☐ |
| 3 | FAQ panels open without height animation lag | ☐ |
| 4 | Content never stuck invisible | ☐ |

## Performance

| # | Check | Pass |
|---|-------|------|
| 1 | No continuous React state updates while scrolling sections (DevTools profiler sample) | ☐ |
| 2 | Parallax off on mobile width | ☐ |
| 3 | Leaving page does not leave orphaned GSAP tweens (no console errors) | ☐ |
| 4 | CinematicHero 180-frame path still works (manual smoke) | ☐ |

## CTA routes

| Route | Pass |
|-------|------|
| Appointment / Randevu | ☐ |
| Services / Hizmetler | ☐ |
| Contact / İletişim | ☐ |
| Blog posts | ☐ |
| tel: and WhatsApp | ☐ |

## Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| Manual QA | | | |
| Product | | | |

**Do not mark Phase 3.2.2 complete until this file is filled and real browsers are checked.**
