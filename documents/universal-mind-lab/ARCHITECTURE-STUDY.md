# Architecture study — 2 November 2026

This pass replaces the plain provisional shells with original reference-based meshes. It retains the shared warm earthen palette and removes the cellular openings from the satellite references. The forms remain project adaptations for discussion with the architectural teams.

## References reviewed

- **R07 — single vault, front:** the broad arched entrances, changing roof curvature and four contacts with the ground.
- **R08 — vault edge and masonry:** the thin layered edge, staggered tiles and continuous surface over the curved roof.
- **R21/R22/R23 — Striatus underside, side and stairs:** the broad arch passage, flowing boundary surfaces and rising upper route. The play bridge is a separate landscape sculpture beside the satellite, rather than another pavilion.
- **R24 — Volu dining pavilion:** the continuous sweep from the rear support into a broad canopy, open front and rounded outline. The source's oval/cellular openings, applied ribs and furniture are intentionally absent, following Ben's earlier direction.

The generated materials use a repeating tile atlas with staggered courses, restrained colour variation, fine mortar relief and a layered rim. The satellite now shares the main vault’s staggered tile atlas, mortar relief, warm colour and layered rim. Arc-length UV mapping fans the tile courses continuously from the support into the canopy, keeping the texture readable on the upright rear surface. This visual material study does not lock the local construction material or manufacturing method.

Ben reattached R21 during this iteration to reinforce the separate playground requirement. The reattached Desktop image matches the archived original SHA-256; no duplicate copy is needed. The metal and rainbow finish is the proposed Lab adaptation.

## Integration

`lab/architecture.mjs` exports `createArchitecture(THREE)`. Call it once per scene to share geometry, textures and materials.

- `mainVault()` returns a group centred at ground level. Its footprint is 22.6 × 18.4 metres, peak 8.04 metres and nominal visual shell thickness 0.24 metres. The front faces positive Z. Four lower corners reach ground level. No floor is included.
- `satellite({scale=1}={})` returns a group centred at ground level, with the continuous support at negative Z and open front at positive Z. Its visual span is 12.04 metres, depth 9.19 metres and peak 6.51 metres, with 0.22-metre nominal shell thickness offset along surface normals. No floor is included. The group scale multiplies the dimensions.
- `playground({rainbow=true}={})` returns a separate fluid ribbon bridge, approximately 11 × 7 metres with a 3.2-metre peak. It has a broad curved underpass, a rising timber-marked top route and metallic surfaces. Set `rainbow:false` for neutral silver. No additional floor is included. Its access, fall protection and play certification remain design work.
- Each mesh has distinct exterior, underside and rim material groups. The geometries and materials are shared between copies. One vault plus two satellites remains below 70,000 triangles and nine material draw calls before shadows. The play sculpture adds 8,096 shell triangles plus 492 instanced timber-marker triangles. The total for one vault, two satellites and one play bridge is 77,196 triangles. A third satellite for support facilities raises that total to 98,508 triangles.

## Scope

The mesh geometry and textures are created for this pitch from the supplied visual references. No official Foster + Partners, Norman Foster Foundation or ZHA CAD asset is represented as imported. The tiled texture is an original procedural material, rather than a photograph copied from the supplied references.

These dimensions are concept-model dimensions. Shell thickness, structure, drainage, thermal properties, transport, assembly, occupancy and site suitability remain design work. The model does not establish construction approval or an agreed architectural partnership. Photorealistic completion has not been claimed; close-range modelling, site-specific material review and further landscape work remain part of the quality pass.

## Verification

Node geometry checks confirmed finite positions, normals and UVs; measured bounding boxes; and ground contact on all three assets. A dedicated headless Chromium process launched with `--mute-audio` rendered all three objects without page errors. The image was inspected for roof continuity, open entrances, rear canopy support and the play underpass. The automated browser was closed after capture. These checks validate the rendering implementation, not physical construction or access compliance.

## Satellite refinement and roof mapping

The revised Volu-informed silhouette has a flared continuous rear support, a broad rounded canopy, compound curvature, a shallow centre crown, rolled outer edges and a lightly lifted perimeter. The leading edge now closes into a rounded tip. It retains the open front and excludes cellular or oval holes. Food, play and support facilities can all use this same factory method and material family; the parent scene controls their scale, placement and furnishings. The separate play bridge retains its shape and gains restrained surface grain on the metal finish.

The main vault’s position, UV and index buffers are identical to the earlier committed asset. Its material palette and silhouette are preserved.

`roofHeight(x,z)` is now returned from `createArchitecture(THREE)`. It accepts local vault coordinates, clamps X to ±11.3 metres and Z to ±9.2 metres, and returns the analytical underside height used by the main mesh. Its formula is `4.24 × arch(x / 11.3) + 3.56 × arch(z / 9.2)`. The outer roof is 0.24 metres higher. At local Z = −6.9, the underside is 6.405 metres at X = 0, 5.896 metres at X = 5, and 3.806 metres at X = 10.

For the roof-conforming stage screen, sample this function across the screen width and subtract a small rendering clearance, for example 0.08 metres, to prevent intersections with the triangulated surface. This clearance is a visual implementation detail. For roof-lighting effects, the local X/Z domain maps to `[(x + 11.3) / 22.6, (z + 9.2) / 18.4]`; the existing material UVs remain physical tiled courses, so use local position for an independent full-roof projection. Material group 0 is the exterior, 1 the underside, and 2 the layered rim. The parent scene supplies the vault’s world transform.

Revision verification: finite position, normal and UV attributes; measured bounds; main mesh buffer hash comparison; roof-height agreement at every underside mesh vertex (maximum error 0.00000114 metres); and a silent headless Chromium render without page errors. The rounded outline, tiled surface and continuous support were inspected in the screenshot, and the automated browser was closed after capture.
