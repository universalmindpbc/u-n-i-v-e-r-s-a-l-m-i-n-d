# Technology Citizen Needs - Handover - 2026-07-02

## Workspace

- Root: `/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/universal light`
- Page: `/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/universal light/i  a m/technology-citizen-needs.html`
- CSS: `/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/universal light/i  a m/technology-citizen-needs.css`
- JS: `/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/universal light/i  a m/technology-citizen-needs.js`
- Server: `/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/universal light/i  a m/technology-citizen-needs-server.mjs`
- Current preview target: `http://127.0.0.1:8126/technology-citizen-needs.html?v=vector-11`
- Ground-truth reference: `/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/universal light/i  a m/a s s e t s/Citizen Needs - Populated Radar - Diagram.png`

## User Priority

Ben is blocked and frustrated by the label layout. The next thread must not keep doing tiny blind polar-coordinate tweaks.

Immediate priority:

- No overlapping text.
- No bunched text.
- No labels hitting wedge borders.
- Spread labels organically like a scatter plot.
- Use empty space.
- If needed, hide or disable the white outer trace until text layout is solved.
- Build or expose a drag/manual text placement interface if code placement is not reliably solving it.

## Signed Off / Preserve Unless Explicitly Changed

- Six equal 60-degree sectors.
- Curved outside domain titles.
- General wheel/cube/node visual direction.
- Wheel centered in viewport with `.radar-frame { left: 50%; top: 50%; }`.
- Bottom instruction copy has been removed.

## Current State

The current implementation is `vector-11`.

Recent changes:

- Outer white trace is hidden via:
  `.trace-layer { display: none; }`
- The wheel is centered.
- Additional labels were added:
  - Cognitive: `Clarify`
  - Emotional: `Love`, `Awe`, `Purpose`, `Self-actualisation`
  - Social: `Self-transcendence`
- New labels were also added to `allowedHighlights` in `technology-citizen-needs-server.mjs`.

Known problem:

- Label placement is still unacceptable. It is worse in some screenshots.
- Emotional and Social are visibly crowded.
- Text placement is not robust enough.

## Current Domain Data

Labels are in `technology-citizen-needs.js` under `const domains`.

Current label objects use:

```js
{ text: "Label", angle: 0, radius: 400 }
```

For multi-line labels:

```js
{ text: ["Psychological", "Safety"], angle: 84, radius: 394 }
```

Current render code computes:

```js
const point = polar(item.angle, item.radius);
```

Then sets `x` and `y` on the `<text>` plus each `<tspan>`.

## Recommended Next Move

Do not keep manually guessing `angle` and `radius` only.

Implement a manual layout layer:

1. Extend labels to accept explicit pixel nudges:

```js
{ text: "Joy", angle: -24, radius: 452, dx: 0, dy: 0 }
```

2. Render labels at:

```js
const x = point.x + (item.dx || 0);
const y = point.y + (item.dy || 0);
```

3. Make `.need-label` draggable in the SVG while a layout/edit mode is enabled.

4. On drag, update `dx/dy` in memory and expose a copyable JSON/JS block of final offsets.

5. Add a simple debug overlay or console output:

```js
console.table(labels.map(({ text, angle, radius, dx, dy }) => ...))
```

This lets Ben push pixels directly rather than waiting through repeated failed coordinate guesses.

## Better Text Layout Strategy

Use scatter-style manual zones per domain:

- Outer band: main domain needs.
- Mid band: added secondary needs.
- Inner band: abstract/high-order needs.
- Labels should not be perfectly aligned into rows if that causes bunching.
- Long labels need their own pockets and should often be multi-line.
- Text should be placed first. Network traces adapt to text, not the other way around.

For Emotional:

- Outer: Joy, Calm, Hope, Curiosity, Gratitude.
- Mid: Love, Awe, Purpose.
- Inner: Self-actualisation.

For Social:

- Outer/mid: Trust, Belonging, Connection, Empathy, Psychological Safety.
- Inner: Self-transcendence.

For Cognitive:

- Outer/mid: Attention, Mental Load, Rumination, Motivation, Executive Function.
- Inner: Clarify.

For Clinical Risk:

- Use all available wedge height.
- Avoidance can sit closer to centre.
- Do not stack Startle Sensitivity, Sleep Disturbance, Emotional Numbing too tightly.

For Threat:

- Loneliness must not bleed into the neighboring 60-degree sector.

## Node / Trace Rule

The white node trace should be subordinate to text legibility.

Preferred future behavior:

- When a domain is active, fade/dissolve the white outer trace strongly or hide it if it interferes.
- Once GPT inference is wired, show the four inferred qualities as a separate network across the wheel.
- The inferred network should be generated after labels are placed and must avoid label bounding boxes.
- Text is a hard exclusion zone. Trace points may move, fade, split, or snap. Text does not move for the trace.

Algorithm:

1. Render active labels.
2. Measure each label with `getBBox()`.
3. Inflate each box by a padding value, e.g. `10-16px`.
4. Place inferred nodes in available sector zones.
5. If a node or segment intersects a label box:
   - Move radially first.
   - Then move angularly toward open space.
   - Then fade/split the segment behind the text.
6. Never draw a node or bright segment over text.

## HTML Title Fix Still Needed

Ben clarified the browser title should be:

```html
<title>Citizen Needs | Inference Engine</title>
```

Not:

```html
<title>Citizen Needs / Inference Engine</title>
```

This is the browser/tab title only, not necessarily visible page copy.

## Tone / Collaboration Note

Ben is angry because repeated text layout attempts made the page worse. The next agent should acknowledge this plainly, avoid defensiveness, and implement a deterministic drag/manual label placement workflow before further aesthetic guessing.
