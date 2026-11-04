# Lab cleanup verification — 5 November 2026

Source candidate: `44721c3bf`.

Result: the Panthur staging deployment completed successfully. All five viewport cases passed locally and on staging. The desktop and mobile Portal journeys reported no page errors or preview-module requests. All three changed live files matched the candidate hashes.

Scope: remove the flat-image realistic-preview interface and its module; center and reduce the mobile initiative, disclaimer and impact text; hide the mobile research link. New EMDR lookbook characters remain review proposals and are not implemented in 3D.

## Checks

- JavaScript syntax, existing Lab source preflight, Portal geometry checks and Git whitespace checks passed.
- The dedicated Playwright Chromium process asserts `--mute-audio` in its actual launch arguments before navigation. Media playback is additionally stubbed; HLS requests are blocked. Native fullscreen entry is disabled for these checks.
- Desktop widths: 1440px and 1024px. Touch/mobile widths: 393px, 320px and 900px.
- Footer sizes, mobile centering, viewport bounds, mobile research-link removal and absence of horizontal overflow are asserted.
- The About → I Am Portal → EMDR journey is exercised at desktop and mobile viewport sizes. Removed preview controls and requests are absent; page errors are checked.
- Live verification compares the deployed HTML, CSS and JavaScript bytes against the committed source, ignoring only the host-injected analytics script in HTML. The QA harness instruments the story timeline to reach the assembled scene without waiting through the full sequence.

`local/verification.json` and `live/verification.json` contain the results; selected live screenshots retain visual evidence. These checks establish layout and navigation in Chromium viewport emulation. They do not establish physical-phone performance, subjective audio quality, or the anatomy of the existing experimental 3D cast.

Publishing uses only `./deploy-panthur-staging.sh lab`. Production is outside this release scope.
