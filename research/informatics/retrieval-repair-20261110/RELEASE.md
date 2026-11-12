# Literature retrieval repair — 10 November 2026

The staging Worker used an unsupported redirect mode. Cloudflare rejected PubMed, Europe PMC, paper-reader and Perplexity requests before dispatch. All three retrieval modules now use manual redirect handling and reject non-success responses without following a redirect.

The workerd regression reproduces the original failure, exercises Search and Agent API transports with fixtures, and proves redirect targets receive no request. Free live workerd requests returned CD38 literature from PubMed and Europe PMC and selected original-paper passages.

On the permanent staging page, the complete CD38 connection-test journey returned PubMed and Europe PMC evidence plus a real Perplexity Search result, followed by a cited Astra answer in the interface. A separate ordinary CD38 question returned findings, citations and limitations without provider-status diagnostics. Dictation recorded synthetic speech, transcribed it and submitted the resulting text. Live voice completed a real WebRTC exchange and displayed its response beside the inline waveform. Dedicated Chromium used process-level audio muting; each browser closed after verification. Two earlier dictation test assertions checked asynchronous state too early or referenced an unavailable diagnostic field; the corrected test waits for the actual chat input. The product transcription code remained unchanged.

Visible page content is byte-identical apart from generated source hashes and dataset integrity metadata. All 15 changed public files match staging. Complete JSON and CSV exports reconstruct all 1,196 source records.

Source commit: `91de0986052303c717d2a3c30b8da5a67634b4a9`. Staging Worker version: `af233844-2358-4839-b92a-ac192203e6ae`.

The approved additional US$2 OpenAI verification allowance retains a conservative used-or-reserved upper total in release.json, including the voice reservation. The live Perplexity Search check uses US$0.005 from its existing separate allowance. No new Opus live request, study, quantum hardware or GPU job was launched. Opus transport has runtime fixture coverage; this repair does not establish biological Agent API availability. The shared AWS study-worker activation remains pending its separate approval. Production remains unchanged.
