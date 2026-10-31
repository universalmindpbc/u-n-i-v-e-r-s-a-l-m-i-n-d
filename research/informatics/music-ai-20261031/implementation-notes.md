# Music Atlas machine access — 31 October 2026

Base staging: 26ca796910c25c21f98d01b74f614a57f21ec60f.
Production baseline: 4900e9e0a33a85c154104b25ec09586a03216675.

Ben requested native machine access to the existing Music Atlas, with its human experience preserved. The authorized visible addition is a bottom row linking the Music Atlas AI / LLM Wiki and downloadable JSON, CSV and Markdown; the Wiki repeats the downloads.

A build-time generator reads the existing atlas-visuals.js declarations. All six approved explanation sets, workings, equations, settings and tables enter the initial HTML, an application/json block, structured metadata, a standalone JSON record, a complete typed-path CSV, Markdown and the plain HTML Wiki. The measurement chapter and its three figure descriptions retain their approved wording. No participant measurements are fabricated from the mockup images.

The runtime JavaScript, existing styles, visible copy, navigation, charts, media and three image assets are unchanged. Source comparison strips only the generated machine blocks, metadata and authorized footer before checking the original HTML. The new Wiki is readable with JavaScript disabled. The only new stylesheet selectors on the Atlas target the authorized footer.

Existing AI guides, the resource directory and sitemap discover the Music reading page. Existing sitemap URLs remain present. All 1,177 prior structured records and all 9,018 prior asset records remain unchanged. The new JSON and CSV enter the standard complete exports, which reconstruct all 1,179 source records.

Verification uses a separate headless Chromium process with --mute-audio confirmed before navigation. No native fullscreen is invoked. Automated media is paused and contexts are closed after checks. Source and HTTP checks establish delivery and parseability; no claim is made that every external AI product was exercised.

The established Panthur staging workflow and GitHub audit remain in use. Production publication is outside this task’s authorization.
