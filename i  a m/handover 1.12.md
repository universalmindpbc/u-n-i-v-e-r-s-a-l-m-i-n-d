# Handover 1.12

Date: 2026-07-01

## Current Approved State

The selected live experience is now the canonical pair:

- `index.html`
- `styles.css`
- `script.js`
- `globe.html`
- `globe.css`
- `globe.js`

The local preview server has been running from `i  a m/` on:

- `http://127.0.0.1:8022/index.html`
- `http://127.0.0.1:8022/globe.html`

## Homepage

The homepage keeps the fullscreen Chanel runway background video and the panel grid / veil treatment.

The Vimeo hero video and its casing were removed from the homepage.

That removed design has been parked in:

- `featured-film.html`

The parked film page should remain available via global navigation later.

## Globe

The approved globe version is:

- `globe.html?reverted=1`

Important approved behavior:

- Globe sends directly to `index.html`.
- The attempted cinematic dissolve / fade-to-black transition was reverted.
- Do not reintroduce the fade-to-black transition.
- The final reflection uses the actual Universal Mind logo asset, not an interpreted particle redraw.

Logo asset used:

- `a s s e t s/Universal Mind [ I o H ] Logo.PNG`

Old A/B test globe variants were deleted to reduce future error:

- `globe-b.*`
- `globe-c.*`
- `globe-d.*`
- `globe-e.*`
- `globe-f.*`

## Next Task: Global Nav Lightbox

Ben wants the global nav finished next.

Use these screenshot references as the visual source of truth:

- `a s s e t s/r e f e r e n c e s/Global Nav Lightbox - Screen 4.png`
- `a s s e t s/r e f e r e n c e s/Global Nav Lightbox - Screen 5.png`

Relevant spec is also in:

- `i  a m.md`

Spec notes:

- Fullscreen lightbox menu opens over the homepage.
- The homepage remains visible beneath the overlay.
- The menu fades in rather than appearing abruptly.
- Typeface: Helvetica Neue.
- Main nav: Bold, approximately 42 pt.
- Default nav color: white.
- Hover / active color: yellow, using the second yellow from Apple Keynote.
- Supporting citation: Helvetica Neue Thin, approximately 17 pt.

Screenshot-derived details to preserve exactly:

- Dark fullscreen overlay over the existing homepage scene.
- UM logo and `universalmind / i am` lockup at top-left.
- Large left-aligned vertical menu with generous letter spacing.
- Menu items shown in screenshots:
  - problem
  - solution
  - demo
  - technology
  - globe
  - contact
- Active item is yellow.
- Screen 4 shows `problem` active.
- Screen 5 shows `technology` active.
- When `technology` is active, show the two indented subitems:
  - `citizen experience | ux`
  - `citizen algorithm | ai`
- Footer citation centered near the bottom:
  - `A Direct Response To Orygen + Phoenix Australia’s “The Next Post: Young people transitioning from military service and their mental health”`

Implementation guidance:

- Add the nav to `index.html` and probably `featured-film.html`, using the shared `styles.css` and `script.js`.
- Keep the overlay visually faithful to the screenshots.
- Do not add a visible close button if it is not present in the screenshot. Use Escape / backdrop / existing brand-trigger behavior if needed.
- The existing top-left brand can be the nav trigger, but avoid adding extra visible UI that is not in the reference.
- The `globe` menu item should point to `globe.html`.
- The parked film page should be reachable via global nav, likely from `problem`.
- The `citizen experience | ux` subitem can point to `technology-citizen-needs.html`.

## Important Working Preference

Ben is asking for literal execution from the supplied visual references. Do not reinterpret the layout or brand language. The screenshots are the brief.
