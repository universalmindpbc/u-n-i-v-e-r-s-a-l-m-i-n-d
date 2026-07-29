import {
  BeginTransactionCommand,
  CommitTransactionCommand,
  ExecuteStatementCommand,
  RDSDataClient,
  RollbackTransactionCommand,
} from "@aws-sdk/client-rds-data";
import { GenerateDataKeyCommand, KMSClient } from "@aws-sdk/client-kms";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createCitizenDataService } from "../../../cloudflare/citizen-data-core.js";
import { createEnvelopeVault } from "../../../cloudflare/citizen-data-vault.js";

const region = process.env.AWS_REGION || "ap-southeast-2";
const resourceArn = process.env.CITIZEN_DATA_RESOURCE_ARN;
const secretArn = process.env.CITIZEN_DATA_DATABASE_SECRET_ARN;
const database = process.env.CITIZEN_DATA_DATABASE_NAME;
const bucket = process.env.CITIZEN_DATA_OBJECT_BUCKET;
const keyArn = process.env.CITIZEN_DATA_KMS_KEY_ARN;
const edgeSharedSecret = process.env.CITIZEN_DATA_EDGE_SHARED_SECRET;
const rds = new RDSDataClient({ region });
const kms = new KMSClient({ region });
const s3 = new S3Client({ region });

const literal = (value) => `'${String(value).replaceAll("'", "''")}'`;
const nullableLiteral = (value) => (value == null || value === "" ? "NULL" : literal(value));

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function withDatabaseResumeRetry(work) {
  let delay = 900;
  for (let attempt = 0; attempt < 7; attempt += 1) {
    try {
      return await work();
    } catch (error) {
      const code = String(error?.name || error?.Code || "");
      if (!/DatabaseResumingException|DatabaseUnavailableException/.test(code) || attempt === 6) throw error;
      await sleep(delay);
      delay = Math.min(Math.round(delay * 1.7), 9000);
    }
  }
  throw new Error("citizen_data_database_unavailable");
}

function createDataApi() {
  const base = { resourceArn, secretArn, database };
  return {
    async begin() {
      const result = await withDatabaseResumeRetry(() => rds.send(new BeginTransactionCommand(base)));
      if (!result.transactionId) throw new Error("citizen_data_transaction_unavailable");
      return result.transactionId;
    },
    async execute(sql, transactionId = null, formatted = false) {
      const result = await withDatabaseResumeRetry(() => rds.send(new ExecuteStatementCommand({
        ...base,
        sql,
        transactionId: transactionId || undefined,
        formatRecordsAs: formatted ? "JSON" : undefined,
      })));
      return formatted ? JSON.parse(result.formattedRecords || "[]") : result;
    },
    async commit(transactionId) {
      return rds.send(new CommitTransactionCommand({ resourceArn, secretArn, transactionId }));
    },
    async rollback(transactionId) {
      return rds.send(new RollbackTransactionCommand({ resourceArn, secretArn, transactionId }));
    },
  };
}

function createRepository(dataApi) {
  const operations = {
    async createCitizen(record, transactionId) {
      await dataApi.execute(`
        INSERT INTO citizen_data.citizens
          (id, status, residency_region, created_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.status)},
           ${literal(record.residencyRegion)}, ${literal(record.createdAt)}::timestamptz);
      `, transactionId);
    },
    async appendConsentReceipt(record, transactionId) {
      await dataApi.execute(`
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
        await dataApi.execute(`
          INSERT INTO citizen_data.consent_receipt_purposes
            (receipt_id, citizen_id, purpose_code)
          VALUES
            (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid, ${literal(purpose)});
        `, transactionId);
      }
    },
    async createBrowserCredential(record, transactionId) {
      await dataApi.execute(`
        INSERT INTO citizen_data.browser_credentials
          (id, citizen_id, token_sha256, created_at, expires_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid,
           ${literal(record.tokenSha256)}, ${literal(record.createdAt)}::timestamptz,
           ${literal(record.expiresAt)}::timestamptz);
      `, transactionId);
    },
    async createExperienceSession(record, transactionId) {
      await dataApi.execute(`
        INSERT INTO citizen_data.experience_sessions
          (id, citizen_id, consent_receipt_id, locale, timezone, started_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid,
           ${literal(record.consentReceiptId)}::uuid, ${nullableLiteral(record.locale)},
           ${nullableLiteral(record.timezone)}, ${literal(record.startedAt)}::timestamptz);
      `, transactionId);
    },
    async createEncryptedObject(record, transactionId) {
      const wrappedDataKey = Buffer.from(record.wrappedDataKey).toString("base64");
      await dataApi.execute(`
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
    async createCheckin(record, transactionId) {
      await dataApi.execute(`
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
    async createConversationThread(record, transactionId) {
      await dataApi.execute(`
        INSERT INTO citizen_data.conversation_threads
          (id, citizen_id, session_id, consent_receipt_id, created_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid,
           ${literal(record.sessionId)}::uuid, ${literal(record.consentReceiptId)}::uuid,
           ${literal(record.createdAt)}::timestamptz);
      `, transactionId);
    },
    async createConversationTurn(record, transactionId) {
      await dataApi.execute(`
        INSERT INTO citizen_data.conversation_turns
          (id, citizen_id, thread_id, payload_object_id, role, ordinal, created_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid,
           ${literal(record.threadId)}::uuid, ${literal(record.payloadObjectId)}::uuid,
           ${literal(record.role)}, ${Number(record.ordinal)},
           ${literal(record.createdAt)}::timestamptz);
      `, transactionId);
    },
    async appendDataUseEvent(record, transactionId) {
      await dataApi.execute(`
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
    async appendOutboxEvent(record, transactionId) {
      await dataApi.execute(`
        INSERT INTO citizen_data.outbox_events
          (id, citizen_id, event_type, aggregate_type, aggregate_id, metadata, created_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid,
           ${literal(record.eventType)}, ${literal(record.aggregateType)},
           ${literal(record.aggregateId)}::uuid,
           ${literal(JSON.stringify(record.metadata || {}))}::jsonb,
           ${literal(record.createdAt)}::timestamptz);
      `, transactionId);
    },
    async createDataRightsRequest(record, transactionId) {
      await dataApi.execute(`
        INSERT INTO citizen_data.data_rights_requests
          (id, citizen_id, request_type, status, requested_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid,
           ${literal(record.requestType)}, ${literal(record.status)},
           ${literal(record.requestedAt)}::timestamptz);
      `, transactionId);
    },
    async revokeBrowserCredentials(citizenId, revokedAt, transactionId) {
      await dataApi.execute(`
        UPDATE citizen_data.browser_credentials
        SET revoked_at = ${literal(revokedAt)}::timestamptz
        WHERE citizen_id = ${literal(citizenId)}::uuid AND revoked_at IS NULL;
      `, transactionId);
    },
    async markCitizenErasurePending(citizenId, transactionId) {
      await dataApi.execute(`
        UPDATE citizen_data.citizens
        SET status = 'erasure_pending'
        WHERE id = ${literal(citizenId)}::uuid;
      `, transactionId);
    },
  };
  const writeMethods = Object.keys(operations);

  return {
    async transaction(work) {
      const transactionId = await dataApi.begin();
      const tx = Object.fromEntries(writeMethods.map((name) => [
        name,
        (...args) => operations[name](...args, transactionId),
      ]));
      try {
        const result = await work(tx);
        await dataApi.commit(transactionId);
        return result;
      } catch (error) {
        try { await dataApi.rollback(transactionId); } catch { /* Surface the original failure. */ }
        throw error;
      }
    },
    async getPublishedConsentDocument(version) {
      const rows = await dataApi.execute(`
        SELECT id, version, copy_sha256, status
        FROM citizen_data.consent_documents
        WHERE version = ${literal(version)} AND status = 'published'
        LIMIT 1;
      `, null, true);
      return rows[0] || null;
    },
    async resolveCredential(tokenSha256, isoNow) {
      const rows = await dataApi.execute(`
        SELECT bc.citizen_id, c.status
        FROM citizen_data.browser_credentials bc
        JOIN citizen_data.citizens c ON c.id = bc.citizen_id
        WHERE bc.token_sha256 = ${literal(tokenSha256)}
          AND bc.revoked_at IS NULL
          AND bc.expires_at > ${literal(isoNow)}::timestamptz
        LIMIT 1;
      `, null, true);
      return rows[0] ? { citizenId: rows[0].citizen_id, status: rows[0].status } : null;
    },
    async getActiveConsent(citizenId, requiredPurposes) {
      const rows = await dataApi.execute(`
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
      const rows = await dataApi.execute(`
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
      const rows = await dataApi.execute(`
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
}

const dataApi = createDataApi();
const repository = createRepository(dataApi);
const vault = createEnvelopeVault({
  keyManager: {
    async generateDataKey({ citizenId, recordId, dataClass }) {
      const generated = await kms.send(new GenerateDataKeyCommand({
        KeyId: keyArn,
        KeySpec: "AES_256",
        EncryptionContext: {
          citizen_id: citizenId,
          record_id: recordId,
          data_class: dataClass,
        },
      }));
      if (!generated.Plaintext || !generated.CiphertextBlob) {
        throw new Error("citizen_data_key_generation_failed");
      }
      return {
        plaintextKey: new Uint8Array(generated.Plaintext),
        wrappedKey: new Uint8Array(generated.CiphertextBlob),
        keyArn,
      };
    },
  },
  objectStore: {
    async put({ objectKey, body, contentType, metadata }) {
      const stored = await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: body,
        ContentType: contentType,
        ServerSideEncryption: "aws:kms",
        SSEKMSKeyId: keyArn,
        Metadata: metadata,
      }));
      if (!stored.VersionId) throw new Error("citizen_data_object_version_missing");
      return { provider: "aws_s3", bucket, versionId: stored.VersionId };
    },
    async delete({ objectKey, versionId }) {
      if (!versionId) throw new Error("citizen_data_exact_object_version_required");
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey, VersionId: versionId }));
    },
  },
});
const service = createCitizenDataService({ repository, vault });

function hexBytes(value) {
  if (!/^[0-9a-f]{64}$/i.test(value)) return null;
  return Uint8Array.from(value.match(/../g), (byte) => Number.parseInt(byte, 16));
}

async function verifyEdgeRequest(event, rawBody) {
  if (!edgeSharedSecret) return false;
  const headers = Object.fromEntries(Object.entries(event.headers || {}).map(([key, value]) => [key.toLowerCase(), value]));
  const timestamp = String(headers["x-universal-mind-edge-timestamp"] || "");
  const nonce = String(headers["x-universal-mind-edge-nonce"] || "");
  const signature = hexBytes(String(headers["x-universal-mind-edge-signature"] || ""));
  if (!/^\d{13}$/.test(timestamp) || !/^[0-9a-f-]{36}$/i.test(nonce) || !signature) return false;
  if (Math.abs(Date.now() - Number(timestamp)) > 60000) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(edgeSharedSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    new TextEncoder().encode(`${timestamp}\n${nonce}\n${rawBody}`),
  );
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Cache-Control": "no-store, private",
      "Content-Type": "application/json; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
    body: JSON.stringify(payload),
  };
}

function safeErrorCode(error) {
  return String(error?.message || "citizen_data_unavailable").split(":")[0];
}

export async function handler(event) {
  if (event?.requestContext?.http?.method !== "POST") {
    return jsonResponse(405, { error: "citizen_data_method_not_allowed" });
  }
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : String(event.body || "");
  if (!rawBody || Buffer.byteLength(rawBody, "utf8") > 32768) {
    return jsonResponse(400, { error: "citizen_data_request_invalid" });
  }
  if (!(await verifyEdgeRequest(event, rawBody))) {
    return jsonResponse(403, { error: "citizen_data_edge_signature_invalid" });
  }

  try {
    const request = JSON.parse(rawBody);
    const credential = typeof request.credential === "string" ? request.credential : "";
    const payload = request.payload && typeof request.payload === "object" ? request.payload : {};
    const operations = {
      consentStatus: () => service.consentStatus(credential),
      acceptCoreConsent: () => service.acceptCoreConsent(payload),
      startSession: () => service.startSession(credential, payload),
      recordCheckin: () => service.recordCheckin(credential, payload),
      startConversation: () => service.startConversation(credential, payload),
      recordConversationTurn: () => service.recordConversationTurn(credential, payload),
      requestExport: () => service.requestExport(credential),
      requestErasure: () => service.requestErasure(credential),
    };
    if (!Object.hasOwn(operations, request.operation)) {
      return jsonResponse(404, { error: "citizen_data_operation_not_found" });
    }
    return jsonResponse(200, await operations[request.operation]());
  } catch (error) {
    const code = safeErrorCode(error);
    const status = /credential/.test(code) ? 401
      : /active_consent/.test(code) ? 403
        : /required|invalid|not_allowed|forbidden|not_published|not_found/.test(code) ? 400
          : 503;
    console.error("Citizen data Lambda request failed", { code });
    return jsonResponse(status, { error: status === 503 ? "citizen_data_unavailable" : code });
  }
}
