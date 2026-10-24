# Quantum Lab staging release — 25 October 2026

Quantum Lab follows Transcription Atlas in the shared navigation. It provides a bounded two-neutral-atom experiment, an independently checked browser solver, a simulated-time visualisation, the recorded GPU comparison, a dated Aquila API status, a teachable workflow, biological-method guidance and five primary research cards.

Scientists can create simulations, rerun with new IDs, retain local history, import parameters, export full run records and figures, and prepare a local hardware review file. The cloud access register distinguishes verified research submissions from activated website connections.

## Access decision

Universal Informatics funds approved researchers within individual budgets. See GATEWAY.md for the activation contract. Hardware submission, researcher sign-in, budget administration and shared server storage are pending. No live GPU or QPU job is submitted by this website release.

## Validation

- Independent SciPy DOP853 comparison over 25 baseline and boundary cases: maximum probability difference below 2.6e-9.
- Browser checks at 1470×956, 1024×768, 390×844 and 320×844: parameter changes, distinct reruns, deterministic reproduced probabilities, import/export, SVG figure download, persistent local history, history removal, rejected invalid model import and local-only hardware request.
- Embedded navigation order, area switching, focus, keyboard Escape and no horizontal overflow checked.
- Separate Chromium process with --mute-audio; no native fullscreen; automated contexts closed after testing.
- API refresh of the existing Aquila task: QUEUED, position 456 at 2026-10-24 18:18:38 UTC. No new hardware submission.
- No account identifiers, credentials or private provider task ARNs are included in public experiment data.

Production remains unchanged. Staging deployment and live evidence are recorded alongside this file after publication.
