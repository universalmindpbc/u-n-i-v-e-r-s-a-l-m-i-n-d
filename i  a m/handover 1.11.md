# Handover 1.11

## Project Context

Workspace:

`/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/universal light`

Primary working folder:

`i  a m/`

Primary page:

`i  a m/globe.html`

Preferred design source:

`i  a m/globe-f.html`, `i  a m/globe-f.css`, `i  a m/globe-f.js`

Current local preview:

`http://127.0.0.1:8018/globe.html?checkin=7`

The local Python HTTP server was running from:

`/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/universal light/i  a m`

## Important User Preference

Ben is giving exact art direction. Follow the literal brief and screenshot references. Do not reinterpret into a new design language unless explicitly asked.

When Ben says a spacing, title, visual source, animation reference, or treatment is exact, treat it as a locked instruction.

Avoid “close enough.”

## Metadata Title

The metadata/browser title must visually read as:

`VOGUE  / /  I AM`

The intended spacing is:

- `VOGUE`
- two spaces
- `/`
- one space
- `/`
- two spaces
- `I AM`

Because browser tab titles collapse normal spaces, the current implementation uses non-breaking spaces for only the two outer gaps:

```html
<title>VOGUE&nbsp;&nbsp;/ /&nbsp;&nbsp;I AM</title>
```

This is currently applied in:

- `i  a m/index.html`
- `i  a m/globe.html`
- `i  a m/globe-f.html`

Verified decoded character codes:

`86,79,71,85,69,160,160,47,32,47,160,160,73,32,65,77`

Do not change this without explicit instruction.

## Current Form Flow

The live check-in state machine is in:

`i  a m/globe-f.js`

The form markup is in both:

- `i  a m/globe.html`
- `i  a m/globe-f.html`

Current states:

1. Idle: `I am...`
2. Focus prompt: `How are you feeling?`
3. Typing: fixed prefix `I am` plus typed response
4. Confirmation: `✓ Thank you.`
5. Processing: `Joining the global check in...`
6. Reflection: completed phrase in globe center
7. Integration into globe node, then idle, then home redirect

Current typography:

- State 1 remains original italic bold treatment.
- States 2-5: Helvetica Neue, 21px, weight 300.
- State 6: Helvetica Neue, 34px, weight 300.

Ben approved the font sizes/weights after iteration.

## Current Timing

Current timing constants in `globe-f.js`:

```js
const iamTiming = {
  textFade: 240,
  focusPause: 120,
  thankYouHold: 1700,
  joiningHold: 2250,
  transferDuration: 2600,
  reflectionFadeIn: 1760,
  reflectionHold: 5000,
  reflectionDissolve: 920,
  integrationHold: 1800,
  homeRedirectDelay: 3000,
};
```

Ben said the timing is now mostly ok, except States 4 and 5 had felt too snappy before the latest increase. These were increased to:

- State 4 hold: `1700ms`
- State 5 hold: `2250ms`

State 6 holds for `5000ms`, then dissolves.

After the post-integration idle moment, page redirects to `index.html` after `3000ms`.

## Animation Issue To Fix Next

The current particle transfer is only a rough sketch and Ben rated it about `3/10`.

Current implementation uses DOM spans:

- `div[data-iam-transfer]`
- `.iam-transfer-particle`
- `runPhraseTransfer(phrase)` in `globe-f.js`

This currently feels like separate glued-together pieces:

`pill > particles > hero text`

Ben wants one evolving transformation:

`typed phrase in pill`
`-> phrase dissolves into dense particles`
`-> particles coalesce into a rich spiralling DNA/flora ribbon`
`-> ribbon dissolves into simpler State 6 text on the globe`

The current DOM particle approach should probably be replaced with a canvas overlay.

## Desired Next Animation Direction

Use a canvas-based particle system for State 3 through State 6 transition.

Choreography:

1. User types phrase in pill, e.g. `I am happy`.
2. On Enter, capture the visual phrase position before changing pill text.
3. State 4 pill text becomes `✓ Thank you.`
4. Simultaneously, the captured phrase begins dissolving from the pill position into particles.
5. State 5 pill text becomes `Joining the global check in...`
6. Particles continue evolving into a dense, flowing DNA/flora ribbon over the globe.
7. Particle ribbon begins forming the rough silhouette of the completed phrase at the globe center.
8. Clean State 6 text fades in through the particle cloud.
9. Particles dissolve away, leaving the final phrase.

The pill layer and particle layer should be conceptually separate:

- Pill layer: reassurance/status copy.
- Particle layer: the citizen sentence transforming into symbolic globe matter.

This avoids conflict between `Thank you.`, `Joining...`, and the transforming user phrase.

## Visual References

Ben provided screenshots from animation references:

- `/Users/benkorbel/Desktop/Screenshot 2026-07-01 at 4.46.53 pm.png`
- `/Users/benkorbel/Desktop/Screenshot 2026-07-01 at 4.46.30 pm.png`

External references:

- `https://www.vecteezy.com/video/71589995-futuristic-animation-featuring-a-flowing-stream-of-white-particles-that-form-a-dynamic-wave-like-dna-helix-on-a-blue-and-purple-gradient-background`
- `https://www.vecteezy.com/video/12348186-dna-molecule-rotates-on-a-blue-background-looped-seamless-animation`

Reference qualities:

- Dense particle field, hundreds or low thousands of particles.
- White/cyan dominant.
- Fine dust and brighter nodes.
- Flowing wave-like DNA helix.
- Rich, organic, not a sparse dotted line.
- Premium and cinematic, not sci-fi gimmicky.

## Flora / Logo Treatment

Current State 6 uses the Universal Mind PNG beside the hero phrase.

Ben suggested that the flora should perhaps be represented as particles rather than a PNG.

Preferred direction:

- Mostly white/cyan particle field.
- Sparse Universal Mind flora palette accents: soft yellow, pink, green, pale blue.
- The flora can bloom as particles near the final phrase.
- Avoid confetti.
- Avoid making the PNG feel glued on.

## Animation Style Rules

Important correction from previous iteration:

No vertical up/down movement for form text or hero text.

Approved:

- Typewriter.
- Fade in place.
- Particle motion as symbolic material.

Not approved:

- Text moving up/down into place.
- Translate/scale entrance for State 6 text.
- Sparse dot trail.
- A separate-looking animation glued between two text states.

Current CSS already removed the tacky up/down text motion:

- `.iam-display-text` transition: opacity only.
- `.iam-fixed-prefix` transition: opacity only.
- `.iam-input` transition: opacity only.
- `.iam-hero-reflection` transition: opacity only.

Keep that.

## Implementation Recommendation

Replace `runPhraseTransfer(phrase)` with a canvas overlay system.

Suggested approach:

- Add or reuse a full-screen canvas in `.iam-transfer-field`.
- On submit, sample the typed phrase location from `.iam-control-text`.
- Generate particles from the phrase area.
- Animate particles through phases:
  - `dissolve`
  - `helix`
  - `coalesce`
  - `resolve`
- Draw text silhouette target using an offscreen canvas.
- Particles should gradually target points sampled from the final phrase text.
- Clean DOM State 6 text should fade in only near the end of the coalesce phase.

Potential phase timings:

- Dissolve from pill: 1200-1600ms.
- Rich helix / integration: 2200-3000ms.
- Coalesce toward phrase: 1800-2400ms.
- Clean text fade-through: 1760ms.
- State 6 hold after resolved: 5000ms.

Keep the existing State 4/5 pill messages visible while the particle layer runs.

## Files Likely To Edit

Main files:

- `i  a m/globe-f.js`
- `i  a m/globe-f.css`
- `i  a m/globe.html`
- `i  a m/globe-f.html`

Avoid touching older variants unless explicitly asked:

- `globe-b.html/js/css`
- `globe-c.html/js/css`
- `globe-d.html/js/css`
- `globe-e.html/js/css`

## Current Verification Status

Last verified:

- JS syntax check passed with bundled Node:
  `/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check 'i  a m/globe-f.js'`
- Browser loaded `globe-f.css?v=live-checkin-7`.
- Browser loaded `globe-f.js?v=live-checkin-7`.
- State 6 computed style:
  - `font-size: 34px`
  - `font-weight: 300`
  - transition: `opacity`
- No console errors.

## Important Caution

The latest assistant had begun to wobble with context. Start from this document as the source of truth, then inspect the actual files before editing.

Do not keep explaining the approach instead of implementing it. Ben has approved the canvas-particle direction and asked to proceed in a new chat.

