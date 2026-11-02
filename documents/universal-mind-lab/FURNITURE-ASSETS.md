# Tropicália furniture assets — first detailed scene pass

Date: 2 November 2026.

The scene models are reference-based parametric studies of the rainbow Tropicália furniture shown in Ben's supplied photographs. They are not manufacturer CAD, fabrication drawings or verified product dimensions.

## Official asset check

Moroso's [Tropicália product page](https://moroso.it/en/prodotti/tropicalia-4/) identifies Patricia Urquiola and 2008, describes multicoloured polymer cord on a steel frame, and lists a 3D-model download. The linked `Tropicalia_daybed_3D.zip` request returned HTTP 403 with a Cloudflare challenge on 2 November 2026. No challenge was bypassed, no archive was downloaded, and its contents/format/size remain unverified.

A manufacturer asset remains the preferred replacement when access and reuse are established. No assertion of official model fidelity is made for this pass.

## Reference treatment

- Armchair: angular back and side geometry, metal sled frame, multicoloured crossed seat/back cords, woven arm panels. Uses R10/R11 and weave detail R01.
- Low chair: wider seat, lower seating position, open sides and rainbow seat/back weave. Uses R12.
- Day bed: an open-front half-dome with ribs, coloured cord bands, a lower woven basket, green mattress and three contrasting cushions. Uses R09.
- Hanging cocoon: open-front woven form, coloured horizontal bands and cushions, suspended from a separate freestanding frame. Uses R13–R18. The support frame is a project concept, not a Moroso product or engineered suspension design.
- Circular workshop table: a separate generic table study; it is not represented as a Tropicália product.

All pieces face local +Z, rest on local ground Y=0, and use provisional metre units. Approximate dimensions: armchair 0.94 m wide × 0.85 m deep × 1.03 m high; low chair 1.08 × 0.93 × 0.88 m; day bed 2.30 × 2.03 × 1.75 m; cocoon/frame 2.08 × 1.30 × 3.02 m; table 1.14 m diameter × 0.74 m high. Actual dimensions, quantities and the purchased inventory remain to be reconciled.

## Implementation

`lab/furnishings.mjs` exports `createFurnishings(THREE)`. The factory supplies `chair({low=false})`, `daybed()`, `hangingSeat()` and `table()`, each returning a Three.js Group. Clones share prototype geometry and materials. Cord segments are merged into vertex-coloured meshes: two meshes per chair, three per day bed, four per cocoon/frame, one per table. This avoids a draw call for every individual strand.

The woven mesh and cushions improve the first spatial prototype. This pass is not the final photorealistic material treatment. Rope microtexture, fabric detail, manufacturer dimensions and a more accurate cocoon silhouette remain refinement tasks.

## Verification

Node module syntax and instantiation passed against the repository's Three.js module. All positions are finite, every group rests at Y=0, and duplicate chairs share geometry. Triangle counts are 1,980 per armchair, 1,580 per low chair, 17,612 per day bed, 22,464 per cocoon/frame and 272 per table. A hidden Chromium process with `--mute-audio` rendered the collection without JavaScript errors; no media or native fullscreen was started.
