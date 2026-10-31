# Universal Informatics Music Atlas

[Interactive Music Atlas](https://universalmind.tv/informatics/?entry=research&area=sound) · [AI / LLM Wiki](https://universalmind.tv/informatics/read/music/index.html)

## Reading this record

- Read the six model records together with their equations, tables and workings. The wording is taken from the interactive Music Atlas.
- Keep units and conventions: phrase lengths count bars; chromatic pitch classes exclude the repeated octave endpoint; frequency values are in hertz.
- Use the selected tuning reference and key when discussing an interactive setting. The default is C major with A4 = 440 Hz.
- The measurement chapter describes software visual mockups and planned streams. No participant time-series samples are included in this record.
- Follow the source links for Geometry Atlas records and citations. Cite the ordinary Music Atlas URL or the linked model section when discussing the material.

## SEQUENCE STRUCTURE · Doubling the phrase

A four-bar phrase doubles to 8, 16, 32, 64 and 128 bars. Reducing each length modulo 9 gives a repeating six-value cycle.

4 → 8 → 7 → 5 → 1 → 2

Phrase length in bars, mapped onto the nine positions of the Beta circle.

In 4/4, each bar contains four quarter-note beats. Here the numbers count bars in a phrase. Doubling is the structural choice being explored.

| Bars | Calculation |
| --- | --- |
| 4 | 4 = 9 × 0 + 4 |
| 8 | 8 = 9 × 0 + 8 |
| 16 | 16 = 9 × 1 + 7 |
| 32 | 32 = 9 × 3 + 5 |
| 64 | 64 = 9 × 7 + 1 |
| 128 | 128 = 9 × 14 + 2 |

The M9 / P24 Beta cycle is `1, 2, 4, 8, 7, 5`. Starting at 4 rotates the same cycle to `4, 8, 7, 5, 1, 2`.

Within the Atlas, Beta is calculated by summing the Alpha values strictly between successive Gamma positions and reducing modulo 9. These two calculations produce the same six-value cycle.

| Phrase length (bars) | Quotient on division by 9 | Remainder |
| --- | --- | --- |
| 4 | 0 | 4 |
| 8 | 0 | 8 |
| 16 | 1 | 7 |
| 32 | 3 | 5 |
| 64 | 7 | 1 |
| 128 | 14 | 2 |

## MELODIC STRUCTURE · One · three · five · eight

Select the first, third and fifth degrees of C major, then repeat the tonic at the octave: C, E, G, C. These degree numbers are selected Fibonacci numbers.

1 · 3 · 5 · 8
C · E · G · C

The piano and circle highlight the same values: 1, 3, 5 and 8. Blend Alpha to reveal the full M9 / P24 sequence.

The Fibonacci sequence begins `0, 1, 1, 2, 3, 5, 8…`. The chord selects degrees `1, 3, 5, 8`; these are selected values within the sequence.

The circle keeps all 24 Alpha positions in their original order. Every occurrence of `1, 3, 5 or 8` is highlighted, synchronised with its piano key. Repeated values stay at their separate positions. Blend Alpha to reveal the remaining values; this is a comparison of scale-degree numbers with sequence values.

A major triad is degrees 1, 3 and 5. Degree 8 repeats its root one octave higher.

| Degree | Just ratio | 12-TET ratio |
| --- | --- | --- |
| 1 | 1 | 1 |
| 3 | 5/4 | 1.25992 |
| 5 | 3/2 | 1.49831 |
| 8 | 2 | 2 |

12-TET means twelve equal divisions of the octave. Its frequency ratio after `n` semitones is `2^(n/12)`. Just intonation gives the chord the proportional frequencies `4 : 5 : 6 : 8`.

| Scale degree | Note | Semitones above C | Just ratio | 12-TET ratio |
| --- | --- | --- | --- | --- |
| 1 | C | 0 | 1 | 1 |
| 3 | E | 4 | 5/4 | 1.2599210498948732 |
| 5 | G | 7 | 3/2 | 1.4983070768766815 |
| 8 | C | 12 | 2 | 2 |

## SCALE · A tonic and six companions

Place the tonic at the centre and the six other notes of its major scale around it. Trace the hexagon, then return to the centre.

1 tonic + 6 notes = 7
2 · 2 · 1 · 2 · 2 · 2 · 1

Six scale notes surround the tonic. Blend Gamma to compare the six positions; blend Alpha to see their place in the full period.

The seven distinct notes of C major are `C D E F G A B`. C at the centre leaves six notes on the perimeter.

The steps from one note to the next, including the return to C, are `2, 2, 1, 2, 2, 2, 1` semitones. Equal distances in the drawing represent positions in the arrangement.

Move from C major to G major and six note names remain: `C D E G A B`. F changes to F♯.

The Gamma overlay uses the Atlas positions `24, 4, 8, 12, 16, 20`, with Alpha values `9, 3, 3, 9, 6, 6`. These six equally spaced positions align with the six scale notes around the tonic. Gamma also joins alternating vertices into two opposing equilateral triangles, forming the six-pointed star within the hexagon. The note names and the modular values remain visible as separate labels.

Blend Alpha to reveal all 24 positions. We hypothesise that these are possible Fibonacci structures within M9 / P24. The overlay makes the proposed spatial relationship available for inspection.

| Degree | Note | Semitones above tonic | Placement |
| --- | --- | --- | --- |
| 1 | C | 0 | Centre |
| 2 | D | 2 | Perimeter 1 |
| 3 | E | 4 | Perimeter 2 |
| 4 | F | 5 | Perimeter 3 |
| 5 | G | 7 | Perimeter 4 |
| 6 | A | 9 | Perimeter 5 |
| 7 | B | 11 | Perimeter 6 |

## CHROMATIC · The chromatic octave

Follow the twelve chromatic pitch classes around the circle and across the keyboard. From C to the next C, five black keys sit alongside eight white keys.

2 + 3 = 5
5 + 8 = 13

13 keys from C to C, including the repeated upper C. The circle contains 12 distinct pitch classes.

The chromatic scale includes every semitone in the octave. On the circle, the seven natural notes `C D E F G A B` are white; the five black-key notes `C♯ D♯ F♯ G♯ A♯` are pink. Sharp spellings are used here; on an equal-tempered keyboard these keys also have flat names.

The major-scale steps are `2, 2, 1, 2, 2, 2, 1` semitones. A black key fills each two-semitone gap. E–F and B–C are already one semitone apart, creating the familiar groups of two and three black keys.

`2 + 3 = 5` counts the black keys. `5 + 8 = 13` counts all keys from C to C, including both endpoints. The numbers `2, 3, 5, 8, 13` are consecutive Fibonacci numbers. This is a counting pattern in the illustrated keyboard span, not a derivation of chromatic tuning.

The upper C has twice the frequency of the lower C and belongs to the same pitch class. Without the repeated endpoint, there are `7 + 5 = 12` pitch classes. Choosing different endpoints changes the colour counts: C♯ to C♯ contains seven white keys and six black keys.

The circle uses twelve-tone equal temperament: every adjacent step has frequency ratio `2^(1/12)`. Equal angles represent equal semitone intervals. The separate Circle of fifths view explains pure 3:2 fifths, octaves and the tuning adjustment that closes the twelve-note circle.

[Scales and scale degrees · Open Music Theory ↗](https://openmusictheory.github.io/scales.html)
[Notes, frequencies and equal temperament · UNSW ↗](https://www.phys.unsw.edu.au/jw/notes.html)

| Semitones above C | Note | Key colour | Circle pitch-class index |
| --- | --- | --- | --- |
| 0 | C | White | 0 |
| 1 | C♯ | Black | 1 |
| 2 | D | White | 2 |
| 3 | D♯ | Black | 3 |
| 4 | E | White | 4 |
| 5 | F | White | 5 |
| 6 | F♯ | Black | 6 |
| 7 | G | White | 7 |
| 8 | G♯ | Black | 8 |
| 9 | A | White | 9 |
| 10 | A♯ | Black | 10 |
| 11 | B | White | 11 |
| 12 | C | White | 0 |

## CIRCLE OF FIFTHS · Pythagoras and the scale

Pythagorean tuning, traditionally attributed to Pythagoras, builds a scale from 3:2 fifths and 2:1 octaves. Bring the notes into one octave and order them by pitch: C, D, E, F, G, A, B. Repeat C above them to complete the eight-note scale.

Perfect fifth: 3 : 2
Octave: 2 : 1

Pythagorean tuning builds seven distinct scale notes using fifths and octaves. The eighth note repeats the first, one octave higher.

The tuning system named after Pythagoras constructs a scale using two operations: multiply by `3/2` for a fifth, then divide by `2` when the note lies above the octave.

Starting from F, the chain `F → C → G → D → A → E → B` contains the C-major collection. Ordering those notes by pitch gives `C D E F G A B`.

In twelve-tone equal temperament each fifth is `2^(7/12) ≈ 1.49831`. Twelve steps return to the same pitch class.

Twelve pure 3:2 fifths exceed seven octaves by `531441/524288 ≈ 1.01364`. This small difference is the Pythagorean comma.

The numbers in `2:1` and `3:2` are consecutive Fibonacci numbers. This is the numerical relationship explored here.

`3/2` is one ratio of successive Fibonacci numbers. The sequence `3/2, 5/3, 8/5, 13/8…` approaches the Phi Ratio. Repeating the fixed ratio 3/2 is a separate operation.

[Pythagorean tuning: method and ratios ↗](https://www.mtosmt.org/classic/mto.98.4.4/mto.98.4.4.scholtz.html)
[Pythagoras: historical attribution ↗](https://plato.stanford.edu/entries/pythagoras/)

| Fifth step | Pitch class | Semitones modulo 12 | 12-TET frequency ratio within one octave |
| --- | --- | --- | --- |
| 0 | C | 0 | 1 |
| 1 | G | 7 | 1.4983070768766815 |
| 2 | D | 2 | 1.122462048309373 |
| 3 | A | 9 | 1.681792830507429 |
| 4 | E | 4 | 1.2599210498948732 |
| 5 | B | 11 | 1.8877486253633868 |
| 6 | F♯ / G♭ | 6 | 1.4142135623730951 |
| 7 | D♭ | 1 | 1.0594630943592953 |
| 8 | A♭ | 8 | 1.5874010519681994 |
| 9 | E♭ | 3 | 1.189207115002721 |
| 10 | B♭ | 10 | 1.7817974362806785 |
| 11 | F | 5 | 1.3348398541700344 |

## TUNING & FREQUENCY · A reference and a ratio

Compare the proposed M9 shapes for 528, 111 and 7.38 Hz. Choose the reference frequency for A4 to see the scale frequencies change while their interval ratios stay the same.

f = A4 × 2^((n − 9)/12)

528 → 6: hexagon · 111 → 3: triangle · 7.38 → 9: circle. A proposed visual mapping from the written frequency in hertz.

The reference sets A4 to `432, 440 or 444 Hz`. Every equal-tempered note follows the same ratio rule. Here `n` is the number of semitones above C4.

Relative to A4 = 440 Hz, A4 = 432 Hz shifts every note by approximately −31.77 cents. A4 = 444 Hz shifts every note by approximately +15.67 cents. One semitone is 100 cents.

The separate 528 Hz tone is included as a named solfeggio-frequency example. A single tone does not define the tuning of a whole piece.

For the M9 diagrams, add the digits of the frequency written in hertz, omitting the decimal point, and reduce the sum modulo 9, displaying zero as 9: `528 → 15 → 6`, `111 → 3`, `7.38 → 18 → 9`. For 7.38 Hz, this operates on its written digits: `7 + 3 + 8 = 18`. The visual presets associate 6 with a hexagon, 3 with a triangle and 9 with the circle. They show the proposed mapping; the shapes are not waveforms.

Changing the tuning reference preserves relative intervals. The research question is whether these stimulus settings modulate emotional and biological responses.

| Frequency (Hz) | Written digits | Digit sum | M9 displayed value | Visual preset |
| --- | --- | --- | --- | --- |
| 528 | 5 + 2 + 8 | 15 | 6 | hexagon |
| 111 | 1 + 1 + 1 | 3 | 3 | triangle |
| 7.38 | 7 + 3 + 8 | 18 | 9 | circle |

## Reference frequencies

| A4 reference (Hz) | Note | Semitones above C4 | Frequency (Hz) |
| --- | --- | --- | --- |
| 432 | C | 0 | 256.86873684058776 |
| 432 | D | 2 | 288.3254085007274 |
| 432 | E | 4 | 323.6343286053632 |
| 432 | F | 5 | 342.8786272251311 |
| 432 | G | 7 | 384.8682462366266 |
| 432 | A | 9 | 432 |
| 432 | B | 11 | 484.90360486964914 |
| 432 | C | 12 | 513.7374736811755 |
| 440 | C | 0 | 261.6255653005986 |
| 440 | D | 2 | 293.6647679174076 |
| 440 | E | 4 | 329.6275569128699 |
| 440 | F | 5 | 349.2282314330039 |
| 440 | G | 7 | 391.99543598174927 |
| 440 | A | 9 | 440 |
| 440 | B | 11 | 493.8833012561241 |
| 440 | C | 12 | 523.2511306011972 |
| 444 | C | 0 | 264.00397953060406 |
| 444 | D | 2 | 296.33444762574766 |
| 444 | E | 4 | 332.6241710666233 |
| 444 | F | 5 | 352.4030335369403 |
| 444 | G | 7 | 395.55903085431066 |
| 444 | A | 9 | 444 |
| 444 | B | 11 | 498.3731494493616 |
| 444 | C | 12 | 528.0079590612081 |

## Geometry source

Alpha display values: 9, 1, 1, 2, 3, 5, 8, 4, 3, 7, 1, 8, 9, 8, 8, 7, 6, 4, 1, 5, 6, 2, 8, 1.

Gamma positions: 24, 4, 8, 12, 16, 20. Gamma Alpha values: 9, 3, 3, 9, 6, 6.

[Complete M9/P24 JSON](https://universalmind.tv/informatics/pilot-v1/m9.json) · [Geometry explanations](https://universalmind.tv/informatics/read/atlas/m9.html)

## Measurement architecture

MUSIC ATLAS · MEASUREMENT ARCHITECTURE

### Non-invasive measurement before mRNA sequencing

Validating the research approach for stakeholders before a substantial investment in mRNA sequencing.

Our hypothesis: does electronic music modulate *OXTR* via Fibonacci numbers? Our initial non-invasive study, **N = 33**, brings physiology, audience experience and musical structure together to validate the research approach and establish the case for mRNA sequencing investment.

These graphics are visual mockups of a real **Universal Informatics Music Atlas Python script**: custom software Ben Korbel is developing with Gemini to measure and unify these metrics together as one. Implementation is in progress.

#### Brain & autonomic response

EEG from Muse S Athena, galvanic skin response (GSR / EDA), heart-rate variability, **HRV power spectral density (PSD)** and baroreflex sensitivity. Brain-state analysis brings amplitude and phase–amplitude coupling onto the shared timeline.

#### Optical signals & inference

A 400-channel laboratory hyperspectral analysis and smartphone-grade RGB analysis reconstructed into 31 spectral bands. Inferred oxytocin is an exploratory model output created by Immersion Neuroscience via research with DARPA. Explore [Immersion Neuroscience ↗](https://www.getimmersion.com/) and [SIX ↗](https://www.your6.com/).

#### Audience & musical structure

Continuous audience feedback and a participant peak-moment trigger, aligned with real-time song analysis: position within a **64-bar sequence**, melodic anticipation and resolution, chords, arpeggios, and Fibonacci / Pisano landmarks.

01 · Unified measurement timeline
The landscape overview brings the streams together, from EEG at the top to Fibonacci coding at the bottom.

02 · Brain state, amplitude & coupling
Brain state, amplitude and coupling alongside audience peaks, cardiovascular features and spectral imaging.

03 · A peak moment across the streams
The vertical view begins with EEG and aligns the measurement streams around an audience-reported peak moment.

NEXT STAGE · mRNA SEQUENCING

#### Validating the investment for stakeholders

Following validation of the research approach through the **N = 33** non-invasive study, we will invest in mRNA sequencing through the [Kinghorn Centre for Clinical Genomics at the Garvan Institute of Medical Research ↗](https://www.garvan.org.au/research/services/genome), from whom we have received a commercial quote.

**mRNA sequencing represents an investment of A$600–A$1,000 per participant.** The initial non-invasive phase establishes the case for that investment for stakeholders. Sequencing will compare OXTR mRNA expression in samples collected before and after the intervention or song.

| Order | Figure | Description | Image |
| --- | --- | --- | --- |
| 1 | 01 · Unified measurement timeline The landscape overview brings the streams together, from EEG at the top to Fibonacci coding at the bottom. | Illustrative landscape timeline, from EEG at the top through HRV PSD, baroreflex, GSR, inferred hormone placeholders, rhythm and melodic resolution to Fibonacci coding at the bottom. | media/music-measurement/unified-timeline.jpeg |
| 2 | 02 · Brain state, amplitude & coupling Brain state, amplitude and coupling alongside audience peaks, cardiovascular features and spectral imaging. | Illustrative dashboard with EEG phase–amplitude coupling, an audience response timeline, a Fibonacci/Pisano clock, HRV PSD, baroreflex features, an inference network and a hyperspectral cube. | media/music-measurement/brain-state-dashboard.jpeg |
| 3 | 03 · A peak moment across the streams The vertical view begins with EEG and aligns the measurement streams around an audience-reported peak moment. | Illustrative vertical stack beginning with EEG, followed by GSR, HRV PSD, baroreflex, an inferred oxytocin placeholder, laboratory and RGB spectral views, audience feedback, musical structure and Fibonacci coding. | media/music-measurement/peak-moment-timeline.jpeg |

## Source and downloads

Source: atlas-visuals.js · SHA-256: 72ebebbb51ad51b094ec5072e051885fdf134ccd51bf0a9bc73ba9dfddbb5235

[JSON](https://universalmind.tv/informatics/music-atlas/music-atlas.json) · [CSV](https://universalmind.tv/informatics/music-atlas/music-atlas.csv) · [Markdown](https://universalmind.tv/informatics/music-atlas/music-atlas.md)
