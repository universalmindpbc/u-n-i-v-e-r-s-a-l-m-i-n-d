import {
  PRIVACY_RESEARCH_ARCHITECTURE,
  assertHealthOmicsReadReady,
  assertNoPrivacyResearchWrites,
} from "../../cloudflare/privacy-research-foundations.js";

export const HEALTHOMICS_SDK_VERSION = "3.1090.0";

export function healthOmicsClientPlan(env = {}) {
  assertNoPrivacyResearchWrites(env);
  return {
    provider: PRIVACY_RESEARCH_ARCHITECTURE.healthOmics.provider,
    sdk: PRIVACY_RESEARCH_ARCHITECTURE.healthOmics.sdk,
    sdk_version: HEALTHOMICS_SDK_VERSION,
    region: env.AWS_HEALTHOMICS_REGION || "ap-southeast-2",
    sequence_store_id: env.AWS_HEALTHOMICS_SEQUENCE_STORE_ID || null,
    kms_key_arn: env.AWS_HEALTHOMICS_KMS_KEY_ARN || null,
    access_mode: "metadata_read_only",
    sequence_store_purpose: PRIVACY_RESEARCH_ARCHITECTURE.healthOmics.sequenceStorePurpose,
    generic_biometrics_store: false,
    writes_implemented: false,
    live_data_present: false,
  };
}

export async function inspectConfiguredSequenceStore(env = {}, options = {}) {
  assertHealthOmicsReadReady(env);
  assertNoPrivacyResearchWrites(env);

  let client = options.client;
  let commandFactory = options.commandFactory;
  if (!client || !commandFactory) {
    const sdk = await import("@aws-sdk/client-omics");
    client = new sdk.OmicsClient({ region: env.AWS_HEALTHOMICS_REGION });
    commandFactory = (input) => new sdk.GetSequenceStoreCommand(input);
  }

  const result = await client.send(commandFactory({ id: env.AWS_HEALTHOMICS_SEQUENCE_STORE_ID }));
  const configuredKmsKey = String(env.AWS_HEALTHOMICS_KMS_KEY_ARN);
  const observedKmsKey = String(result?.sseConfig?.keyArn || "");
  if (!observedKmsKey || observedKmsKey !== configuredKmsKey) throw new Error("healthomics_kms_key_mismatch");

  return {
    schema_version: "universal_mind_healthomics_readiness_v1",
    id: String(result.id || ""),
    name: String(result.name || ""),
    status: String(result.status || "UNKNOWN"),
    region: env.AWS_HEALTHOMICS_REGION,
    kms_key_matches: true,
    s3_access_logs_configured: Boolean(result?.s3Access?.accessLogLocation),
    e_tag_algorithm_family: String(result.eTagAlgorithmFamily || ""),
    purpose: PRIVACY_RESEARCH_ARCHITECTURE.healthOmics.sequenceStorePurpose,
    writes_enabled: false,
    live_data_present: false,
  };
}
