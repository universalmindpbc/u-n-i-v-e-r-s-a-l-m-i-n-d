# Mobile interface, launch and youth wording — staging release

Verified on 3 November 2026 (Australia/Sydney).

## Recorded source

- Baseline staging: `65aa57a6a7fef9fbc01f59a6b720ba3aaa188bf8`.
- Mobile controls, tap-based launch and youth wording: `ff21fb6fb`.
- Hidden landing animation pause: `55d53f382`.
- Published with the existing Panthur staging script, using its `informatics`, `lab` and `events` scopes.
- Production was not modified. The production branch remained `d5e3499af7533a3c87cef794aa028f33194656f8` during verification.

## Result

Phones omit the place-navigation strip, view toolbar and floating area labels. Essential controls use drawn SVG icons, with Motion, Lineup and supported fullscreen controls in settings. The landscape remains visible throughout the automatic tour; support and biofeedback actions remain accessible. Desktop navigation is retained, with footer spacing corrected.

Events prepares the Lab without starting media. The Lab choice starts music and the 7% video overlay synchronously in the original tap, before any remaining scene loading. Safari uses native inline HLS. There is no second landing page. Hidden landing animations stop during the Lab experience; Back returns to Events and stops Lab audio.

Research headings use Youth and state the Lab audience as 16–24. Publication titles and reported participant ages remain intact. The startup fix preserves deep-link queries when cached data resolves before the frame bridge.

Ben's permanent preference for designed interface icons, with no emoji controls, is saved in the Codex memory update folder. The brief is version 0.16.

## Verification

- Live layouts at 320 × 668, 390 × 844, 430 × 932, 844 × 390 and 1440 × 1000: responsive visibility, touch targets, settings, automatic tour, lineup, biofeedback, support and proposal.
- Real homepage login → Events → Lab: one mobile tap, active browser gesture, decoded video frames and audio bytes, advancing playback, 65% initial volume, 7% overlay, no retry notice. Music pause/resume and Back verified.
- Events → A Thousand Minds → Events → Lab → Back, plus repeated visits, preserve the session and persistent shell. Invitation protection and exact dissolving stigma wording verified.
- All 12 youth destinations have the correct visible title and exact publication set. The full collection retains 105 unique publications. Citation dialogs, reloads, Back, topic switching, wider search and normal Sound chapters verified.
- Live source hashes match the committed assets; startup-script hashes are recorded separately.
- Code syntax, Lab source checks, portal navigation, Informatics discovery and export checks passed.
- All browser processes were isolated Chromium with process-level `--mute-audio`. Native fullscreen was disabled. Media pages were paused and closed after verification.

Physical iPhone Safari and subjective sound quality were not tested. The mobile playback check uses a touch viewport and rejects main-media playback requests without an active user gesture. Device settings may still require the Music control to resume playback.

## Evidence and proof

- `qa/mobile-ui/verification.json`
- `qa/mobile-tap-playback/verification.json`
- `qa/mobile-launch-events/verification.json`
- `qa/youth-mobile-destinations/verification.json`
- `qa/youth-mobile-destinations/startup-source.json`

Start the visitor journey at https://staging.universalmind.tv/events/?experience=1 and choose Universal Mind Lab.
Research overview: https://staging.universalmind.tv/lab/research.html

Production requires Ben's explicit release instruction after staging proof.
