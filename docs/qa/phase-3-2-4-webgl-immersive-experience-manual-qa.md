# Phase 3.2.4 WebGL Immersive Experience — Manual QA

Status: **PASS WITH WARNINGS until completed in real browsers**

## Desktop

- Confirm only one WebGL canvas exists on each public route.
- On the homepage, scroll both directions through the 400vh clinic journey.
- Verify arrival, examination, treatment, recovery, and location copy transitions align with their photographs.
- Confirm no generated geometry covers the veterinarian, patient, animals, or important clinic details.
- Confirm cat/dog guides stay realistically small, move reversibly between waypoints, and never cross the central subject-safe zone.
- Check pointer camera influence is subtle and the canvas never captures wheel, keyboard, or pointer actions.
- Verify About portrait framing does not stretch or distort the doctor’s face.
- Verify Services symbolic objects respond smoothly as the sticky service list scrolls.
- Verify Contact retains its normal Google Maps link and CTA focus indicators.
- Navigate repeatedly among Home, About, Services, and Contact; inspect memory for continued growth.

## Fallbacks

- Enable `prefers-reduced-motion`; verify posters replace every canvas and all HTML copy remains.
- Enable Save-Data in browser networking emulation; verify posters replace every canvas.
- Test a mobile viewport below 768px; verify no live canvas is mounted and normal HTML remains primary.
- Disable WebGL/hardware acceleration; verify no content loss or runtime error.
- Scroll canvases offscreen and confirm rendering pauses.

## Quality and performance

- Confirm desktop DPR never exceeds 1.5.
- Confirm there is no second frame-sequence canvas beyond the existing CinematicHero implementation.
- Profile initial load: WebGL chunks must load after critical HTML and must not delay CinematicHero.
- Inspect shadows and materials in Safari, Firefox, and Chromium.
- Test low-power hardware for frame pacing, context loss, and recovery.
