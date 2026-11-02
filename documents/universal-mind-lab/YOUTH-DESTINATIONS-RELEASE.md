# Youth research destinations and Events wordmarks

Date: 3 November 2026 (Australia/Sydney).

Website source commit: `b82eaab87f043ead990112fd15f66583698d28f6`.
Base staging commit: `49df4fa9f8eec9659a3e1b14f503b49e0c6319f8`.
Production reference observed before this update: `d5e3499af7533a3c87cef794aa028f33194656f8`. Production was not modified.

## Changes

- The existing Lab research introduction now links to dedicated Informatics youth views. Each destination starts with its own institution or topic heading, explicit youth scope and reported participant ages.
- Orygen Research displays 21 associated publications; Black Dog Institute Research displays 20. Institutional groups overlap.
- Topic views include music listening/therapy (7), music making (3), sound and brain entrainment (3), EMDR (7), mindfulness (26), Transcendental Meditation (2), yoga (3) and access/digital support/connection (67 unique publications across collections). Mantra provides the existing evidence-gap context with zero qualifying publications in this addition.
- The full Lab collection contains 105 unique publications. The existing canonical data, findings, study methods, citations and limitations are retained. No scientific claims or dataset records were changed.
- The wider age-filtered library now opens with the heading Youth Research. General research search and chapter navigation retain their existing interface.
- Events uses `universalmind[lab]` and `athousandminds`, with mind/minds bold and no word spaces. Small Informatics serif typography, original flower and Fibonacci rain remain.
- The existing Panthur staging script now uses an Informatics-specific syntax preflight for its existing Informatics deployment scope. Discovery and export validation still run in the established deploy function. Hosting and transport are unchanged.

## Verification

- Local and staging tests clicked every institution/topic link from `/lab/research.html`, checking the visible heading on arrival, exact publication IDs, deduplication and participant-age details.
- All 105 full-collection records verified. Source links, citation dialog, reload, browser Back, topic-to-topic navigation and return to general research passed.
- Desktop 1440 × 1000, phone 390 × 844 and landscape 844 × 390 layouts checked. Orygen, Black Dog, EMDR, mantra and phone screenshots inspected.
- Real staging homepage invitation → Events → both destinations passed. Correct wordmark strings, bold spans, serif fonts, centred flower and no overflow verified at all three viewport sizes.
- Lab launch still decodes video/audio with 7% video blend, skips the redundant landing and returns through browser Back. Proposal retains dissolving stigma.
- Dedicated Chromium process used `--mute-audio` before navigation. Research checks mocked playback; Events media checks were process-muted. Native fullscreen was never invoked. All automated tabs were paused and closed. Subjective sound quality was not assessed.
- Deployed source hashes matched for the changed reader, Lab research page and Events stylesheet. The rendered PHP wordmarks were checked through the authenticated visitor journey.
- Discovery validation passed: 2,341 HTML pages, 29,115 local links and 17 source-file hashes. Existing exports passed with 1,195 sources. Portal navigation and Lab static preflights passed.

Evidence: `qa/youth-destinations/verification.json` and `qa/youth-wordmarks/verification.json`.

## Deployment

The exact committed website source was deployed using `./deploy-panthur-staging.sh informatics`, `lab`, then `events`. The manifest has seven changed asset paths and no removed paths. Only the four changed Informatics assets were uploaded; the existing scoped Lab and Events workflows were retained.

Proof: https://staging.universalmind.tv/lab/research.html and https://staging.universalmind.tv/events/?experience=1

The following verification commit records this release note, QA evidence, final deployment manifest and test synchronisation fixes. It introduces no additional website source.
