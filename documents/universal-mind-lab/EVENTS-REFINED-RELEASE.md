# Events landing and youth research — staging release

Verified on 3 November 2026, Australia/Sydney.

Website source: `cb3f2aa37318314acce81134542e4fa09f34f9c3`.

## Visitor experience

- The Events choice uses the original centred Universal Mind flower, small Bodoni 72 / Didot serif titles and Fibonacci rain. Universal Mind Lab sits above the flower and A Thousand Minds below it; short landscape layouts place the choices either side. No posters or large display titles remain.
- Events continues directly into the festival pop-up. The music-video blend is restored to 7%.
- The proposal heading reads **Free access. Dissolving stigma. Clear pathways to support.** The brief preserves Ben’s instruction to retain signed-off wording.
- **A direct response to this body of research ↗** appears at the festival footer’s right edge. It opens `/lab/research.html` in a separate tab, preserving the festival tab.
- The research page introduces the full approved collection of 105 publications. Orygen and Black Dog Institute are featured, alongside nine topic links across music, sound and brain entrainment, EMDR, mindfulness, mantra context, Transcendental Meditation, yoga, access and connection.
- Universal Informatics remains the single research home. The Lab contains an introduction and index; the papers, dropdowns, filters, findings and assessments remain in Informatics. Institution groups overlap, and the mantra section retains its research context.

## Deployment and verification

The exact committed website source was deployed through `./deploy-panthur-staging.sh lab` and `./deploy-panthur-staging.sh events`, using the established Panthur transport.

- Lab source, original references and DOM bindings passed the existing preflight. Portal navigation passed 14 legacy routes and 29 chapter checks. JavaScript syntax and whitespace checks passed.
- The real staging journey passed: invitation → homepage → Attend Events → both destinations, Home return, browser Back and repeated immediate entries. The retained root shell and authenticated session remain intact.
- The Lab launched with decoded video, advancing playback and computed opacity `0.07`. The proposal retained the exact approved heading.
- Events titles use the Informatics serif stack at 16–20px. The original flower remains centred at 1440 × 1000, 390 × 844 and 844 × 390; no poster graphics or horizontal overflow appeared.
- At all three viewport sizes, the research footer link has its own visible space and opens a separate tab. The festival URL remains unchanged. The research index has two featured institutions and nine topic links, all pointing to Informatics.
- The full-collection link opened the canonical Informatics library with exactly **105 papers**. Orygen, Black Dog Institute and mantra links resolved to their topic sections.
- Served source hashes matched the committed Lab and Events assets. All 63 Lab and Events deployment-manifest entries matched the committed files.
- Browser checks used a separate Chromium process with `--mute-audio` confirmed before navigation. Media was paused and contexts closed afterwards. Native fullscreen was never invoked. The research layout check mocks playback; the authenticated Events check separately verifies real media decoding.

Compact reports and screenshots are retained in `qa/events-refined/` and `qa/research-entry/`. Physical iPhone/Safari behaviour and subjective audio quality were not tested. No OpenAI workflow changed.

## Proofing routes

- https://staging.universalmind.tv/events/?experience=1
- https://staging.universalmind.tv/lab/?launch=1
- https://staging.universalmind.tv/lab/research.html

Production has not been modified.
