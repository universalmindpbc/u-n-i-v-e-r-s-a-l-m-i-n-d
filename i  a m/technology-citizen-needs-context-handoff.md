# Technology Citizen Needs - Context Handoff

## Current Surface

- Workspace: `/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/universal light`
- Page: `/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/universal light/i  a m/technology-citizen-needs.html`
- Local preview: `http://127.0.0.1:8126/technology-citizen-needs.html?v=vector-6`
- Ground-truth radar reference: `/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/universal light/i  a m/a s s e t s/Citizen Needs - Populated Radar - Diagram.png`

## User Direction

Ben wants this to feel futuristic, minimal, elegant, avant garde, and plausibly Apple-adjacent. The priority is aesthetic fidelity and hover/rollover behavior before any GPT wiring, forms, or inference plumbing.

The existing populated radar should be used as the ground truth for visual logic, not copied as a JPEG. The radar is being recreated in code as SVG/CSS/JS.

## Signed Off / Do Not Touch Unless Explicitly Unlocked

- Six equal 60-degree domain sectors.
- Curved domain titles outside the circle.
- Current domain title placement and title arc system.
- Circle, cube, node, and core geometry.
- The overall radar/cube/node aesthetic direction.

Current signed-off domain geometry in `technology-citizen-needs.js`:

- Emotional: `start: -30`, `end: 30`
- Social: `start: 30`, `end: 90`
- Cognitive: `start: 90`, `end: 150`
- Physiological: `start: 150`, `end: 210`
- Clinical Risk: `start: 210`, `end: 270`
- Threat: `start: 270`, `end: 330`

## Current Next Task

Improve the smaller need/subtext labels only.

Ben's latest direction:

> next let's try increasing the weight of the subtext so it becomes much easier to read - using the populated radar as our ground truth for why ours isn't working yet and where we can resolve it.

Use the populated radar as the ground truth for why the current subtext is not working:

- Ground truth labels are bolder, brighter, and more materially readable.
- Current need labels are too light and break up against the moving/glowing trace and colored sector backgrounds.
- Improve legibility through font weight, contrast, stroke/halo, opacity, and possibly slight placement adjustment.
- Do not change the signed-off 60-degree sectors or curved outside titles while doing this.

Likely first surgical pass:

- Increase `.need-label` from `font-weight: 300` to a stronger weight.
- Increase active label fill opacity.
- Strengthen the dark text stroke subtly so labels hold against bright sectors.
- Keep the labels uppercase unless Ben asks otherwise.
- Verify in browser or by asking Ben for screenshots if browser automation is unavailable.

## Relevant Files

- `/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/universal light/i  a m/technology-citizen-needs.html`
- `/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/universal light/i  a m/technology-citizen-needs.css`
- `/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/universal light/i  a m/technology-citizen-needs.js`
- `/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/universal light/i  a m/technology-citizen-needs-server.mjs`

## Verification Notes

- Previous JS syntax check passed with the bundled Node runtime:
  `/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check 'i  a m/technology-citizen-needs.js'`
- Previous local HTTP check returned `200 OK` for:
  `http://127.0.0.1:8126/technology-citizen-needs.html?v=vector-6`

## Collaboration Notes

- Ben prefers exact execution of concrete visual direction.
- If an element is signed off, preserve it.
- If a design miss happens, own it plainly and correct the exact requested surface.
- Share verified HTTP preview links, not file URLs.
