#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createCitizenDataService } from "../../../cloudflare/citizen-data-core.js";
import { createEnvelopeVault } from "../../../cloudflare/citizen-data-vault.js";

const SYNTHETIC_PREFIX = "synthetic-service-validation";
const SYNTHETIC_CHECKIN = "Synthetic check-in: grounded, curious, and testing consented memory.";
const SYNTHETIC_CITIZEN_TURN = "Synthetic citizen turn: please remember this fictional context for the test.";
const SYNTHETIC_UNIVERSAL_ONE_TURN = "Synthetic Universal One turn: this fictional response remains encrypted.";

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
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(redact(result.stderr || result.stdout || `aws_exit_${result.status}`));
  }
  const output = result.stdout.trim();
  return output ? JSON.parse(output) : {};
}

const literal = (value) => `'${String(value).replaceAll("'", "''")}'`;
const nullableLiteral = (value) => (value == null || value === "" ? "NULL" : literal(value));

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
      const command = ["rds-data", "execute-statement", ...connection, "--sql", sql];
      if (transactionId) command.push("--transaction-id", transactionId);
      if (formatted) command.push("--format-records-as", "JSON");
      const output = runAws(awsCli, command);
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

function makeRepository(dataApi) {
  const operations = {
    createCitizen(record, transactionId) {
      dataApi.execute(`
        INSERT INTO citizen_data.citizens
          (id, status, residency_region, created_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.status)},
           ${literal(record.residencyRegion)}, ${literal(record.createdAt)}::timestamptz);
      `, transactionId);
    },
    appendConsentReceipt(record, transactionId) {
      dataApi.execute(`
        INSERT INTO citizen_data.consent_receipts
          (id, citizen_id, document_id, action, supersedes_receipt_id,
           evidence_nonce, source, occurred_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid,
           ${literal(record.documentId)}::uuid, ${literal(record.action)},
           ${record.supersedesReceiptId ? `${literal(record.supersedesReceiptId)}::uuid` : "NULL"},
           ${literal(record.evidenceNonce)}::uuid, ${literal(record.source)},
           ${literal(record.occurredAt)}::timestamptz);
      `, transactionId);
      for (const purpose of record.purposes || []) {
        dataApi.execute(`
          INSERT INTO citizen_data.consent_receipt_purposes
            (receipt_id, citizen_id, purpose_code)
          VALUES
            (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid, ${literal(purpose)});
        `, transactionId);
      }
    },
    createBrowserCredential(record, transactionId) {
      dataApi.execute(`
        INSERT INTO citizen_data.browser_credentials
          (id, citizen_id, token_sha256, created_at, expires_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid,
           ${literal(record.tokenSha256)}, ${literal(record.createdAt)}::timestamptz,
           ${literal(record.expiresAt)}::timestamptz);
      `, transactionId);
    },
    createExperienceSession(record, transactionId) {
      dataApi.execute(`
        INSERT INTO citizen_data.experience_sessions
          (id, citizen_id, consent_receipt_id, locale, timezone, started_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid,
           ${literal(record.consentReceiptId)}::uuid, ${nullableLiteral(record.locale)},
           ${nullableLiteral(record.timezone)}, ${literal(record.startedAt)}::timestamptz);
      `, transactionId);
    },
    createEncryptedObject(record, transactionId) {
      const wrappedDataKey = Buffer.from(record.wrappedDataKey).toString("base64");
      dataApi.execute(`
        INSERT INTO citizen_data.encrypted_objects
          (id, citizen_id, data_class, storage_provider, bucket_name, object_key,
           object_version_id, ciphertext_sha256, wrapped_data_key, kms_key_arn,
           encryption_algorithm, aad_schema_version, content_type, byte_length,
           retention_class, created_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid,
           ${literal(record.dataClass)}, ${literal(record.storageProvider)},
           ${literal(record.bucketName)}, ${literal(record.objectKey)},
           ${literal(record.objectVersionId)}, ${literal(record.ciphertextSha256)},
           decode(${literal(wrappedDataKey)}, 'base64'), ${literal(record.kmsKeyArn)},
           ${literal(record.encryptionAlgorithm)}, ${literal(record.aadSchemaVersion)},
           ${literal(record.contentType)}, ${Number(record.byteLength)},
           ${literal(record.retentionClass)}, ${literal(record.createdAt)}::timestamptz);
      `, transactionId);
    },
    createCheckin(record, transactionId) {
      dataApi.execute(`
        INSERT INTO citizen_data.checkins
          (id, citizen_id, session_id, consent_receipt_id, payload_object_id,
           idempotency_key, client_created_at, created_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid,
           ${literal(record.sessionId)}::uuid, ${literal(record.consentReceiptId)}::uuid,
           ${literal(record.payloadObjectId)}::uuid, ${literal(record.idempotencyKey)}::uuid,
           ${record.clientCreatedAt ? `${literal(record.clientCreatedAt)}::timestamptz` : "NULL"},
           ${literal(record.createdAt)}::timestamptz);
      `, transactionId);
    },
    createConversationThread(record, transactionId) {
      dataApi.execute(`
        INSERT INTO citizen_data.conversation_threads
          (id, citizen_id, session_id, consent_receipt_id, created_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid,
           ${literal(record.sessionId)}::uuid, ${literal(record.consentReceiptId)}::uuid,
           ${literal(record.createdAt)}::timestamptz);
      `, transactionId);
    },
    createConversationTurn(record, transactionId) {
      dataApi.execute(`
        INSERT INTO citizen_data.conversation_turns
          (id, citizen_id, thread_id, payload_object_id, role, ordinal, created_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid,
           ${literal(record.threadId)}::uuid, ${literal(record.payloadObjectId)}::uuid,
           ${literal(record.role)}, ${Number(record.ordinal)},
           ${literal(record.createdAt)}::timestamptz);
      `, transactionId);
    },
    appendDataUseEvent(record, transactionId) {
      dataApi.execute(`
        INSERT INTO citizen_data.data_use_events
          (id, citizen_id, purpose_code, system_name, operation,
           source_record_type, source_record_id, occurred_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid,
           ${literal(record.purposeCode)}, ${literal(record.systemName)},
           ${literal(record.operation)}, ${literal(record.sourceRecordType)},
           ${literal(record.sourceRecordId)}::uuid, ${literal(record.occurredAt)}::timestamptz);
      `, transactionId);
    },
    appendOutboxEvent(record, transactionId) {
      dataApi.execute(`
        INSERT INTO citizen_data.outbox_events
          (id, citizen_id, event_type, aggregate_type, aggregate_id, metadata, created_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid,
           ${literal(record.eventType)}, ${literal(record.aggregateType)},
           ${literal(record.aggregateId)}::uuid, ${literal(JSON.stringify(record.metadata || {}))}::jsonb,
           ${literal(record.createdAt)}::timestamptz);
      `, transactionId);
    },
    createDataRightsRequest(record, transactionId) {
      dataApi.execute(`
        INSERT INTO citizen_data.data_rights_requests
          (id, citizen_id, request_type, status, requested_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid,
           ${literal(record.requestType)}, ${literal(record.status)},
           ${literal(record.requestedAt)}::timestamptz);
      `, transactionId);
    },
    completeDataRightsRequest(requestId, citizenId, completedAt, transactionId) {
      dataApi.execute(`
        UPDATE citizen_data.data_rights_requests
        SET status = 'completed', completed_at = ${literal(completedAt)}::timestamptz
        WHERE id = ${literal(requestId)}::uuid
          AND citizen_id = ${literal(citizenId)}::uuid;
      `, transactionId);
    },
    revokeBrowserCredentials(citizenId, revokedAt, transactionId) {
      dataApi.execute(`
        UPDATE citizen_data.browser_credentials
        SET revoked_at = ${literal(revokedAt)}::timestamptz
        WHERE citizen_id = ${literal(citizenId)}::uuid AND revoked_at IS NULL;
      `, transactionId);
    },
    markCitizenErasurePending(citizenId, transactionId) {
      dataApi.execute(`
        UPDATE citizen_data.citizens
        SET status = 'erasure_pending'
        WHERE id = ${literal(citizenId)}::uuid;
      `, transactionId);
    },
  };

  const writeMethods = Object.keys(operations);
  const repository = {
    async transaction(work) {
      const transactionId = dataApi.begin();
      const tx = Object.fromEntries(writeMethods.map((name) => [
        name,
        (...args) => operations[name](...args, transactionId),
      ]));
      try {
        const result = await work(tx);
        dataApi.commit(transactionId);
        return result;
      } catch (error) {
        try { dataApi.rollback(transactionId); } catch { /* Surface the original failure. */ }
        throw error;
      }
    },
    async getPublishedConsentDocument(version) {
      const rows = dataApi.execute(`
        SELECT id, version, copy_sha256, status
        FROM citizen_data.consent_documents
        WHERE version = ${literal(version)} AND status = 'published'
        LIMIT 1;
      `, null, true);
      return rows[0] || null;
    },
    async resolveCredential(tokenSha256, isoNow) {
      const rows = dataApi.execute(`
        SELECT bc.citizen_id, c.status
        FROM citizen_data.browser_credentials bc
        JOIN citizen_data.citizens c ON c.id = bc.citizen_id
        WHERE bc.token_sha256 = ${literal(tokenSha256)}
          AND bc.revoked_at IS NULL
          AND bc.expires_at > ${literal(isoNow)}::timestamptz
        LIMIT 1;
      `, null, true);
      return rows[0]
        ? { citizenId: rows[0].citizen_id, status: rows[0].status }
        : null;
    },
    async getActiveConsent(citizenId, requiredPurposes) {
      const rows = dataApi.execute(`
        SELECT cr.id, cr.document_id, cd.version AS document_version,
               json_agg(crp.purpose_code ORDER BY crp.purpose_code) AS purposes
        FROM citizen_data.consent_receipts cr
        JOIN citizen_data.consent_documents cd ON cd.id = cr.document_id
        JOIN citizen_data.consent_receipt_purposes crp ON crp.receipt_id = cr.id
        WHERE cr.citizen_id = ${literal(citizenId)}::uuid
          AND cr.action = 'granted'
          AND NOT EXISTS (
            SELECT 1 FROM citizen_data.consent_receipts superseding
            WHERE superseding.supersedes_receipt_id = cr.id
          )
        GROUP BY cr.id, cr.document_id, cd.version, cr.occurred_at
        ORDER BY cr.occurred_at DESC
        LIMIT 1;
      `, null, true);
      if (!rows[0]) return null;
      const purposes = Array.isArray(rows[0].purposes)
        ? rows[0].purposes
        : JSON.parse(rows[0].purposes || "[]");
      if (!requiredPurposes.every((purpose) => purposes.includes(purpose))) return null;
      return {
        id: rows[0].id,
        documentId: rows[0].document_id,
        documentVersion: rows[0].document_version,
        purposes,
      };
    },
    async assertSessionOwnership(citizenId, sessionId) {
      const rows = dataApi.execute(`
        SELECT EXISTS (
          SELECT 1 FROM citizen_data.experience_sessions
          WHERE id = ${literal(sessionId)}::uuid
            AND citizen_id = ${literal(citizenId)}::uuid
            AND ended_at IS NULL
        ) AS owned;
      `, null, true);
      if (rows[0]?.owned !== true) throw new Error("citizen_data_session_not_found");
    },
    async assertConversationThreadOwnership(citizenId, threadId) {
      const rows = dataApi.execute(`
        SELECT EXISTS (
          SELECT 1 FROM citizen_data.conversation_threads
          WHERE id = ${literal(threadId)}::uuid
            AND citizen_id = ${literal(citizenId)}::uuid
            AND closed_at IS NULL AND deleted_at IS NULL
        ) AS owned;
      `, null, true);
      if (rows[0]?.owned !== true) throw new Error("citizen_data_conversation_thread_not_found");
    },
  };
  return repository;
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  for (const required of [
    "resource-arn", "secret-arn", "database", "bucket", "key-arn", "region", "profile",
  ]) {
    if (!args[required]) throw new Error(`missing_value:--${required}`);
  }

  const awsCli = process.env.AWS_CLI || "aws";
  const awsBase = ["--region", args.region, "--profile", args.profile];
  const dataApi = makeDataApi({
    awsCli,
    resourceArn: args["resource-arn"],
    secretArn: args["secret-arn"],
    database: args.database,
    region: args.region,
    profile: args.profile,
  });
  const repository = makeRepository(dataApi);
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "um-live-service-flow-"));
  const uploadedObjects = [];
  const version = `synthetic-service-flow-${Date.now()}`;
  const documentId = crypto.randomUUID();
  const publishedAt = new Date().toISOString();
  const consentCopyHash = crypto.createHash("sha256")
    .update("Synthetic-only arrival consent fixture. No real citizen data.")
    .digest("hex");

  const keyManager = {
    async generateDataKey({ citizenId, recordId, dataClass }) {
      const generated = runAws(awsCli, [
        "kms", "generate-data-key",
        ...awsBase,
        "--key-id", args["key-arn"],
        "--key-spec", "AES_256",
        "--encryption-context", `citizen_id=${citizenId},record_id=${recordId},data_class=${dataClass}`,
      ]);
      return {
        plaintextKey: new Uint8Array(Buffer.from(generated.Plaintext, "base64")),
        wrappedKey: new Uint8Array(Buffer.from(generated.CiphertextBlob, "base64")),
        keyArn: args["key-arn"],
      };
    },
  };
  const objectStore = {
    async put({ objectKey, body, contentType, metadata }) {
      const filePath = path.join(temporaryDirectory, `${crypto.randomUUID()}.umenc`);
      fs.writeFileSync(filePath, body, { mode: 0o600 });
      try {
        const stored = runAws(awsCli, [
          "s3api", "put-object",
          ...awsBase,
          "--bucket", args.bucket,
          "--key", objectKey,
          "--body", filePath,
          "--content-type", contentType,
          "--server-side-encryption", "aws:kms",
          "--ssekms-key-id", args["key-arn"],
          "--metadata", `schema=${metadata.schema},ciphertext_sha256=${metadata.ciphertext_sha256}`,
        ]);
        if (!stored.VersionId) throw new Error("citizen_data_object_version_missing");
        uploadedObjects.push({ objectKey, versionId: stored.VersionId });
        return { provider: "aws_s3", bucket: args.bucket, versionId: stored.VersionId };
      } finally {
        fs.rmSync(filePath, { force: true });
      }
    },
    async delete({ objectKey, versionId }) {
      if (!versionId) throw new Error("citizen_data_exact_object_version_required");
      runAws(awsCli, [
        "s3api", "delete-object", ...awsBase,
        "--bucket", args.bucket,
        "--key", objectKey,
        "--version-id", versionId,
      ]);
      const trackedIndex = uploadedObjects.findIndex((item) => (
        item.objectKey === objectKey && item.versionId === versionId
      ));
      if (trackedIndex >= 0) uploadedObjects.splice(trackedIndex, 1);
    },
  };
  const vault = createEnvelopeVault({
    keyManager,
    objectStore,
    objectKeyPrefix: SYNTHETIC_PREFIX,
  });
  const service = createCitizenDataService({ repository, vault });

  let accepted = null;
  let exportObject = null;
  let eraseRequest = null;
  try {
    dataApi.execute(`
      INSERT INTO citizen_data.consent_documents
        (id, version, copy_sha256, status, jurisdiction, published_at, created_at)
      VALUES
        (${literal(documentId)}::uuid, ${literal(version)}, ${literal(consentCopyHash)},
         'published', 'AU', ${literal(publishedAt)}::timestamptz, ${literal(publishedAt)}::timestamptz);
    `);

    accepted = await service.acceptCoreConsent({
      documentVersion: version,
      purposes: [
        "core_checkin_processing",
        "cross_session_memory",
        "universal_one_conversation_memory",
      ],
    });
    assert.equal((await service.consentStatus(accepted.rawCredential)).granted, true);

    const session = await service.startSession(accepted.rawCredential, {
      locale: "en-AU",
      timezone: "Australia/Sydney",
    });
    await service.recordCheckin(accepted.rawCredential, {
      sessionId: session.id,
      idempotencyKey: crypto.randomUUID(),
      checkin: SYNTHETIC_CHECKIN,
      clientCreatedAt: new Date().toISOString(),
    });
    const conversation = await service.startConversation(accepted.rawCredential, { sessionId: session.id });
    await service.recordConversationTurn(accepted.rawCredential, {
      threadId: conversation.id,
      role: "citizen",
      ordinal: 0,
      text: SYNTHETIC_CITIZEN_TURN,
    });
    await service.recordConversationTurn(accepted.rawCredential, {
      threadId: conversation.id,
      role: "universal_one",
      ordinal: 1,
      text: SYNTHETIC_UNIVERSAL_ONE_TURN,
    });

    const exportRequest = await service.requestExport(accepted.rawCredential);
    exportObject = await vault.storeJson({
      citizenId: accepted.citizenId,
      recordId: crypto.randomUUID(),
      dataClass: "citizen_export",
      value: {
        schema_version: "synthetic_citizen_export_v1",
        fixture: "synthetic_only",
        checkins: [SYNTHETIC_CHECKIN],
        conversation: [SYNTHETIC_CITIZEN_TURN, SYNTHETIC_UNIVERSAL_ONE_TURN],
      },
    });
    await repository.transaction(async (tx) => {
      await tx.createEncryptedObject(exportObject);
      await tx.completeDataRightsRequest(
        exportRequest.id,
        accepted.citizenId,
        new Date().toISOString(),
      );
      await tx.appendDataUseEvent({
        id: crypto.randomUUID(),
        citizenId: accepted.citizenId,
        purposeCode: "cross_session_memory",
        systemName: "synthetic_service_flow",
        operation: "export",
        sourceRecordType: "data_rights_request",
        sourceRecordId: exportRequest.id,
        occurredAt: new Date().toISOString(),
      });
    });

    const beforeErasure = dataApi.execute(`
      SELECT
        (SELECT count(*)::int FROM citizen_data.checkins
          WHERE citizen_id = ${literal(accepted.citizenId)}::uuid AND deleted_at IS NULL) AS live_checkins,
        (SELECT count(*)::int FROM citizen_data.conversation_turns
          WHERE citizen_id = ${literal(accepted.citizenId)}::uuid AND deleted_at IS NULL) AS live_turns,
        (SELECT count(*)::int FROM citizen_data.encrypted_objects
          WHERE citizen_id = ${literal(accepted.citizenId)}::uuid AND deleted_at IS NULL) AS live_objects,
        (SELECT count(*)::int FROM citizen_data.data_rights_requests
          WHERE citizen_id = ${literal(accepted.citizenId)}::uuid
            AND request_type = 'export' AND status = 'completed') AS completed_exports;
    `, null, true)[0];
    assert.deepEqual(beforeErasure, {
      live_checkins: 1,
      live_turns: 2,
      live_objects: 4,
      completed_exports: 1,
    });

    const storedObjects = dataApi.execute(`
      SELECT id, object_key, object_version_id
      FROM citizen_data.encrypted_objects
      WHERE citizen_id = ${literal(accepted.citizenId)}::uuid AND deleted_at IS NULL
      ORDER BY created_at;
    `, null, true);
    assert.equal(storedObjects.length, 4);
    assert.equal(storedObjects.every((item) => item.object_version_id), true);

    for (const storedObject of storedObjects) {
      const filePath = path.join(temporaryDirectory, `${storedObject.id}.download`);
      runAws(awsCli, [
        "s3api", "get-object", ...awsBase,
        "--bucket", args.bucket,
        "--key", storedObject.object_key,
        "--version-id", storedObject.object_version_id,
        filePath,
      ]);
      const ciphertext = fs.readFileSync(filePath);
      fs.rmSync(filePath, { force: true });
      const decoded = ciphertext.toString("utf8");
      assert.equal(decoded.includes(SYNTHETIC_CHECKIN), false);
      assert.equal(decoded.includes(SYNTHETIC_CITIZEN_TURN), false);
      assert.equal(decoded.includes(SYNTHETIC_UNIVERSAL_ONE_TURN), false);
    }

    eraseRequest = await service.requestErasure(accepted.rawCredential);
    assert.equal(eraseRequest.consentWithdrawn, true);
    assert.equal((await service.consentStatus(accepted.rawCredential)).granted, false);

    for (const storedObject of storedObjects) {
      await objectStore.delete({
        objectKey: storedObject.object_key,
        versionId: storedObject.object_version_id,
      });
    }

    const completedAt = new Date().toISOString();
    const erasureTransaction = dataApi.begin();
    try {
      for (const storedObject of storedObjects) {
        dataApi.execute(`
          INSERT INTO citizen_data.erasure_targets
            (id, citizen_id, request_id, target_system, target_reference,
             status, created_at, completed_at)
          VALUES
            (${literal(crypto.randomUUID())}::uuid, ${literal(accepted.citizenId)}::uuid,
             ${literal(eraseRequest.id)}::uuid, 'aws_s3', ${literal(storedObject.object_key)},
             'completed', ${literal(completedAt)}::timestamptz,
             ${literal(completedAt)}::timestamptz);
        `, erasureTransaction);
      }
      dataApi.execute(`
        INSERT INTO citizen_data.erasure_targets
          (id, citizen_id, request_id, target_system, target_reference,
           status, created_at, completed_at)
        VALUES
          (${literal(crypto.randomUUID())}::uuid, ${literal(accepted.citizenId)}::uuid,
           ${literal(eraseRequest.id)}::uuid, 'postgres', 'synthetic-citizen-metadata',
           'completed', ${literal(completedAt)}::timestamptz,
           ${literal(completedAt)}::timestamptz);
      `, erasureTransaction);
      dataApi.execute(`
        UPDATE citizen_data.encrypted_objects
        SET deleted_at = ${literal(completedAt)}::timestamptz
        WHERE citizen_id = ${literal(accepted.citizenId)}::uuid AND deleted_at IS NULL;
      `, erasureTransaction);
      dataApi.execute(`
        UPDATE citizen_data.checkins
        SET deleted_at = ${literal(completedAt)}::timestamptz
        WHERE citizen_id = ${literal(accepted.citizenId)}::uuid AND deleted_at IS NULL;
      `, erasureTransaction);
      dataApi.execute(`
        UPDATE citizen_data.conversation_turns
        SET deleted_at = ${literal(completedAt)}::timestamptz
        WHERE citizen_id = ${literal(accepted.citizenId)}::uuid AND deleted_at IS NULL;
      `, erasureTransaction);
      dataApi.execute(`
        UPDATE citizen_data.conversation_threads
        SET deleted_at = ${literal(completedAt)}::timestamptz,
            closed_at = COALESCE(closed_at, ${literal(completedAt)}::timestamptz)
        WHERE citizen_id = ${literal(accepted.citizenId)}::uuid AND deleted_at IS NULL;
      `, erasureTransaction);
      dataApi.execute(`
        UPDATE citizen_data.data_rights_requests
        SET status = 'completed', completed_at = ${literal(completedAt)}::timestamptz
        WHERE id = ${literal(eraseRequest.id)}::uuid
          AND citizen_id = ${literal(accepted.citizenId)}::uuid;
      `, erasureTransaction);
      dataApi.execute(`
        UPDATE citizen_data.citizens
        SET status = 'erased', erased_at = ${literal(completedAt)}::timestamptz
        WHERE id = ${literal(accepted.citizenId)}::uuid;
      `, erasureTransaction);
      dataApi.execute(`
        INSERT INTO citizen_data.data_use_events
          (id, citizen_id, purpose_code, system_name, operation,
           source_record_type, source_record_id, occurred_at)
        VALUES
          (${literal(crypto.randomUUID())}::uuid, ${literal(accepted.citizenId)}::uuid,
           'cross_session_memory', 'synthetic_service_flow', 'erase',
           'data_rights_request', ${literal(eraseRequest.id)}::uuid,
           ${literal(completedAt)}::timestamptz);
      `, erasureTransaction);
      dataApi.commit(erasureTransaction);
    } catch (error) {
      dataApi.rollback(erasureTransaction);
      throw error;
    }

    const afterErasure = dataApi.execute(`
      SELECT
        (SELECT status FROM citizen_data.citizens
          WHERE id = ${literal(accepted.citizenId)}::uuid) AS citizen_status,
        (SELECT count(*)::int FROM citizen_data.encrypted_objects
          WHERE citizen_id = ${literal(accepted.citizenId)}::uuid AND deleted_at IS NULL) AS live_objects,
        (SELECT count(*)::int FROM citizen_data.browser_credentials
          WHERE citizen_id = ${literal(accepted.citizenId)}::uuid AND revoked_at IS NULL) AS live_credentials,
        (SELECT count(*)::int FROM citizen_data.erasure_targets
          WHERE request_id = ${literal(eraseRequest.id)}::uuid AND status = 'completed') AS completed_targets,
        (SELECT count(*)::int FROM citizen_data.data_rights_requests
          WHERE id = ${literal(eraseRequest.id)}::uuid AND status = 'completed') AS completed_erasure;
    `, null, true)[0];
    assert.deepEqual(afterErasure, {
      citizen_status: "erased",
      live_objects: 0,
      live_credentials: 0,
      completed_targets: 5,
      completed_erasure: 1,
    });

    const remainingVersions = runAws(awsCli, [
      "s3api", "list-object-versions", ...awsBase,
      "--bucket", args.bucket,
      "--prefix", `${SYNTHETIC_PREFIX}/${accepted.citizenId}/`,
    ]);
    assert.equal((remainingVersions.Versions || []).length, 0);
    assert.equal((remainingVersions.DeleteMarkers || []).length, 0);

    console.log("arrival_consent_verified=true");
    console.log("pseudonymous_cookie_credential_verified=true");
    console.log("encrypted_checkin_verified=true");
    console.log("encrypted_conversation_turns=2");
    console.log("aurora_lineage_verified=true");
    console.log("export_completed=true");
    console.log("withdrawal_fail_closed=true");
    console.log("erasure_completed=true");
    console.log("live_encrypted_objects=0");
    console.log("synthetic_only=true");
  } finally {
    for (const storedObject of [...uploadedObjects]) {
      try {
        await objectStore.delete(storedObject);
      } catch {
        console.error("synthetic_service_object_cleanup_failed=true");
      }
    }
    if (accepted?.rawCredential) accepted.rawCredential = "";
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(redact(error?.message || error));
  process.exitCode = 1;
});
