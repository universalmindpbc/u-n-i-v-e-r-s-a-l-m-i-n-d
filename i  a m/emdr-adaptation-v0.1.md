# EMDR visual adaptation v0.1

This experimental visual layer adapts only after the citizen chooses to turn it on. It is an adaptive environment and research hypothesis, not a diagnosis, treatment or claim of clinical effect.

## Inputs

The selector reads the existing Adaptive Inference Engine v4.44 contract:

- six-domain `citizen_needs` scores;
- adaptive-support and human-review relevance;
- music environment function, trajectory, intensity and density;
- Calm, Chill or House continuation mode;
- the current music selection when no citizen-needs record is available.

## Decision hierarchy

1. Safety, clinical-risk relevance, threat and physiological load.
2. Current emotional trajectory and restoration needs.
3. Cognitive readiness.
4. Connection and social context.
5. Growth, awe, curiosity and activation.
6. Music environment function and soundtrack energy.
7. A small deterministic citizen-specific variation to avoid identical presets for otherwise similar profiles.

The selector chooses a starting visual and intensity. It never turns EMDR on automatically, and the citizen can change the style, adjust intensity or turn it off immediately.

## Visual families

- `temple`: restoration, calm, psychological safety, high load or depletion.
- `orbit`: connection, belonging, warmth, love and integration.
- `stellar`: awe, hope, curiosity and self-transcendence.
- `prism`: attention, clarity, executive function, motivation and focus.
- `rave`: joy, arousal, belonging, motivation and club/festival activation.
- `3d`: self-actualisation, awe, exploration and self-transcendence; a dedicated Three.js scene renders two counter-rotating solid tetrahedral meshes as a stellated octahedron above a living Seed of Life light-shadow.

## Intensity

Music intensity and Calm/Chill/House provide the baseline. Readiness and activation can raise it; anxiety, stress, hypervigilance, intrusions, fatigue and sleep pressure reduce it. High support or human-review relevance selects `temple` and caps the starting intensity at 32%.

The decision is stored for inspection in session storage as `iamLatestEmdrAdaptation`, using schema `emdr_adaptation_v0.1`.

## Audio continuity

Both the hero `<video>` element and the streaming-radio `Audio` element connect to the same Web Audio analyser. A transient gate isolates kick and snare or unusually strong hi-hat events; continuous midrange, vocals and overall loudness do not drive the visuals when the music video hands off to radio.

In the 3D scene, bass controls the sculpture's breathing and Seed of Life radius, midrange shapes opposing rotational energy, and treble activates spectral physical materials and shadow detail. The artwork uses depth-tested solid triangular faces, separate scene pivots, physically based lighting, soft shadows and a dedicated perspective camera rather than projected 2D line art.

### Shared intensity architecture

All six styles follow three direct rules: more shapes, brighter lighting and faster rotation as intensity rises. At zero, each style contains one fully visible hero object rather than a finished composition made transparent.

The slider's displayed `100%` maps to the former visual system's `77%` ceiling. Population growth is delayed through the first quarter so the compositions remain minimal and legible before additional geometry appears.

For `3d`, the approved star tetrahedron and single floor Seed of Life remain the zero state. Higher intensities reveal additional nested stellated octahedra, accelerate counter-rotation and increase physical separation and illumination. The floor Seed never duplicates.

Motion is approximately 80% smooth authored rotation and 20% percussion response. Rotation remains monotonic and never changes direction in response to audio. Bass produces only restrained breathing, kick creates a short expansion and tetrahedral-separation impulse, and snare or a sufficiently strong high-frequency transient creates a brief refractive-light accent.

Music reaction is off by default and is exposed as a separate `react ♫` toggle. With reaction off, the percussion envelope is zeroed and the authored rotation remains completely independent of the soundtrack.

While EMDR is active, the on-by-default `automate ↔︎` control moves intensity from a needs-informed 22–30% starting point toward a generatively varied 72–77% crest and back down. Each of the 22 local catalogue videos has a measured/canonical BPM and locally analysed first strong downbeat in `video-beat-grid-v1.json`; the automation follows a smooth 64-beat `sin²` arc anchored to that video timecode. Seeking therefore resynchronises the phrase, pausing holds it, and the visual waits at its minimum before the first strong downbeat.

Streaming radio deliberately does not attempt live BPM detection in this iteration. After the video-to-radio handoff, automation continues on the existing 32-second cinematic fallback clock.

Any manual intensity-slider movement is treated as an explicit fixed-state override: it immediately switches `automate` off and never resumes on a timer. The citizen can opt back in with the button; automation then joins the current slider position without a visual jump.

Closing the wallet never changes the running EMDR state. Reopening EMDR synchronises the controls from the live style, intensity, reaction and automation values; adaptive style selection runs only on a fresh activation after EMDR has been turned off.

The radio element sets `crossOrigin` before assigning the Radio.co stream URL, then connects to the same analyser as the hero video. This ordering is required for cross-origin frequency analysis in supported browsers.
