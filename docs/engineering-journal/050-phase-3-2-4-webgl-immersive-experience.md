# 050 — Phase 3.2.4 WebGL Immersive Experience

Date: 2026-07-17  
Status: **PASS WITH WARNINGS**

## Decision

MeteVet now uses route-scoped, progressively enhanced React Three Fiber scenes instead of expanding the existing CSS perspective system. Each public route uses at most one canvas. `CinematicHero` remains independent and unchanged.

## Architecture

`WebGLProvider` is the client boundary. It dynamically imports `SceneCanvas` with SSR disabled, renders an image poster first, measures viewport intersection, and selects a quality tier. `SceneCanvas` owns the only React Three Fiber `Canvas` implementation and routes to clinic, portrait, services, or contact geometry.

Low quality is selected for reduced motion, Save-Data, mobile, slow connections, or missing WebGL. High quality caps DPR at 1.5 and enables shadows; medium caps DPR at 1. Rendering uses demand mode in view and `never` when inactive.

The Phase 3.2.5 browser correction replaced the original 24-unit camera tunnel with a bounded dissolve system. Camera Z now stays between 4.8 and 3.8, photo planes stay within 0.42 units of depth, and the journey height is 320vh. Only current and next photos participate in a transition, while only one narrative card remains primary.

## Phase 3.2.5 correction

Real-browser QA rejected the initial procedural room composition because opaque furniture and wall geometry obstructed photographic subjects and did not share the photographs' perspective. The homepage journey was therefore corrected to a photographic 2.5D strategy.

The current scene keeps each clinic photograph intact on shallow depth planes. It adds only small diagnostic markers and recurring edge-positioned cat/dog guides. Oversized tables, generated walls, arbitrary blockers, and the abstract contact map board were removed.

## Scene design

- Homepage: five-stage photographic journey covering arrival, examination, diagnosis/treatment, recovery, and location.
- About: a non-displaced image plane with a separate accent plane, protecting facial geometry.
- Services: symbolic vial, scanning ring, and care object composition.
- Contact: clinic exterior, lightweight DOM/SVG route treatment, and accessible Google Maps navigation retained in HTML.

## Performance and cleanup

The canvas bundle is dynamically split, posters render before initialization, geometry is declarative and disposed by R3F on unmount, and the portrait texture has explicit cleanup. No GLTF, physics, particles, or postprocessing dependency was introduced.

## Warning

Automated verification cannot establish visual quality, GPU stability, motion comfort, or memory behavior. Status remains PASS WITH WARNINGS pending the manual QA checklist.
