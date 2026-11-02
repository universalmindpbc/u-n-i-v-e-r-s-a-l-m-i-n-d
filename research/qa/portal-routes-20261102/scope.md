# Portal routes and sitemaps — staging scope

Baseline: 05da69656bbe9fae4498e306d1e1b9171b51e372. Production baseline: a2d6cb9b83340e841c9362cefd5d193aff63ee56.

Approved scope: clear Informatics and I AM chapter URLs; maps in existing global navigation order; main map including Events and Festivals; compatibility for old URLs and research selections; retained media during chapter navigation. Existing page wording and layout remain the source for each chapter. Production is excluded.

Local verification uses the candidate source at intercepted staging addresses, with actual staging media and services. A separate Chromium process launches with process-level audio disabled. Fullscreen ownership is instrumented, never native. Playback assertions compare element identity, source, advancing time, mute and volume settings, and fullscreen owner. Check-in browsing is covered; its existing submit action and inference pipeline are not changed or exercised by these route tests.

The root and portal maps are separate from the XML index. Record and publication sitemap files retain the existing reading records. Immutable complete-export revisions preserve their earlier versions.

Staging deployment, HTTP checks, browser evidence and the final GitHub audit are recorded after publishing the committed candidate.
