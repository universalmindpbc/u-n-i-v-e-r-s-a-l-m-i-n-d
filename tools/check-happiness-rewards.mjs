import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  HAPPINESS_ARCHITECTURE,
  assertCollectiveEmissionReady,
  assertImpactFundingReady,
  assertMutationReady,
  assertOracleReady,
  evaluateCollectiveEmission,
  formatHappinessUnits,
  parseHappinessUnits,
  publicHappinessConfig,
  reserveState,
  validateImpactFundingAttestation,
} from "../cloudflare/happiness-rewards-core.js";
import happinessWorker from "../cloudflare/happiness-rewards-worker.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const wallet = read("i  a m/wallet.html");
const style = read("i  a m/wallet.css");
const script = read("i  a m/wallet.js");
const architecture = read("cloudflare/happiness-rewards-architecture.md");
const contract = read("contracts/HappinessRewards.sol");
const htaccess = read(".htaccess");
const redirects = read("_redirects");

assert.equal(HAPPINESS_ARCHITECTURE.currency.name, "HAPPINESS");
assert.equal(HAPPINESS_ARCHITECTURE.currency.symbol, "[ I o H ]");
assert.equal(HAPPINESS_ARCHITECTURE.currency.symbolMeaning, "Internet of Happiness");
assert.equal(HAPPINESS_ARCHITECTURE.ledger.network, "polygon-amoy");
assert.equal(HAPPINESS_ARCHITECTURE.ledger.memberTransfersEnabled, false);
assert.equal(HAPPINESS_ARCHITECTURE.ledger.cashRedemptionEnabled, false);
assert.equal(HAPPINESS_ARCHITECTURE.reserve.enabled, false);
assert.equal(HAPPINESS_ARCHITECTURE.reserve.backed, false);
assert.equal(HAPPINESS_ARCHITECTURE.reserve.pegClaimEnabled, false);
assert.equal(HAPPINESS_ARCHITECTURE.oracle.provider, "chainlink-functions");
assert.equal(HAPPINESS_ARCHITECTURE.oracle.enabled, false);
assert.equal(HAPPINESS_ARCHITECTURE.oracle.purpose, "collective_emissions_and_stage_gated_impact_financing");
assert.equal(HAPPINESS_ARCHITECTURE.oracle.evidencePolicy, "cohort_impact_milestones_not_individual_scoring");
assert.equal(HAPPINESS_ARCHITECTURE.oracle.evidenceOrigin, "triall-verifiable-proof");
assert.equal(HAPPINESS_ARCHITECTURE.oracle.triallAdapterMode, "interface_pending_vendor_diligence");

assert.equal(parseHappinessUnits("12.345").toString(), "12345000");
assert.equal(formatHappinessUnits("12345000"), "12.345");
assert.throws(() => parseHappinessUnits("1.0000001"), /happiness_precision_exceeded/);
assert.throws(() => assertMutationReady({}), /happiness_mutations_disabled/);
assert.throws(() => assertOracleReady({}), /happiness_oracle_disabled/);
assert.throws(() => assertImpactFundingReady({}), /happiness_impact_funding_disabled/);
assert.throws(() => assertCollectiveEmissionReady({}), /happiness_collective_emissions_disabled/);
const collectiveRule = assertCollectiveEmissionReady({
  HAPPINESS_COLLECTIVE_EMISSIONS_ENABLED: "true",
  HAPPINESS_MUTATIONS_ENABLED: "true",
  HAPPINESS_POLYGON_CONTRACT_ADDRESS: "0x1111111111111111111111111111111111111111",
  HAPPINESS_SIGNER_KEY: "configured-secret-reference",
  HAPPINESS_CHAINLINK_ENABLED: "true",
  HAPPINESS_CHAINLINK_DON_ID: "fun-polygon-amoy-1",
  HAPPINESS_CHAINLINK_SUBSCRIPTION_ID: "1",
  HAPPINESS_CHAINLINK_SOURCE_HASH: `0x${"a".repeat(64)}`,
  HAPPINESS_ORACLE_CONSUMER_ADDRESS: "0x2222222222222222222222222222222222222222",
  HAPPINESS_COMMUNITY_TREASURY_ADDRESS: "0x3333333333333333333333333333333333333333",
  HAPPINESS_COLLECTIVE_MIN_UNIQUE_CHECKINS: "100",
  HAPPINESS_COLLECTIVE_MIN_CONTINUITY_BPS: "5100",
  HAPPINESS_COLLECTIVE_EPOCH_MINT_UNITS: "10000000000",
  HAPPINESS_COLLECTIVE_WEEKLY_CAP_UNITS: "10000000000",
  HAPPINESS_COLLECTIVE_TOTAL_CAP_UNITS: "130000000000",
});
assert.deepEqual(evaluateCollectiveEmission({
  unique_eligible_checkins: "125",
  continuity_rate_bps: "6200",
}, collectiveRule), {
  triggered: true,
  mint_units: "10000000000",
  destination: "community_rewards_treasury",
});
assert.deepEqual(evaluateCollectiveEmission({
  unique_eligible_checkins: "99",
  continuity_rate_bps: "6200",
}, collectiveRule), {
  triggered: false,
  mint_units: "0",
  destination: "community_rewards_treasury",
});
assert.equal(validateImpactFundingAttestation({
  schema_version: "happiness_impact_funding_attestation_v1",
  funding_stage_id: "stage:checkins:0001",
  cohort_commitment: `0x${"a".repeat(64)}`,
  methodology_commitment: `0x${"b".repeat(64)}`,
  evaluator_commitment: `0x${"c".repeat(64)}`,
  study_registry_commitment: `0x${"d".repeat(64)}`,
  scientific_review_commitment: `0x${"e".repeat(64)}`,
  investor_milestone_commitment: `0x${"f".repeat(64)}`,
  triall_proof_commitment: `0x${"1".repeat(64)}`,
  evidence_origin: "triall-verifiable-proof",
  metric_type: "checkin_continuity_rate",
  metric_unit: "basis_points",
  metric_value: "5100",
  minimum_cohort_size: 100,
  approved_usdc_units: "25000000000",
  issued_at: "2026-07-28T00:00:00.000Z",
  expires_at: "2026-07-28T00:10:00.000Z",
}), true);
assert.throws(() => validateImpactFundingAttestation({ mood: "happy" }), /sensitive_or_subjective_oracle_field_forbidden/);
assert.deepEqual(reserveState({}), {
  adapter: "circle-usdc",
  requested: false,
  enabled: false,
  backed: false,
  peg_claim_enabled: false,
  settlement_enabled: false,
});
assert.equal(publicHappinessConfig().programme.cash_value, false);

assert.match(wallet, /<h1 id="happiness-title">HAPPINESS<\/h1>/);
assert.match(wallet, /\[ I o H \]/);
assert.match(wallet, /Internet of Happiness/);
assert.match(wallet, /Every visit unlocks something new\.<br>We earn, together as one\./);
assert.match(wallet, /Universal Mind \[ I o H \] Logo 512\.png/);
assert.doesNotMatch(wallet, /crypto|blockchain|stablecoin|USDC|Polygon|ERC-20/i);
assert.match(wallet, /has no cash value and is not available for cash redemption/i);
assert.equal((wallet.match(/data-happiness-category=/g) || []).length, 4);
assert.match(style, /grid-template-columns:\s*repeat\(12, 1fr\)/);
assert.match(style, /@media \(max-width: 980px\)/);
assert.match(wallet, /happiness-wallet-qr-staging\.png/);
assert.match(script, /happiness-wallet-qr-production\.png/);
assert.match(wallet, /href="\/vogue\/iam\/wallet\.css\?v=happiness-wallet-3"/);
assert.match(wallet, /src="\/vogue\/iam\/wallet\.js\?v=happiness-wallet-2"/);
assert.doesNotMatch(wallet, /(?:href|src)="a s s e t s\//);
assert.match(wallet, /data-stream-file="a s s e t s\/Globe Landing Page Video - Sunscreem - Perfection Motion for RMU\.mp4"/);
assert.match(wallet, /Ethereum Diamond Rainbow \[ e o r a \] 3\.png/);
assert.match(wallet, /cloudflare-stream-controller\.js\?v=stream-controller-8/);
assert.match(style, /\.happiness-background-shade\s*\{[^}]*background:\s*rgba\(0, 0, 0, 0\.77\)/s);
assert.match(style, /\.happiness-card__member img\s*\{[^}]*width:\s*clamp\(18px, 1\.7vw, 25px\)/s);
assert.match(architecture, /It is not currently backed, pegged, cash redeemable/i);
assert.match(architecture, /Adding USDC infrastructure does not itself make HAPPINESS a stablecoin/i);
assert.match(architecture, /It does not decide individual HAPPINESS rewards/i);
assert.match(architecture, /never raw sequence data, an individual result, clinical notes, patient identifiers, mood or diagnosis/i);
assert.match(architecture, /That proof establishes integrity, not scientific meaning/i);
assert.match(architecture, /interface_pending_vendor_diligence/i);
assert.match(architecture, /no promise of appreciation, USDC conversion, cash value, investment return or migration/i);
assert.match(contract, /contract HappinessRewards is ERC20, AccessControl, Pausable/);
assert.match(contract, /ERC20\("HAPPINESS", "\[ I o H \]"\)/);
assert.match(contract, /return 6;/);
assert.match(contract, /MemberTransfersDisabled/);
assert.match(contract, /totalSupply\(\) \+ amount > supplyCap/);
assert.doesNotMatch(contract, /mood|diagnosis|patient|clinical|mRNA/i);
assert.match(htaccess, /RewriteRule \^wallet\/\?\$ \/vogue\/iam\/wallet\.html \[L\]/);
assert.match(redirects, /^\/wallet\/ \/vogue\/iam\/wallet\.html 200$/m);

const healthResponse = await happinessWorker.fetch(new Request("https://rewards.example/health"), {});
assert.equal(healthResponse.status, 200);
assert.equal((await healthResponse.json()).ledger, "architecture_ready_not_deployed");

const earnResponse = await happinessWorker.fetch(new Request("https://rewards.example/v1/earn", {
  method: "POST",
  headers: { Origin: "https://staging.universalmind.tv" },
}), {});
assert.equal(earnResponse.status, 503);
assert.equal((await earnResponse.json()).error, "happiness_mutations_disabled");

const fundingResponse = await happinessWorker.fetch(new Request("https://rewards.example/internal/funding-release", {
  method: "POST",
  headers: { Origin: "https://staging.universalmind.tv" },
}), {});
assert.equal(fundingResponse.status, 503);
assert.equal((await fundingResponse.json()).error, "happiness_impact_funding_disabled");

const emissionResponse = await happinessWorker.fetch(new Request("https://rewards.example/internal/collective-emission", {
  method: "POST",
  headers: { Origin: "https://staging.universalmind.tv" },
}), {});
assert.equal(emissionResponse.status, 503);
assert.equal((await emissionResponse.json()).error, "happiness_collective_emissions_disabled");

const blockedOriginResponse = await happinessWorker.fetch(new Request("https://rewards.example/v1/config", {
  headers: { Origin: "https://example.com" },
}), {});
assert.equal(blockedOriginResponse.status, 403);

for (const asset of [
  "i  a m/a s s e t s/Universal Mind [ I o H ] Logo 512.png",
  "i  a m/a s s e t s/happiness-wallet-qr-staging.png",
  "i  a m/a s s e t s/happiness-wallet-qr-production.png",
  "i  a m/a s s e t s/Ethereum Diamond Rainbow [ e o r a ] 3.png",
]) {
  assert.ok(fs.existsSync(path.join(root, asset)), `Missing HAPPINESS wallet asset: ${asset}`);
}

console.log("HAPPINESS rewards architecture checks passed.");
