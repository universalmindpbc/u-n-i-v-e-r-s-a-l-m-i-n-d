# Articulated crowd study

Date: 2 November 2026.

`lab/crowd.mjs` supplies fictional people for the interactive site story. These are efficient geometric studies for spatial scale, activity and programme presentation. They are not portraits, scanned people, a staffing plan or a photorealistic character collection.

## Interface

```js
const crowd = createCrowd(THREE);
scene.add(crowd.builders, crowd.visitors);
crowd.builders.visible = constructionStage;
crowd.visitors.visible = programmeStage;
crowd.update(timeInSeconds, {
  construction: constructionProgress, // normalised 0–1
  dancing: musicIsPlaying,
  visible: experienceIsVisible,
  night: nightBlend                  // normalised 0–1
});
```

`builders` and `visitors` are separate Three.js Groups. Their positions are already in site world coordinates. Keep both groups at the scene origin. The parent owns each group's visibility; `update` never changes it. The `visible` option gates animation work. Hidden groups skip their animation updates. The parent can hide both groups when the whole experience is hidden.

Builder movement runs while construction lies strictly between zero and one. It stops at either endpoint. Visitors move only when `dancing` is true. A final static pose is applied when active movement ends; later static frames skip matrix work. Night blends wristband emission from zero to 1.3.

## Placement and motion

- 12 builders work near the main vault, food pavilion, play pavilion, support facilities and listening area. Their three action families carry paired timber pieces, bend and raise a hammer, or lift a small component. Walking uses articulated knees, alternating feet and a short local route.
- 70 visitors include 56 around the main floor, within approximately X ±6 m and Z −16 to −7 m. Another 14 stand near listening, food and lawn gathering areas.
- Visitor movement includes small torso sway, knee movement, wrist and elbow gestures, and a restrained vertical pulse. It follows the parent's musical activity flag; there is no microphone, automatic audio analysis or medical interpretation.
- Deterministic variation sets stature, skin tone, clothing, hair colour, hair volume, pose phase and heading. Colours and actions are assigned independently. No real person's likeness, identity, demographic role or protected characteristic is inferred.

The underlying reference stature is approximately 1.6–1.9 m. Nominal ground is Y=0. Hair and footwear alter exact bounds slightly. Figures include heads, noses, hair, torsos, necks, arms, hands, hips, thighs, lower legs, shoes and wristbands. Builders also have helmets and tool/material props. Construction choreography is illustrative; no engineering or on-site working method is represented.

## Rendering and verification

The collection uses 14 InstancedMesh draw calls across both visible groups: six for visitors and eight for builders. Six small shared geometry types and two materials supply all parts. Individual skin, clothing and accessory colours use instance colours. No external asset, network dependency or texture download is needed.

Module syntax, deterministic placements, finite animated transform matrices, update skipping when static or hidden, and preservation of independent group visibility were checked against the repository Three.js module. A separate hidden Chromium process launched with `--mute-audio` rendered builder and visitor views without JavaScript errors. No media was played and native fullscreen was not invoked.

## Central fashion runway

The optional `createRunwayCrowd(THREE)` export returns a separate `{group, update}` collection. It leaves the original builder/visitor interface intact.

```js
const runwayCrowd = createRunwayCrowd(THREE);
scene.add(runwayCrowd.group);
runwayCrowd.group.visible = programmeStage;
runwayCrowd.update(motionTimeInSeconds, {
  moving: fashionProgrammeActive,
  visible: experienceIsVisible
});
```

Eight tall, slender fictional figures walk a continuous rounded loop. The centreline runs at X ±0.75 m on the straight portions and turns within Z 8–38 m. Garments and limbs fit approximately within the requested X ±1.1 m runway corridor. Models travel at 0.77 m/s with individual gait phases, alternating feet, knees, arms and a small garment sway. Their nominal standing height is approximately 1.87–2.0 m.

The original colour pairings, pleated drapes, asymmetric hems and diagonal garment accents are concept treatments. They do not reproduce a named collection, celebrity likeness or asserted cultural dress. The intended Indigenous fashion collaboration remains a programme direction; participating designers can replace these visual studies with their own approved work.

The runway uses six additional instanced draw calls and 160 rendered part instances. Pausing leaves the last pose in place. The parent retains ownership of group visibility and motion time; hidden or paused states skip transforms. Checks covered finite matrices across more than two complete loops, route bounds, deterministic initial placement, pause/visibility behaviour and preservation of the original API. A process-muted hidden Chromium render completed without JavaScript errors.
