import { sha256Hex } from "./citizen-data-vault.js";

const REQUIRED_CORE_PURPOSES = Object.freeze([
  "core_checkin_processing",
  "cross_session_memory",
]);

const ALLOWED_CORE_PURPOSES = new Set([
  ...REQUIRED_CORE_PURPOSES,
  "universal_one_conversation_memory",
  "consented_engagement_understanding",
  "deidentified_collective_learning",
]);

const PROHIBITED_REWARD_KEYS = /(?:happiness|reward|wallet|token|balance|issuance|redeem)/i;

function randomToken(length = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function cleanString(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").slice(0, maxLength);
}

function assertNoRewardFields(value, path = "payload") {
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    if (PROHIBITED_REWARD_KEYS.test(key)) throw new Error(`citizen_data_rewards_field_forbidden:${path}.${key}`);
    if (nested && typeof nested === "object") assertNoRewardFields(nested, `${path}.${key}`);
  }
}

function normalizePurposes(purposes) {
  if (!Array.isArray(purposes)) throw new Error("citizen_data_consent_purposes_required");
  const normalized = [...new Set(purposes.map((purpose) => cleanString(purpose, 80)).filter(Boolean))];
  if (normalized.some((purpose) => !ALLOWED_CORE_PURPOSES.has(purpose))) {
    throw new Error("citizen_data_consent_purpose_not_allowed");
  }
  for (const required of REQUIRED_CORE_PURPOSES) {
    if (!normalized.includes(required)) throw new Error(`citizen_data_required_purpose_missing:${required}`);
  }
  return normalized;
}

function requireUuid(value, errorCode) {
  const normalized = cleanString(value, 64);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)) {
    throw new Error(errorCode);
  }
  return normalized;
}

function requireConversationRole(value) {
  const normalized = cleanString(value, 32);
  if (!new Set(["citizen", "universal_one"]).has(normalized)) {
    throw new Error("citizen_data_conversation_role_invalid");
  }
  return normalized;
}

function requireOrdinal(value) {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized < 0 || normalized > 1000000) {
    throw new Error("citizen_data_conversation_ordinal_invalid");
  }
  return normalized;
}

export const CITIZEN_DATA_ARCHITECTURE = Object.freeze({
  schemaVersion: "universal_mind_citizen_data_v0.1",
  status: "staging_browser_consent_pilot",
  requiredCorePurposes: REQUIRED_CORE_PURPOSES,
  rewardsPermissionIncluded: false,
  rawPayloadDatabaseColumns: false,
  identityMode: "pseudonymous_secure_cookie",
});

export function createCitizenDataService({
  repository,
  vault,
  now = () => new Date(),
  uuid = () => crypto.randomUUID(),
  browserCredentialLifetimeDays = 365,
  residencyRegion = "AU",
}) {
  if (!repository?.transaction || !repository?.resolveCredential) {
    throw new Error("citizen_data_repository_required");
  }
  if (!vault?.storeJson || !vault?.delete) throw new Error("citizen_data_vault_required");

  async function identityForCredential(rawCredential) {
    if (!rawCredential) throw new Error("citizen_data_credential_required");
    const tokenSha256 = await sha256Hex(rawCredential);
    const identity = await repository.resolveCredential(tokenSha256, now().toISOString());
    if (!identity || identity.status !== "active") throw new Error("citizen_data_credential_invalid");
    return { ...identity, tokenSha256 };
  }

  async function requireConsent(citizenId, requiredPurposes) {
    const consent = await repository.getActiveConsent(citizenId, requiredPurposes);
    if (!consent) throw new Error("citizen_data_active_consent_required");
    return consent;
  }

  return Object.freeze({
    architecture: CITIZEN_DATA_ARCHITECTURE,

    async acceptCoreConsent(input = {}) {
      assertNoRewardFields(input);
      const documentVersion = cleanString(input.documentVersion, 80);
      const document = await repository.getPublishedConsentDocument(documentVersion);
      if (!document || document.status !== "published") throw new Error("citizen_data_consent_document_not_published");
      const purposes = normalizePurposes(input.purposes);
      const createdAt = now();
      const citizenId = uuid();
      const receiptId = uuid();
      const credentialId = uuid();
      const evidenceNonce = uuid();
      const rawCredential = randomToken();
      const tokenSha256 = await sha256Hex(rawCredential);
      const expiresAt = new Date(createdAt.getTime() + browserCredentialLifetimeDays * 86400000);

      const citizen = {
        id: citizenId,
        status: "active",
        residencyRegion: cleanString(residencyRegion, 16) || "AU",
        createdAt: createdAt.toISOString(),
      };
      const receipt = {
        id: receiptId,
        citizenId,
        documentId: document.id,
        documentVersion: document.version,
        documentCopySha256: document.copySha256 || document.copy_sha256 || null,
        action: "granted",
        evidenceNonce,
        source: "arrival_consent",
        purposes,
        occurredAt: createdAt.toISOString(),
      };
      const credential = {
        id: credentialId,
        citizenId,
        tokenSha256,
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      if (repository.grantCoreConsent) {
        await repository.grantCoreConsent({ citizen, receipt, credential });
      } else {
        await repository.transaction(async (tx) => {
          await tx.createCitizen(citizen);
          await tx.appendConsentReceipt(receipt);
          await tx.createBrowserCredential(credential);
        });
      }

      return {
        rawCredential,
        citizenId,
        receiptId,
        documentVersion: document.version,
        purposes,
        expiresAt: expiresAt.toISOString(),
      };
    },

    async consentStatus(rawCredential) {
      if (!rawCredential) return { granted: false, reason: "no_credential" };
      try {
        const identity = await identityForCredential(rawCredential);
        const consent = await repository.getActiveConsent(identity.citizenId, REQUIRED_CORE_PURPOSES);
        return consent
          ? { granted: true, receiptId: consent.id, documentVersion: consent.documentVersion, purposes: consent.purposes }
          : { granted: false, reason: "no_active_consent" };
      } catch (error) {
        if (String(error?.message || "") === "citizen_data_credential_invalid") {
          return { granted: false, reason: "invalid_credential" };
        }
        throw error;
      }
    },

    async startSession(rawCredential, input = {}) {
      assertNoRewardFields(input);
      const identity = await identityForCredential(rawCredential);
      const consent = await requireConsent(identity.citizenId, REQUIRED_CORE_PURPOSES);
      if (repository.ensureRelationalConsent) {
        await repository.ensureRelationalConsent(identity.citizenId, consent.id);
      }
      const session = {
        id: uuid(),
        citizenId: identity.citizenId,
        consentReceiptId: consent.id,
        locale: cleanString(input.locale, 32) || null,
        timezone: cleanString(input.timezone, 64) || null,
        startedAt: now().toISOString(),
      };
      await repository.transaction((tx) => tx.createExperienceSession(session));
      return { id: session.id, startedAt: session.startedAt };
    },

    async recordCheckin(rawCredential, input = {}) {
      assertNoRewardFields(input);
      const identity = await identityForCredential(rawCredential);
      const consent = await requireConsent(identity.citizenId, REQUIRED_CORE_PURPOSES);
      const sessionId = requireUuid(input.sessionId, "citizen_data_session_id_required");
      const idempotencyKey = requireUuid(input.idempotencyKey, "citizen_data_idempotency_key_required");
      const checkin = cleanString(input.checkin, 180);
      if (!checkin) throw new Error("citizen_data_checkin_required");
      await repository.assertSessionOwnership(identity.citizenId, sessionId);

      const checkinId = uuid();
      const objectId = uuid();
      const createdAt = now().toISOString();
      const storedObject = await vault.storeJson({
        citizenId: identity.citizenId,
        recordId: objectId,
        dataClass: "checkin_text",
        value: { schema_version: "citizen_checkin_v1", text: checkin },
      });

      try {
        await repository.transaction(async (tx) => {
          await tx.createEncryptedObject(storedObject);
          await tx.createCheckin({
            id: checkinId,
            citizenId: identity.citizenId,
            sessionId,
            consentReceiptId: consent.id,
            payloadObjectId: objectId,
            idempotencyKey,
            clientCreatedAt: input.clientCreatedAt || null,
            createdAt,
          });
          await tx.appendDataUseEvent({
            id: uuid(),
            citizenId: identity.citizenId,
            purposeCode: "core_checkin_processing",
            systemName: "universal_mind_citizen_data",
            operation: "collect",
            sourceRecordType: "checkin",
            sourceRecordId: checkinId,
            occurredAt: createdAt,
          });
          await tx.appendOutboxEvent({
            id: uuid(),
            citizenId: identity.citizenId,
            eventType: "inference_requested",
            aggregateType: "checkin",
            aggregateId: checkinId,
            metadata: { schema_version: "inference_request_v1", object_id: objectId },
            createdAt,
          });
        });
      } catch (error) {
        await vault.delete(storedObject).catch(() => {});
        throw error;
      }

      return { id: checkinId, sessionId, createdAt, inferenceStatus: "queued" };
    },

    async startConversation(rawCredential, input = {}) {
      assertNoRewardFields(input);
      const identity = await identityForCredential(rawCredential);
      const consent = await requireConsent(identity.citizenId, ["universal_one_conversation_memory"]);
      const sessionId = requireUuid(input.sessionId, "citizen_data_session_id_required");
      await repository.assertSessionOwnership(identity.citizenId, sessionId);
      const thread = {
        id: uuid(),
        citizenId: identity.citizenId,
        sessionId,
        consentReceiptId: consent.id,
        createdAt: now().toISOString(),
      };
      await repository.transaction((tx) => tx.createConversationThread(thread));
      return { id: thread.id, sessionId, createdAt: thread.createdAt };
    },

    async recordConversationTurn(rawCredential, input = {}) {
      assertNoRewardFields(input);
      const identity = await identityForCredential(rawCredential);
      await requireConsent(identity.citizenId, ["universal_one_conversation_memory"]);
      const threadId = requireUuid(input.threadId, "citizen_data_conversation_thread_id_required");
      const role = requireConversationRole(input.role);
      const ordinal = requireOrdinal(input.ordinal);
      const text = cleanString(input.text, 8000);
      if (!text) throw new Error("citizen_data_conversation_text_required");
      await repository.assertConversationThreadOwnership(identity.citizenId, threadId);

      const turnId = uuid();
      const objectId = uuid();
      const createdAt = now().toISOString();
      const storedObject = await vault.storeJson({
        citizenId: identity.citizenId,
        recordId: objectId,
        dataClass: "conversation_turn",
        value: { schema_version: "universal_one_conversation_turn_v1", role, text },
      });

      try {
        await repository.transaction(async (tx) => {
          await tx.createEncryptedObject(storedObject);
          await tx.createConversationTurn({
            id: turnId,
            citizenId: identity.citizenId,
            threadId,
            payloadObjectId: objectId,
            role,
            ordinal,
            createdAt,
          });
          await tx.appendDataUseEvent({
            id: uuid(),
            citizenId: identity.citizenId,
            purposeCode: "universal_one_conversation_memory",
            systemName: "universal_mind_citizen_data",
            operation: "remember",
            sourceRecordType: "conversation_turn",
            sourceRecordId: turnId,
            occurredAt: createdAt,
          });
          await tx.appendOutboxEvent({
            id: uuid(),
            citizenId: identity.citizenId,
            eventType: "conversation_turn_recorded",
            aggregateType: "conversation_turn",
            aggregateId: turnId,
            metadata: { schema_version: "conversation_turn_recorded_v1", object_id: objectId, role, ordinal },
            createdAt,
          });
        });
      } catch (error) {
        await vault.delete(storedObject).catch(() => {});
        throw error;
      }

      return { id: turnId, threadId, role, ordinal, createdAt };
    },

    async requestExport(rawCredential) {
      const identity = await identityForCredential(rawCredential);
      const consent = await repository.getActiveConsent(identity.citizenId, []);
      if (repository.ensureRelationalConsent && consent) {
        await repository.ensureRelationalConsent(identity.citizenId, consent.id);
      }
      const requestedAt = now().toISOString();
      const requestId = uuid();
      await repository.transaction(async (tx) => {
        await tx.createDataRightsRequest({
          id: requestId,
          citizenId: identity.citizenId,
          requestType: "export",
          status: "received",
          requestedAt,
        });
        await tx.appendOutboxEvent({
          id: uuid(),
          citizenId: identity.citizenId,
          eventType: "export_requested",
          aggregateType: "data_rights_request",
          aggregateId: requestId,
          metadata: { schema_version: "citizen_export_request_v1" },
          createdAt: requestedAt,
        });
      });
      return { id: requestId, status: "received", requestedAt };
    },

    async requestErasure(rawCredential) {
      const identity = await identityForCredential(rawCredential);
      const consent = await repository.getActiveConsent(identity.citizenId, []);
      const requestedAt = now().toISOString();
      const requestId = uuid();
      const withdrawalReceipt = consent ? {
        id: uuid(),
        citizenId: identity.citizenId,
        documentId: consent.documentId,
        documentVersion: consent.documentVersion,
        action: "withdrawn",
        supersedesReceiptId: consent.id,
        evidenceNonce: uuid(),
        source: "my_data",
        purposes: consent.purposes,
        occurredAt: requestedAt,
      } : null;
      const rightsRequest = {
        id: requestId,
        citizenId: identity.citizenId,
        requestType: "erase",
        status: "received",
        requestedAt,
      };

      if (repository.requestCoreErasure) {
        await repository.requestCoreErasure({
          citizenId: identity.citizenId,
          tokenSha256: identity.tokenSha256,
          withdrawalReceipt,
          rightsRequest,
        });
        return { id: requestId, status: "received", consentWithdrawn: Boolean(consent), requestedAt };
      }

      await repository.transaction(async (tx) => {
        if (withdrawalReceipt) await tx.appendConsentReceipt(withdrawalReceipt);
        await tx.revokeBrowserCredentials(identity.citizenId, requestedAt);
        await tx.markCitizenErasurePending(identity.citizenId);
        await tx.createDataRightsRequest(rightsRequest);
        await tx.appendOutboxEvent({
          id: uuid(),
          citizenId: identity.citizenId,
          eventType: "erasure_requested",
          aggregateType: "data_rights_request",
          aggregateId: requestId,
          metadata: { schema_version: "citizen_erasure_request_v1" },
          createdAt: requestedAt,
        });
      });
      return { id: requestId, status: "received", consentWithdrawn: Boolean(consent), requestedAt };
    },
  });
}

export { ALLOWED_CORE_PURPOSES, REQUIRED_CORE_PURPOSES, assertNoRewardFields };
