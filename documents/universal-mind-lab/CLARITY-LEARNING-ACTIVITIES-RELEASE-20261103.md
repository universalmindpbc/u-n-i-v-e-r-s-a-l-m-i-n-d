# Lab clarity, learning and activity release

Date: 3 November 2026

Source commit: `c8633faa1912a3699b7422939bee86ec2b93da18`

Staging: https://staging.universalmind.tv/lab/

Published with the existing `./deploy-panthur-staging.sh lab` workflow. Production has not been modified.

## Changes

- Universal Mind flower placed to the left of the wordmark, with responsive sizing.
- Portrait overview framed farther out and lower; daytime heading and lineup use charcoal against a continuous cream reading field. Approved tagline gold retained. No text shadows or outlines added.
- Headline crossfades every eight seconds between “Next Generation Lab for Next Generation Humans” and “Together, let’s beat as one.” The text remains stationary within a fixed footprint.
- Support space populated with three darker-skinned children meditating cross-legged, one child in downward-facing dog and a doctor wearing a lab coat and stethoscope.
- Playground gains a smooth slide ribbon and three animated sliding children.
- Rotunda gains three children making music on phones, linked waveforms, animated beat displays and a central 360-degree speaker with expanding sound rings.
- What you’ll learn opens from the main pavilion and About. Its SVG diagram connects electronic music making, fashion design and mindfulness through STEAM workshops responding to live cinema, TV and advertising briefs, together as one.
- Proposal renamed About. Day order: Dining experience, Leisure, Workshops, Rave. Existing signed-off narrative retained, including dissolving stigma.
- Brief updated; the two supplied curriculum sketches archived unchanged with SHA-256 provenance.

## Verification

- Local syntax and existing Lab source/reference checks passed.
- Live checks passed at 320 × 568, 393 × 647, 844 × 390 and 1440 × 1000.
- Initial and final overview camera positions verified; full automated story reaches completion.
- Flower loads, sits left of text and fits the viewport without horizontal overflow.
- Daytime foreground colors and reading field verified; the field hides at night. Heading shadow and lineup filter are both absent.
- Both headline opacity states verified without transform or footprint changes. A separate natural-time phone check confirms the actual crossfade. Motion off and reduced-motion behavior verified.
- All eleven activity figures and their visibility verified. Sliding positions and music beat step change over time.
- Both learning entry points, internal phone scrolling, close button, Escape and return to About verified.
- No browser JavaScript errors in these checks.
- Seven live assets match local SHA-256 values, including the new activity module and flower asset. See `qa/clarity-activities/source-hashes.json`.

All browser checks ran in a separate headless Chromium process with `--mute-audio` confirmed before navigation. Native fullscreen APIs were disabled. Media playback was stubbed; these checks establish layout and interaction behavior, not media playback or subjective sound quality. Phone checks use browser emulation rather than a physical iPhone. All automated browser sessions were closed after verification.

Evidence and repeatable QA scripts: `qa/clarity-activities/`.
