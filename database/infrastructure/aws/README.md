# AWS staging foundation

These files define the AWS infrastructure. The foundation deployment is recorded
in `DEPLOYMENT-2026-07-29.md` and the first synthetic application-flow proof in
`DEPLOYMENT-2026-07-30-SERVICE-FLOW.md`; future changes remain billable and
require review against the same cost boundary.

Read `TEARDOWN.md` before executing a change set. The database, buckets and KMS
key are retained by design, so deleting the CloudFormation stack alone is not a
complete cost stop or erasure procedure.

## Authentication

Use AWS IAM Identity Center and temporary credentials. Never create or paste a root access key or long-lived IAM user key.

The AWS account's private portal URL, account identifier, permission-set identifier and cached SSO token remain in the local AWS configuration only. They must not enter this repository, deployment logs, chat transcripts or Cloudflare configuration.

Expected terminal flow after an Identity Center user, permission set and account assignment exist:

```text
aws configure sso --profile universal-mind-staging
aws sso login --profile universal-mind-staging
aws sts get-caller-identity --profile universal-mind-staging
```

AWS CloudShell is an acceptable bootstrap alternative because it inherits the signed-in console session and does not require exporting an access key.

AWS Secrets Manager is the canonical vault for service credentials and third-party API keys. Edge or application platforms may receive only the minimum runtime secret they require; that value is a managed mirror, not a second source of truth. Future credential work should inventory names and rotation state without reading values, migrate remaining local or hosting copies into AWS, and automate narrowly scoped rotation from AWS to each approved runtime.

## Region split

- IAM Identity Center remains in its configured primary region.
- Citizen data resources are intended for `ap-southeast-2` after data-residency review.
- The region is always supplied explicitly during validation and deployment.

## Staging stack

`citizen-data-staging.yaml` creates:

- one customer-managed KMS key with annual rotation and a 30-day deletion window;
- one private KMS-encrypted S3 object bucket;
- one private S3 server-access-log bucket;
- one isolated VPC with two non-public subnets;
- one private Aurora PostgreSQL Serverless v2 cluster;
- one `db.serverless` writer;
- automatic pause to 0 ACUs after 5 idle minutes, using a compatible engine version;
- an AWS-managed database password in Secrets Manager;
- RDS Data API access, avoiding a public database endpoint or a long-lived database credential outside AWS;
- one staging-only Lambda service with an AWS execution role, two-execution concurrency cap and 14-day structured-log retention;
- one KMS-encrypted DynamoDB on-demand table that is authoritative for active consent and pseudonymous browser credentials;
- one filtered DynamoDB Stream projection that copies consent evidence into Aurora asynchronously, so the arrival interface never waits for Aurora to resume;
- one generated edge-to-Lambda HMAC secret in Secrets Manager;
- one Lambda function URL that rejects every request without a fresh valid edge signature.

Every stateful resource uses `DeletionPolicy: Retain`. The database has deletion protection enabled. No public ingress rule is created.

## Cost boundary

The AWS Price List API returned **USD $0.20 per ACU-hour** for Aurora PostgreSQL
Serverless v2 in Sydney on 2026-07-29. AWS rejected a 0-to-0.5 ACU range during
the first synthetic-only creation rehearsal because this platform requires the
maximum capacity to be at least 1 ACU. The approved prototype is therefore
constrained to an exact 0-to-1 ACU range and pauses after five idle minutes.
Instance-capacity cost is zero while fully paused and no more than USD $0.20 per
active hour. The continuous-awake ceiling is about USD $146 per 730-hour month,
but that is not the intended mode and would exceed the prototype budget.

The separately configured monthly AWS cost budget is USD $30, with actual-cost
email alerts at USD $10, $20, $25 and $30. AWS Budgets is an alerting boundary,
not a real-time hard stop, because billing data can be delayed. Any future
billable change set must remain unexecuted until its cost impact is reviewed and
the founder explicitly approves execution.

Those figures exclude Aurora storage and I/O, backup storage, S3, CloudWatch,
Secrets Manager and data transfer. The customer-managed KMS key starts at USD
$1 per month, plus chargeable requests. Prices must be refreshed immediately
before any change set is executed. Automatic pause introduces a resume delay.
The browser consent path therefore writes durably to DynamoDB first and returns
without waiting for Aurora; the asynchronous projection may wake Aurora after
the visitor has continued. Benchmarks record the browser hot path and the
background Aurora projection separately.

The Lambda service uses 256 MB memory and reserves at most two concurrent
executions. Lambda request and compute charges are usage-based and expected to be
negligible during staging. The Cloudflare edge rate limiter additionally caps
browser requests before they reach AWS. These controls reduce accidental spend;
they do not turn the USD $30 budget alert into a hard billing stop.

## Staging browser service path

The browser calls a same-origin route under
`/vogue/iam/api/citizen-data/v1/`. A staging-only Cloudflare Worker handles the
secure pseudonymous cookie, checks the page origin and rate-limits requests. It
then signs a short-lived HMAC request to Lambda. The browser never receives the
Lambda URL, HMAC secret, AWS credentials, database credential, citizen UUID or
encryption key.

Lambda uses its AWS execution role to call DynamoDB, the RDS Data API, KMS and
the private versioned object bucket. New consent grants and credential checks
use the on-demand DynamoDB ledger. DynamoDB Streams projects the same immutable
evidence into Aurora in the background; Aurora remains the relational metadata
store for sessions, check-ins, conversations, data-use events and rights
workflows. No long-lived AWS access key is created. The Lambda URL
is publicly routable at the network layer, but unsigned or stale requests fail
before any database or storage operation. Reserved concurrency provides a small
prototype blast-radius cap.

`build-citizen-data-lambda.mjs` creates the minimal Lambda zip in a temporary
directory. Upload the package with KMS encryption to the exact
`CitizenDataServiceCodeKey`, record its S3 version identifier, and pass that
identifier as `CitizenDataServiceCodeVersion` in the reviewed change set.

## Why Hyperdrive is not in the first AWS stack

Hyperdrive remains a possible later performance layer, but direct access would require a separately reviewed private-network or database-credential path. The first staging foundation keeps Aurora private and uses IAM-authorised RDS Data API calls from AWS compute. Any future Hyperdrive binding for citizen data must have query caching disabled and must not make the database public.

## Required review before a future deployment or update

1. Confirm the target AWS region.
2. Review the AWS Pricing Calculator estimate for the minimum and maximum Aurora capacity.
3. Confirm budget alarms and the billing contact.
4. Create an Identity Center user and least-privilege permission set.
5. Validate the template and create a CloudFormation change set.
   Resolve a currently supported Aurora PostgreSQL Serverless v2 engine version in
   `ap-southeast-2` and supply it as `AuroraPostgresEngineVersion`; the repository
   deliberately does not guess a version that may become stale. The version must
   support a 0-ACU minimum and automatic pause.
6. Inspect the change set without executing it.
7. Obtain explicit founder approval for the billable stack.
8. Execute the change set.
9. Apply the SQL migration using the RDS Data API.
10. Run synthetic consent, RLS, encryption, export and erasure checks.

`run-data-api-migration.mjs` splits PostgreSQL safely around quoted and
dollar-quoted function bodies, executes one statement per Data API request in a
single transaction, and rolls the transaction back if any statement fails. Pass
the cluster ARN, managed-secret ARN and database name from CloudFormation
outputs at runtime; never copy those identifiers or the secret value into Git.

`validate-deployed-foundation.mjs` uses fictional data only. It exercises
KMS-backed envelope encryption, versioned S3 storage, consent lineage,
default-deny row isolation, append-only consent evidence, export bookkeeping and
erasure. It removes every uploaded synthetic object version and its temporary
database role before returning success.

`validate-live-service-flow.mjs` drives the operator-side application service boundary with a
fictional consent receipt, pseudonymous browser credential, encrypted check-in,
two encrypted Universal One turns, encrypted export, withdrawal and completed
erasure. Its object access is restricted to the
`synthetic-service-validation/` prefix, it records exact S3 version identifiers,
and it removes each version before returning success. It is an operator-side
staging validator, not the browser runtime and not an authorization to collect
real visitor data. The browser runtime has a separate consent-first proof path
and must be tested with fictional wording during release verification.

## Deliberately absent

- production resources;
- production citizen-data collection;
- collection before published arrival consent;
- Pinecone or Vertex indexes;
- Storj dual writes;
- Fhenix deployment or reward issuance;
- Zama live shadow traffic;
- HealthOmics writes;
- public database ingress;
- long-lived AWS access keys.
