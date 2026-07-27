# Adaptive Soundtrack Stage Gates

> **Superseded.** Calm / Chill / House were the literal names of the original Cafe Del Mar radio stations, not the Universal Mind recommendation architecture. Current extended streaming sessions use the five canonical music rooms in `adaptive-music-room-selection-guide-v1.0.json`. This file remains only as a historical implementation record and must not be imported by current runtime code.

## Canonical MVP Fields

The GPT inference response records the adaptive soundtrack as flat fields on the same payload as the radar highlights:

```json
{
  "soundtrack_stage_gate": "calm",
  "soundtrack_confidence": 0.82,
  "soundtrack_reason": "High arousal language with stress/fatigue signals; downshift environment."
}
```

## Where This Is Recorded

The live worker returns these fields in the `/citizen-needs-inference` JSON response.

`globe.js` stores the full response in `sessionStorage` and `localStorage` under:

- `iamLatestInference`
- `citizenNeedsLatestInference`

`adaptive-environment.js` reads those records and gives priority to `soundtrack_stage_gate` before falling back to local keyword logic.

## Gate Meaning

- `calm`: downshift threat, overload, fatigue, sleep pressure, rumination, stress or clinical-risk signals.
- `chill`: hold reflective, connected, grateful, hopeful, trusting, clear, calm or awe-based states.
- `house`: lift joy, motivation, curiosity, agency, self-actualisation and healthy activation.

## Needs State Matrix

| Needs state | Stage gate | Confidence | Soundtrack reason |
| --- | --- | ---: | --- |
| Joy | house | 0.78 | Positive activation and reward language; lift environment. |
| Calm | chill | 0.76 | Calm present-state signal; preserve spaciousness without sedation. |
| Hope | chill | 0.72 | Forward-looking language with emotional steadiness; hold optimism. |
| Curiosity | house | 0.74 | Exploratory language and cognitive openness; add gentle momentum. |
| Gratitude | chill | 0.80 | Gratitude and appreciation signals; hold warmth and reflection. |
| Awe | chill | 0.70 | Expansive language with quiet intensity; keep atmosphere spacious. |
| Love | chill | 0.78 | Care and attachment language; hold connection and warmth. |
| Self-Actualisation | house | 0.77 | Growth, agency and becoming language; lift environment. |
| Trust | chill | 0.75 | Safety and support language; hold stable, low-friction atmosphere. |
| Belonging | chill | 0.76 | Inclusion and home signals; hold social warmth. |
| Connection | chill | 0.76 | Relational language; support warmth without overstimulation. |
| Empathy | chill | 0.72 | Attunement and care language; hold reflective presence. |
| Psychological Safety | calm | 0.78 | Safety need is active; reduce arousal and create steadiness. |
| Self-Transcendence | chill | 0.72 | Meaning beyond self; hold spacious and reflective tone. |
| Attention | chill | 0.70 | Focus signal; keep environment low-distraction and steady. |
| Mental Load | calm | 0.84 | Overload and pressure signals; downshift environment. |
| Rumination | calm | 0.82 | Repetitive thinking signal; reduce intensity and pace. |
| Motivation | house | 0.76 | Agency and readiness signals; lift momentum. |
| Executive Function | chill | 0.71 | Planning and organisation signal; support steady focus. |
| Clarity | chill | 0.74 | Clear or decisive language; hold clean, composed atmosphere. |
| Stress | calm | 0.85 | Stress and pressure signals; downshift environment. |
| Recovery | calm | 0.78 | Rest, healing or reset signal; support restoration. |
| Sleep Pressure | calm | 0.86 | Sleep need or restlessness signal; lower stimulation. |
| Fatigue | calm | 0.84 | Tiredness or depletion signal; reduce intensity. |
| Arousal | calm | 0.80 | Physiological activation signal; downshift unless paired with joy or motivation. |
| Fear | calm | 0.86 | Threat signal; lower intensity and support safety. |
| Anxiety | calm | 0.86 | Worry, panic or uncertainty signals; downshift environment. |
| Anger | calm | 0.82 | Anger or frustration signal; reduce tempo and intensity. |
| Shame | calm | 0.83 | Self-critical or shame signal; soften environment. |
| Loneliness | calm | 0.79 | Isolation signal; hold gentle, non-intrusive atmosphere. |
| Hypervigilance | calm | 0.87 | Scanning or on-edge signal; lower stimulation and unpredictability. |
| Avoidance | calm | 0.78 | Withdrawal or avoidance signal; keep environment gentle. |
| Intrusions | calm | 0.86 | Intrusive memory or flashback signal; downshift environment. |
| Emotional Numbing | calm | 0.78 | Numbness or blankness signal; avoid overstimulation. |
| Sleep Disturbance | calm | 0.86 | Disturbed sleep signal; lower stimulation and pace. |
| Startle Sensitivity | calm | 0.86 | Heightened startle signal; reduce intensity and surprise. |

## Combined Signals

When multiple needs are present, choose the most protective gate:

1. Threat, clinical-risk, overload, fatigue or sleep signals usually override into `calm`.
2. Balanced positive, social and reflective signals usually resolve to `chill`.
3. Joy, curiosity, motivation and agency resolve to `house` only when there are no strong downshift signals.
