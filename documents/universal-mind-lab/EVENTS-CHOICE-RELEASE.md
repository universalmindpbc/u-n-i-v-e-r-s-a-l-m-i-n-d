# Events choice — staging release

The homepage’s Attend Events entry opens two choices: Universal Mind Lab and A Thousand Minds. The existing invitation session is reused; the root navigation shell remains the fullscreen owner. The Lab landing and film behaviour remain unchanged.

- Choice: `/events/?experience=1`
- Universal Mind Lab: `/lab/`
- A Thousand Minds: `/events/?experience=1&event=athousandminds`
- Home return on the choice, Events return in A Thousand Minds, browser Back from the Lab.
- Existing artwork and a clean capture of the approved Lab landscape; no new autoplay on the choice itself.

Validation uses `tools/check-events-choice.mjs`: local-source responsive checks followed by the real staging login, homepage, choice, both destinations, Lab media decoding, Back, and Home return. The dedicated headless Chromium process has `--mute-audio` confirmed before navigation; native fullscreen is disabled for QA. The live report and selected screenshots are in `qa/events-choice/`.

The Lab design approval applies to the staged revision at `847d054528e60a69f36571cefb46ad31eeb79643`. Production remains unchanged.
