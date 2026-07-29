# Citizen data foundation staging deployment — 2026-07-29

## Scope

- Environment: staging only
- Region: Sydney (`ap-southeast-2`)
- Stack: `universal-mind-citizen-data-staging`
- Data: fictional synthetic fixtures only; no real citizen data
- Production: unchanged

## Deployed controls

- Aurora PostgreSQL `16.8`, Serverless v2, `0–1` ACU
- Five-minute idle auto-pause (`300` seconds)
- Private database instance with no public network access
- Encryption at rest, managed database secret, KMS key rotation and S3 versioning
- Deletion protection enabled on the database cluster
- Data API enabled for migration and validation without opening database ingress
- S3 public-access blocks, KMS default encryption, access logging and lifecycle rules
- Independent `$30` monthly AWS prototype budget with actual-spend alerts

## Migration evidence

- Foundation migration executed transactionally through the Data API
- `88/88` statements completed
- Transaction committed successfully

## Synthetic validation evidence

The deployed stack passed all of the following checks:

- Four encrypted payload classes uploaded with KMS-backed S3 encryption
- Core data collection failed closed without consent
- Row-level citizen isolation held across two synthetic identities
- Consent receipts rejected mutation and remained append-only
- Citizen export workflow completed
- Citizen erasure workflow completed
- Four encrypted-object records are erased and zero remain live
- Two synthetic data-rights requests are completed
- The temporary database runtime role was removed
- Temporary object-validation access was removed after the run

Encrypted objects were deleted by their exact S3 version identifiers during the
validation cleanup. The validator emits a failure marker if any object cleanup
does not complete; no such marker was emitted by the successful run.

## Capacity evidence

- Database connections reached zero at `21:14 AEST`.
- The five-minute auto-pause transition began during the `21:19 AEST` interval.
- The `21:20 AEST` `ServerlessDatabaseCapacity` datapoint reported minimum,
  maximum and average capacity of `0.0` ACU.
- Capacity metrics were read through CloudWatch and did not wake the database.

## Audit boundary

This record deliberately excludes AWS account identifiers, resource ARNs,
bucket names, portal URLs, credentials and synthetic citizen UUIDs.
