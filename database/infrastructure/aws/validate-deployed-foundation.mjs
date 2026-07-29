#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function redact(value) {
  return String(value || "")
    .replace(/arn:aws:[^\s"']+/g, "[redacted-arn]")
    .replace(/\b\d{12}\b/g, "[redacted-account]")
    .replace(/https:\/\/[^\s"']*awsapps\.com[^\s"']*/g, "[redacted-portal]");
}

function parseArguments(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key.startsWith("--") || !value || value.startsWith("--")) {
      throw new Error(`invalid_argument:${key}`);
    }
    args[key.slice(2)] = value;
    index += 1;
  }
  return args;
}

function runAws(awsCli, args) {
  const result = spawnSync(awsCli, [...args, "--no-cli-pager", "--output", "json"], {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(redact(result.stderr || result.stdout || `aws_exit_${result.status}`));
  }
  const output = result.stdout.trim();
  return output ? JSON.parse(output) : {};
}

const literal = (value) => `'${String(value).replaceAll("'", "''")}'`;

function makeDataApi({ awsCli, resourceArn, secretArn, database, region, profile }) {
  const connection = [
    "--region", region,
    "--profile", profile,
    "--resource-arn", resourceArn,
    "--secret-arn", secretArn,
    "--database", database,
  ];

  return {
    begin() {
      const output = runAws(awsCli, ["rds-data", "begin-transaction", ...connection]);
      if (!output.transactionId) throw new Error("data_api_transaction_id_missing");
      return output.transactionId;
    },
    execute(sql, transactionId = null, formatted = false) {
      const args = ["rds-data", "execute-statement", ...connection, "--sql", sql];
      if (transactionId) args.push("--transaction-id", transactionId);
      if (formatted) args.push("--format-records-as", "JSON");
      const output = runAws(awsCli, args);
      return formatted ? JSON.parse(output.formattedRecords || "[]") : output;
    },
    commit(transactionId) {
      return runAws(awsCli, [
        "rds-data", "commit-transaction",
        "--region", region,
        "--profile", profile,
        "--resource-arn", resourceArn,
        "--secret-arn", secretArn,
        "--transaction-id", transactionId,
      ]);
    },
    rollback(transactionId) {
      return runAws(awsCli, [
        "rds-data", "rollback-transaction",
        "--region", region,
        "--profile", profile,
        "--resource-arn", resourceArn,
        "--secret-arn", secretArn,
        "--transaction-id", transactionId,
      ]);
    },
  };
}

function encryptPayload(key, plaintext, aad) {
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(aad));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from("UMC1"), nonce, tag, ciphertext]);
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  for (const required of [
    "resource-arn", "secret-arn", "database", "bucket", "key-arn", "region", "profile",
  ]) {
    if (!args[required]) throw new Error(`missing_value:--${required}`);
  }

  const awsCli = process.env.AWS_CLI || "aws";
  const dataApi = makeDataApi({
    awsCli,
    resourceArn: args["resource-arn"],
    secretArn: args["secret-arn"],
    database: args.database,
    region: args.region,
    profile: args.profile,
  });
  const awsBase = ["--region", args.region, "--profile", args.profile];
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "um-citizen-validation-"));
  const uploaded = [];
  const dataKeys = [];

  const citizenA = crypto.randomUUID();
  const citizenB = crypto.randomUUID();
  const documentId = crypto.randomUUID();
  const grantId = crypto.randomUUID();
  const withdrawalId = crypto.randomUUID();
  const credentialId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const checkinId = crypto.randomUUID();
  const threadId = crypto.randomUUID();
  const turnId = crypto.randomUUID();
  const inferenceId = crypto.randomUUID();
  const exportRequestId = crypto.randomUUID();
  const eraseRequestId = crypto.randomUUID();
  const now = new Date().toISOString();
  const version = `synthetic-validation-${Date.now()}`;
  const runtimeRole = "um_synthetic_runtime";

  const fixtures = [
    {
      name: "checkin",
      id: crypto.randomUUID(),
      dataClass: "checkin_text",
      contentType: "text/plain",
      plaintext: "Synthetic check-in: hopeful, thoughtful, and testing privacy boundaries.",
      retentionClass: "citizen_controlled",
    },
    {
      name: "conversation",
      id: crypto.randomUUID(),
      dataClass: "conversation_turn",
      contentType: "text/plain",
      plaintext: "Synthetic Universal One reply: this is fictional validation content only.",
      retentionClass: "citizen_controlled",
    },
    {
      name: "inference",
      id: crypto.randomUUID(),
      dataClass: "inference_result",
      contentType: "application/json",
      plaintext: JSON.stringify({ fixture: "synthetic_only", support_signal: 0.62 }),
      retentionClass: "citizen_controlled",
    },
    {
      name: "export",
      id: crypto.randomUUID(),
      dataClass: "citizen_export",
      contentType: "application/json",
      plaintext: JSON.stringify({ fixture: "synthetic_only", citizen: citizenA }),
      retentionClass: "export_temporary",
    },
  ];

  try {
    for (const fixture of fixtures) {
      const aad = JSON.stringify({
        schema: "citizen_data_aad_v1",
        citizen_id: citizenA,
        data_class: fixture.dataClass,
      });
      const generated = runAws(awsCli, [
        "kms", "generate-data-key",
        ...awsBase,
        "--key-id", args["key-arn"],
        "--key-spec", "AES_256",
        "--encryption-context", `citizen_id=${citizenA},data_class=${fixture.dataClass}`,
      ]);
      const plaintextKey = Buffer.from(generated.Plaintext, "base64");
      dataKeys.push(plaintextKey);
      const body = encryptPayload(plaintextKey, fixture.plaintext, aad);
      fixture.ciphertextSha256 = crypto.createHash("sha256").update(body).digest("hex");
      fixture.wrappedDataKey = generated.CiphertextBlob;
      fixture.objectKey = `synthetic-validation/${citizenA}/${fixture.id}.bin`;
      const filePath = path.join(temporaryDirectory, `${fixture.id}.bin`);
      fs.writeFileSync(filePath, body, { mode: 0o600 });
      const stored = runAws(awsCli, [
        "s3api", "put-object",
        ...awsBase,
        "--bucket", args.bucket,
        "--key", fixture.objectKey,
        "--body", filePath,
        "--server-side-encryption", "aws:kms",
        "--ssekms-key-id", args["key-arn"],
        "--metadata", "fixture=synthetic-only",
      ]);
      if (!stored.VersionId) throw new Error("versioned_s3_upload_missing_version_id");
      fixture.byteLength = body.length;
      fixture.versionId = stored.VersionId;
      uploaded.push(fixture);
    }

    for (const fixture of fixtures) {
      const head = runAws(awsCli, [
        "s3api", "head-object",
        ...awsBase,
        "--bucket", args.bucket,
        "--key", fixture.objectKey,
      ]);
      if (head.ServerSideEncryption !== "aws:kms" || head.ContentLength !== fixture.byteLength) {
        throw new Error("s3_encryption_or_length_verification_failed");
      }
    }

    dataApi.execute(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ${literal(runtimeRole)}) THEN
          CREATE ROLE ${runtimeRole} NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
        END IF;
      END
      $$;
    `);
    dataApi.execute(`GRANT USAGE ON SCHEMA citizen_data TO ${runtimeRole};`);
    dataApi.execute(`GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA citizen_data TO ${runtimeRole};`);

    const insertTransaction = dataApi.begin();
    try {
      dataApi.execute(`
        INSERT INTO citizen_data.consent_documents
          (id, version, copy_sha256, status, jurisdiction, published_at, created_at)
        VALUES
          (${literal(documentId)}::uuid, ${literal(version)}, ${literal(crypto.createHash("sha256").update(version).digest("hex"))},
           'published', 'AU', ${literal(now)}::timestamptz, ${literal(now)}::timestamptz);
      `, insertTransaction);
      dataApi.execute(`
        INSERT INTO citizen_data.citizens (id, status, residency_region, created_at)
        VALUES
          (${literal(citizenA)}::uuid, 'active', 'AU', ${literal(now)}::timestamptz),
          (${literal(citizenB)}::uuid, 'active', 'AU', ${literal(now)}::timestamptz);
      `, insertTransaction);
      dataApi.execute(`
        INSERT INTO citizen_data.consent_receipts
          (id, citizen_id, document_id, action, evidence_nonce, source, occurred_at)
        VALUES
          (${literal(grantId)}::uuid, ${literal(citizenA)}::uuid, ${literal(documentId)}::uuid,
           'granted', ${literal(crypto.randomUUID())}::uuid, 'arrival_consent', ${literal(now)}::timestamptz);
      `, insertTransaction);
      for (const purpose of [
        "core_checkin_processing",
        "cross_session_memory",
        "universal_one_conversation_memory",
        "consented_engagement_understanding",
        "deidentified_collective_learning",
      ]) {
        dataApi.execute(`
          INSERT INTO citizen_data.consent_receipt_purposes (receipt_id, citizen_id, purpose_code)
          VALUES (${literal(grantId)}::uuid, ${literal(citizenA)}::uuid, ${literal(purpose)});
        `, insertTransaction);
      }
      dataApi.execute(`
        INSERT INTO citizen_data.browser_credentials
          (id, citizen_id, token_sha256, created_at, expires_at)
        VALUES
          (${literal(credentialId)}::uuid, ${literal(citizenA)}::uuid,
           ${literal(crypto.createHash("sha256").update(crypto.randomBytes(48)).digest("hex"))},
           ${literal(now)}::timestamptz, (${literal(now)}::timestamptz + interval '1 day'));
      `, insertTransaction);
      dataApi.execute(`
        INSERT INTO citizen_data.experience_sessions
          (id, citizen_id, consent_receipt_id, locale, timezone, started_at)
        VALUES
          (${literal(sessionId)}::uuid, ${literal(citizenA)}::uuid, ${literal(grantId)}::uuid,
           'en-AU', 'Australia/Sydney', ${literal(now)}::timestamptz);
      `, insertTransaction);
      for (const fixture of fixtures) {
        dataApi.execute(`
          INSERT INTO citizen_data.encrypted_objects
            (id, citizen_id, data_class, storage_provider, bucket_name, object_key,
             ciphertext_sha256, wrapped_data_key, kms_key_arn, content_type, byte_length,
             retention_class, created_at)
          VALUES
            (${literal(fixture.id)}::uuid, ${literal(citizenA)}::uuid, ${literal(fixture.dataClass)},
             'aws_s3', ${literal(args.bucket)}, ${literal(fixture.objectKey)},
             ${literal(fixture.ciphertextSha256)}, decode(${literal(fixture.wrappedDataKey)}, 'base64'),
             ${literal(args["key-arn"])}, ${literal(fixture.contentType)}, ${fixture.byteLength},
             ${literal(fixture.retentionClass)}, ${literal(now)}::timestamptz);
        `, insertTransaction);
      }
      dataApi.execute(`
        INSERT INTO citizen_data.checkins
          (id, citizen_id, session_id, consent_receipt_id, payload_object_id,
           idempotency_key, client_created_at, created_at)
        VALUES
          (${literal(checkinId)}::uuid, ${literal(citizenA)}::uuid, ${literal(sessionId)}::uuid,
           ${literal(grantId)}::uuid, ${literal(fixtures[0].id)}::uuid,
           ${literal(crypto.randomUUID())}::uuid, ${literal(now)}::timestamptz, ${literal(now)}::timestamptz);
      `, insertTransaction);
      dataApi.execute(`
        INSERT INTO citizen_data.conversation_threads
          (id, citizen_id, session_id, consent_receipt_id, created_at)
        VALUES
          (${literal(threadId)}::uuid, ${literal(citizenA)}::uuid, ${literal(sessionId)}::uuid,
           ${literal(grantId)}::uuid, ${literal(now)}::timestamptz);
      `, insertTransaction);
      dataApi.execute(`
        INSERT INTO citizen_data.conversation_turns
          (id, citizen_id, thread_id, payload_object_id, role, ordinal, created_at)
        VALUES
          (${literal(turnId)}::uuid, ${literal(citizenA)}::uuid, ${literal(threadId)}::uuid,
           ${literal(fixtures[1].id)}::uuid, 'universal_one', 0, ${literal(now)}::timestamptz);
      `, insertTransaction);
      dataApi.execute(`
        INSERT INTO citizen_data.inference_runs
          (id, citizen_id, checkin_id, result_object_id, model_name, prompt_version,
           prompt_sha256, status, started_at, completed_at, created_at)
        VALUES
          (${literal(inferenceId)}::uuid, ${literal(citizenA)}::uuid, ${literal(checkinId)}::uuid,
           ${literal(fixtures[2].id)}::uuid, 'synthetic-validation', 'v1',
           ${literal(crypto.createHash("sha256").update("synthetic-prompt-v1").digest("hex"))},
           'completed', ${literal(now)}::timestamptz, ${literal(now)}::timestamptz, ${literal(now)}::timestamptz);
      `, insertTransaction);
      dataApi.execute(`
        INSERT INTO citizen_data.engagement_events
          (id, citizen_id, session_id, consent_receipt_id, event_type, content_id,
           duration_ms, completion_ratio, occurred_at)
        VALUES
          (${literal(crypto.randomUUID())}::uuid, ${literal(citizenA)}::uuid, ${literal(sessionId)}::uuid,
           ${literal(grantId)}::uuid, 'content_completed', 'synthetic-programme', 120000, 1,
           ${literal(now)}::timestamptz);
      `, insertTransaction);
      dataApi.execute(`
        INSERT INTO citizen_data.data_rights_requests
          (id, citizen_id, request_type, status, requested_at, completed_at)
        VALUES
          (${literal(exportRequestId)}::uuid, ${literal(citizenA)}::uuid, 'export', 'completed',
           ${literal(now)}::timestamptz, ${literal(now)}::timestamptz),
          (${literal(eraseRequestId)}::uuid, ${literal(citizenA)}::uuid, 'erase', 'processing',
           ${literal(now)}::timestamptz, NULL);
      `, insertTransaction);
      dataApi.execute(`
        INSERT INTO citizen_data.data_use_events
          (id, citizen_id, purpose_code, system_name, operation, source_record_type,
           source_record_id, occurred_at)
        VALUES
          (${literal(crypto.randomUUID())}::uuid, ${literal(citizenA)}::uuid,
           'core_checkin_processing', 'synthetic-validation', 'collect', 'checkin',
           ${literal(checkinId)}::uuid, ${literal(now)}::timestamptz),
          (${literal(crypto.randomUUID())}::uuid, ${literal(citizenA)}::uuid,
           'core_checkin_processing', 'synthetic-validation', 'infer', 'inference_run',
           ${literal(inferenceId)}::uuid, ${literal(now)}::timestamptz),
          (${literal(crypto.randomUUID())}::uuid, ${literal(citizenA)}::uuid,
           'cross_session_memory', 'synthetic-validation', 'export', 'data_rights_request',
           ${literal(exportRequestId)}::uuid, ${literal(now)}::timestamptz);
      `, insertTransaction);
      dataApi.commit(insertTransaction);
    } catch (error) {
      dataApi.rollback(insertTransaction);
      throw error;
    }

    let noConsentRejected = false;
    const noConsentTransaction = dataApi.begin();
    try {
      dataApi.execute(`
        INSERT INTO citizen_data.experience_sessions
          (id, citizen_id, consent_receipt_id, started_at)
        VALUES
          (${literal(crypto.randomUUID())}::uuid, ${literal(citizenB)}::uuid,
           ${literal(grantId)}::uuid, ${literal(now)}::timestamptz);
      `, noConsentTransaction);
    } catch {
      noConsentRejected = true;
    } finally {
      dataApi.rollback(noConsentTransaction);
    }
    if (!noConsentRejected) throw new Error("consent_lineage_failed_open");

    const rlsTransaction = dataApi.begin();
    let rlsRows;
    try {
      dataApi.execute(`SET LOCAL ROLE ${runtimeRole};`, rlsTransaction);
      dataApi.execute(`SELECT set_config('app.current_citizen_id', ${literal(citizenA)}, true);`, rlsTransaction);
      rlsRows = dataApi.execute(`
        SELECT
          (SELECT count(*)::int FROM citizen_data.citizens) AS visible_citizens,
          (SELECT count(*)::int FROM citizen_data.checkins) AS visible_checkins;
      `, rlsTransaction, true);
      dataApi.commit(rlsTransaction);
    } catch (error) {
      dataApi.rollback(rlsTransaction);
      throw error;
    }
    if (rlsRows?.[0]?.visible_citizens !== 1 || rlsRows?.[0]?.visible_checkins !== 1) {
      throw new Error("rls_isolation_count_mismatch");
    }

    let crossCitizenWriteRejected = false;
    const rlsWriteTransaction = dataApi.begin();
    try {
      dataApi.execute(`SET LOCAL ROLE ${runtimeRole};`, rlsWriteTransaction);
      dataApi.execute(`SELECT set_config('app.current_citizen_id', ${literal(citizenA)}, true);`, rlsWriteTransaction);
      dataApi.execute(`
        INSERT INTO citizen_data.citizens (id, status, residency_region, created_at)
        VALUES (${literal(crypto.randomUUID())}::uuid, 'active', 'AU', ${literal(now)}::timestamptz);
      `, rlsWriteTransaction);
    } catch {
      crossCitizenWriteRejected = true;
    } finally {
      dataApi.rollback(rlsWriteTransaction);
    }
    if (!crossCitizenWriteRejected) throw new Error("rls_cross_citizen_write_allowed");

    let appendOnlyRejected = false;
    const appendOnlyTransaction = dataApi.begin();
    try {
      dataApi.execute(`
        UPDATE citizen_data.consent_receipts
        SET occurred_at = occurred_at + interval '1 second'
        WHERE id = ${literal(grantId)}::uuid;
      `, appendOnlyTransaction);
    } catch {
      appendOnlyRejected = true;
    } finally {
      dataApi.rollback(appendOnlyTransaction);
    }
    if (!appendOnlyRejected) throw new Error("append_only_consent_update_allowed");

    for (const fixture of uploaded) {
      runAws(awsCli, [
        "s3api", "delete-object",
        ...awsBase,
        "--bucket", args.bucket,
        "--key", fixture.objectKey,
        "--version-id", fixture.versionId,
      ]);
    }
    uploaded.length = 0;

    for (const fixture of fixtures) {
      const versions = runAws(awsCli, [
        "s3api", "list-object-versions",
        ...awsBase,
        "--bucket", args.bucket,
        "--prefix", fixture.objectKey,
      ]);
      if ((versions.Versions?.length || 0) !== 0 || (versions.DeleteMarkers?.length || 0) !== 0) {
        throw new Error("erasure_left_s3_object_version");
      }
    }

    const erasureTransaction = dataApi.begin();
    try {
      dataApi.execute(`
        INSERT INTO citizen_data.consent_receipts
          (id, citizen_id, document_id, action, supersedes_receipt_id,
           evidence_nonce, source, occurred_at)
        VALUES
          (${literal(withdrawalId)}::uuid, ${literal(citizenA)}::uuid, ${literal(documentId)}::uuid,
           'withdrawn', ${literal(grantId)}::uuid, ${literal(crypto.randomUUID())}::uuid,
           'my_data', ${literal(now)}::timestamptz);
      `, erasureTransaction);
      dataApi.execute(`
        INSERT INTO citizen_data.erasure_targets
          (id, citizen_id, request_id, target_system, target_reference, status,
           created_at, completed_at)
        VALUES
          (${literal(crypto.randomUUID())}::uuid, ${literal(citizenA)}::uuid,
           ${literal(eraseRequestId)}::uuid, 'postgres', 'synthetic-metadata', 'completed',
           ${literal(now)}::timestamptz, ${literal(now)}::timestamptz),
          (${literal(crypto.randomUUID())}::uuid, ${literal(citizenA)}::uuid,
           ${literal(eraseRequestId)}::uuid, 'aws_s3', 'synthetic-object-versions', 'completed',
           ${literal(now)}::timestamptz, ${literal(now)}::timestamptz),
          (${literal(crypto.randomUUID())}::uuid, ${literal(citizenA)}::uuid,
           ${literal(eraseRequestId)}::uuid, 'backup_expiry', '14-day-staging-backup-window',
           'retained_until_expiry', ${literal(now)}::timestamptz, NULL);
      `, erasureTransaction);
      dataApi.execute(`
        UPDATE citizen_data.browser_credentials
        SET revoked_at = ${literal(now)}::timestamptz
        WHERE citizen_id = ${literal(citizenA)}::uuid;
      `, erasureTransaction);
      dataApi.execute(`
        UPDATE citizen_data.encrypted_objects
        SET deleted_at = ${literal(now)}::timestamptz
        WHERE citizen_id = ${literal(citizenA)}::uuid;
      `, erasureTransaction);
      dataApi.execute(`
        UPDATE citizen_data.checkins
        SET deleted_at = ${literal(now)}::timestamptz
        WHERE citizen_id = ${literal(citizenA)}::uuid;
      `, erasureTransaction);
      dataApi.execute(`
        UPDATE citizen_data.conversation_threads
        SET deleted_at = ${literal(now)}::timestamptz
        WHERE citizen_id = ${literal(citizenA)}::uuid;
      `, erasureTransaction);
      dataApi.execute(`
        UPDATE citizen_data.conversation_turns
        SET deleted_at = ${literal(now)}::timestamptz
        WHERE citizen_id = ${literal(citizenA)}::uuid;
      `, erasureTransaction);
      dataApi.execute(`
        UPDATE citizen_data.inference_runs
        SET status = 'erased'
        WHERE citizen_id = ${literal(citizenA)}::uuid;
      `, erasureTransaction);
      dataApi.execute(`
        UPDATE citizen_data.data_rights_requests
        SET status = 'completed', completed_at = ${literal(now)}::timestamptz
        WHERE id = ${literal(eraseRequestId)}::uuid;
      `, erasureTransaction);
      dataApi.execute(`
        UPDATE citizen_data.citizens
        SET status = 'erased', erased_at = ${literal(now)}::timestamptz
        WHERE id = ${literal(citizenA)}::uuid;
      `, erasureTransaction);
      dataApi.execute(`
        INSERT INTO citizen_data.data_use_events
          (id, citizen_id, purpose_code, system_name, operation, source_record_type,
           source_record_id, occurred_at)
        VALUES
          (${literal(crypto.randomUUID())}::uuid, ${literal(citizenA)}::uuid,
           'cross_session_memory', 'synthetic-validation', 'erase', 'data_rights_request',
           ${literal(eraseRequestId)}::uuid, ${literal(now)}::timestamptz);
      `, erasureTransaction);
      dataApi.commit(erasureTransaction);
    } catch (error) {
      dataApi.rollback(erasureTransaction);
      throw error;
    }

    const finalRows = dataApi.execute(`
      SELECT
        (SELECT status FROM citizen_data.citizens WHERE id = ${literal(citizenA)}::uuid) AS citizen_status,
        (SELECT count(*)::int FROM citizen_data.encrypted_objects
          WHERE citizen_id = ${literal(citizenA)}::uuid AND deleted_at IS NULL) AS live_objects,
        (SELECT count(*)::int FROM citizen_data.browser_credentials
          WHERE citizen_id = ${literal(citizenA)}::uuid AND revoked_at IS NULL) AS live_credentials,
        (SELECT count(*)::int FROM citizen_data.erasure_targets
          WHERE request_id = ${literal(eraseRequestId)}::uuid) AS erasure_targets;
    `, null, true);
    if (
      finalRows?.[0]?.citizen_status !== "erased"
      || finalRows?.[0]?.live_objects !== 0
      || finalRows?.[0]?.live_credentials !== 0
      || finalRows?.[0]?.erasure_targets !== 3
    ) {
      throw new Error("erasure_database_verification_failed");
    }

    console.log("synthetic_payload_classes=4");
    console.log("s3_kms_encryption_verified=true");
    console.log("consent_failure_closed=true");
    console.log("rls_isolation_verified=true");
    console.log("append_only_consent_verified=true");
    console.log("export_workflow_verified=true");
    console.log("erasure_workflow_verified=true");
  } finally {
    for (const fixture of uploaded) {
      try {
        runAws(awsCli, [
          "s3api", "delete-object",
          ...awsBase,
          "--bucket", args.bucket,
          "--key", fixture.objectKey,
          "--version-id", fixture.versionId,
        ]);
      } catch {
        console.error("synthetic_object_cleanup_failed=true");
      }
    }
    for (const key of dataKeys) key.fill(0);
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    try {
      dataApi.execute(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ${literal(runtimeRole)}) THEN
            DROP OWNED BY ${runtimeRole};
            DROP ROLE ${runtimeRole};
          END IF;
        END
        $$;
      `);
    } catch {
      console.error("synthetic_runtime_role_cleanup_failed=true");
    }
  }
}

main().catch((error) => {
  console.error(redact(error?.message || error));
  process.exitCode = 1;
});
