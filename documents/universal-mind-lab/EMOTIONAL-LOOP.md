# Emotional regulation and connection loop

Primary-source review: 2 November 2026. This note supplements BRIEF.md section 21 and preserves Ben's committed MVP direction.

## Product commitment

Universal Mind Lab's responsive-environment MVP connects Apple Watch cardiac data with Immersion Neuroscience / SIX inference signals and uses them to modulate light, colour, projection, motion and sound. The participant can notice the change, reflect on their experience and connect with others. Reduced short-term stress and increased felt connection are the intended outcomes. The real Lab integration is part of the delivery brief. The current browser scene demonstrates the loop with simulated signals; it has no connected participant Watch feed.

## Source-linked findings

| Topic | Verified public description and precise use in the Lab |
| --- | --- |
| Organisation and app | **Immersion Neuroscience** is the organisation; **SIX** applies its science at an individual level for emotional fitness, awareness and reflection. Its public FAQ describes cardiac-rhythm analysis producing derived metrics. [Immersion FAQ](https://www.getimmersion.com/faq). |
| Measured input | Apple describes an optical sensor that observes blood-volume changes at the wrist to calculate heart rate. The diagram can say **Apple Watch · heart-rhythm data**. It does not depict a hormone sensor or a brain scan. [Apple heart-rate measurement](https://support.apple.com/en-us/120277). |
| Emotional Connection | Ben's pitch label remains **Emotional Connection · oxytocin–dopamine inference**. Immersion publicly describes wearable-based inference of concurrent oxytocin and dopamine release. Attribute this to the provider; it is not a directly sampled neurochemical concentration. [Provider wellbeing explanation](https://www.getimmersion.com/measuring-well-being-with-value-measurement). |
| Psychological Safety | The provider publicly offers **Psychological Safety** scores through its SDK. The clinical pitch retains **cortisol inference**, attributed to the provider explanation Ben received in his meetings. The public pages checked here did not establish a specific cortisol calibration or the 90/10 weighting. [Provider SDK introduction](https://www.getimmersion.com/neuroscience-sdk-for-wearables). |
| Integration exists now | The public SDK describes timestamped cardiac samples as input and on-device **Value** and **Psychological Safety** scores as output. This supports the MVP's implementation direction. It does not establish that the browser demo is connected. Preserve Emotional Connection as the experience label; confirm its mapping to the contracted SDK field with Immersion during integration. [Immersion SDK](https://sdk.your6.com/). |
| No emotion naming from BPM alone | The provider distinguishes its derived predictors from recognising named emotions. Its SDK documentation accepts cardiac samples and describes provider processing; a generic high/low heart-rate threshold is not an equivalent model. The Lab does not infer sadness, anxiety, consent or a clinical diagnosis from a BPM number. [SDK developer FAQ](https://sdk.your6.com/faq). |
| Research provenance | Immersion's current live-experience page publicly states that DARPA funding required independent laboratory reproduction of its science. This is a provider claim, now publicly traceable as well as reported by Ben. It is not independent verification of the Lab's therapeutic effects. [ImmersionLive](https://www.getimmersion.com/live). |

Ben reports that his meetings with the SIX team included a **90% oxytocin / 10% dopamine** explanation, with dopamine connected to focus and oxytocin to emotional connection, and Psychological Safety described as a cortisol inference proxy. Retain this explanation in clinical briefing materials with that attribution. Do not convert the percentages into measured hormone levels, an algorithm specification or independently verified calibration.

The provider's science page describes processing beyond conventional heart rate or HRV summaries. Keep the distinction visible in the implementation: cardiac observations enter the provider's model, and inferred scores then inform environmental controls. [Provider science explanation](https://www.getimmersion.com/the-science-of-value-measurement).

## Presentation-ready diagram copy

**Heading:** Emotional regulation and connection

| Diagram position | Main label | Supporting label |
| --- | --- | --- |
| 1 | Apple Watch | Heart-rhythm data |
| 2 | Immersion Neuroscience / SIX | Provider inference |
| 2a | Emotional Connection | Oxytocin–dopamine inference |
| 2b | Psychological Safety | Cortisol inference |
| 3 | Light and sound respond | Colour · projection · motion · music |
| 4 | Notice · Reflect · Connect | Explore your response and shared experience |
| Return arrow | The experience evolves | Signals inform the next adjustment |

Keep the feedback path legible as a loop. Do not add a rising-score goal, a success/failure colour or an animation that implies that maximum intensity means maximum wellbeing. A participant can pause, lower intensity or step out. The person's own account remains part of reflection; a score does not override it.

**Short explanatory paragraph:**

Apple Watch heart-rhythm data feeds Immersion Neuroscience / SIX. Emotional Connection and Psychological Safety inferences guide changes in the surrounding light and sound, creating a visible feedback loop for noticing, reflection and connection. The Lab is designed to support reduced short-term stress and increased felt connection.

**One shared Proposal panel:**

This proposal presents the Lab's committed Apple Watch / SIX responsive-environment MVP and intended collaborators. The browser experience simulates the feedback loop. Emotional Connection and Psychological Safety are provider-derived inferences, not direct hormone readings; the cortisol interpretation and 90/10 oxytocin–dopamine explanation are attributed to Ben's discussions with the provider. Named partnerships, clinical delivery and referral arrangements remain to be agreed. The Lab's intended benefits are not presented as measured clinical outcomes.

Use the shared panel for status and attribution. Keep individual scene cards focused on the experience and its purpose.

## Creative and technical collaboration

The proposal names Apple Watch for the wearable experience, Immersion Neuroscience / SIX for inference and integration, teamLab for responsive artistic environments, TDC for screens and projection delivery, and Arup for engineering and environmental design. These are Ben's intended collaborations. The environmental mapping belongs to the Lab's design process; provider scores do not by themselves prescribe a clinical intervention or a lighting recipe.

## Support space and participation

**Scene title:** Support and connection

**Scene copy:** A discreet space for conversation, mental health support, mindfulness and onward connection with care. headspace · Médecins Sans Frontières · AABCAP.

**Referral copy:** Free participation through self-nomination, headspace referrals and participating NSW Education schools. Limited in-person places are complemented by the online experience and live programme.

The proposed school pathway includes nominated students and assistance from teachers or school leadership, with the young person's participation choice. Existing headspace service use or a school nomination is not a prerequisite. The supplied `/eora` membership route remains a proposal destination; this review does not verify a working Lab intake service at that address. headspace here means Australia's youth mental health organisation at **headspace.org.au**. Its NSW Miranda centre publishes self-referral and professional-referral routes and identifies consent as part of referral. This is service context, not confirmation of a Universal Mind partnership. [headspace Miranda](https://headspace.org.au/headspace-centres/miranda/).

The precise Buddhist psychotherapy organisation is the **Australian Association of Buddhist Counsellors and Psychotherapists (AABCAP)**. Its stated work brings Buddhism and psychotherapy together. [AABCAP](https://aabcap.org/). The current management page lists **Margaret Chua as President** and **Dr Eng-Kong Tan as Founding President**. It states that Tan has retired from clinical practice and continues teaching and supervision. Use his correct name and founding role in briefing notes; do not depict him as a booked event clinician. [AABCAP management committee](https://aabcap.org/our-management-committee/).

**Médecins Sans Frontières (MSF)** is the international medical humanitarian organisation also known as Doctors Without Borders. Its Australian site describes international medical assistance; it does not establish staffing for this Australian event. The proposed support-area collaboration remains in the Lab brief, alongside headspace, AABCAP and local health capacity. [MSF Australia](https://msf.org.au/about-us).

The support space offers privacy and participant choice. Clinical conversations, intake and care stay separate from the public audiovisual feedback loop. The diagram is an experience explanation, not a diagnostic instrument, eligibility rule or automated triage pathway.
