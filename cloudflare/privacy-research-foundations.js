const enabled = (env, key) => String(env[key] || "false") === "true";

export const PRIVACY_RESEARCH_ARCHITECTURE = Object.freeze({
  schemaVersion: "universal_mind_privacy_research_v1",
  principle: "parallel_proof_without_live_citizen_data",
  zama: Object.freeze({
    provider: "zama",
    implementation: "tfhe-rs",
    purpose: "sensitive_inference_insight_benchmark",
    mode: "synthetic_fixture_benchmark_not_live_processing",
    allowedData: Object.freeze([
      "synthetic_inference_score",
      "synthetic_inference_aggregate",
      "synthetic_threshold_result",
    ]),
    prohibitedData: Object.freeze([
      "raw_checkin",
      "raw_conversation",
      "raw_voice",
      "citizen_identifier",
      "genomic_read_set",
    ]),
  }),
  fhenix: Object.freeze({
    provider: "fhenix",
    implementation: "cofhe",
    purpose: "happiness_confidential_rewards_benchmark",
    mode: "separate_testnet_contract_not_deployed",
    allowedData: Object.freeze([
      "pseudonymous_reward_account",
      "encrypted_reward_amount",
      "encrypted_reward_balance",
      "non_sensitive_attestation_commitment",
    ]),
    prohibitedData: Object.freeze([
      "checkin",
      "conversation",
      "diagnosis",
      "inference_score",
      "mood",
      "patient_identifier",
    ]),
  }),
  healthOmics: Object.freeze({
    provider: "aws-healthomics",
    sdk: "@aws-sdk/client-omics",
    purpose: "future_horizon_2_3_research_readiness",
    mode: "read_only_adapter_configured_no_store_no_data",
    sequenceStorePurpose: "validated_omics_read_sets_only",
    genericBiometricsStore: false,
    writesImplemented: false,
    allowedData: Object.freeze([
      "validated_horizon_3_omics_read_set",
      "approved_horizon_2_omics_derived_research_artifact",
    ]),
    prohibitedData: Object.freeze([
      "checkin",
      "conversation",
      "engagement_event",
      "inference_score",
      "raw_voice",
      "reward_balance",
    ]),
  }),
});

export function privacyResearchReadiness(env = {}) {
  return {
    schema_version: PRIVACY_RESEARCH_ARCHITECTURE.schemaVersion,
    live_citizen_data_used: false,
    zama: {
      ...PRIVACY_RESEARCH_ARCHITECTURE.zama,
      benchmark_enabled: enabled(env, "ZAMA_SENSITIVE_INSIGHT_BENCHMARK_ENABLED"),
      real_citizen_shadow_traffic_enabled: false,
    },
    fhenix: {
      ...PRIVACY_RESEARCH_ARCHITECTURE.fhenix,
      benchmark_enabled: enabled(env, "FHENIX_HAPPINESS_BENCHMARK_ENABLED"),
      rewards_only: true,
      contract_address_configured: Boolean(env.FHENIX_HAPPINESS_PILOT_CONTRACT_ADDRESS),
      issuance_enabled: false,
    },
    healthomics: {
      ...PRIVACY_RESEARCH_ARCHITECTURE.healthOmics,
      reads_enabled: enabled(env, "AWS_HEALTHOMICS_READS_ENABLED"),
      writes_enabled: false,
      horizon_2_enabled: enabled(env, "UNIVERSAL_MIND_HORIZON_2_ENABLED"),
      horizon_3_enabled: enabled(env, "UNIVERSAL_MIND_HORIZON_3_ENABLED"),
      region_configured: Boolean(env.AWS_HEALTHOMICS_REGION),
      sequence_store_configured: Boolean(env.AWS_HEALTHOMICS_SEQUENCE_STORE_ID),
      kms_key_configured: Boolean(env.AWS_HEALTHOMICS_KMS_KEY_ARN),
    },
  };
}

export function assertHealthOmicsReadReady(env = {}) {
  if (!enabled(env, "AWS_HEALTHOMICS_READS_ENABLED")) throw new Error("healthomics_reads_disabled");
  if (enabled(env, "AWS_HEALTHOMICS_WRITES_ENABLED")) throw new Error("healthomics_writes_not_implemented");
  if (!enabled(env, "UNIVERSAL_MIND_HORIZON_2_ENABLED") && !enabled(env, "UNIVERSAL_MIND_HORIZON_3_ENABLED")) {
    throw new Error("healthomics_research_horizons_disabled");
  }
  if (!env.AWS_HEALTHOMICS_REGION) throw new Error("healthomics_region_not_configured");
  if (!/^\d{10,36}$/.test(String(env.AWS_HEALTHOMICS_SEQUENCE_STORE_ID || ""))) {
    throw new Error("healthomics_sequence_store_not_configured");
  }
  if (!/^arn:aws[a-z-]*:kms:[a-z0-9-]+:\d{12}:key\/[a-f0-9-]+$/i.test(String(env.AWS_HEALTHOMICS_KMS_KEY_ARN || ""))) {
    throw new Error("healthomics_kms_key_not_configured");
  }
  return true;
}

export function assertResearchDataClass(lane, dataClass) {
  const profile = PRIVACY_RESEARCH_ARCHITECTURE[lane];
  if (!profile) throw new Error("privacy_research_lane_not_supported");
  const normalized = String(dataClass || "").trim();
  if (profile.prohibitedData.includes(normalized)) throw new Error(`${lane}_data_class_forbidden`);
  if (!profile.allowedData.includes(normalized)) throw new Error(`${lane}_data_class_not_approved`);
  return true;
}

export function assertNoPrivacyResearchWrites(env = {}) {
  if (enabled(env, "AWS_HEALTHOMICS_WRITES_ENABLED")) throw new Error("healthomics_writes_not_implemented");
  if (enabled(env, "FHENIX_HAPPINESS_ISSUANCE_ENABLED")) throw new Error("fhenix_happiness_issuance_not_implemented");
  if (enabled(env, "ZAMA_REAL_CITIZEN_SHADOW_TRAFFIC_ENABLED")) throw new Error("zama_real_citizen_shadow_traffic_not_approved");
  return true;
}
