# I AM Adaptive Sound — Phase 1 Staging Feedback Dashboard

This directory is subordinate to the canonical blueprint:

`research/I_AM_EMDR_ADAPTIVE_SOUND_SYNTH_CANONICAL_BLUEPRINT.md`

The canonical file currently lives in the primary project workspace. This
isolated worktree does not replace or revise it.

This laboratory also records Ben's subsequent exact allocation clarification of
2026-08-10. The read-only canonical source still needs its owner-side wording
updated from `6.666...%` / `6.67%` to the exact allocation and profile-noise
defaults below; this worktree does not alter the primary workspace.

## Authority and scope

This is a deterministic engineering laboratory presented through a
near-finished read-only feedback dashboard in the listener portal. The current
design stage adds no listener choice between frequencies and no listener-facing
audition control; interaction remains open until Ben approves the visual design.
It does not
modify Quantum Tree, route programme audio through the synth, establish a
clinical or biological effect, provide a study-ready research protocol, or
constitute a production release. The current downward-only output control uses
an explicitly provisional technical ceiling for Ben-controlled muted staging
verification; final subjective calibration remains open.

The Phase 1 implementation preserves these locked boundaries:

- Delta `3.33 Hz`, Theta `7.38 Hz`, Alpha `10.11 Hz`, Gamma exactly `111 Hz`.
- Gamma is an isochronic modulation rate. It may coexist with a separate
  `111 Hz` carrier and is never substituted with a conventional gamma value.
- Principal carrier conditions are `111`, `222`, `444`, `555`, and `999 Hz`,
  one carrier per Phase 1 condition.
- The exact legacy Quantum Tree description remains separate:
  `7.38088 Hz` on `111.011 Hz`, plus constant `528.088 Hz`.
- The adaptive renderer is mono and its worklet copies the same sample to every
  output channel for identical dual mono.
- Programme audio remains stereo and is not routed through this directory.
- Quantum Tree remains outside the new mastering chain and under its existing
  owner controller.
- The authored vintage bandwidth stage is an exact `14,444 Hz` low-pass.
- Isochronic envelopes follow colour and compression.
- Dominant profiles allocate exactly `80%` to the primary frequency lane,
  `6.66%` to each of the three secondary frequency lanes, `0.01%` total noise,
  and `0.01%` to a real zero-signal silence reserve. The allocations total
  exactly `100%`.
- Ben's locked profile defaults are Delta/brown, Theta/white, Alpha/pink, and
  Gamma/equal white-pink-brown. Gamma divides the same `0.01%` total noise power
  equally (`0.003333...%` each); it does not add `0.01%` per colour.
- White, pink, and brown remain separate deterministic algorithms. Their current
  post-diamond/pre-limiter insertion point is a laboratory topology candidate,
  not yet a public product decision.
- Frequency and gene relationships are hypotheses only and are deliberately
  absent from the renderer schema.

## Modules

- `profiles-v1.js` — versioned laboratory profiles and explicitly provisional
  envelope, compressor, and low-pass candidates.
- `dsp-v1.js` — deterministic carrier, custom 4x colour core, aligned main and
  New York compression, 14,444 Hz low-pass, post-mastering envelopes,
  power-domain lane mixer, selectable deterministic micro-noise, explicit
  silence allocation, and invariant limiter.
- `worklet-v1.js` — fail-closed AudioWorklet adapter with objective meter
  diagnostics.
- `controller-v1.js` — dual-mono output routing, Quantum Tree owner-controller
  coordination, diagnostic state, fail-safe teardown, and the non-autoplay
  `?sound=1` direct entry. Profile and carrier controls are not listener-enabled
  in the visual-design approval stage.
- `panel-v1.css` — full-screen video composition with four overlapping vesica
  forms at exactly `44%` opacity, a four-lane isochronic mix matrix, and the
  Quantum Tree baseline. All four circles are congruent and their centres are
  locked to the four vertices of a square whose side is exactly one circle
  radius, so every adjacent pair forms a mathematically exact vesica piscis at
  every viewport height. The remembered Quantum Tree source balance is shown as
  `77%` for `7.38 Hz`, `77%` for `111 Hz`, and `86%` for `528 Hz`, with subtle
  independent visual modulation; the existing mastered recording is unchanged.
  Engineering controls remain visually absent from the listener experience.
- `tools/check-adaptive-sound-dsp.mjs` — objective verification.
- `tools/render-adaptive-sound-reference.mjs` — non-playing, hashed Float32 WAV
  reference renderer.

## Objective verification

Use the repository-bundled Node runtime when `node` is not on `PATH`:

```sh
/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  tools/check-adaptive-sound-dsp.mjs \
  --report /tmp/iam-adaptive-sound-phase1-objective-report.json
```

Generate the ten-condition five-carrier ON/clean engineering matrix with the
selected profile's locked noise default, without playing it:

```sh
/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  tools/render-adaptive-sound-reference.mjs \
  --matrix \
  --profile sleep_delta_80_v1 \
  --duration 4 \
  --sample-rate 48000 \
  --output-dir /tmp/iam-adaptive-sound-phase1-renders
```

Use `--noise white_noise_v1`, `pink_noise_v1`, or `brown_noise_v1` for an
explicit laboratory override. Use `--noise-matrix` to render all three override
conditions as a 30-condition engineering comparison.

The clean reference in Phase 1 is intentionally labelled `engineering` and
`study_ready: false`. Phase 2 must perform the locked latency and loudness
matching before any research-condition or blinded comparison claim.

## Remaining gates

- Ben's approval of the locked visual treatment before any interactive features
  are designed or enabled.
- Ben-controlled matched subjective audition for warmth and fatigue.
- Selection of the final pulse candidate, compression calibration, and
  14,444 Hz low-pass topology.
- Approval of the final noise insertion topology; the profile-colour defaults
  themselves are now locked.
- Approval of the final new-synth ceiling after Ben-controlled subjective
  audition; the staging build retains the provisional technical ceiling
  internally without exposing an engineering control surface.
- Phase 2 loudness/latency matching and configuration-fidelity work.
- Separate later approval for public listener exposure, masking, Tensor
  integration, study mode, and production.
