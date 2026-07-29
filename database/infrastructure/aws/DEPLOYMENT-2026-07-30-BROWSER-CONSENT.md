# Staging browser consent and service connection — 2026-07-30

## Scope

- Environment: staging only
- Website source deployed through Panthur: `f5f0969`
- Data: one explicitly fictional browser proof; no real citizen data
- Consent document: `arrival-consent-v1`
- Approved copy SHA-256: `738aea649091259b573476e8fd25c558a7baefee5b657dea480659d8a03a9f9a`
- Production: unchanged

## Live journey verified

1. the arrival page blocked check-in until a privacy choice was made;
2. the consent interface requested no name or email and kept HAPPINESS rewards separate;
3. acceptance created a pseudonymous Universal Citizen credential in a secure HTTP-only cookie;
4. a fictional check-in was envelope-encrypted and acknowledged as “Encrypted and remembered”;
5. Aurora recorded consent, one session, one check-in, one encrypted-object reference, one data-use event and one redacted inference event;
6. the exact versioned ciphertext key was present in the private S3 object store;
7. GPT inference and the adaptive selector completed, and the homepage displayed a needs-matched music selection based on the check-in;
8. a new browser visit recognized the existing consent without asking again; and
9. both browser journeys completed with no relevant console warning or error.

The retained record is synthetic staging evidence only. Its wording explicitly identifies it as a browser proof, and no name, email, IP address, device fingerprint, reward field or plaintext mental-health payload appears in Aurora metadata. It remains active temporarily to verify cross-session continuity; the existing withdrawal and erasure service path will be connected to a member-facing data-rights interface in a later phase.

## Security evidence

- The staging page uses only the same-origin citizen-data route.
- Cloudflare enforces exact origin matching, a required request header, a 30-request-per-minute limiter and `no-store` responses.
- Cloudflare signs every backend body with a fresh timestamp, nonce and HMAC signature.
- The AWS Lambda rejects unsigned calls before database or object-store access.
- Redirects from the configured backend are handled manually and rejected rather than followed.
- The Lambda uses temporary AWS execution-role credentials; no static AWS access key exists.
- The generated edge HMAC key is canonical in AWS Secrets Manager and mirrored only into Cloudflare’s encrypted Worker secret store.
- AWS Secrets Manager is the intended source of truth for all service and API credentials; future migration and rotation work must not expose secret values.

## Deliberate boundaries

- HAPPINESS and Fhenix rewards consent remain a separate in-app journey.
- Zama FHE shadow traffic remains disabled.
- Storj replication, Pinecone, Vertex RAG and HealthOmics writes remain disabled.
- No production resources or production website were modified.
- No account identifiers, resource ARNs, bucket names, credentials, private portal URLs or citizen identifiers are recorded here.
