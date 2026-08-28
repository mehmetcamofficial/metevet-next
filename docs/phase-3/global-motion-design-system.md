# Global Motion Design System

## Overview

The MeteVet Global Motion Design System provides a consistent, performant, and accessible animation foundation using GSAP + ScrollTrigger. It replaces ad-hoc Framer Motion wrappers with a shared vocabulary adapted to MeteVet’s warm ivory / forest green / soft gold identity.

## Architecture

| File | Purpose |
|------|---------|
| `src/components/motion/load-gsap.ts` | Singleton GSAP + ScrollTrigger loader/register |
| `src/components/motion/motion-config.ts` | Shared durations, easings, thresholds |
| `src/components/motion/useReducedMotion.ts` | `prefers-reduced-motion` via `useSyncExternalStore` |
| `src/components/motion/useInViewOnce.ts` | Single-fire IntersectionObserver hook |
| `src/components/motion/MotionProvider.tsx` | Optional preload of GSAP plugins |
| `src/components/motion/index.ts` | Public API exports |

### Components

| Component | Use case |
|-----------|----------|
| `Reveal` | Single-element fade + translate |
| `BlurText` | Word-by-word blur-to-clear (semantic HTML) |
| `StaggerGroup` | One observer/timeline for child stagger |
| `SectionTransition` | Section-level enter wrapper |
| `ParallaxMedia` | Restrained scroll-linked parallax (desktop) |
| `CountUp` | In-view number counting |
| `MagneticLink` | Subtle magnetic hover for fine pointers |

## Design principles

1. **No scroll hijacking** — native browser scrolling only.
2. **Reduced motion** — all motion components skip animations when preferred.
3. **Progressive enhancement** — markup does not start at `opacity: 0`; off-screen hide is applied only after JS confirms the element is not yet in view.
4. **Cleanup** — `gsap.context().revert()` + cancelled async loads.
5. **Accessibility** — BlurText uses `sr-only` + `aria-hidden` visual words; decorative layers are `aria-hidden`.

## Usage

```tsx
import { Reveal, BlurText, StaggerGroup } from "@/src/components/motion";

<Reveal delay={0.1} direction="up">
  <div>Content fades in from below</div>
</Reveal>

<BlurText as="h2" className="text-3xl font-semibold">
  Animated heading text
</BlurText>

<StaggerGroup className="grid gap-4" alternateOffset={10}>
  {items.map((item) => (
    <div key={item.id}>{item.name}</div>
  ))}
</StaggerGroup>
```

## Liquid-glass CSS utilities

In `app/globals.css`:

| Class | Purpose |
|-------|---------|
| `.glass-light` | Warm translucent ivory |
| `.glass-dark` | Deep forest green glass |
| `.glass-cta` | Strong CTA surface |
| `.glass-pill` | Chip / badge glass |
| `.glass-caption` | Photo caption overlay |

All include `@supports not (backdrop-filter)` solid fallbacks.

## Homepage choreography (summary)

| Section | Treatment |
|---------|-----------|
| TrustStrip | Hero→page gradient veil + staggered chips |
| ServicesPreview | BlurText heading, staggered cards, hover rise |
| DoctorProfile | Opposite-direction reveals + image parallax + glass chip |
| GallerySection | Alternating parallax media + caption glass |
| CarePhilosophy | Soft blooms + indexed staggered cards + BlurText |
| AppointmentCTA | Bounded pointer glow + BlurText + glass CTA |
| BlogPreview | Header reveal + staggered editorial cards |
| FAQ | Grid-row accordion + ARIA + reduced-motion instant |
| ContactPreview | Complementary direction reveals + light glass details |
| Footer | Single Reveal enter + underline link polish |
| Navbar | Transparent/home → compact liquid-glass on scroll |

## Testing

```bash
node --test tests/phase-3/global-motion-design-system.test.ts
```
