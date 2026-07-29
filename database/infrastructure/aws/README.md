# AWS staging foundation

These files prepare AWS infrastructure but do not create it. The template is intentionally billable and must not be deployed until its change set and cost boundary are approved.

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

## Region split

- IAM Identity Center remains in its configured primary region.
- Citizen data resources are intended for `ap-southeast-2` after data-residency review.
- The region is always supplied explicitly during validation and deployment.

## Proposed staging stack

`citizen-data-staging.yaml` creates:

- one customer-managed KMS key with annual rotation and a 30-day deletion window;
- one private KMS-encrypted S3 object bucket;
- one private S3 server-access-log bucket;
- one isolated VPC with two non-public subnets;
- one private Aurora PostgreSQL Serverless v2 cluster;
- one `db.serverless` writer;
- automatic pause to 0 ACUs after 5 idle minutes, using a compatible engine version;
- an AWS-managed database password in Secrets Manager;
- RDS Data API access, avoiding a public database endpoint or a long-lived database credential outside AWS.

Every stateful resource uses `DeletionPolicy: Retain`. The database has deletion protection enabled. No public ingress rule is created.

## Cost boundary

The AWS Price List API returned **USD $0.20 per ACU-hour** for Aurora PostgreSQL
Serverless v2 in Sydney on 2026-07-29. The prototype is constrained to a
0-to-0.5 ACU range and pauses after five idle minutes. Instance-capacity cost is
zero while fully paused and about USD $0.10 per active hour. The continuous-awake
ceiling is about USD $73 per 730-hour month, but that is not the intended mode.

The separately configured monthly AWS cost budget is USD $30, with actual-cost
email alerts at USD $10, $20, $25 and $30. AWS Budgets is an alerting boundary,
not a real-time hard stop, because billing data can be delayed. The database
change set must remain unexecuted until the payment method is current and the
founder explicitly approves execution.

Those figures exclude Aurora storage and I/O, backup storage, S3, CloudWatch,
Secrets Manager and data transfer. The customer-managed KMS key starts at USD
$1 per month, plus chargeable requests. Prices must be refreshed immediately
before any change set is executed. Automatic pause introduces a resume delay, so
the performance benchmark must record cold and warm timings separately.

## Why Hyperdrive is not in the first AWS stack

Hyperdrive remains a possible later performance layer, but direct access would require a separately reviewed private-network or database-credential path. The first staging foundation keeps Aurora private and uses IAM-authorised RDS Data API calls from AWS compute. Any future Hyperdrive binding for citizen data must have query caching disabled and must not make the database public.

## Required review before deployment

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

## Deliberately absent

- production resources;
- real citizen data;
- Pinecone or Vertex indexes;
- Storj dual writes;
- Fhenix deployment or reward issuance;
- Zama live shadow traffic;
- HealthOmics writes;
- public database ingress;
- long-lived AWS access keys.
