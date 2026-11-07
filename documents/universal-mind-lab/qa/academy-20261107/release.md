# Universal Academy and partner marks staging proof

- Staging route: https://staging.universalmind.tv/lab/
- Source commit: 8fc0c25152df334ad01647d0a578fb8cb4783ce1
- Baseline: f12cd6d73dc6d430688b375f63818fc9c30839fa
- Source scope: six Lab files, with no change to the original learning dialog or lab.css.
- About now introduces Universal Academy micro schools and live briefs for the world of work.
- Separate STEAM circle: Artificial Intelligence at the centre; AI literacy, music and film, fashion design and pattern making, AI agents, genomics and bioinformatics, then quantum computing clockwise.
- Separate learning continuum: students, mentors and clients, with “everyone learns together as one”.
- Main footer only: CSIRO and Live Nation use the existing footer text colour by day and white by night. The existing proposal notice remains.
- Existing Panthur staging script deployed the committed source; the resulting manifest matches all 130 tracked Lab files.
- Browser checks use hidden Chromium with process-level --mute-audio confirmed before navigation. Native fullscreen requests are intercepted. Playback is paused and contexts are closed after checks.
- Mobile theme checks invoke the existing day/night handler directly because the current mobile interface hides that control. Dialog checks exercise the visible About buttons, Escape and close controls, focus return and scroll restoration.
- This change has no AI API integration. Media sound quality was outside this verification.
- Production was not modified. Production main remained eb01597176ddf920a4c16a34b4f78afe06a5e38e.

Live verification passed at 1440 × 1000, 390 × 844, 320 × 740 and 844 × 390. Six changed assets matched local SHA-256 values over HTTPS. No browser page errors or failing staging responses were recorded.
