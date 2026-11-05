# EMDR character study — 4 November 2026

An isolated visual experiment for the EMDR tent. Nine youth participants (18–24) and one facilitator use textured skinned meshes, mixed sportswear, varied hair and relaxed seating. Six participants have fitted research-headset representations. No handheld phones or long dresses are present. Other festival and Portal figures retain their existing style pending review.

## Festival cast — 5 November 2026

The initial festival pass followed 22 wardrobe options. Looks 01–09 sit in the EMDR workshop. Thirteen more detailed guests wear the three swim-and-denim outfits, three boxing-short colourways, river-to-arena look and six Defence looks. Seventy additional visitors across the pavilion and grounds share 16 civilian wardrobe meshes with varied height, orientation, spacing and motion. The arena movement pass expands this set below.

The wardrobe brief references THE UPSIDE and Nagnata for yoga, and vintage Levi’s 501 cut-offs and Ksubi for denim. Garments, faces, the In This World emblem and uniforms are interpretations for this spatial concept. The aircrew carries a helmet and the river-to-arena dancer has fine-line arm artwork. A sports bra or swim top and visible hands are modelled as part of each applicable outfit.

### Arena movement and runway shows

The expanded scene has 101 instanced festival visitors, 24 walking visitors across eight paths and ten diners and listeners fitted to existing seats. Six Portal rooms share a posed lookbook library for their nine participants and facilitator. EMDR retains its ten detailed characters and fitted headsets. Audience movement, runway walking and workshop gestures follow the scene clock and respect reduced motion.

The runway proposal is First Nations-led with AIME. Billie-Jean Hamlet and Cindy Rostron are casting references. Both shows use fictional models and original concept garments. Design references are [Iris van Herpen’s Seijaku](https://www.irisvanherpen.com/collections/seijaku/the-inspiration-8) and [Nagnata’s Movement 13 Core](https://nagnata.com/pages/movement-013-core). Each show carries eight looks. The second wardrobe loads when selected.

To regenerate the workshop and runway packs, copy the two festival TypeScript files, `festival-distance.mjs` and the runtime `lab/character-motion.mjs` into the pinned generator’s `scripts` directory. Supply an existing festival asset directory as the second baker argument. The walk and runway source GLBs are intermediate files.

```sh
node --import tsx scripts/festival-cast.ts /tmp/festival-show iris-{0..7} nagnata-{0..7}
node scripts/festival-distance.mjs /tmp/festival-show /path/to/lab/assets/festival iris
node scripts/festival-distance.mjs /tmp/festival-show /path/to/lab/assets/festival nagnata
node --import tsx scripts/festival-cast.ts /tmp/festival-walk 01 04 06 09 A D2 --walk
node scripts/festival-distance.mjs /tmp/festival-walk /path/to/lab/assets/festival walkers
node scripts/festival-distance.mjs /tmp/festival-walk /path/to/lab/assets/festival workshops
```

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
