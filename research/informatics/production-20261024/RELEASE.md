# Informatics production release — 24 October 2026

Ben explicitly approved publication of the entire completed Informatics staging website, including the Molecular Atlas animations. The approved staging reference is `6411df6646853c7da118ca8edb74ac3ee4b049b0`. Prior production is `d82c7ae080a5236cd1029bd9605d7b4e3988feb4`.

## Production configuration

Source `a3e4ab3c` enables the existing Universal One interface on the production hostname, adds the dedicated production Worker configuration, and makes Atlas citation links use the active site origin. Approved research wording, grades, data and visual behavior are unchanged. Staging and production retain separate origins, rate-limit namespaces and usage counters. Both read the same research release. Secrets remain outside Git.

## Staging verification

The existing Panthur workflow uploaded the three changed frontend files after all preflights passed. Staging Worker version: `8d9cd994-0cf0-42bd-95d4-54c5a1de48e9`. The live research test passed 17 layouts across four widths, including black/white/video backgrounds, Research entry from the Atlas and network, paper overlays and standalone Research. A real request reached the research service and Astra, and a cited answer appeared in the interface. Live voice connected, greeted with Hi, decoded remote audio and retained its session when Research opened and closed. Synthetic microphone only; separate muted Chromium; media paused and browser closed. Visitor allowance was unchanged by QA. Details: `staging-ai.json`.

Production verification follows after deployment.
