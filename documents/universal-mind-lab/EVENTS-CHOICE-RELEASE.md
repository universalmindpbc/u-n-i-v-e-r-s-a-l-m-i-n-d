# Events choice — staging release

The homepage’s Attend Events entry opens two choices: Universal Mind Lab and A Thousand Minds. The existing invitation session is reused; the root navigation shell remains the fullscreen owner. The Lab landing and film behaviour remain unchanged.

- Choice: `/events/?experience=1`
- Universal Mind Lab: `/lab/`
- A Thousand Minds: `/events/?experience=1&event=athousandminds`
- Home return on the choice, Events return in A Thousand Minds, browser Back from the Lab.
- Existing artwork and a clean capture of the approved Lab landscape; no new autoplay on the choice itself.

Validation uses `tools/check-events-choice.mjs`: local-source responsive checks followed by the real staging login, homepage, choice, both destinations, Lab media decoding, Back, and Home return. The dedicated headless Chromium process has `--mute-audio` confirmed before navigation; native fullscreen is disabled for QA. The live report and selected screenshots are in `qa/events-choice/`.

The Lab design approval applies to the staged revision at `847d054528e60a69f36571cefb46ad31eeb79643`. Production remains unchanged.

## Verified staging candidate

- Source commit: `b2d765d0b641aeb3e82dbeb1bf8f3cd0c1278964` (initial choice commit `c2d2f5493b4d7d73d2b6c4537d2e58f151dd495b`).
- Verified at 2026-11-02T11:54:22.248Z: real login, both choices, Home return, repeated immediate navigation and browser Back.
- Layouts: 1440 × 1000, 390 × 844 and 844 × 390.
- Lab music/video decoded after entry at 7% opacity in the isolated muted process.
- Four served asset hashes and all 24 Events deployment-manifest entries match the committed source.
- No JavaScript errors. Native fullscreen, physical iPhone and subjective sound quality were not tested.
- An early-click timing case was resolved by installing Events navigation before the links render.
