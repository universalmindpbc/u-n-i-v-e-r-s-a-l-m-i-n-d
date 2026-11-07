# Lab footer centre alignment

The initiative credit and Proposal text now align with the page centre, accounting for the unequal logo columns. The only website source changes are partner-marks.css and its versioned link in index.html.

Source commit: ec50924dba580e48fedced3993abe106d7cc0dfe
Baseline: b42e9ca62c9eb8347fbe649582296c7f0a6697d2
Staging route: https://staging.universalmind.tv/lab/

Verification measures the credit and proposal midpoint against the viewport midpoint at 390 × 844, 320 × 740, 844 × 390, 667 × 375 and 1440 × 1000. It also checks text clearance from both logos and footer overflow. The dedicated hidden browser has --mute-audio before navigation; native fullscreen is intercepted and media is paused before the browser closes.

Production has not been modified.

All five live sizes passed, with maximum centre error below 0.01 CSS pixels and no text/logo overlap. Both changed files matched local SHA-256 values over HTTPS; the deployment manifest matches all 130 Lab files.
