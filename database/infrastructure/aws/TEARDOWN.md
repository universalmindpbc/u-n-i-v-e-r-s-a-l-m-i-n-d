# AWS staging teardown and cost-stop runbook

This runbook covers only the `universal-mind-citizen-data-staging` stack in
`ap-southeast-2`. It is deliberately manual because deletion can destroy
encrypted citizen data and cryptographic keys. Never run the destructive steps
against production, and never infer approval to delete resources from approval
to create them.

The staging foundation is synthetic-only until the consent interface and live
data path are separately approved. During this phase, do not place real names,
email addresses, IP addresses, check-ins, conversations, inference insights or
other citizen data in the stack.

## Cost-stop without deleting data

Aurora Serverless v2 is configured to pause at 0 ACUs after five idle minutes.
To confirm that the instance-capacity charge has stopped:

1. Stop all migration, test and Data API requests.
2. Wait at least five minutes plus the short pause transition.
3. Confirm the cluster still has a minimum capacity of `0`.
4. Confirm `ServerlessDatabaseCapacity` and `ServerlessV2Usage` are zero.
5. Remember that Aurora storage, backups, S3, KMS, Secrets Manager, logs and data
   transfer can still incur charges while compute is paused.

Do not use a continuously polling health check or open database connection in
staging; either can prevent auto-pause or wake the database.

## Read-only inventory before any teardown

Use the Identity Center profile and the Sydney region. Record the stack status,
physical resource identifiers and bucket version counts without pasting account
identifiers, ARNs, secrets or object names into chat or issue trackers.

```sh
aws cloudformation describe-stacks \
  --stack-name universal-mind-citizen-data-staging \
  --region ap-southeast-2 \
  --profile universal-mind-staging

aws cloudformation list-stack-resources \
  --stack-name universal-mind-citizen-data-staging \
  --region ap-southeast-2 \
  --profile universal-mind-staging
```

Before deletion, make an explicit written choice between:

- **Retain evidence:** take a final encrypted database snapshot and retain only
  the minimum required synthetic test evidence for a documented period.
- **Erase the prototype:** skip the final database snapshot and permanently
  remove all synthetic objects, versions, snapshots and database storage.

Never retain a snapshot by accident. Snapshots and retained resources continue
to incur applicable charges.

## Full teardown sequence

Full teardown requires a new, explicit founder instruction naming this staging
stack. Creation approval does not authorize teardown.

1. Disable every application writer and verify there is no real citizen data.
2. Capture the read-only inventory and the retain-or-erase decision above.
3. Disable database deletion protection.
4. Delete the Aurora writer and cluster, taking or skipping the final snapshot
   according to the recorded decision.
5. If erasing, remove every object version and delete marker from both versioned
   S3 buckets, then delete the buckets.
6. Delete any retained manual or final database snapshots that are outside the
   approved retention decision.
7. Delete the CloudFormation stack so networking, policies, aliases and other
   non-retained resources are removed.
8. Schedule the customer-managed KMS key for deletion using its configured
   30-day window only after all retained encrypted data has been intentionally
   removed. Deleting the key makes remaining ciphertext unrecoverable.
9. Confirm the stack is gone, no tagged prototype resources remain, and the
   budget view begins trending back to zero. Billing data is delayed, so repeat
   the read-only cost check later.

Because the template uses `DeletionPolicy: Retain` for the database, buckets and
KMS key, deleting the CloudFormation stack alone is not a complete teardown.

## Failed creation or rollback

If stack creation fails:

1. Do not immediately retry.
2. Read the CloudFormation failure event and identify every created or retained
   physical resource.
3. Confirm whether the database, buckets or KMS key survived rollback.
4. Repair the template only after the cost-bearing resource inventory is known.
5. Reuse or deliberately remove retained resources; do not create duplicates.

## Completion evidence

A teardown is complete only when all of the following are true:

- the target stack no longer exists;
- no Aurora cluster, writer, snapshot, S3 bucket, secret or KMS key from the
  staging foundation remains except an explicitly documented retention item;
- no retained item lacks an owner, deletion date and cost reason;
- the AWS budget and billing views have been checked after their reporting delay;
- the exact commands, timestamps and non-sensitive results are recorded in Git.
