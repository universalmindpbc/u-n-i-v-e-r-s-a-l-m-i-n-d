# Citizen data service-flow staging validation — 2026-07-30

## Scope

- Environment: staging only
- Region: Sydney (`ap-southeast-2`)
- Data: fictional synthetic fixtures only; no real citizen data
- Tested source: `c08f9fc`
- Production: unchanged

## Validated flow

The application service boundary completed this sequence against the live
staging foundation:

1. accepted a published arrival-consent document;
2. issued a pseudonymous Universal Citizen browser credential;
3. recorded one encrypted check-in;
4. recorded two encrypted Universal One conversation turns;
5. wrote Aurora metadata, consent lineage and data-use evidence;
6. completed an encrypted export;
7. withdrew consent and immediately failed closed;
8. completed erasure in Aurora and removed every exact S3 object version.

## Privacy and cryptographic evidence

- Check-in, citizen-turn, Universal One-turn and export payloads were encrypted
  with AES-256-GCM envelope encryption and KMS-wrapped data keys.
- The validator downloaded each stored ciphertext version and confirmed that
  none of the fictional plaintext strings appeared in it.
- Each Aurora encrypted-object row recorded its exact S3 version identifier.
- Erasure used those identifiers, rather than an unversioned key delete.
- Consent withdrawal revoked the pseudonymous browser credential before the
  erasure workflow continued.
- The final independent audit found zero incomplete synthetic citizens, zero
  live encrypted objects, zero live credentials and zero incomplete data-rights
  requests.
- The isolated synthetic S3 prefix contained zero object versions and zero
  delete markers after validation.

## Recovery evidence

Two earlier synthetic preflight fixtures stopped safely while the exact-prefix
and exact-version IAM permissions were being narrowed. No public runtime was
enabled. Their object versions were removed and their metadata was retired
before the successful run. The final audit covered all three fixtures.

## Deliberate boundaries

- The public arrival-consent interface and browser-to-service runtime remain
  disabled pending founder-approved consent language and a staging proof.
- Current visitor check-ins and conversations were not uploaded or inspected.
- Rewards consent and HAPPINESS/Fhenix data remain a separate, later in-app
  path.
- Zama FHE shadow processing, Storj replication, RAG and HealthOmics writes were
  not activated by this validation.
- No account identifiers, resource ARNs, bucket names, credentials, portal URLs
  or synthetic citizen identifiers are recorded here.
