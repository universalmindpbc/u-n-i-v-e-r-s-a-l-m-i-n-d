# Universal Sovereignty v1

This is a private record of the first **successfully recorded portal entry since
activation**, once per distinct assigned password. It is not member consent,
contract execution, proof of a person's identity, or token issuance. No earlier
login history is inferred or backfilled. Password reassignment/replacement needs
an explicit migration of the private identity mapping before use.

## Login

The existing local password gate, presentation and 700ms transition are unchanged.
After scheduling navigation, an independent HTTPS keepalive POST sends the
password for server verification. No password, document, key or receipt is stored
in browser persistence. Two bounded, in-memory retries handle transient errors
while the gate remains open. The HTTP response never exposes archive contents.

Server verification uses the same current password allowlist as the portal and
study. The existing browser gate is not itself a server access-control boundary;
confidential content is never made available through that gate. The private
recording endpoint validates the actual password, never a client-supplied digest.
The existing passwords must be distinct per person, as specified by Ben.

No fire-and-forget browser request can guarantee delivery when the network or
server is unavailable. In that case entry still proceeds; a later valid login
can create the first recorded entry. The record uses its actual server recording
time and does not claim the earlier failed attempt was captured. Guaranteed
durable capture before entry would require waiting for an acknowledgement.

## Private archive

The original lives in the owner's ignored `.private/universal-sovereignty`
directory, outside the site assets. The sealed PDF adds 48 points of header space
and the existing 30-point Universal Mind flora at upper left on all 17 pages.
Original text and attribution are preserved. The document is encrypted before
any upload using AES-256-GCM and an RSA-OAEP envelope. The owner's decryption
private key is never uploaded. Keep a separate encrypted offline backup of it.

The server uses an RSA public encryption key, a separate private signing key, and
a random private HMAC identity key. Each entry is signed and encrypted, with a
random event ID. Passwords, password hashes, names, emails, IP addresses and user
agents are excluded from the archive. Hosting access logs can still contain
connection metadata; this is pseudonymous, not absolute anonymity.

Only ciphertext and operational secrets occupy the HTTP-denied
`api/.runtime-private/sovereignty` area, excluded from ordinary deployments.
Provisioning uses the existing Panthur deployment script's `sovereignty-seed`
mode over FTPS, stages `.htaccess` first, verifies bytes, refuses replacement of
different existing keys, and enables the archive by uploading config last.
Clear PDFs and the owner decryption key are never eligible for provisioning.

## Four copies: account setup still required

There are no vault accounts yet. `vaults: []` and `retention_days: null` deliberately
leave delivery pending. The Panthur queue is not one of four immutable copies.
No blockchain timestamp has been submitted; no token has been issued.

Provision four private, versioned S3-compatible buckets with Object Lock, across
AWS and Backblaze B2, using distinct storage locations and independent accounts.
Choose an explicit retention period with Ben before enabling compliance locks.
Keep the accounts active and monitor renewal of retention before expiry; these
locks do not promise infinite retention or survival of account closure.
The private config's vault entries contain: `id`, `provider` (`aws` or `backblaze`),
`account_label`, `region`, `endpoint` (HTTPS S3 origin), `bucket`, `access_key`,
`secret_key`, and optional `session_token`. Credentials need read/version/retention
inspection and Object Lock PUT permissions, without delete/bypass permission.
Do not paste credentials into chat or commit this config.

`sovereignty-worker.php` runs separately from login, under a hosting cron or an
authenticated operational POST using the private worker token. No scheduler is
configured yet. It sends the same complete encrypted document-and-entry bundle
to all four destinations concurrently. It verifies version IDs, body metadata,
COMPLIANCE lock and retention date before marking a destination secured. A retry
reuses a matching locked version. Partial successes remain pending and are
retried; an event is complete only after four independently verified copies.
The worker's live S3 operations cannot be verified until accounts are connected.

Keep event files and their matching encrypted document version together. This v1
accepts only one immutable document version per runtime; do not replace it while
queued entries exist. A new document or credential scheme requires a migration.

## Proof and operations

`tools/check-sovereignty.mjs` tests actual PHP code in isolated PHP 8.3, including
credential checks, replay prevention, decryption, signatures, tampering and
unconfigured delivery. `tools/check-sovereignty-browser.mjs` compares desktop and
mobile navigation against the old timing with stalled, failed and throwing
recording requests, in a dedicated Chromium process with `--mute-audio`.

`sovereignty-status.php` requires the private worker bearer token. GET returns
counts only. A staging-only POST with `{"action":"self_test"}` exercises signing,
encryption and idempotency in a separate synthetic namespace excluded from
audience records and replication. It cannot be run without the private token.

Finish account provisioning, retention selection, worker scheduling, and live
four-copy upload/read/lock/retry/restore tests before describing delivery as
operational. Future blockchain timestamping should publish only randomised
commitments and remain outside the entry path. Future token issuance requires a
separate explicit workflow; v1 contains no entitlement or minting action.
