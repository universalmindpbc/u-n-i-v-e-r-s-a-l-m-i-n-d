# Universal Mind Lab tour focus verification — 3 November 2026

Source commit: `56c94d836`  
Proof route: https://staging.universalmind.tv/lab/

## Scope

- Floating destination labels appear for five seconds in the completed wide overview and then disappear.
- Labels stay hidden during guided tours, destination close-ups, the continuous camera circuit and the final biofeedback scene. Opening or closing the biofeedback panel does not restore them.
- Desktop Reset and Labels can briefly show the guide in the wide overview. Camera interaction dismisses it.
- The main pavilion camera looks from the front under the arch at the crowd and four band roles, following Ben's supplied screenshot. The right-hand destination card and desktop navigation remain available.
- The previously approved About update, compact controls, mobile lineup and continuous ground-level circuit remain in this staged candidate. See the adjacent continuous-circuit record.

## Verification

- Live checks passed at 1440×900 and 393×647 in a dedicated hidden Playwright Chromium process with `--mute-audio` positively confirmed. No native fullscreen action was invoked.
- The automatic timeline was checked at 30, 31, 34, 36, 39, 45, 50, 55, 60, 65, 70, 90 and 151 seconds. Labels are visible only at 31 and 34 seconds in that sample.
- All seven destination close-ups hide floating labels and retain the information card when explicitly opened. Desktop navigation remains visible.
- Final desktop overview opens the biofeedback panel with labels hidden. Reset, keyboard camera interaction, five-second expiry and biofeedback open/close behaviour passed.
- Manual Tour reaches the main pavilion with the camera at [0, 3.2, 12], targeting [2.5, 2, -12]. The artist lineup fades out and the miniature labels remain hidden. The settled screenshot was visually checked.
- The approved About opening is present. No page errors were recorded.
- Live index.html and lab.mjs returned HTTP 200 and matched the source hashes. See live-source.json.
- This focused layout test stubs media and advances the story clock. CSS fades are allowed to finish on the separate compositor clock. Real playback was verified separately in the continuous-circuit release; this patch changes neither media assets nor playback logic.
- Automated media elements were paused and every test context/browser was closed. Verification covers Chromium phone and desktop viewports, not native iPhone Safari.

## Deployment

The exact source commit was deployed with `./deploy-panthur-staging.sh lab`. The manifest and this evidence record document the staging release. Production has not been modified.
