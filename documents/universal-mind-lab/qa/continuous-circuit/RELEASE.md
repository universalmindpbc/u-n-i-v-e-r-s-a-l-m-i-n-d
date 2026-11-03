# Universal Mind Lab staging verification — 3 November 2026

Source commit: `5ad6e8307`  
Proof route: https://staging.universalmind.tv/lab/

## Scope

- About opens with the approved explanation of electronic music and fashion as mindfulness. The Apple Watch biofeedback paragraph sits in the existing Change your emotions. Change your world. section. The day programme, referral pathways, free access and dissolving stigma copy remain in place.
- Artist lineup remains visible during arrival, assembly and overview on mobile and desktop; it hides during the guided tour and continuous ground-level circuit, then returns.
- Compact controls retain Replay, About and fullscreen, with fullscreen hidden while active. Layout and 2D selectors are removed; graphics-failure fallback remains available.
- Navigation labels wrap in their own left-aligned column. Linfox truck replaces The clearing and opens the close truck view.
- The camera circuit uses one continuous constant-arc-length path at 2.6 scene units, with separate entry and exit transitions.
- The approved day/night typography, gold words, waveform, flower and lightning-bolt placement remain intact. Launch uses the 7% video blend.

## Verification

- Static stage checks and JavaScript syntax checks passed.
- Mathematical camera validation passed: 60-second circuit inside 72 seconds of entry/circuit/exit; sampled speed 4.983224–5.003952 scene units per second; maximum sampled turn 22.61647 degrees per second.
- Live responsive checks passed at 320×568, 393×647, 844×390 and 1440×1000. Checks cover About text/order/scrolling, navigation alignment, all four logos, timeline visibility, exact final overview, truck view, circuit path, removed controls and horizontal overflow. No page errors.
- Responsive tests stub media and use test-only time/camera inspection for deterministic layout verification. See verification.json.
- Separate real playback checks passed at 393×647 and 1440×1000 with no playback stubs. Explore starts real Cloudflare HLS decoding; all four videos have dimensions and advancing playback; Replay resumes playback; overlay blend is 0.07. See media-verification.json.
- All six deployed source files returned HTTP 200 and matched the committed SHA-256 values.
- Dedicated hidden Playwright Chromium ran with process-level --mute-audio. Native fullscreen was never invoked; fullscreen visibility used mocked DOM state. All automated media was paused and browser sessions closed.
- This verification covers Chromium at mobile and desktop viewports. It does not establish native iPhone Safari behaviour or subjective sound quality.

## Deployment boundary

The exact source commit was published through the existing `./deploy-panthur-staging.sh lab` workflow. This record and the deployment manifest document that staging release. Production has not been modified.
