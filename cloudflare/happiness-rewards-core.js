export const HAPPINESS_ARCHITECTURE = Object.freeze({
  schemaVersion: "happiness_rewards_architecture_v1",
  currency: Object.freeze({
    name: "HAPPINESS",
    symbol: "[ I o H ]",
    symbolMeaning: "Internet of Happiness",
    decimals: 6,
    iconAsset: "Universal Mind flower",
  }),
  ledger: Object.freeze({
    standard: "ERC-20",
    network: "polygon-amoy",
    chainId: 80002,
    contractAddress: null,
    memberTransfersEnabled: false,
    cashRedemptionEnabled: false,
    mode: "architecture_ready_not_deployed",
  }),
  oracle: Object.freeze({
    provider: "chainlink-functions",
    network: "polygon-amoy",
    enabled: false,
    consumerContractAddress: null,
    purpose: "collective_emissions_and_stage_gated_impact_financing",
    lanes: Object.freeze([
      "collective-participation-emission",
      "stage-gated-impact-financing",
    ]),
    evidencePolicy: "cohort_impact_milestones_not_individual_scoring",
    attestationSchema: "happiness_impact_funding_attestation_v1",
    evidenceOrigin: "triall-verifiable-proof",
    triallAdapterMode: "interface_pending_vendor_diligence",
  }),
  emissions: Object.freeze({
    enabled: false,
    mode: "polygon_amoy_simulation",
    epoch: "weekly",
    destination: "community_rewards_treasury",
    attestationSchema: "happiness_collective_emission_attestation_v1",
    thresholds: "governance_configuration_required",
    caps: "governance_configuration_required",
  }),
  a2a: Object.freeze({
    protocol: "Agent2Agent",
    protocolVersion: "1.0",
    protocolBinding: "HTTP+JSON",
    discoveryPath: "/.well-known/agent-card.json",
    servicePath: "/a2a/v1",
    enabled: false,
    rewardsEnabled: false,
    mode: "architecture_ready_not_activated",
    purpose: "verified_mental_health_innovation",
    contributionSchema: "happiness_agent_contribution_receipt_v1",
    prohibitedPurpose: "synthetic_platform_activity",
  }),
  reserve: Object.freeze({
    adapter: "circle-usdc",
    enabled: false,
    backed: false,
    pegClaimEnabled: false,
    settlementEnabled: false,
  }),
  appleWallet: Object.freeze({
    mode: "prepared_not_issued",
    passTypeIdentifier: null,
    updateServiceEnabled: false,
  }),
});

const INTEGER_PATTERN = /^\d+$/;

export function parseHappinessUnits(value, decimals = HAPPINESS_ARCHITECTURE.currency.decimals) {
  const normalized = String(value ?? "").trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) throw new TypeError("invalid_happiness_amount");
  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > decimals) throw new RangeError("happiness_precision_exceeded");
  return BigInt(`${whole}${fraction.padEnd(decimals, "0")}`);
}

export function formatHappinessUnits(value, decimals = HAPPINESS_ARCHITECTURE.currency.decimals) {
  const raw = String(value ?? "");
  if (!INTEGER_PATTERN.test(raw)) throw new TypeError("invalid_happiness_units");
  const padded = raw.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

export function publicHappinessConfig() {
  return {
    schema_version: HAPPINESS_ARCHITECTURE.schemaVersion,
    currency: {
      name: HAPPINESS_ARCHITECTURE.currency.name,
      ticker: HAPPINESS_ARCHITECTURE.currency.symbol,
      ticker_meaning: HAPPINESS_ARCHITECTURE.currency.symbolMeaning,
      icon: HAPPINESS_ARCHITECTURE.currency.iconAsset,
    },
    experience: {
      primary_surface: "desktop_tablet_web",
      apple_wallet_mirror: HAPPINESS_ARCHITECTURE.appleWallet.mode,
    },
    programme: {
      mode: "rewards",
      cash_value: false,
      cash_redemption: HAPPINESS_ARCHITECTURE.ledger.cashRedemptionEnabled,
      transfer_between_members: HAPPINESS_ARCHITECTURE.ledger.memberTransfersEnabled,
    },
  };
}

export function assertMutationReady(env = {}) {
  if (String(env.HAPPINESS_MUTATIONS_ENABLED || "false") !== "true") throw new Error("happiness_mutations_disabled");
  if (!env.HAPPINESS_POLYGON_CONTRACT_ADDRESS) throw new Error("happiness_contract_not_configured");
  if (!env.HAPPINESS_SIGNER_KEY) throw new Error("happiness_signer_not_configured");
}

const A2A_CONTRIBUTION_TYPES = new Set([
  "assistive_experience",
  "clinical_safety_tooling",
  "interoperability_adapter",
  "privacy_security",
  "research_infrastructure",
  "responsible_ai_evaluation",
  "wellbeing_accessibility",
]);

const A2A_RECEIPT_FIELDS = new Set([
  "schema_version",
  "contribution_id",
  "agent_identity_commitment",
  "swarm_commitment",
  "contribution_type",
  "artifact_commitment",
  "evaluation_commitment",
  "acceptance_rule_version",
  "approver_commitment",
  "approved_happiness_units",
  "recipient_address",
  "issued_at",
  "expires_at",
]);

const FORBIDDEN_A2A_FIELDS = new Set([
  "checkin",
  "checkins",
  "clicks",
  "diagnosis",
  "engagement",
  "happiness_score",
  "mental_health_impact_claim",
  "mood",
  "patient_id",
  "referrals",
  "screen_time",
  "sessions",
]);

export function validateAgentContributionReceipt(receipt = {}) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    throw new TypeError("invalid_agent_contribution_receipt");
  }
  for (const key of Object.keys(receipt)) {
    if (FORBIDDEN_A2A_FIELDS.has(key.toLowerCase())) throw new Error("synthetic_activity_or_health_claim_forbidden");
    if (!A2A_RECEIPT_FIELDS.has(key)) throw new Error("agent_contribution_field_not_allowed");
  }
  if (receipt.schema_version !== HAPPINESS_ARCHITECTURE.a2a.contributionSchema) {
    throw new Error("agent_contribution_schema_not_supported");
  }
  if (!/^[a-z0-9][a-z0-9._:-]{7,127}$/i.test(String(receipt.contribution_id || ""))) {
    throw new Error("invalid_agent_contribution_id");
  }
  if (!A2A_CONTRIBUTION_TYPES.has(receipt.contribution_type)) {
    throw new Error("agent_contribution_type_not_supported");
  }
  for (const field of [
    "agent_identity_commitment",
    "artifact_commitment",
    "evaluation_commitment",
    "approver_commitment",
  ]) {
    if (!IMPACT_COMMITMENT_PATTERN.test(String(receipt[field] || ""))) throw new Error(`invalid_${field}`);
  }
  if (receipt.swarm_commitment && !IMPACT_COMMITMENT_PATTERN.test(String(receipt.swarm_commitment))) {
    throw new Error("invalid_swarm_commitment");
  }
  if (!/^[a-z0-9][a-z0-9._:-]{2,63}$/i.test(String(receipt.acceptance_rule_version || ""))) {
    throw new Error("invalid_acceptance_rule_version");
  }
  if (!INTEGER_PATTERN.test(String(receipt.approved_happiness_units || "")) || BigInt(receipt.approved_happiness_units) <= 0n) {
    throw new Error("invalid_approved_happiness_units");
  }
  if (!/^0x[a-f0-9]{40}$/i.test(String(receipt.recipient_address || ""))) {
    throw new Error("invalid_agent_reward_recipient");
  }
  const issuedAt = Date.parse(String(receipt.issued_at || ""));
  const expiresAt = Date.parse(String(receipt.expires_at || ""));
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt <= issuedAt) {
    throw new Error("invalid_agent_contribution_window");
  }
  if (expiresAt - issuedAt > 24 * 60 * 60 * 1000) throw new Error("agent_contribution_window_too_long");
  return true;
}

export function assertA2AReady(env = {}) {
  if (String(env.HAPPINESS_A2A_ENABLED || "false") !== "true") throw new Error("happiness_a2a_disabled");
  if (String(env.HAPPINESS_A2A_REWARDS_ENABLED || "false") !== "true") throw new Error("happiness_a2a_rewards_disabled");
  if (!env.HAPPINESS_A2A_ISSUER_ID) throw new Error("happiness_a2a_issuer_not_configured");
  if (!env.HAPPINESS_A2A_APPROVER_QUORUM) throw new Error("happiness_a2a_approver_quorum_not_configured");
  if (!env.HAPPINESS_A2A_EVALUATION_POLICY_HASH) throw new Error("happiness_a2a_evaluation_policy_not_pinned");
  assertMutationReady(env);
}

export function happinessAgentCard(env = {}) {
  const baseUrl = String(env.HAPPINESS_A2A_PUBLIC_BASE_URL || "https://rewards.universalmind.tv").replace(/\/$/, "");
  return {
    name: "Internet of Happiness Innovation Gateway",
    description: "Accepts reviewable mental-health innovation contributions. It never rewards synthetic check-ins, engagement or other platform activity.",
    supportedInterfaces: [{
      url: `${baseUrl}${HAPPINESS_ARCHITECTURE.a2a.servicePath}`,
      protocolBinding: HAPPINESS_ARCHITECTURE.a2a.protocolBinding,
      protocolVersion: HAPPINESS_ARCHITECTURE.a2a.protocolVersion,
    }],
    provider: {
      organization: "Universal Mind",
      url: "https://universalmind.tv",
    },
    version: "0.1.0",
    capabilities: {
      streaming: false,
      pushNotifications: false,
      extendedAgentCard: false,
    },
    securitySchemes: {
      bearer: { httpAuthSecurityScheme: { scheme: "Bearer" } },
    },
    securityRequirements: [{ schemes: { bearer: { list: [] } } }],
    defaultInputModes: ["application/json", "text/plain"],
    defaultOutputModes: ["application/json", "text/plain"],
    skills: [{
      id: "submit-mental-health-innovation",
      name: "Submit mental-health innovation",
      description: "Submits a code, safety, accessibility, research-tooling or interoperability contribution for independent evaluation and human approval.",
      tags: ["mental-health", "innovation", "safety", "accessibility", "open-development"],
      examples: ["Submit a privacy-preserving accessibility improvement for evaluation."],
    }],
  };
}

const IMPACT_METRIC_UNITS = Object.freeze({
  checkin_continuity_rate: "basis_points",
  referral_pathway_rate: "basis_points",
  independent_study_milestone: "milestone",
});

const IMPACT_COMMITMENT_PATTERN = /^0x[a-f0-9]{64}$/i;

const IMPACT_ATTESTATION_FIELDS = new Set([
  "schema_version",
  "funding_stage_id",
  "cohort_commitment",
  "methodology_commitment",
  "evaluator_commitment",
  "study_registry_commitment",
  "scientific_review_commitment",
  "investor_milestone_commitment",
  "triall_proof_commitment",
  "evidence_origin",
  "metric_type",
  "metric_unit",
  "metric_value",
  "minimum_cohort_size",
  "approved_usdc_units",
  "issued_at",
  "expires_at",
]);

const FORBIDDEN_ORACLE_FIELDS = new Set([
  "diagnosis",
  "clinical_notes",
  "emotion",
  "happiness_score",
  "mental_health_score",
  "mood",
  "outcome_score",
  "patient_id",
]);

export function validateImpactFundingAttestation(attestation = {}) {
  if (!attestation || typeof attestation !== "object" || Array.isArray(attestation)) {
    throw new TypeError("invalid_oracle_attestation");
  }
  for (const key of Object.keys(attestation)) {
    if (FORBIDDEN_ORACLE_FIELDS.has(key.toLowerCase())) throw new Error("sensitive_or_subjective_oracle_field_forbidden");
    if (!IMPACT_ATTESTATION_FIELDS.has(key)) throw new Error("impact_attestation_field_not_allowed");
  }
  if (attestation.schema_version !== HAPPINESS_ARCHITECTURE.oracle.attestationSchema) {
    throw new Error("impact_schema_version_not_supported");
  }
  if (!IMPACT_METRIC_UNITS[attestation.metric_type]) throw new Error("impact_metric_type_not_supported");
  if (attestation.metric_unit !== IMPACT_METRIC_UNITS[attestation.metric_type]) {
    throw new Error("impact_metric_unit_mismatch");
  }
  if (attestation.evidence_origin !== HAPPINESS_ARCHITECTURE.oracle.evidenceOrigin) {
    throw new Error("impact_evidence_origin_not_supported");
  }
  for (const field of [
    "cohort_commitment",
    "methodology_commitment",
    "evaluator_commitment",
    "study_registry_commitment",
    "scientific_review_commitment",
    "investor_milestone_commitment",
    "triall_proof_commitment",
  ]) {
    if (!IMPACT_COMMITMENT_PATTERN.test(String(attestation[field] || ""))) throw new Error(`invalid_${field}`);
  }
  if (!/^[a-z0-9][a-z0-9._:-]{7,127}$/i.test(String(attestation.funding_stage_id || ""))) {
    throw new Error("invalid_funding_stage_id");
  }
  if (!INTEGER_PATTERN.test(String(attestation.metric_value || ""))) throw new Error("invalid_impact_metric_value");
  if (attestation.metric_unit === "basis_points" && BigInt(attestation.metric_value) > 10000n) {
    throw new Error("impact_basis_points_out_of_range");
  }
  if (attestation.metric_unit === "milestone" && !["0", "1"].includes(String(attestation.metric_value))) {
    throw new Error("impact_milestone_out_of_range");
  }
  if (!Number.isInteger(attestation.minimum_cohort_size) || attestation.minimum_cohort_size <= 0) {
    throw new Error("invalid_minimum_cohort_size");
  }
  if (!INTEGER_PATTERN.test(String(attestation.approved_usdc_units || "")) || BigInt(attestation.approved_usdc_units) <= 0n) {
    throw new Error("invalid_approved_usdc_units");
  }
  const issuedAt = Date.parse(String(attestation.issued_at || ""));
  const expiresAt = Date.parse(String(attestation.expires_at || ""));
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt <= issuedAt) {
    throw new Error("invalid_impact_attestation_window");
  }
  if (expiresAt - issuedAt > 24 * 60 * 60 * 1000) throw new Error("impact_attestation_window_too_long");
  return true;
}

export function assertOracleReady(env = {}) {
  if (String(env.HAPPINESS_CHAINLINK_ENABLED || "false") !== "true") throw new Error("happiness_oracle_disabled");
  if (!env.HAPPINESS_CHAINLINK_DON_ID) throw new Error("happiness_oracle_don_not_configured");
  if (!env.HAPPINESS_CHAINLINK_SUBSCRIPTION_ID) throw new Error("happiness_oracle_subscription_not_configured");
  if (!env.HAPPINESS_CHAINLINK_SOURCE_HASH) throw new Error("happiness_oracle_source_not_pinned");
  if (!env.HAPPINESS_ORACLE_CONSUMER_ADDRESS) throw new Error("happiness_oracle_consumer_not_configured");
}

export function assertImpactFundingReady(env = {}) {
  if (String(env.HAPPINESS_IMPACT_FUNDING_ENABLED || "false") !== "true") {
    throw new Error("happiness_impact_funding_disabled");
  }
  assertOracleReady(env);
  if (!env.HAPPINESS_SPONSOR_ESCROW_ADDRESS) throw new Error("happiness_sponsor_escrow_not_configured");
  if (!env.HAPPINESS_USDC_TREASURY_ADDRESS) throw new Error("happiness_usdc_treasury_not_configured");
}

function requiredPositiveInteger(env, key) {
  const value = String(env[key] || "");
  if (!INTEGER_PATTERN.test(value) || BigInt(value) <= 0n) throw new Error(`${key.toLowerCase()}_not_configured`);
  return BigInt(value);
}

function requiredUnsignedInteger(source, key) {
  const value = String(source[key] ?? "");
  if (!INTEGER_PATTERN.test(value)) throw new Error(`${key.toLowerCase()}_not_configured`);
  return BigInt(value);
}

export function collectiveEmissionRule(env = {}) {
  return {
    schema_version: "happiness_collective_emission_rule_v1",
    epoch: "weekly",
    minimum_unique_checkins: requiredPositiveInteger(env, "HAPPINESS_COLLECTIVE_MIN_UNIQUE_CHECKINS"),
    minimum_continuity_bps: requiredPositiveInteger(env, "HAPPINESS_COLLECTIVE_MIN_CONTINUITY_BPS"),
    epoch_mint_units: requiredPositiveInteger(env, "HAPPINESS_COLLECTIVE_EPOCH_MINT_UNITS"),
    weekly_cap_units: requiredPositiveInteger(env, "HAPPINESS_COLLECTIVE_WEEKLY_CAP_UNITS"),
    total_cap_units: requiredPositiveInteger(env, "HAPPINESS_COLLECTIVE_TOTAL_CAP_UNITS"),
  };
}

export function assertCollectiveEmissionReady(env = {}) {
  if (String(env.HAPPINESS_COLLECTIVE_EMISSIONS_ENABLED || "false") !== "true") {
    throw new Error("happiness_collective_emissions_disabled");
  }
  assertMutationReady(env);
  assertOracleReady(env);
  if (!env.HAPPINESS_COMMUNITY_TREASURY_ADDRESS) throw new Error("happiness_community_treasury_not_configured");
  const rule = collectiveEmissionRule(env);
  if (rule.minimum_continuity_bps > 10000n) throw new Error("happiness_collective_continuity_out_of_range");
  if (rule.epoch_mint_units > rule.weekly_cap_units) throw new Error("happiness_collective_epoch_exceeds_weekly_cap");
  if (rule.weekly_cap_units > rule.total_cap_units) throw new Error("happiness_collective_weekly_exceeds_total_cap");
  return rule;
}

export function evaluateCollectiveEmission(metrics = {}, rule) {
  if (!rule) throw new Error("happiness_collective_rule_required");
  const uniqueCheckins = requiredUnsignedInteger(metrics, "unique_eligible_checkins");
  const continuityBps = requiredUnsignedInteger(metrics, "continuity_rate_bps");
  if (continuityBps > 10000n) throw new Error("happiness_collective_continuity_out_of_range");
  const triggered = uniqueCheckins >= rule.minimum_unique_checkins && continuityBps >= rule.minimum_continuity_bps;
  return {
    triggered,
    mint_units: triggered ? rule.epoch_mint_units.toString() : "0",
    destination: HAPPINESS_ARCHITECTURE.emissions.destination,
  };
}

export function reserveState(env = {}) {
  const requested = String(env.HAPPINESS_USDC_RESERVE_ENABLED || "false") === "true";
  return {
    adapter: "circle-usdc",
    requested,
    enabled: requested && Boolean(env.CIRCLE_API_KEY) && Boolean(env.HAPPINESS_USDC_TREASURY_ADDRESS),
    backed: false,
    peg_claim_enabled: false,
    settlement_enabled: false,
  };
}
