# Staging deployment: DynamoDB arrival consent

Date: 2026-07-30 (Australia/Sydney)

Scope: staging only. Production was not modified.

## Recorded source

- Foundation and interface source: `dea6df3`
- Check-in cache-buster correction: `eeb68a6`
- Scoped KMS and operator diagnostics: `2ae832b`
- Payload-free Lambda diagnostic fields: `b0e391a`
- Transaction item permissions: `7d40a1a`
- Visible ownership emphasis: `e8a2512`
- Consent document: `arrival-consent-v3`
- Approved-copy SHA-256: `52f5a4e51b6d4642e87b4ee05afd928c3a6f208a1ea949fe48c3900c45761bc1`

## Deployed staging architecture

- On-demand DynamoDB is the authoritative hot path for pseudonymous browser credentials and current arrival consent.
- The table uses the existing customer-managed KMS key, point-in-time recovery, TTL and a `NEW_IMAGE` stream.
- A filtered, one-record Lambda stream consumer projects immutable consent and rights evidence into Aurora asynchronously.
- Aurora remains at 0-1 ACU and may auto-pause; its resume time is no longer in the visitor's Allow path.
- The Cloudflare edge remains HMAC-gated to the Lambda URL. The backend URL is held as a Cloudflare secret and was refreshed after CloudFormation replaced the function URL.
- Runtime DynamoDB actions are limited to `GetItem`, transactional `PutItem` and transactional `UpdateItem` on the consent table, plus read access to its projection stream.
- Customer-managed KMS actions are limited to the existing key and the DynamoDB service path in the staging account.
- Operator log access is read-only and limited to the staging citizen-data Lambda log group. Diagnostics record error class, AWS action and status only; they do not record request payloads or identifiers.

## Interface proof

- The permissions panel opens on the induction page after Enter the portal is selected.
- The background remains sharp; the panel is compact and app-like with left-aligned copy.
- The sentence uses `deliver`, not `delivery`.
- The full ownership sentence has a verified computed weight of 700.
- `How your data works` is a native new-tab link with `noopener noreferrer`.
- The destination page loads the DynamoDB-v3 client and consent controller with an updated cache key.

## Performance proof

- Returning-browser Allow-to-check-in navigation: 454 ms.
- First synthetic consent immediately after the Lambda/KMS deployment: 4.911 s.
- Four subsequent fresh synthetic consents: 0.633 s, 0.425 s, 1.205 s and 0.193 s.
- Subsequent fresh-consent median: 0.529 s.
- Active-consent status read: 0.424 s.

The 15-second Aurora resume delay is removed from visitor consent. The one-time post-deployment cold result is retained here rather than hidden; provisioned concurrency can be considered later if stakeholders require a hard sub-second cold-start SLA.

## Consent and erasure proof

- Five synthetic, non-human consent grants returned HTTP 201 for `arrival-consent-v3`.
- The browser credential was issued as `Secure`, `HttpOnly`, `SameSite=Strict`, path `/`, with a one-year maximum age.
- All five grants projected into Aurora without querying or recording citizen identifiers in this deployment record.
- All five synthetic identities then returned HTTP 202 through the erasure control.
- All five withdrawals and all five erasure requests projected into Aurora.
- A post-erasure status check returned `granted: false` with `invalid_credential`.
- The DynamoDB projection stream finished in `OK` state.
- No check-in, conversation, genomic, biometric or HAPPINESS payload was submitted during this proof.

## Cost boundary

- DynamoDB remains on-demand with no provisioned read or write capacity.
- No provisioned Lambda concurrency was added.
- Aurora remains configured for 0-1 ACU with automatic pause.
