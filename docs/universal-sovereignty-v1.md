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

## Approved free staging storage

Ben approved the $0 Backblaze MVP and a 30-day staging lock on 22 September
2026. Four private buckets in one dedicated B2 account use provider encryption,
Object Lock, and 30-day default retention. The worker explicitly writes in
COMPLIANCE mode. This is one storage provider, not four independent providers.
The console currently shows $0 storage/download caps and free transaction caps.
No payment card or paid service is needed for this plan. No Event Notifications
or paid support is enabled. The source PDF and owner decryption key stay local.

The worker requires `storage_plan: b2-free-v1`, `zero_cost_verified: true`,
`environment: staging`, exactly four different Backblaze buckets in one account,
and `retention_days: 30`. The verified flag is set only after checking provider
caps. It refuses production use; longer retention or a paid tier needs separate
approval. Application keys expire after the 30-day staging trial and each is
restricted to one bucket. The console's Read and Write key preset may include
file deletion; COMPLIANCE locks prevent deletion before retention expiry.

Before each delivery batch, the worker sums every object version across all
four buckets and reserves the full four-copy bundle size plus proof overhead.
Its upload ceiling is 9,000,000,000 bytes, below the account's 10 GB free allowance.
Unknown usage, provider errors and insufficient capacity stop delivery, while
first-entry receipts remain in the private queue and login continues normally.
Provider caps remain the account-wide backstop. This account is dedicated to
these records; unrelated account usage would require a new capacity assessment.

`sovereignty-worker.php` runs separately from login. It sends each complete
signed/encrypted entry plus the encrypted document to all four destinations.
Concurrent writes cannot be guaranteed to complete simultaneously. It records
the immutable object version, checksum, COMPLIANCE mode and exact retention
date. Ambiguous lookups never trigger a replacement upload. A retry reuses the
same matching locked object version. Partial success remains pending.

`sovereignty-run.php` is CLI-only. The authenticated staging operations endpoint
can install one five-minute cron entry on the existing Panthur host, preserving
all unrelated cron lines. An execution lock prevents overlapping runs. Private
status files distinguish scheduler installation from an observed completed run.
Filesystem free space is not represented as proof of the hosting account quota.

`sovereignty-configure` in the existing Panthur deployment script atomically
updates private staging configuration over FTPS. It verifies bytes and refuses
changes to existing identity or authentication keys. Runtime configuration and
credentials remain excluded from Git and ordinary website deployment.

## Background Bitcoin timestamping

Two free OpenTimestamps calendars receive only a SHA-256 digest blinded with a
fresh 32-byte nonce. The standard proof binds back to the complete encrypted
bundle. No document, password, member identifier or owner decryption key is sent
to a calendar or blockchain explorer. The pending proofs are retained privately.
The scheduled worker upgrades them fairly, with bounded retries and response
sizes, without holding up login or the four storage copies.

Only a proof whose computed Merkle root matches the same block header reported
by both Blockstream and mempool.space, with a valid header hash/proof of work and
at least six confirmations at both indexes, becomes `bitcoin_confirmed`.
This uses two public explorers, not a locally validating Bitcoin full node.
Unavailable services, malformed proofs or disagreement remain pending. A
confirmed `.ots` proof is saved for independent owner verification using the
standard OpenTimestamps client. No wallet or blockchain transaction fee is used.

The private archive records portal entry only. It does not establish consent,
a signature on a contract, token issuance or entitlement. Object locks expire;
status reports expired locks separately and does not silently renew them.

## Proof and operations

`tools/check-sovereignty.mjs` tests actual PHP code in isolated PHP 8.3, including
credential checks, replay prevention, decryption, signatures, tampering and
unconfigured delivery. `tools/check-sovereignty-browser.mjs` compares desktop and
mobile navigation against the old timing with stalled, failed and throwing
recording requests, in a dedicated Chromium process with `--mute-audio`.

`sovereignty-status.php` requires the private worker bearer token. GET returns
counts only. A staging-only POST with `{"action":"self_test"}` exercises signing,
encryption and idempotency in a separate synthetic namespace excluded from
audience records. `deliver_test` replicates only that diagnostic, and
`timestamp_test` submits its blinded digest. None can run without the private token.

Complete and record live four-copy upload/read/lock/retry/restore tests and an
observed scheduled run before describing the archive as operational. The
staging diagnostic's event, delivery and timestamp files are isolated from
audience records. Runtime status, not this design document, is authoritative
for connection, delivery and Bitcoin confirmation status.
