# Architecture study — 2 November 2026

This pass replaces the plain provisional shells with original reference-based meshes. It retains the shared warm earthen palette and removes the cellular openings from the satellite references. The forms remain project adaptations for discussion with the architectural teams.

## References reviewed

- **R07 — single vault, front:** the broad arched entrances, changing roof curvature and four contacts with the ground.
- **R08 — vault edge and masonry:** the thin layered edge, staggered tiles and continuous surface over the curved roof.
- **R22/R23 — Striatus side and stairs:** the broad arch passage, flowing metal-like boundary surfaces and rising upper route. The play bridge is a separate landscape sculpture beside the satellite, rather than another pavilion.
- **R24 — Volu dining pavilion:** the continuous sweep from the rear support into a broad canopy, open front and rounded outline. The source's oval/cellular openings, applied ribs and furniture are intentionally absent, following Ben's earlier direction.

The generated materials use a repeating tile atlas with staggered courses, restrained colour variation, fine mortar relief and a layered rim. The satellite has a quieter fine-aggregate surface in the same colour family. This visual material study does not lock the local construction material or manufacturing method.

## Integration

`lab/architecture.mjs` exports `createArchitecture(THREE)`. Call it once per scene to share geometry, textures and materials.

- `mainVault()` returns a group centred at ground level. Its footprint is 22.6 × 18.4 metres, peak 8.04 metres and nominal visual shell thickness 0.24 metres. The front faces positive Z. Four lower corners reach ground level. No floor is included.
- `satellite({scale=1}={})` returns a group centred at ground level, with the continuous support at negative Z and open front at positive Z. Its visual span is 12.07 metres, depth 9.18 metres and peak 6.39 metres. No floor is included. The group scale multiplies the dimensions.
- `playground({rainbow=true}={})` returns a separate fluid ribbon bridge, approximately 11 × 7 metres with a 3.2-metre peak. It has a broad curved underpass, a rising timber-marked top route and metallic surfaces. Set `rainbow:false` for neutral silver. No additional floor is included. Its access, fall protection and play certification remain design work.
- Each mesh has distinct exterior, underside and rim material groups. The geometries and materials are shared between copies. One vault plus two satellites remains below 70,000 triangles and nine material draw calls before shadows. The play sculpture adds 8,096 shell triangles plus 492 instanced timber-marker triangles. The total for one vault, two satellites and one play bridge is 72,524 triangles.

## Scope

The mesh geometry and textures are created for this pitch from the supplied visual references. No official Foster + Partners, Norman Foster Foundation or ZHA CAD asset is represented as imported. The tiled texture is an original procedural material, rather than a photograph copied from the supplied references.

These dimensions are concept-model dimensions. Shell thickness, structure, drainage, thermal properties, transport, assembly, occupancy and site suitability remain design work. The model does not establish construction approval or an agreed architectural partnership. Photorealistic completion has not been claimed; close-range modelling, site-specific material review and further landscape work remain part of the quality pass.

## Verification

Node geometry checks confirmed finite positions, normals and UVs; measured bounding boxes; and ground contact on all three assets. A dedicated headless Chromium process launched with `--mute-audio` rendered all three objects without page errors. The image was inspected for roof continuity, open entrances, rear canopy support and the play underpass. The automated browser was closed after capture. These checks validate the rendering implementation, not physical construction or access compliance.
