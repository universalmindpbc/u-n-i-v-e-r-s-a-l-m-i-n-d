import {
  BeginTransactionCommand,
  CommitTransactionCommand,
  ExecuteStatementCommand,
  RDSDataClient,
  RollbackTransactionCommand,
} from "@aws-sdk/client-rds-data";
import { GenerateDataKeyCommand, KMSClient } from "@aws-sdk/client-kms";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  DynamoDBClient,
  GetItemCommand,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { createCitizenDataService } from "../../../cloudflare/citizen-data-core.js";
import { createEnvelopeVault } from "../../../cloudflare/citizen-data-vault.js";

const region = process.env.AWS_REGION || "ap-southeast-2";
const resourceArn = process.env.CITIZEN_DATA_RESOURCE_ARN;
const secretArn = process.env.CITIZEN_DATA_DATABASE_SECRET_ARN;
const database = process.env.CITIZEN_DATA_DATABASE_NAME;
const bucket = process.env.CITIZEN_DATA_OBJECT_BUCKET;
const keyArn = process.env.CITIZEN_DATA_KMS_KEY_ARN;
const edgeSharedSecret = process.env.CITIZEN_DATA_EDGE_SHARED_SECRET;
const consentLedgerTable = process.env.CITIZEN_DATA_CONSENT_LEDGER_TABLE;
const currentConsentDocument = Object.freeze({
  id: process.env.CITIZEN_DATA_CONSENT_DOCUMENT_ID,
  version: process.env.CITIZEN_DATA_CONSENT_DOCUMENT_VERSION,
  copySha256: process.env.CITIZEN_DATA_CONSENT_DOCUMENT_SHA256,
  status: "published",
});
const rds = new RDSDataClient({ region });
const kms = new KMSClient({ region });
const s3 = new S3Client({ region });
const dynamodb = new DynamoDBClient({ region });

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
           ${literal(record.residencyRegion)}, ${literal(record.createdAt)}::timestamptz)
        ON CONFLICT (id) DO NOTHING;
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
           ${literal(record.occurredAt)}::timestamptz)
        ON CONFLICT (id) DO NOTHING;
      `, transactionId);
      for (const purpose of record.purposes || []) {
        await dataApi.execute(`
          INSERT INTO citizen_data.consent_receipt_purposes
            (receipt_id, citizen_id, purpose_code)
          VALUES
            (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid, ${literal(purpose)})
          ON CONFLICT (receipt_id, purpose_code) DO NOTHING;
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
           ${literal(record.expiresAt)}::timestamptz)
        ON CONFLICT (id) DO NOTHING;
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
           ${literal(record.createdAt)}::timestamptz)
        ON CONFLICT (id) DO NOTHING;
      `, transactionId);
    },
    async createDataRightsRequest(record, transactionId) {
      await dataApi.execute(`
        INSERT INTO citizen_data.data_rights_requests
          (id, citizen_id, request_type, status, requested_at)
        VALUES
          (${literal(record.id)}::uuid, ${literal(record.citizenId)}::uuid,
           ${literal(record.requestType)}, ${literal(record.status)},
           ${literal(record.requestedAt)}::timestamptz)
        ON CONFLICT (id) DO NOTHING;
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

  async function projectGrant(tx, projection) {
    await tx.createCitizen(projection.citizen);
    await tx.appendConsentReceipt(projection.receipt);
    await tx.createBrowserCredential(projection.credential);
  }

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
    async projectConsentEvent(projection) {
      if (!projection || typeof projection !== "object") {
        throw new Error("citizen_data_projection_invalid");
      }
      if (projection.type === "consent_granted") {
        await this.transaction((tx) => projectGrant(tx, projection));
        return;
      }
      if (projection.type === "consent_withdrawn") {
        await this.transaction(async (tx) => {
          await projectGrant(tx, projection.grantProjection);
          if (projection.withdrawalReceipt) {
            await tx.appendConsentReceipt(projection.withdrawalReceipt);
          }
          await tx.revokeBrowserCredentials(projection.citizenId, projection.requestedAt);
          await tx.markCitizenErasurePending(projection.citizenId);
          await tx.createDataRightsRequest(projection.rightsRequest);
          await tx.appendOutboxEvent({
            id: projection.outboxEventId,
            citizenId: projection.citizenId,
            eventType: "erasure_requested",
            aggregateType: "data_rights_request",
            aggregateId: projection.rightsRequest.id,
            metadata: { schema_version: "citizen_erasure_request_v1" },
            createdAt: projection.requestedAt,
          });
        });
        return;
      }
      throw new Error("citizen_data_projection_type_invalid");
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

const dynamoString = (value) => ({ S: String(value) });
const dynamoNumber = (value) => ({ N: String(value) });
const dynamoStringList = (values) => ({ L: values.map((value) => dynamoString(value)) });

function dynamoValue(item, key) {
  return item?.[key]?.S || "";
}

function dynamoList(item, key) {
  return Array.isArray(item?.[key]?.L) ? item[key].L.map((value) => value.S).filter(Boolean) : [];
}

function uniquePut(item) {
  return {
    Put: {
      TableName: consentLedgerTable,
      Item: item,
      ConditionExpression: "attribute_not_exists(#pk)",
      ExpressionAttributeNames: { "#pk": "pk" },
    },
  };
}

async function getLedgerItem(pk, sk) {
  if (!consentLedgerTable) throw new Error("citizen_data_consent_ledger_unavailable");
  const result = await dynamodb.send(new GetItemCommand({
    TableName: consentLedgerTable,
    Key: { pk: dynamoString(pk), sk: dynamoString(sk) },
    ConsistentRead: true,
  }));
  return result.Item || null;
}

function createConsentLedgerRepository(aurora) {
  async function currentConsent(citizenId) {
    return getLedgerItem(`CITIZEN#${citizenId}`, "CONSENT#CURRENT");
  }

  return {
    ...aurora,
    async getPublishedConsentDocument(version) {
      if (version === currentConsentDocument.version
          && currentConsentDocument.id
          && /^[0-9a-f]{64}$/i.test(currentConsentDocument.copySha256 || "")) {
        return currentConsentDocument;
      }
      return aurora.getPublishedConsentDocument(version);
    },
    async grantCoreConsent({ citizen, receipt, credential }) {
      const projection = { type: "consent_granted", citizen, receipt, credential };
      const projectionJson = JSON.stringify(projection);
      const citizenPk = `CITIZEN#${citizen.id}`;
      const credentialPk = `CREDENTIAL#${credential.tokenSha256}`;
      await dynamodb.send(new TransactWriteItemsCommand({
        TransactItems: [
          uniquePut({
            pk: dynamoString(citizenPk),
            sk: dynamoString("PROFILE"),
            entity: dynamoString("citizen_profile"),
            citizen_id: dynamoString(citizen.id),
            status: dynamoString(citizen.status),
            residency_region: dynamoString(citizen.residencyRegion),
            created_at: dynamoString(citizen.createdAt),
          }),
          uniquePut({
            pk: dynamoString(citizenPk),
            sk: dynamoString("CONSENT#CURRENT"),
            entity: dynamoString("current_consent"),
            state: dynamoString("granted"),
            receipt_id: dynamoString(receipt.id),
            document_id: dynamoString(receipt.documentId),
            document_version: dynamoString(receipt.documentVersion),
            purposes: dynamoStringList(receipt.purposes),
            occurred_at: dynamoString(receipt.occurredAt),
            projection_json: dynamoString(projectionJson),
          }),
          uniquePut({
            pk: dynamoString(credentialPk),
            sk: dynamoString("CREDENTIAL"),
            entity: dynamoString("browser_credential"),
            citizen_id: dynamoString(citizen.id),
            status: dynamoString("active"),
            created_at: dynamoString(credential.createdAt),
            expires_at: dynamoString(credential.expiresAt),
            expires_at_epoch: dynamoNumber(Math.floor(new Date(credential.expiresAt).getTime() / 1000)),
          }),
          uniquePut({
            pk: dynamoString(citizenPk),
            sk: dynamoString(`CONSENT_EVENT#${receipt.occurredAt}#${receipt.id}`),
            entity: dynamoString("consent_projection_event"),
            action: dynamoString("granted"),
            receipt_id: dynamoString(receipt.id),
            occurred_at: dynamoString(receipt.occurredAt),
            projection_json: dynamoString(projectionJson),
          }),
        ],
      }));
    },
    async resolveCredential(tokenSha256, isoNow) {
      const item = await getLedgerItem(`CREDENTIAL#${tokenSha256}`, "CREDENTIAL");
      if (item) {
        const active = dynamoValue(item, "status") === "active";
        const unexpired = Date.parse(dynamoValue(item, "expires_at")) > Date.parse(isoNow);
        return active && unexpired
          ? { citizenId: dynamoValue(item, "citizen_id"), status: "active" }
          : null;
      }
      return aurora.resolveCredential(tokenSha256, isoNow);
    },
    async getActiveConsent(citizenId, requiredPurposes) {
      const item = await currentConsent(citizenId);
      if (item) {
        if (dynamoValue(item, "state") !== "granted") return null;
        const purposes = dynamoList(item, "purposes");
        if (!requiredPurposes.every((purpose) => purposes.includes(purpose))) return null;
        return {
          id: dynamoValue(item, "receipt_id"),
          documentId: dynamoValue(item, "document_id"),
          documentVersion: dynamoValue(item, "document_version"),
          purposes,
        };
      }
      return aurora.getActiveConsent(citizenId, requiredPurposes);
    },
    async ensureRelationalConsent(citizenId, receiptId) {
      const item = await currentConsent(citizenId);
      if (!item || dynamoValue(item, "receipt_id") !== receiptId) return;
      const projection = JSON.parse(dynamoValue(item, "projection_json"));
      await aurora.projectConsentEvent(projection);
    },
    async requestCoreErasure({ citizenId, tokenSha256, withdrawalReceipt, rightsRequest }) {
      const item = await currentConsent(citizenId);
      if (!item) {
        await aurora.transaction(async (tx) => {
          if (withdrawalReceipt) await tx.appendConsentReceipt(withdrawalReceipt);
          await tx.revokeBrowserCredentials(citizenId, rightsRequest.requestedAt);
          await tx.markCitizenErasurePending(citizenId);
          await tx.createDataRightsRequest(rightsRequest);
          await tx.appendOutboxEvent({
            id: crypto.randomUUID(),
            citizenId,
            eventType: "erasure_requested",
            aggregateType: "data_rights_request",
            aggregateId: rightsRequest.id,
            metadata: { schema_version: "citizen_erasure_request_v1" },
            createdAt: rightsRequest.requestedAt,
          });
        });
        return;
      }

      const grantProjection = JSON.parse(dynamoValue(item, "projection_json"));
      const outboxEventId = crypto.randomUUID();
      const projection = {
        type: "consent_withdrawn",
        citizenId,
        requestedAt: rightsRequest.requestedAt,
        grantProjection,
        withdrawalReceipt,
        rightsRequest,
        outboxEventId,
      };
      const projectionJson = JSON.stringify(projection);
      const citizenPk = `CITIZEN#${citizenId}`;
      const eventId = withdrawalReceipt?.id || rightsRequest.id;
      await dynamodb.send(new TransactWriteItemsCommand({
        TransactItems: [
          {
            Update: {
              TableName: consentLedgerTable,
              Key: { pk: dynamoString(citizenPk), sk: dynamoString("CONSENT#CURRENT") },
              UpdateExpression: "SET #state = :withdrawn, withdrawal_receipt_id = :withdrawal, updated_at = :updated, projection_json = :projection",
              ConditionExpression: "#state = :granted AND receipt_id = :receipt",
              ExpressionAttributeNames: { "#state": "state" },
              ExpressionAttributeValues: {
                ":withdrawn": dynamoString("withdrawn"),
                ":granted": dynamoString("granted"),
                ":withdrawal": dynamoString(eventId),
                ":updated": dynamoString(rightsRequest.requestedAt),
                ":receipt": dynamoString(dynamoValue(item, "receipt_id")),
                ":projection": dynamoString(projectionJson),
              },
            },
          },
          {
            Update: {
              TableName: consentLedgerTable,
              Key: { pk: dynamoString(citizenPk), sk: dynamoString("PROFILE") },
              UpdateExpression: "SET #status = :pending, updated_at = :updated",
              ConditionExpression: "attribute_exists(pk)",
              ExpressionAttributeNames: { "#status": "status" },
              ExpressionAttributeValues: {
                ":pending": dynamoString("erasure_pending"),
                ":updated": dynamoString(rightsRequest.requestedAt),
              },
            },
          },
          {
            Update: {
              TableName: consentLedgerTable,
              Key: { pk: dynamoString(`CREDENTIAL#${tokenSha256}`), sk: dynamoString("CREDENTIAL") },
              UpdateExpression: "SET #status = :revoked, revoked_at = :updated",
              ConditionExpression: "#status = :active",
              ExpressionAttributeNames: { "#status": "status" },
              ExpressionAttributeValues: {
                ":revoked": dynamoString("revoked"),
                ":active": dynamoString("active"),
                ":updated": dynamoString(rightsRequest.requestedAt),
              },
            },
          },
          uniquePut({
            pk: dynamoString(citizenPk),
            sk: dynamoString(`RIGHTS#${rightsRequest.requestedAt}#${rightsRequest.id}`),
            entity: dynamoString("data_rights_request"),
            request_id: dynamoString(rightsRequest.id),
            request_type: dynamoString(rightsRequest.requestType),
            status: dynamoString(rightsRequest.status),
            requested_at: dynamoString(rightsRequest.requestedAt),
          }),
          uniquePut({
            pk: dynamoString(citizenPk),
            sk: dynamoString(`CONSENT_EVENT#${rightsRequest.requestedAt}#${eventId}`),
            entity: dynamoString("consent_projection_event"),
            action: dynamoString("withdrawn"),
            receipt_id: dynamoString(eventId),
            occurred_at: dynamoString(rightsRequest.requestedAt),
            projection_json: dynamoString(projectionJson),
          }),
        ],
      }));
    },
  };
}

const dataApi = createDataApi();
const auroraRepository = createRepository(dataApi);
const repository = createConsentLedgerRepository(auroraRepository);
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

async function projectConsentLedgerRecords(records) {
  for (const record of records) {
    const image = record?.dynamodb?.NewImage;
    if (dynamoValue(image, "entity") !== "consent_projection_event") continue;
    const projectionJson = dynamoValue(image, "projection_json");
    if (!projectionJson) throw new Error("citizen_data_projection_missing");
    await auroraRepository.projectConsentEvent(JSON.parse(projectionJson));
  }
  return { projected: records.length };
}

export async function handler(event) {
  if (Array.isArray(event?.Records)) {
    return projectConsentLedgerRecords(event.Records);
  }
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
