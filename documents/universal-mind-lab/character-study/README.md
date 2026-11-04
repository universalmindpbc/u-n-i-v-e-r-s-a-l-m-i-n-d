# EMDR character study — 4 November 2026

An isolated visual experiment for the EMDR tent. Nine youth participants (18–24) and one facilitator use textured skinned meshes, mixed sportswear, varied hair and relaxed seating. Six participants have fitted research-headset representations. No handheld phones or long dresses are present. Other festival and Portal figures retain their existing style pending review.

## Festival cast — 5 November 2026

The current festival pass follows 22 wardrobe options. Looks 01–09 sit in the EMDR workshop. Thirteen more detailed guests wear the three swim-and-denim outfits, three boxing-short colourways, river-to-arena look and six Defence looks. Seventy additional visitors across the pavilion and grounds share 16 civilian wardrobe meshes with varied height, orientation, spacing and motion. The rest of the workshops, performers and runway models use the earlier assets.

The wardrobe brief references THE UPSIDE and Nagnata for yoga, and vintage Levi’s 501 cut-offs and Ksubi for denim. Garments, faces, the In This World emblem and uniforms are interpretations for this spatial concept. The aircrew carries a helmet and the river-to-arena dancer has fine-line arm artwork. A sports bra or swim top and visible hands are modelled as part of each applicable outfit.

To reproduce, copy `festival-cast.ts`, `festival-garments.ts` and `festival-distance.mjs` into the pinned generator’s `scripts/` directory. Run the following with paths appropriate to the checkout.

```sh
node --import tsx scripts/festival-cast.ts /absolute/path/to/lab/assets/festival
node --import tsx scripts/festival-cast.ts /absolute/path/to/temporary-standing 01 02 03 04 05 06 07 08 09 --standing
node scripts/festival-distance.mjs /absolute/path/to/temporary-standing /absolute/path/to/lab/assets/festival
```

## Sources and reproduction

- Generator: [Ara 3D Gen](https://github.com/olatunde85/3d-gen), pinned to `a4947ffdd14acf2ff018cb3568c941595f86d86e`.
- Source code: MIT; character data: MakeHuman CC0. The original notices accompany this record.
- The animation is the procedural eight-second breathing/head/arm pose authored in `emdr-study.ts`. It does not use the optional CMU motion-capture clips described in the upstream asset notice.
- Install the pinned repository's dependencies, run its documented asset setup, and place this script in its `scripts/` directory. Run `node --import tsx scripts/emdr-study.ts /absolute/path/to/lab/assets/emdr` from that repository. Node 20 or later is required.
- `lab/assets/emdr/manifest.json` records every character's source parameters, pose, mesh size and rig. Textures are capped at 512 pixels; animation is baked at 12 samples per second and interpolated by Three.js.
- The site's existing Three.js r165 runtime loads local GLB files using matching official `GLTFLoader.js` and `BufferGeometryUtils.js`; its existing Three.js MIT notice remains included.

## Review criteria and limits

Compare the EMDR view in day and night with the supplied photo: varied soft seating, believable anatomy, youth festival sportswear, relaxed posture and a facilitator. The first experiment is a step beyond the geometric figures, not a completed photorealistic scene. Clothing, headset fit, floor seating and lighting remain visual review items. Skin and hair parameters are appearance choices, not claims about any character's cultural identity.

A lookbook can establish outfits, faces and casting direction. ImageGen stills alone do not produce a reusable rigged character: the interactive site needs meshes, textures, skeletons and animation. Approve this small 3D group before extending its asset pipeline across the entire site.

The ten models total approximately 34 MB and load with two concurrent requests when the Portal becomes visible. Mobile-device GPU and memory performance still needs physical-device review; Chromium viewport checks do not establish iPhone performance.
