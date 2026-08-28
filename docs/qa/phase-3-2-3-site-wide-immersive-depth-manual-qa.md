# Phase 3.2.3 — Site-wide Immersive Depth Manual QA

## Overview

This document outlines the manual QA checklist for the site-wide immersive 3D experience implementation.

## QA Checklist

### Homepage Gallery
- [ ] Gallery images fill complete card area (no empty ivory space)
- [ ] Captions appear at bottom of images with glass-caption styling
- [ ] Alternating vertical offsets on desktop (0px, 56px, 18px)
- [ ] Pointer tilt works on fine-pointer devices only
- [ ] No tilt on mobile/touch devices
- [ ] Reduced motion disables all depth effects
- [ ] No horizontal overflow

### About Page
- [ ] ImmersivePageHero with layered background image
- [ ] Floating chip with "Veteriner Hekim" / "Veterinarian" label
- [ ] StickyStory with doctor portrait on left
- [ ] Three story items with scroll-triggered opacity/y animation
- [ ] Mobile: vertical sequence (no sticky trap)
- [ ] One H1 per page (via BlurText)

### Services Page
- [ ] ImmersivePageHero with treatment room image
- [ ] Floating chip with "Klinik Hizmetler" / "Clinic Services"
- [ ] StickyStory with service list on right
- [ ] Each service item has distinct title/description
- [ ] Mobile: vertical stack of services
- [ ] No scroll hijacking

### Blog Page
- [ ] ImmersivePageHero with blog SVG image
- [ ] Floating chip with "Bilgi Merkezi" / "Knowledge Center"
- [ ] Featured article section with image
- [ ] BlogExplorer for remaining posts
- [ ] Blog routes and SEO preserved
- [ ] One H1 per page

### Contact Page
- [ ] ImmersivePageHero with clinic exterior image
- [ ] Floating chip with location
- [ ] Contact cards with StaggerGroup animation
- [ ] Map link remains clickable
- [ ] All contact methods accessible
- [ ] Mobile: stacked layout with 44px+ touch targets

### Cross-page Behavior
- [ ] Navbar scroll state for liquid-glass effect
- [ ] Footer fade-up animation
- [ ] Page transitions (300-450ms) for public pages only
- [ ] Admin pages skip transitions
- [ ] No Lenis or scroll hijacking anywhere
- [ ] No Three.js dependency

### Performance
- [ ] No continuous RAF unless interacting
- [ ] GSAP context cleanup on unmount
- [ ] Lazy loading for below-fold images
- [ ] will-change-transform used sparingly
- [ ] CinematicHero performance preserved

### Accessibility
- [ ] One H1 per route
- [ ] Semantic headings preserved
- [ ] Animated text remains selectable
- [ ] aria-hidden on decorative elements
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Reduced motion disables all animations

## Browser Testing

- [ ] Chrome (desktop)
- [ ] Safari (desktop)
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Reduced motion enabled (macOS)

## Known Compromises

1. Gallery uses `DepthMedia` instead of `ParallaxMedia` for scroll depth
2. StickyStory uses `autoAlpha` for opacity animation (not React state)
3. ImmersivePageHero uses BlurText for H1 (not native h1)
4. No map embed on contact page (link only) to avoid blocking interaction