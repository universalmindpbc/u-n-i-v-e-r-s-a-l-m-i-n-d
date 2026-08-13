import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CITIZEN_DATA_ARCHITECTURE,
  REQUIRED_CORE_PURPOSES,
  createCitizenDataService,
} from "../cloudflare/citizen-data-core.js";
import { createEnvelopeVault } from "../cloudflare/citizen-data-vault.js";
import { createCitizenDataWorker, createRemoteCitizenDataService } from "../cloudflare/citizen-data-worker.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const sql = read("database/migrations/0001_citizen_data_foundation.sql");
const sql0002 = read("database/migrations/0002_encrypted_object_versions.sql");
const sql0003 = read("database/migrations/0003_arrival_consent_v1.sql");
const sql0004 = read("database/migrations/0004_arrival_consent_v2.sql");
const sql0005 = read("database/migrations/0005_arrival_consent_v3.sql");
const arrivalConsentCopy = read("database/consent/arrival-consent-v1.txt");
const arrivalConsentCopyV2 = read("database/consent/arrival-consent-v2.txt");
const arrivalConsentCopyV3 = read("database/consent/arrival-consent-v3.txt");
const contract = JSON.parse(read("database/citizen-data-contract-v0.1.json"));
const readme = read("database/README.md");
const wrangler = read("cloudflare/wrangler.citizen-data.toml");
const inferenceWorker = read("cloudflare/iam-citizen-needs-worker.js");
const awsTemplate = read("database/infrastructure/aws/citizen-data-staging.yaml");
const awsLambda = read("database/infrastructure/aws/citizen-data-lambda.mjs");
const awsReadme = read("database/infrastructure/aws/README.md");
const identityCenterPolicy = JSON.parse(read("database/infrastructure/aws/identity-center-permission-policy.json"));
const inductionPage = read("i  a m/induction.html");
const checkinPage = read("i  a m/vogue-self-report.html");
const citizenDataClient = read("i  a m/citizen-data-client.js");
const citizenDataConsent = read("i  a m/citizen-data-consent.js");
const globe = read("i  a m/globe.js");
const homepageCheckin = read("i  a m/homepage-checkin.js");

assert.equal(CITIZEN_DATA_ARCHITECTURE.schemaVersion, "universal_mind_citizen_data_v0.1");
assert.equal(CITIZEN_DATA_ARCHITECTURE.rewardsPermissionIncluded, false);
assert.deepEqual(REQUIRED_CORE_PURPOSES, ["core_checkin_processing", "cross_session_memory"]);
assert.equal(contract.status, "staging_browser_consent_pilot");
assert.equal(contract.core_consent.placement, "before_checkin");
assert.equal(contract.core_consent.rewards_permission_included, false);
assert.equal(contract.sensitive_payload_storage.plaintext_database_columns, false);
assert.equal(contract.sensitive_payload_storage.exact_object_version_recorded, true);
assert.equal(contract.sensitive_payload_storage.dual_write_enabled, false);
assert.equal(contract.projections.fhenix, "separate_happiness_rewards_service_only");

for (const table of [
  "citizens",
  "consent_documents",
  "consent_receipts",
  "browser_credentials",
  "experience_sessions",
  "encrypted_objects",
  "checkins",
  "conversation_threads",
  "conversation_turns",
  "inference_runs",
  "engagement_events",
  "data_use_events",
  "vector_projections",
  "data_rights_requests",
  "erasure_targets",
  "outbox_events",
]) {
  assert.match(sql, new RegExp(`CREATE TABLE citizen_data\\.${table} \\(`));
}

assert.match(sql, /ALTER TABLE citizen_data\.checkins FORCE ROW LEVEL SECURITY/);
assert.match(sql, /ALTER TABLE citizen_data\.conversation_turns FORCE ROW LEVEL SECURITY/);
assert.match(sql, /ALTER TABLE citizen_data\.data_rights_requests FORCE ROW LEVEL SECURITY/);
assert.match(sql, /CREATE TRIGGER consent_receipts_append_only/);
assert.match(sql, /provider_storage_enabled boolean NOT NULL DEFAULT false/);
assert.match(sql, /CHECK \(provider_storage_enabled = false\)/);
assert.match(sql, /FOREIGN KEY \(session_id, citizen_id\)/);
assert.match(sql, /FOREIGN KEY \(payload_object_id, citizen_id\)/);
assert.match(sql, /FOREIGN KEY \(result_object_id, citizen_id\)/);
assert.match(sql, /FOREIGN KEY \(request_id, citizen_id\)/);
assert.match(sql, /HAPPINESS permissions are intentionally absent/);
assert.doesNotMatch(sql, /purpose_code IN \([^)]*(?:happiness|reward)/is);
assert.doesNotMatch(sql, /(?:checkin_text|conversation_turn|inference_result)\s+text/i);
assert.match(sql0002, /ADD COLUMN object_version_id text/);
assert.match(sql0003, /arrival-consent-v1/);
assert.match(sql0003, new RegExp(crypto.createHash("sha256").update(arrivalConsentCopy).digest("hex")));
assert.match(sql0004, /arrival-consent-v2/);
assert.match(sql0004, new RegExp(crypto.createHash("sha256").update(arrivalConsentCopyV2).digest("hex")));
assert.match(sql0005, /arrival-consent-v3/);
assert.match(sql0005, new RegExp(crypto.createHash("sha256").update(arrivalConsentCopyV3).digest("hex")));
assert.match(readme, /Existing browser `localStorage` check-ins are never silently uploaded/);
assert.match(wrangler, /CITIZEN_DATA_ENABLED = "false"/);
assert.match(wrangler, /\[env\.staging\.vars\][\s\S]*CITIZEN_DATA_ENABLED = "true"/);
assert.match(wrangler, /staging\.universalmind\.tv\/vogue\/iam\/api\/citizen-data\/\*/);
assert.match(wrangler, /CITIZEN_DATA_ZAMA_SHADOW_ENABLED = "false"/);
assert.match(wrangler, /CITIZEN_DATA_HEALTHOMICS_WRITES_ENABLED = "false"/);
assert.match(inferenceWorker, /store: false/);
assert.match(inductionPage, /data-induction-enter/);
assert.doesNotMatch(inductionPage, /data-arrival-consent|arrival-consent-title|data-consent-accept|data-consent-continue-without/);
assert.match(inductionPage, /privacy-first\.html/);
assert.doesNotMatch(checkinPage, /data-arrival-consent|arrival-consent-title/);
assert.match(checkinPage, /data-iam-form[^>]*aria-disabled="true"[^>]*inert/);
assert.doesNotMatch(inductionPage, /citizen-data-client\.js|citizen-data-consent\.js/);
assert.match(checkinPage, /citizen-data-client\.js/);
assert.match(checkinPage, /citizen-data-consent\.js/);
assert.match(citizenDataClient, /staging\.universalmind\.tv/);
assert.match(citizenDataClient, /arrival-consent-v3/);
assert.match(citizenDataClient, /credentials: "same-origin"/);
assert.match(citizenDataClient, /window\.crypto\.randomUUID\(\)/);
assert.match(citizenDataConsent, /iam:guest-checkin-ready/);
assert.match(citizenDataConsent, /durableAccountStorage: false/);
assert.doesNotMatch(citizenDataConsent, /acceptConsent|consentStatus|permission=required|Nothing has been collected/);
assert.doesNotMatch(globe, /recordCheckin\(phrase\)/);
assert.doesNotMatch(globe, /Encrypting your check-in|Preparing your experience|Saving only with your permission|Encrypted and remembered|We could not securely save this check-in/);
assert.doesNotMatch(checkinPage, /data-citizen-data-status/);
assert.doesNotMatch(homepageCheckin, /IAMCitizenData|recordCheckin/);
assert.match(globe, /function sensitiveStorageTargets\(\) \{\s*return \[window\.sessionStorage\];/);
assert.match(globe, /function clearLegacyCrossSessionCheckIn\(\)/);
assert.doesNotMatch(globe, /readStoredValue\(window\.localStorage, "(?:iamLatestCheckinValue|citizenNeedsLatestCheckinValue)"\)/);

assert.match(awsTemplate, /AuroraPostgresEngineVersion:\n\s+Type: String/);
assert.doesNotMatch(awsTemplate, /AuroraPostgresEngineVersion:\n(?: {4}.*\n)* {4}Default:/);
assert.match(awsTemplate, /DeletionPolicy: Retain/);
assert.match(awsTemplate, /UpdateReplacePolicy: Retain/);
assert.match(awsTemplate, /Type: AWS::Lambda::Function/);
assert.match(awsTemplate, /ReservedConcurrentExecutions: 2/);
assert.match(awsTemplate, /CITIZEN_DATA_EDGE_SHARED_SECRET/);
assert.match(awsTemplate, /Type: AWS::DynamoDB::Table/);
assert.match(awsTemplate, /BillingMode: PAY_PER_REQUEST/);
assert.match(awsTemplate, /PointInTimeRecoveryEnabled: true/);
assert.match(awsTemplate, /StreamViewType: NEW_IMAGE/);
assert.match(awsTemplate, /Type: AWS::Lambda::EventSourceMapping/);
assert.match(awsTemplate, /CITIZEN_DATA_CONSENT_DOCUMENT_VERSION: arrival-consent-v3/);
assert.match(awsLambda, /TransactWriteItemsCommand/);
assert.match(awsLambda, /consent_projection_event/);
assert.match(awsLambda, /projectConsentLedgerRecords/);
assert.match(awsTemplate, /InvokedViaFunctionUrl: true/);
assert.match(awsTemplate, /EnableKeyRotation: true/);
assert.match(awsTemplate, /DeletionProtection: true/);
assert.match(awsTemplate, /EnableHttpEndpoint: true/);
assert.match(awsTemplate, /PubliclyAccessible: false/);
assert.match(awsTemplate, /Default: 0\n\s+MinValue: 0/);
assert.match(awsTemplate, /SecondsUntilAutoPause: !Ref DatabaseIdleSecondsBeforePause/);
assert.doesNotMatch(awsTemplate, /SecurityGroupIngress:/);
assert.doesNotMatch(awsTemplate, /(?:AccessKeyId|SecretAccessKey):/i);
assert.match(awsReadme, /Staging browser service path/);
assert.match(awsReadme, /future changes remain\s+billable and\s+require review/);
assert.doesNotMatch(awsReadme, /\b\d{12}\b/);
assert.doesNotMatch(awsReadme, /https:\/\/[^\s`]*awsapps\.com\/start/i);
const identityCenterActions = identityCenterPolicy.Statement.flatMap((statement) => (
  Array.isArray(statement.Action) ? statement.Action : [statement.Action]
));
assert.ok(identityCenterActions.includes("iam:CreateServiceLinkedRole"));
assert.ok(identityCenterActions.includes("rds-data:ExecuteStatement"));
assert.ok(identityCenterActions.includes("secretsmanager:GetSecretValue"));
assert.ok(identityCenterActions.includes("s3:DeleteObjectVersion"));
assert.ok(identityCenterActions.includes("s3:GetObjectVersion"));
assert.ok(identityCenterActions.includes("lambda:CreateFunction"));
assert.ok(identityCenterActions.includes("lambda:CreateEventSourceMapping"));
assert.ok(identityCenterActions.includes("dynamodb:CreateTable"));
assert.ok(identityCenterActions.includes("iam:PassRole"));
assert.match(JSON.stringify(identityCenterPolicy), /universal-mind-citizen-dat-\*\/synthetic-service-validation/);
assert.match(JSON.stringify(identityCenterPolicy), /universal-mind-citizen-dat-\*\/service-artifacts/);
assert.doesNotMatch(JSON.stringify(identityCenterPolicy), /universal-mind-citizen-da-\*/);
assert.equal(identityCenterActions.includes("iam:CreateAccessKey"), false);
assert.equal(identityCenterActions.includes("iam:CreateUser"), false);

function createMemoryRepository() {
  const state = {
    documents: [{
      id: "00000000-0000-4000-8000-000000000001",
      version: "founder-draft-test-v1",
      status: "published",
      copySha256: "a".repeat(64),
    }],
    citizens: [],
    consents: [],
    credentials: [],
    sessions: [],
    objects: [],
    checkins: [],
    conversationThreads: [],
    conversationTurns: [],
    dataUseEvents: [],
    outbox: [],
    rightsRequests: [],
  };

  const repository = {
    state,
    async transaction(work) { return work(repository); },
    async getPublishedConsentDocument(version) {
      return state.documents.find((item) => item.version === version && item.status === "published") || null;
    },
    async createCitizen(record) { state.citizens.push(record); },
    async appendConsentReceipt(record) { state.consents.push(record); },
    async createBrowserCredential(record) { state.credentials.push(record); },
    async resolveCredential(tokenSha256, isoNow) {
      const credential = state.credentials.find((item) => item.tokenSha256 === tokenSha256 && !item.revokedAt);
      if (!credential || credential.expiresAt <= isoNow) return null;
      const citizen = state.citizens.find((item) => item.id === credential.citizenId);
      return citizen ? { citizenId: citizen.id, status: citizen.status } : null;
    },
    async getActiveConsent(citizenId, requiredPurposes) {
      const grants = state.consents.filter((item) => item.citizenId === citizenId && item.action === "granted");
      const withdrawn = new Set(state.consents
        .filter((item) => item.citizenId === citizenId && item.action !== "granted")
        .map((item) => item.supersedesReceiptId));
      const grant = grants.reverse().find((item) => !withdrawn.has(item.id) && requiredPurposes.every((purpose) => item.purposes.includes(purpose)));
      if (!grant) return null;
      const document = state.documents.find((item) => item.id === grant.documentId);
      return { ...grant, documentVersion: document.version };
    },
    async createExperienceSession(record) { state.sessions.push(record); },
    async assertSessionOwnership(citizenId, sessionId) {
      if (!state.sessions.some((item) => item.id === sessionId && item.citizenId === citizenId)) {
        throw new Error("citizen_data_session_not_found");
      }
    },
    async createEncryptedObject(record) { state.objects.push(record); },
    async createCheckin(record) {
      if (state.checkins.some((item) => item.citizenId === record.citizenId && item.idempotencyKey === record.idempotencyKey)) {
        throw new Error("citizen_data_duplicate_checkin");
      }
      state.checkins.push(record);
    },
    async createConversationThread(record) { state.conversationThreads.push(record); },
    async assertConversationThreadOwnership(citizenId, threadId) {
      if (!state.conversationThreads.some((item) => item.id === threadId && item.citizenId === citizenId)) {
        throw new Error("citizen_data_conversation_thread_not_found");
      }
    },
    async createConversationTurn(record) {
      if (state.conversationTurns.some((item) => item.threadId === record.threadId && item.ordinal === record.ordinal)) {
        throw new Error("citizen_data_duplicate_conversation_turn");
      }
      state.conversationTurns.push(record);
    },
    async appendDataUseEvent(record) { state.dataUseEvents.push(record); },
    async appendOutboxEvent(record) { state.outbox.push(record); },
    async createDataRightsRequest(record) { state.rightsRequests.push(record); },
    async revokeBrowserCredentials(citizenId, revokedAt) {
      state.credentials.filter((item) => item.citizenId === citizenId).forEach((item) => { item.revokedAt = revokedAt; });
    },
    async markCitizenErasurePending(citizenId) {
      const citizen = state.citizens.find((item) => item.id === citizenId);
      citizen.status = "erasure_pending";
    },
  };
  return repository;
}

function createSyntheticVaultFixture() {
  const objects = new Map();
  const rootKeyCopy = new Uint8Array(32).fill(17);
  const vault = createEnvelopeVault({
    keyManager: {
      async generateDataKey() {
        return {
          plaintextKey: rootKeyCopy.slice(),
          wrappedKey: new Uint8Array([1, 2, 3, 4]),
          keyArn: "synthetic-test-key-not-aws",
        };
      },
    },
    objectStore: {
      async put({ objectKey, body }) {
        objects.set(objectKey, body.slice());
        return { provider: "synthetic_test", bucket: "synthetic-citizen-data", versionId: `version-${objects.size}` };
      },
      async delete({ objectKey }) { objects.delete(objectKey); },
    },
  });
  return { vault, objects };
}

let uuidCounter = 100;
const uuid = () => `00000000-0000-4000-8000-${String(uuidCounter++).padStart(12, "0")}`;
const fixedNow = () => new Date("2026-07-29T12:00:00.000Z");
const repository = createMemoryRepository();
const vaultFixture = createSyntheticVaultFixture();
const service = createCitizenDataService({ repository, vault: vaultFixture.vault, now: fixedNow, uuid });

assert.deepEqual(await service.consentStatus(""), { granted: false, reason: "no_credential" });
await assert.rejects(
  () => service.acceptCoreConsent({ documentVersion: "founder-draft-test-v1", purposes: ["core_checkin_processing"] }),
  /citizen_data_required_purpose_missing/,
);
await assert.rejects(
  () => service.acceptCoreConsent({
    documentVersion: "founder-draft-test-v1",
    purposes: REQUIRED_CORE_PURPOSES,
    rewardBalance: 10,
  }),
  /citizen_data_rewards_field_forbidden/,
);

const accepted = await service.acceptCoreConsent({
  documentVersion: "founder-draft-test-v1",
  purposes: [...REQUIRED_CORE_PURPOSES, "universal_one_conversation_memory"],
  residencyRegion: "AU",
});
assert.ok(accepted.rawCredential.length >= 40);
assert.equal(repository.state.credentials[0].tokenSha256.length, 64);
assert.equal(JSON.stringify(repository.state).includes(accepted.rawCredential), false);
assert.equal((await service.consentStatus(accepted.rawCredential)).granted, true);

const session = await service.startSession(accepted.rawCredential, { locale: "en-AU", timezone: "Australia/Sydney" });
const sensitiveCheckin = "I am hopeful and a little overwhelmed";
const recorded = await service.recordCheckin(accepted.rawCredential, {
  sessionId: session.id,
  idempotencyKey: uuid(),
  checkin: sensitiveCheckin,
  clientCreatedAt: "2026-07-29T11:59:59.000Z",
});
assert.equal(recorded.inferenceStatus, "queued");
assert.equal(repository.state.checkins.length, 1);
assert.equal(repository.state.objects.length, 1);
assert.equal(repository.state.outbox[0].eventType, "inference_requested");
assert.equal(JSON.stringify(repository.state).includes(sensitiveCheckin), false);
const ciphertext = [...vaultFixture.objects.values()][0];
assert.equal(new TextDecoder().decode(ciphertext).includes(sensitiveCheckin), false);

const conversation = await service.startConversation(accepted.rawCredential, { sessionId: session.id });
const syntheticCitizenTurn = "This fictional citizen turn tests encrypted conversation memory.";
const syntheticUniversalOneTurn = "This fictional Universal One response tests the same privacy boundary.";
await service.recordConversationTurn(accepted.rawCredential, {
  threadId: conversation.id,
  role: "citizen",
  ordinal: 0,
  text: syntheticCitizenTurn,
});
await service.recordConversationTurn(accepted.rawCredential, {
  threadId: conversation.id,
  role: "universal_one",
  ordinal: 1,
  text: syntheticUniversalOneTurn,
});
assert.equal(repository.state.conversationThreads.length, 1);
assert.equal(repository.state.conversationTurns.length, 2);
assert.equal(repository.state.objects.length, 3);
assert.equal(JSON.stringify(repository.state).includes(syntheticCitizenTurn), false);
assert.equal(JSON.stringify(repository.state).includes(syntheticUniversalOneTurn), false);
for (const encryptedPayload of vaultFixture.objects.values()) {
  const decoded = new TextDecoder().decode(encryptedPayload);
  assert.equal(decoded.includes(syntheticCitizenTurn), false);
  assert.equal(decoded.includes(syntheticUniversalOneTurn), false);
}
assert.deepEqual(
  repository.state.dataUseEvents.map((event) => event.purposeCode),
  ["core_checkin_processing", "universal_one_conversation_memory", "universal_one_conversation_memory"],
);
assert.equal(repository.state.outbox.filter((event) => event.eventType === "conversation_turn_recorded").length, 2);

const exportRequest = await service.requestExport(accepted.rawCredential);
assert.equal(exportRequest.status, "received");
const eraseRequest = await service.requestErasure(accepted.rawCredential);
assert.equal(eraseRequest.consentWithdrawn, true);
assert.equal(repository.state.citizens[0].status, "erasure_pending");
assert.equal((await service.consentStatus(accepted.rawCredential)).granted, false);
await assert.rejects(
  () => service.startSession(accepted.rawCredential, {}),
  /citizen_data_credential_invalid/,
);

const hotRepository = createMemoryRepository();
const hotVault = createSyntheticVaultFixture();
let hotGrantWrites = 0;
let relationalEnsures = 0;
let hotErasureWrites = 0;
hotRepository.grantCoreConsent = async ({ citizen, receipt, credential }) => {
  hotGrantWrites += 1;
  await hotRepository.createCitizen(citizen);
  await hotRepository.appendConsentReceipt(receipt);
  await hotRepository.createBrowserCredential(credential);
};
hotRepository.ensureRelationalConsent = async () => { relationalEnsures += 1; };
hotRepository.requestCoreErasure = async ({ citizenId, withdrawalReceipt, rightsRequest }) => {
  hotErasureWrites += 1;
  if (withdrawalReceipt) await hotRepository.appendConsentReceipt(withdrawalReceipt);
  await hotRepository.revokeBrowserCredentials(citizenId, rightsRequest.requestedAt);
  await hotRepository.markCitizenErasurePending(citizenId);
  await hotRepository.createDataRightsRequest(rightsRequest);
};
const hotService = createCitizenDataService({ repository: hotRepository, vault: hotVault.vault, now: fixedNow, uuid });
const hotAccepted = await hotService.acceptCoreConsent({
  documentVersion: "founder-draft-test-v1",
  purposes: [...REQUIRED_CORE_PURPOSES, "universal_one_conversation_memory"],
});
assert.equal(hotGrantWrites, 1);
assert.equal((await hotService.consentStatus(hotAccepted.rawCredential)).granted, true);
await hotService.startSession(hotAccepted.rawCredential, { locale: "en-AU" });
assert.equal(relationalEnsures, 1);
await hotService.requestErasure(hotAccepted.rawCredential);
assert.equal(hotErasureWrites, 1);
assert.equal((await hotService.consentStatus(hotAccepted.rawCredential)).granted, false);

const disabledWorker = createCitizenDataWorker({ serviceFactory: async () => service });
const disabledResponse = await disabledWorker.fetch(new Request("https://staging.universalmind.tv/v1/consent/status"), {
  CITIZEN_DATA_ENABLED: "false",
});
assert.equal(disabledResponse.status, 503);
assert.equal((await disabledResponse.json()).error, "citizen_data_foundation_disabled");

const workerRepository = createMemoryRepository();
const workerVault = createSyntheticVaultFixture();
const workerService = createCitizenDataService({ repository: workerRepository, vault: workerVault.vault, now: fixedNow, uuid });
const worker = createCitizenDataWorker({ serviceFactory: async () => workerService });
const consentResponse = await worker.fetch(new Request("https://staging.universalmind.tv/v1/consent/accept", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Origin": "https://staging.universalmind.tv",
    "X-Universal-Mind-Request": "citizen-data-v1",
  },
  body: JSON.stringify({
    documentVersion: "founder-draft-test-v1",
    purposes: [...REQUIRED_CORE_PURPOSES, "universal_one_conversation_memory"],
  }),
}), { CITIZEN_DATA_ENABLED: "true" });
assert.equal(consentResponse.status, 201);
assert.match(consentResponse.headers.get("Set-Cookie"), /Secure; HttpOnly; SameSite=Strict/);
assert.match(consentResponse.headers.get("Set-Cookie"), /__Host-um_citizen_session_v1=/);
const consentResponseBody = await consentResponse.json();
assert.equal(JSON.stringify(consentResponseBody).includes("rawCredential"), false);
assert.equal(Object.hasOwn(consentResponseBody, "citizen_id"), false);
const workerCookie = consentResponse.headers.get("Set-Cookie").split(";", 1)[0];
const workerMutationHeaders = {
  "Content-Type": "application/json",
  "Cookie": workerCookie,
  "Origin": "https://staging.universalmind.tv",
  "X-Universal-Mind-Request": "citizen-data-v1",
};
const workerSessionResponse = await worker.fetch(new Request("https://staging.universalmind.tv/v1/sessions", {
  method: "POST",
  headers: workerMutationHeaders,
  body: JSON.stringify({ locale: "en-AU", timezone: "Australia/Sydney" }),
}), { CITIZEN_DATA_ENABLED: "true" });
assert.equal(workerSessionResponse.status, 201);
const workerSession = await workerSessionResponse.json();
const workerConversationResponse = await worker.fetch(new Request("https://staging.universalmind.tv/v1/conversations", {
  method: "POST",
  headers: workerMutationHeaders,
  body: JSON.stringify({ sessionId: workerSession.id }),
}), { CITIZEN_DATA_ENABLED: "true" });
assert.equal(workerConversationResponse.status, 201);
const workerConversation = await workerConversationResponse.json();
const workerTurnResponse = await worker.fetch(new Request("https://staging.universalmind.tv/v1/conversation-turns", {
  method: "POST",
  headers: workerMutationHeaders,
  body: JSON.stringify({
    threadId: workerConversation.id,
    role: "citizen",
    ordinal: 0,
    text: "Synthetic Worker conversation route proof.",
  }),
}), { CITIZEN_DATA_ENABLED: "true" });
assert.equal(workerTurnResponse.status, 202);
assert.equal(workerRepository.state.conversationThreads.length, 1);
assert.equal(workerRepository.state.conversationTurns.length, 1);
assert.equal(JSON.stringify(workerRepository.state).includes("Synthetic Worker conversation route proof."), false);

const crossOriginResponse = await worker.fetch(new Request("https://staging.universalmind.tv/v1/sessions", {
  method: "POST",
  headers: {
    ...workerMutationHeaders,
    "Origin": "https://universalmind.tv",
  },
  body: JSON.stringify({ locale: "en-AU" }),
}), { CITIZEN_DATA_ENABLED: "true" });
assert.equal(crossOriginResponse.status, 400);
assert.equal((await crossOriginResponse.json()).error, "citizen_data_origin_forbidden");

let signedBackendRequest = null;
const remoteService = createRemoteCitizenDataService({
  CITIZEN_DATA_BACKEND_URL: "https://synthetic-backend.invalid/",
  CITIZEN_DATA_BACKEND_SHARED_SECRET: "synthetic-shared-secret-for-unit-test",
}, async (url, options) => {
  signedBackendRequest = { url, options };
  return Response.json({ granted: false, reason: "no_credential" });
});
assert.deepEqual(await remoteService.consentStatus(""), { granted: false, reason: "no_credential" });
assert.equal(signedBackendRequest.url, "https://synthetic-backend.invalid/");
assert.match(signedBackendRequest.options.headers["X-Universal-Mind-Edge-Timestamp"], /^\d{13}$/);
assert.match(signedBackendRequest.options.headers["X-Universal-Mind-Edge-Nonce"], /^[0-9a-f-]{36}$/);
assert.match(signedBackendRequest.options.headers["X-Universal-Mind-Edge-Signature"], /^[0-9a-f]{64}$/);
assert.equal(signedBackendRequest.options.body.includes("synthetic-shared-secret"), false);
assert.equal(signedBackendRequest.options.redirect, "manual");

const redirectingRemoteService = createRemoteCitizenDataService({
  CITIZEN_DATA_BACKEND_URL: "https://synthetic-backend.invalid/",
  CITIZEN_DATA_BACKEND_SHARED_SECRET: "synthetic-shared-secret-for-unit-test",
}, async () => new Response(null, {
  status: 302,
  headers: { Location: "https://redirect.invalid/" },
}));
await assert.rejects(
  () => redirectingRemoteService.consentStatus(""),
  /citizen_data_backend_redirect_forbidden/,
);

const rateLimitedWorker = createCitizenDataWorker({
  serviceFactory: async () => {
    throw new Error("service_should_not_be_created_after_rate_limit");
  },
});
const rateLimitedResponse = await rateLimitedWorker.fetch(
  new Request("https://staging.universalmind.tv/v1/consent/status"),
  {
    CITIZEN_DATA_ENABLED: "true",
    CITIZEN_DATA_RATE_LIMITER: { limit: async () => ({ success: false }) },
  },
);
assert.equal(rateLimitedResponse.status, 429);

console.log("Citizen data foundation checks passed.");
