import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PRIVACY_RESEARCH_ARCHITECTURE,
  assertHealthOmicsReadReady,
  assertNoPrivacyResearchWrites,
  assertResearchDataClass,
  privacyResearchReadiness,
} from "../cloudflare/privacy-research-foundations.js";
import {
  HEALTHOMICS_SDK_VERSION,
  healthOmicsClientPlan,
  inspectConfiguredSequenceStore,
} from "../research/privacy-lab/healthomics-adapter.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const benchmarkPlan = JSON.parse(read("research/privacy-lab/benchmark-plan.json"));
const healthOmicsExample = JSON.parse(read("research/privacy-lab/healthomics.example.json"));
const fhenixConfig = JSON.parse(read("contracts/happiness-fhenix-pilot.config.json"));
const fhenixContract = read("contracts/fhenix/HappinessConfidentialFhenixPilot.sol");
const zamaCargo = read("research/privacy-lab/zama-tfhe-benchmark/Cargo.toml");
const zamaBenchmark = read("research/privacy-lab/zama-tfhe-benchmark/src/main.rs");
const labReadme = read("research/privacy-lab/README.md");
const packageJson = JSON.parse(read("research/privacy-lab/package.json"));
const workerConfig = read("cloudflare/wrangler.toml");

assert.equal(PRIVACY_RESEARCH_ARCHITECTURE.zama.purpose, "sensitive_inference_insight_benchmark");
assert.equal(PRIVACY_RESEARCH_ARCHITECTURE.fhenix.purpose, "happiness_confidential_rewards_benchmark");
assert.equal(PRIVACY_RESEARCH_ARCHITECTURE.healthOmics.writesImplemented, false);
assert.equal(PRIVACY_RESEARCH_ARCHITECTURE.healthOmics.genericBiometricsStore, false);
assert.equal(privacyResearchReadiness({}).live_citizen_data_used, false);
assert.equal(privacyResearchReadiness({}).fhenix.rewards_only, true);
assert.equal(privacyResearchReadiness({}).healthomics.writes_enabled, false);
assert.throws(() => assertResearchDataClass("zama", "raw_checkin"), /zama_data_class_forbidden/);
assert.throws(() => assertResearchDataClass("fhenix", "inference_score"), /fhenix_data_class_forbidden/);
assert.throws(() => assertResearchDataClass("healthOmics", "engagement_event"), /healthOmics_data_class_forbidden/);
assert.equal(assertResearchDataClass("zama", "synthetic_inference_score"), true);
assert.equal(assertResearchDataClass("fhenix", "encrypted_reward_balance"), true);
assert.equal(assertResearchDataClass("healthOmics", "validated_horizon_3_omics_read_set"), true);
assert.equal(assertNoPrivacyResearchWrites({}), true);
assert.throws(() => assertNoPrivacyResearchWrites({ AWS_HEALTHOMICS_WRITES_ENABLED: "true" }), /healthomics_writes_not_implemented/);
assert.throws(() => assertNoPrivacyResearchWrites({ FHENIX_HAPPINESS_ISSUANCE_ENABLED: "true" }), /fhenix_happiness_issuance_not_implemented/);
assert.throws(() => assertNoPrivacyResearchWrites({ ZAMA_REAL_CITIZEN_SHADOW_TRAFFIC_ENABLED: "true" }), /zama_real_citizen_shadow_traffic_not_approved/);
assert.throws(() => assertHealthOmicsReadReady({}), /healthomics_reads_disabled/);

const activeHealthOmics = {
  AWS_HEALTHOMICS_READS_ENABLED: "true",
  AWS_HEALTHOMICS_WRITES_ENABLED: "false",
  UNIVERSAL_MIND_HORIZON_3_ENABLED: "true",
  AWS_HEALTHOMICS_REGION: "ap-southeast-2",
  AWS_HEALTHOMICS_SEQUENCE_STORE_ID: "1234567890",
  AWS_HEALTHOMICS_KMS_KEY_ARN: "arn:aws:kms:ap-southeast-2:123456789012:key/12345678-1234-1234-1234-123456789abc",
};
assert.equal(assertHealthOmicsReadReady(activeHealthOmics), true);
assert.equal(healthOmicsClientPlan({}).writes_implemented, false);
assert.equal(HEALTHOMICS_SDK_VERSION, packageJson.dependencies["@aws-sdk/client-omics"]);

const sequenceStore = await inspectConfiguredSequenceStore(activeHealthOmics, {
  client: {
    async send(command) {
      assert.deepEqual(command, { id: "1234567890" });
      return {
        id: "1234567890",
        name: "universal-mind-horizon-3-empty",
        status: "ACTIVE",
        eTagAlgorithmFamily: "SHA256up",
        sseConfig: { keyArn: activeHealthOmics.AWS_HEALTHOMICS_KMS_KEY_ARN },
        s3Access: { accessLogLocation: "s3://example-access-logs/healthomics/" },
      };
    },
  },
  commandFactory: (input) => input,
});
assert.equal(sequenceStore.kms_key_matches, true);
assert.equal(sequenceStore.s3_access_logs_configured, true);
assert.equal(sequenceStore.writes_enabled, false);
assert.equal(sequenceStore.live_data_present, false);

assert.equal(benchmarkPlan.zama.dimensions, 144);
assert.equal(benchmarkPlan.zama.live_citizen_shadow_traffic, false);
assert.equal(benchmarkPlan.zama.latency_budget_ms, null);
assert.equal(benchmarkPlan.fhenix.mental_health_data_allowed, false);
assert.equal(benchmarkPlan.fhenix.issuance_enabled, false);
assert.equal(fhenixConfig.status, "contract_scaffolded_not_deployed");
assert.equal(fhenixConfig.production_happiness_contract_replaced, false);
assert.equal(fhenixConfig.mental_health_data_allowed, false);
assert.equal(healthOmicsExample.AWS_HEALTHOMICS_READS_ENABLED, "false");
assert.equal(healthOmicsExample.AWS_HEALTHOMICS_WRITES_ENABLED, "false");
assert.equal(healthOmicsExample.generic_biometrics_store, false);
assert.equal(packageJson.devDependencies["@cofhe/sdk"], "0.6.0");
assert.equal(packageJson.devDependencies["@fhenixprotocol/cofhe-contracts"], "0.1.4");

assert.match(fhenixContract, /HappinessConfidentialFhenixPilot/);
assert.match(fhenixContract, /FHE\.asEuint64\(encryptedAmount\)/);
assert.match(fhenixContract, /FHE\.add\(encryptedBalances\[recipient\], amount\)/);
assert.match(fhenixContract, /FHE\.allowThis\(nextBalance\)/);
assert.match(fhenixContract, /FHE\.allow\(nextBalance, recipient\)/);
assert.doesNotMatch(fhenixContract, /\b(?:checkin|conversation|diagnosis|mood|patient|inference)\b/i);
assert.doesNotMatch(fhenixContract, /\b(?:transfer|redeem|cash|price)\b/i);
assert.match(zamaCargo, /tfhe = \{ version = "1", features = \["integer"\] \}/);
assert.match(zamaBenchmark, /DEFAULT_DIMENSIONS: usize = 144/);
assert.match(zamaBenchmark, /fixture\\\":\\\"synthetic_only/);
assert.match(zamaBenchmark, /plaintext_values_emitted\\\":false/);
assert.match(labReadme, /Sensitive inference insights -> Zama/);
assert.match(labReadme, /HAPPINESS reward amounts\s+-> Fhenix/);
assert.match(labReadme, /Sequence stores are reserved for validated omics-compatible material/i);
assert.match(labReadme, /SX-1411 is recorded here only as a future value-participation hypothesis/i);
assert.match(labReadme, /avoids making sensitive-data consent appear to be purchased with rewards/i);
assert.match(workerConfig, /ZAMA_SENSITIVE_INSIGHT_BENCHMARK_ENABLED = "false"/);
assert.match(workerConfig, /FHENIX_HAPPINESS_BENCHMARK_ENABLED = "false"/);
assert.match(workerConfig, /AWS_HEALTHOMICS_READS_ENABLED = "false"/);
assert.match(workerConfig, /AWS_HEALTHOMICS_WRITES_ENABLED = "false"/);
assert.match(workerConfig, /UNIVERSAL_MIND_HORIZON_2_ENABLED = "false"/);
assert.match(workerConfig, /UNIVERSAL_MIND_HORIZON_3_ENABLED = "false"/);

console.log("Privacy research foundations checks passed.");
