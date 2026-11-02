# Runway study — 2 November 2026

The fashion route follows the existing central path at X = 0, from Z = 8 to Z = 38. A 3.8-metre-wide pale deck remains visually low to the ground, with restrained metal edging and narrow light lines. The visual deck height is 0.075 metres.

Six slim video totems sit at X = −4.8 and +4.8, with three on each side at Z = 12, 23 and 34. Their 1.3 × 2.6-metre screens face inward toward the central path. The screens share the supplied performance-video texture. Portrait cropping is applied to each panel's geometry UVs without modifying the shared texture or creating another video player.

Four continuous metal loop sculptures sit farther from the path at X = ±5.8 and Z = 17.5 and 28.5. Their gently twisted outlines, restrained rainbow finish and small circular bases keep the central route open. The tallest sculpture reaches approximately 3.33 metres. The module adds no text or banners, and no part extends into the main pavilion footprint.

## Integration

`createRunway(THREE, scene, videoTexture)` from `lab/runway.mjs` creates and adds one group to the supplied scene. It returns `{group, setVisible(visible)}`. The parent scene controls stage visibility, models, flags, media playback and lighting. The module creates no audio source and does not start or stop the shared video.

These are concept-model dimensions and visual materials. Physical deck transitions, screen installation, sculpture fixings and circulation approvals remain site-design work.

## Verification

Syntax and geometry checks passed. The module contains six inward-facing screens and four sculptures, with 8,040 triangles in total. Its measured bounds are X = ±6.62, Y = 0 to 3.328, and Z = 8 to 38 metres. Checks confirmed finite geometry attributes, an unchanged shared video texture, correct screen-facing directions and working visibility toggles. Integrated rendering and shared-feed playback remain part of the parent scene verification.
