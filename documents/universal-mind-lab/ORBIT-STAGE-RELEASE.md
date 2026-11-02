# Events entry and festival circuit — staging release

Verified on 3 November 2026, Australia/Sydney.

Website source: `07172916472fae5148b0fcc59b67f9d3621c5130`, following `2de539868ed921642036be85d77c51bc319adb5d`.

## Visitor experience

- Events presents two typographic choices over the original Fibonacci rain, with a subtle dark scrim for readability. Poster graphics and card containers are removed.
- “Explore the festival pop-up” opens Universal Mind Lab directly with music and video at 24% opacity. The Events journey has one rain screen and no second Explore click. Direct standalone visits to `/lab/` retain their launch screen.
- The existing construction, sunset and numbered tour is followed by a continuous 24-second camera circuit. It approaches the runway and band, passes the Apple Music area and rear of the stage, shows the reverse video sides of the trailers, passes the playground, and returns to the wide view. Scene labels and editorial overlays disappear during the circuit and return afterwards. Manual navigation can interrupt it.
- Four articulated performers occupy the stage: a DJ, vocalist, guitarist and drummer. The 56 dance-floor visitors face the stage.
- The NSW Education flag stands left of the runway, opposite Vogue. A Lineup control toggles the artist treatment.
- Fullscreen status recognises the retained homepage shell. Automatic entry does not create a false error notice. An explicit unsuccessful fullscreen request has a transient notice.

## Deployment and verification

The exact committed source was published with `./deploy-panthur-staging.sh lab` and `./deploy-panthur-staging.sh events` through the existing Panthur workflow. No production deployment was run.

- Static checks passed for the Lab assets, reference hashes, DOM bindings, default blend and navigation contract.
- The real staging journey passed: invitation → homepage → Attend Events → both event choices, repeated immediate navigation, browser Back and Home return. The original root shell and invitation session persist.
- The Lab launched without another click, and the real video decoded with advancing playback and 24% opacity.
- Desktop, phone and landscape layouts were checked at 1440 × 1000, 390 × 844 and 844 × 390. The Events page has no poster images or horizontal overflow.
- Camera timing, completion, manual interruption, replay, reduced-motion handling, restored labels, Lineup controls, performer roles and crowd orientation passed.
- A simulated ancestor-owned fullscreen state produced no duplicate request or blank notice. Native fullscreen was never invoked.
- Served source hashes matched the candidate. Every Lab and Events deployment-manifest entry matched local committed website files. The compact records are in `qa/orbit-stage/` and `qa/events-orbit/`.

All browser checks used a separate Chromium process with `--mute-audio` asserted before navigation. Media was paused and test contexts closed afterwards. The camera harness mocks playback; the authenticated Events journey separately verifies real decoding. Physical iPhone/Safari behaviour and subjective audio quality remain untested.

## Proofing routes

- https://staging.universalmind.tv/events/?experience=1
- https://staging.universalmind.tv/lab/?launch=1

Production has not been modified.
