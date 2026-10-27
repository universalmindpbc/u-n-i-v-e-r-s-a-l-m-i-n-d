# Individual article badge display — staging verification

Single-cross badges are hidden on individual article headings in search results, chapter reading, and article details. Two- and three-cross article badges remain visible. Chapter ratings and the underlying study records are unchanged.

- Source commit: `97e1ac6f74585d630b442198cf589972bc9f0ce0`
- Deployed through `./deploy-panthur-staging.sh informatics` on 27 October 2026.
- Two changed public assets uploaded: `library.html` and `library.js` (cache version 21).
- Live browser checks passed for Sound, Vision, and Language at 1470, 390, and 320 pixel widths. Single-cross chapter headings and the chapter legend remain visible; individual single-cross badges are absent from search, article details, and chapter reading.
- Sound Mind Warrior retains three crosses in search, article details, and chapter reading.
- Live HTML and the versioned script match the committed files byte for byte.
- JavaScript syntax, reading-page generation, export integrity, and the existing staging deployment preflight passed.
- Browser checks used a separate headless Chromium process with `--mute-audio`, then closed it.
- Production was not modified by this task.

Proof: https://staging.universalmind.tv/informatics/library.html?collection=sound&view=search
