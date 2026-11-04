# I Am Portal — first 3D build

4 November 2026. Staging review only.

## Source and scope

Built from Ben's [Festival Activation & 3D Reconstruction Brief](https://app.notion.com/p/40d7b9c99c5681fbbbfbf82ca086dd3e?pvs=204), supplied image and subsequent instructions in this chat. The reference image supplies the programme and visual arrangement; mathematical coordinates determine each solid. Ben's latest spaced sign text overrides earlier labels, including **a t e l l i e r**.

The four build stages are present: central geometry and scale, six satellite spaces and flower, placement study, and navigable workshop interiors integrated into the festival story. This is a concept model in the existing site's visual style, with fabrication and operating design still open.

## Scale and accurate geometry

The main pavilion's existing platform is 24 × 20 metres, with a 22.6 × 18.4 metre roof footprint. It remains the approximately 100-person reference. Each Portal space contains nine seated participants and one facilitator, ten people total. The whole village represents 70 people across seven sessions, not ten across the village.

| Space | Mathematical envelope | Bounding width × depth | Model height above grass |
| --- | --- | --- | --- |
| S.T.E.A.M. | Truncated icosahedron | 7.05 × 7.05 m | 5.43 m |
| Mantra | Cube | 5.00 × 5.00 m | 5.00 m |
| Sound | Octahedron, resting on a triangular face | 7.57 × 7.57 m | 5.54 m |
| Comedy | Dodecahedron | 6.91 × 6.91 m | 5.36 m |
| Sex-ed | Icosahedron | 6.46 × 6.46 m | 5.13 m |
| Atellier | Two interpenetrating regular tetrahedra | 4.85 × 4.85 m | 4.87 m |
| EMDR | Tetrahedron, resting on a triangular face | 7.57 × 7.57 m | 6.40 m |

Dimensions describe the model envelope, excluding the small scene ground offset. They are not certified usable floor areas or occupancy calculations. Furniture, entrances and accessible circulation need a dimensioned physical design review.

Each frame uses rigid rotation and one uniform radius. No axis is stretched. Automated checks verify equal edges, equal circumradii, planar regular faces, topology and the placed cube's equal dimensions. The truncated icosahedron has 60 vertices, 90 edges, 12 pentagons and 20 hexagons. The star is explicitly a two-tetrahedron compound.

The STEAM, Comedy and Sex-ed envelopes currently intersect the grass plane: their full mathematical frames continue below ground, leaving an upper marquee volume visible. This is a ground-section study, not a complete solid sitting above grass or a resolved tent base. Lower/front infill panels are omitted for visibility and access; vertices are never flattened to create a floor. Resolving bases and openings is a separate physical-design step.

See [same-scale plan comparison](qa/portal-20261104/scale-comparison.svg) and [geometry measurements](qa/portal-20261104/geometry.json).

## Placement

The selected village centre is at scene coordinates x = −34, z = 66, beyond the road train along a new 2.4-metre-wide path. Satellite centres sit on a 9.5-metre ring. The existing main festival, trees, river and approved opening camera remain in place.

A closer-to-trucks comparison uses x = −44, z = 43. That arrangement brings the village into the busy foreground and road-train activity. The path placement gives the seven spaces a separate destination and preserves more open lawn in the initial view. The comparison changes placement only; scale is constant.

The coloured lawn uses the existing Universal Mind flower asset, including its actual filled overlapping petals. It is a transparent grass-colour layer at ground level, with no platform or carpet edge. Its appearance is a visual study; physical turf colouring and maintenance remain open.

## Workshop detail

- Moroso Tropicália chairs reuse the existing model treatment and rainbow weave.
- STEAM includes tablets, geometric objects and a robot arm.
- Mantra includes microphones, keyboards and sampling equipment. Language and cultural content remain led by First Nations collaborators.
- Sound includes horn speakers, drum pads and electronic instruments.
- Atellier includes sewing machines, garment material, mannequins and a clothing rail.
- EMDR includes black sensor-equipped visor representations and a daybed.
- Comedy includes a microphone and small listening circle.
- Sex-ed includes a facilitated discussion circle and learning material.

The exact spaced labels appear on the physical signs. Workshop titles and spaced labels identify the seven navigation choices.

## Interaction and presentation

Destination 08 and About open the Portal. The right-hand card offers the seven rooms plus a village overview. Mobile uses a small horizontal room selector and compact card. Close views keep the artist lineup and floating place labels hidden. The village assembles during fit-out and receives a ten-second destination stop before the existing continuous circuit.

Day/night lighting and subtle instrument pulses follow the existing scene settings. No new audio source, live biometric connection or therapeutic outcome claim is introduced.

## Verification

- Mathematical shape and placed-geometry assertions in `tools/check-portal-geometry.mjs`.
- Existing Lab preflight and original-reference hash checks.
- Desktop 1440 × 900 and portrait mobile 393 × 780 browser checks.
- About entry, eight Portal choices, capacity metadata, hidden close-view labels/lineup, mobile overflow and existing pavilion navigation.
- Browser launched separately with process-level `--mute-audio`; media calls stubbed. Native fullscreen never invoked. All contexts closed after verification.
- Live verification records exact deployed source hashes after the Panthur staging release.
