# Universal Sovereignty production activation — 23 September 2026

Universal Sovereignty is enabled on production. This release also publishes the separately approved Participate re-authentication fix.

## Version and deployment

- Prior production: `53295e47dcf1a61aae3bd4a72043d29f3b6c70d5`.
- Sovereignty source: `45b3255`; approved Participate ancestry: `7fdc1f1` / `1aca38d`.
- Exact combined staging candidate deployed to production: `e7a98ea6590aaaf08f7938e8a2bfa07be7513392`.
- Existing Panthur scripts deployed seven changed non-video files and root redirects. Protected owner runtime was verified unchanged.
- Private provisioning used certificate-verified FTPS, installed HTTP denial before secrets, verified uploaded bytes and installed configuration last. The owner's decryption key stayed local.
- Four non-expiring production credentials each access one existing private bucket. Production uses separate signing, identity and worker credentials and object namespaces.

## Verified

The actual production diagnostic passed signing, encryption and duplicate prevention without creating an audience record. All four stored copies were downloaded and decrypted locally: signatures verified, each restored PDF matched the approved sealed PDF exactly, and all four encrypted bundles matched. Every copy has provider encryption and a 30-day COMPLIANCE lock. Deletion of each isolated diagnostic version was denied, as was anonymous access. Delivery retries preserved exactly one original version per bucket.

Private configuration, document and signing-key URLs returned 403. Unauthenticated administrative access, cross-origin recording and staging credentials on production were rejected. Seven production PHP files matched the candidate byte for byte. The served portal gate matched the approved source after accounting for the existing CDN analytics injection.

Production browser checks passed for the actual gate and archive diagnostics. Desktop/mobile failure simulations preserved the approximately 700 ms transition. All browser processes used process-level audio muting and were closed after testing.

The production scheduler was installed at 20:16:25 UTC. An actual scheduled run started at 20:20:02 and finished at 20:20:04 UTC with no capacity block. Staging's scheduler and existing four-copy record remained healthy. Hosting quota was verified with approximately 16.9 GB available and unlimited monthly bandwidth. Backblaze $0 caps and the worker's 9 GB storage ceiling remain in place.

Two blinded OpenTimestamps proofs were accepted. Bitcoin confirmation remains pending; automatic proof upgrades run in the background worker.

The real production music → Research → Participate journey opens a password gate, and the real API rejects invalid credentials. Successful password entry, consent, first Heart Check, saved-session restoration and re-entry were verified with the production-served interface against isolated production-source PHP and a synthetic credential. No production research participant was created.

## Limits

No real member password was supplied for testing. Live archive proof used the isolated production diagnostic namespace; ordinary successful credential recording was verified against the exact PHP source in isolation. Final runtime verification showed zero real production archive entries and one diagnostic secured in all four buckets. Future valid portal entries use the active production recording path.

The four copies share one Backblaze provider/account and their locks last 30 days. Bitcoin confirmation is asynchronous and has not been claimed as complete. This MVP records first successfully captured portal entry; it does not execute a contract, establish consent or issue tokens.

The accompanying JSON contains detailed evidence. Prior four-feature integration evidence remains in `four-thread-production-2026-09-22.md` and `.json`.

## Links

- Live portal: https://universalmind.tv/
- Live research login: https://universalmind.tv/study
- Permanent staging: https://staging.universalmind.tv/
- Research ending test (30 seconds remaining): https://staging.universalmind.tv/vogue/iam/study-ending-test.php
