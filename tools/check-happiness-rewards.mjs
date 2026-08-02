import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  HAPPINESS_ARCHITECTURE,
  assertCollectiveEmissionReady,
  assertA2AReady,
  assertImpactFundingReady,
  assertMutationReady,
  assertOracleReady,
  evaluateCollectiveEmission,
  formatHappinessUnits,
  happinessAgentCard,
  parseHappinessUnits,
  publicHappinessConfig,
  reserveState,
  validateAgentContributionReceipt,
  validateImpactFundingAttestation,
} from "../cloudflare/happiness-rewards-core.js";
import happinessWorker from "../cloudflare/happiness-rewards-worker.js";
import {
  CIRCLE_RESERVE_PROFILE,
  assertCircleReserveReadReady,
  assertCircleSettlementDisabled,
  circleReserveReadiness,
  fetchCircleReserveSnapshot,
} from "../cloudflare/happiness-circle-reserve.js";
import {
  HAPPINESS_PILOT_POLICY,
  createSimulatedLedger,
  evaluateBaselineEligibility,
  evaluateCitizenBonus,
  evaluateCollectiveUnlock,
  publicPilotConfig,
} from "../cloudflare/happiness-pilot-core.js";
import {
  buildDeploymentPlan,
  parseDisplayUnits,
} from "./prepare-happiness-deployment.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const wallet = read("i  a m/wallet.html");
const style = read("i  a m/wallet.css");
const script = read("i  a m/wallet.js");
const globalNavigation = read("i  a m/global-navigation.js");
const globalNavigationStyle = read("i  a m/global-navigation.css");
const architecture = read("cloudflare/happiness-rewards-architecture.md");
const contract = read("contracts/HappinessRewards.sol");
const oracleContract = read("contracts/HappinessCommunityOracle.sol");
const deploymentConfig = JSON.parse(read("contracts/happiness-testnet-deployment.config.json"));
const oracleDeploymentConfig = JSON.parse(read("contracts/happiness-oracle-testnet-deployment.config.json"));
const appleRegistration = JSON.parse(read("apple-wallet/happiness-pass-registration.json"));
const wrangler = read("cloudflare/wrangler.happiness-rewards.toml");
const htaccess = read(".htaccess");
const redirects = read("_redirects");
const demoWallet = JSON.parse(read("i  a m/happiness-wallet-demo-v1.json"));
const passTemplate = read("apple-wallet/happiness-pass.template.json");
const passBuilder = read("tools/build-happiness-apple-pass.mjs");
const home = read("i  a m/index.html");
const televisionPage = read("i  a m/adaptive-environment-television.html");
const televisionCss = read("i  a m/adaptive-environment-television.css");
const television = read("i  a m/adaptive-environment-television.js");
const happinessControl = read("i  a m/happiness-control.html");
const happinessControlScript = read("i  a m/happiness-control.js");
const happinessAutomation = read("i  a m/api/happiness-automation.php");
assert.doesNotMatch(happinessAutomation, /'member'\s*=>\s*\$ledger\['member'\]/);
const applePassDelivery = read("i  a m/apple-wallet/pass.php");
const applePassService = read("i  a m/apple-wallet/service.php");
const applePassLibrary = read("i  a m/apple-wallet/happiness-apple-lib.php");

assert.equal(HAPPINESS_ARCHITECTURE.currency.name, "HAPPINESS");
assert.equal(HAPPINESS_ARCHITECTURE.currency.symbol, "[ I o H ]");
assert.equal(HAPPINESS_ARCHITECTURE.currency.ledgerSymbol, "IOH");
assert.equal(HAPPINESS_ARCHITECTURE.currency.symbolMeaning, "Internet of Happiness");
assert.equal(HAPPINESS_ARCHITECTURE.ledger.network, "polygon-amoy");
assert.equal(HAPPINESS_ARCHITECTURE.ledger.contractAddress, "0x616EF64C03D79630ECA03b5Cea4ea58a252dB68a");
assert.equal(HAPPINESS_ARCHITECTURE.ledger.mode, "amoy_deployed_zero_supply");
assert.equal(HAPPINESS_ARCHITECTURE.ledger.memberTransfersEnabled, false);
assert.equal(HAPPINESS_ARCHITECTURE.ledger.cashRedemptionEnabled, false);
assert.equal(HAPPINESS_ARCHITECTURE.reserve.enabled, false);
assert.equal(HAPPINESS_ARCHITECTURE.reserve.backed, false);
assert.equal(HAPPINESS_ARCHITECTURE.reserve.pegClaimEnabled, false);
assert.equal(HAPPINESS_ARCHITECTURE.reserve.blockchain, "MATIC-AMOY");
assert.equal(HAPPINESS_ARCHITECTURE.reserve.usdcTokenAddress, "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582");
assert.equal(HAPPINESS_ARCHITECTURE.appleWallet.passTypeIdentifier, "pass.tv.universalmind.happiness");
assert.equal(HAPPINESS_ARCHITECTURE.appleWallet.mode, "signed_static_demo_ready");
assert.equal(HAPPINESS_ARCHITECTURE.oracle.provider, "chainlink-cre");
assert.equal(HAPPINESS_ARCHITECTURE.oracle.executionModel, "cre-workflow");
assert.equal(HAPPINESS_ARCHITECTURE.oracle.enabled, false);
assert.equal(HAPPINESS_ARCHITECTURE.oracle.purpose, "collective_emissions_and_stage_gated_impact_financing");
assert.equal(HAPPINESS_ARCHITECTURE.oracle.evidencePolicy, "cohort_impact_milestones_not_individual_scoring");
assert.equal(HAPPINESS_ARCHITECTURE.oracle.evidenceOrigin, "triall-verifiable-proof");
assert.equal(HAPPINESS_ARCHITECTURE.oracle.triallAdapterMode, "interface_pending_vendor_diligence");
assert.equal(HAPPINESS_ARCHITECTURE.a2a.protocolVersion, "1.0");
assert.equal(HAPPINESS_ARCHITECTURE.a2a.purpose, "verified_mental_health_innovation");
assert.equal(HAPPINESS_ARCHITECTURE.a2a.prohibitedPurpose, "synthetic_platform_activity");
assert.equal(HAPPINESS_PILOT_POLICY.rollingWindowDays, 91);
assert.equal(HAPPINESS_PILOT_POLICY.baseline.designatedEventAttendanceBps, 5100);
assert.equal(HAPPINESS_PILOT_POLICY.baseline.weeklyMinutes, 120);
assert.equal(HAPPINESS_PILOT_POLICY.baseline.enhancedWeeklyMinutes, 240);
assert.equal(HAPPINESS_PILOT_POLICY.guardrails.employmentVerification, false);
assert.equal(deploymentConfig.deployer_address, "0xA83623eF867Bb651EF8f546632fa49d51FFad5ca");
assert.equal(deploymentConfig.supply_cap_display, "10000000");
assert.equal(deploymentConfig.supply_cap_units, "10000000000000");
assert.equal(deploymentConfig.supply_cap_status, "approved_for_testnet_2026-07-28");
assert.equal(deploymentConfig.production.enabled, false);
assert.equal(deploymentConfig.chainlink_cre.deployment_stage, "early_access");
assert.equal(deploymentConfig.networks["polygon-amoy"].cre_chain_name, "polygon-testnet-amoy");
assert.equal(deploymentConfig.networks["polygon-amoy"].cre_keystone_forwarder, "0x76c9cf548b4179F8901cda1f8623568b58215E62");
assert.equal(oracleDeploymentConfig.status, "prepared_not_deployed");
assert.equal(oracleDeploymentConfig.happiness_contract_address, "0x616EF64C03D79630ECA03b5Cea4ea58a252dB68a");
assert.equal(oracleDeploymentConfig.keystone_forwarder, "0x76c9cf548b4179F8901cda1f8623568b58215E62");
assert.equal(oracleDeploymentConfig.role_grant.required, true);
assert.equal(appleRegistration.pass_type_identifier, "pass.tv.universalmind.happiness");
assert.equal(appleRegistration.team_identifier, "3458V3D263");
assert.equal(appleRegistration.status, "signed_static_demo_ready");
assert.equal(appleRegistration.pass_type_certificate_created, true);
assert.equal(appleRegistration.signing_private_key_created, true);
assert.equal(parseDisplayUnits("1000000").toString(), "1000000000000");
assert.equal(parseDisplayUnits("1.000001").toString(), "1000001");
assert.throws(() => parseDisplayUnits("1.0000001"), /invalid_testnet_supply_cap/);
assert.throws(() => buildDeploymentPlan({ network: "polygon-amoy" }), /invalid_testnet_supply_cap/);
const amoyDeploymentPlan = buildDeploymentPlan({ network: "polygon-amoy", supplyCap: "1000000" });
assert.equal(amoyDeploymentPlan.chain_id, 80002);
assert.equal(amoyDeploymentPlan.currency.ledger_symbol, "IOH");
assert.equal(amoyDeploymentPlan.private_key_required_by_plan, false);
assert.equal(amoyDeploymentPlan.wallet_signature_required_at_deployment, true);
assert.equal(amoyDeploymentPlan.initial_role_policy.future_cre_role, "COMMUNITY_ISSUER_ROLE_only");

assert.equal(parseHappinessUnits("12.345").toString(), "12345000");
assert.equal(formatHappinessUnits("12345000"), "12.345");
assert.throws(() => parseHappinessUnits("1.0000001"), /happiness_precision_exceeded/);
assert.throws(() => assertMutationReady({}), /happiness_mutations_disabled/);
assert.throws(() => assertMutationReady({
  HAPPINESS_MUTATIONS_ENABLED: "true",
  HAPPINESS_POLYGON_CONTRACT_ADDRESS: "0x1111111111111111111111111111111111111111",
  HAPPINESS_SIGNER_KEY: "must-never-be-accepted",
}), /raw_happiness_signer_key_forbidden/);
assert.throws(() => assertMutationReady({
  HAPPINESS_MUTATIONS_ENABLED: "true",
  HAPPINESS_POLYGON_CONTRACT_ADDRESS: "0x1111111111111111111111111111111111111111",
  HAPPINESS_SIGNER_KEY_REFERENCE: "managed-secret:test",
}), /happiness_issuer_not_configured/);
assert.throws(() => assertOracleReady({}), /happiness_oracle_disabled/);
assert.throws(() => assertImpactFundingReady({}), /happiness_impact_funding_disabled/);
assert.throws(() => assertCollectiveEmissionReady({}), /happiness_collective_emissions_disabled/);
assert.throws(() => assertA2AReady({}), /happiness_a2a_disabled/);
const collectiveRule = assertCollectiveEmissionReady({
  HAPPINESS_COLLECTIVE_EMISSIONS_ENABLED: "true",
  HAPPINESS_MUTATIONS_ENABLED: "true",
  HAPPINESS_POLYGON_CONTRACT_ADDRESS: "0x1111111111111111111111111111111111111111",
  HAPPINESS_ISSUER_ADDRESS: "0x4444444444444444444444444444444444444444",
  HAPPINESS_SIGNER_KEY_REFERENCE: "managed-secret:happiness-testnet-issuer",
  HAPPINESS_CHAINLINK_ENABLED: "true",
  HAPPINESS_CHAINLINK_CRE_ENABLED: "true",
  HAPPINESS_CHAINLINK_CRE_WORKFLOW_ID: "happiness-collective-emission-v1",
  HAPPINESS_CHAINLINK_CRE_WORKFLOW_HASH: `0x${"a".repeat(64)}`,
  HAPPINESS_CHAINLINK_CRE_CAPABILITY_CONFIG_HASH: `0x${"b".repeat(64)}`,
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
assert.equal(validateAgentContributionReceipt({
  schema_version: "happiness_agent_contribution_receipt_v1",
  contribution_id: "innovation:privacy:0001",
  agent_identity_commitment: `0x${"a".repeat(64)}`,
  swarm_commitment: `0x${"b".repeat(64)}`,
  contribution_type: "privacy_security",
  artifact_commitment: `0x${"c".repeat(64)}`,
  evaluation_commitment: `0x${"d".repeat(64)}`,
  acceptance_rule_version: "privacy-v1",
  approver_commitment: `0x${"e".repeat(64)}`,
  approved_happiness_units: "1000000",
  recipient_address: "0x1111111111111111111111111111111111111111",
  issued_at: "2026-07-28T00:00:00.000Z",
  expires_at: "2026-07-28T00:10:00.000Z",
}), true);
assert.throws(() => validateAgentContributionReceipt({
  mental_health_impact_claim: "generated 1000 check-ins",
}), /synthetic_activity_or_health_claim_forbidden/);
assert.throws(() => validateAgentContributionReceipt({
  schema_version: "happiness_agent_contribution_receipt_v1",
  contribution_type: "checkin_generation",
}), /agent_contribution_type_not_supported|invalid_agent_contribution_id/);
const agentCard = happinessAgentCard({ HAPPINESS_A2A_PUBLIC_BASE_URL: "https://agents.example/" });
assert.equal(agentCard.supportedInterfaces[0].url, "https://agents.example/a2a/v1");
assert.equal(agentCard.supportedInterfaces[0].protocolVersion, "1.0");
assert.match(agentCard.description, /never rewards synthetic check-ins/i);
assert.deepEqual(evaluateBaselineEligibility({
  designated_events_attended: "6",
  designated_events_available: "10",
  credited_minutes: "1320",
  active_weeks: "11",
  paused_weeks: "2",
}), {
  schema_version: "happiness_baseline_eligibility_v1",
  rolling_window_days: 91,
  eligible: true,
  event_requirement_applied: true,
  designated_event_attendance_bps: 6000,
  minimum_designated_event_attendance_bps: 5100,
  average_weekly_minutes: 120,
  minimum_weekly_minutes: 120,
  enhanced_pathway_reached: false,
  paused_weeks: 2,
  award_units: null,
  award_status: "citizen_governance_amount_required",
  reasons: ["designated_event_requirement_met", "healthy_participation_requirement_met"],
});
assert.equal(evaluateBaselineEligibility({
  designated_events_attended: "0",
  designated_events_available: "0",
  credited_minutes: "1440",
  active_weeks: "12",
}).eligible, true);
assert.equal(evaluateBaselineEligibility({
  designated_events_attended: "5",
  designated_events_available: "10",
  credited_minutes: "1440",
  active_weeks: "12",
}).eligible, false);
assert.throws(() => evaluateBaselineEligibility({
  designated_events_attended: "1",
  designated_events_available: "1",
  credited_minutes: "120",
  active_weeks: "1",
  paused_weeks: "3",
}), /baseline_grace_weeks_exceeded/);
assert.equal(evaluateCitizenBonus({ action_type: "mentor_audio_room", verified_minutes: "25" }, { weekly_count: "0" }).eligible, true);
assert.deepEqual(evaluateCitizenBonus({ action_type: "mentor_audio_room", verified_minutes: "25" }, { weekly_count: "2" }), {
  eligible: false,
  reason: "healthy_weekly_cap_reached",
  award_units: "0",
});
assert.equal(evaluateCitizenBonus({ action_type: "emdr_practice", verified_minutes: "15" }, { weekly_count: "0" }).reason, "clinical_safety_gate_required");
assert.throws(() => evaluateCitizenBonus({ action_type: "considered_checkin", mood: "happy" }), /subjective_or_clinical_bonus_field_forbidden/);
assert.equal(evaluateCollectiveUnlock({}, []).status, "citizen_governance_thresholds_required");
assert.deepEqual(evaluateCollectiveUnlock({ unique_eligible_citizens: "120", continuity_rate_bps: "6200" }, [
  { id: "foundation", minimum_unique_citizens: "0", minimum_continuity_bps: "0" },
  { id: "shared", minimum_unique_citizens: "100", minimum_continuity_bps: "5100" },
]), {
  current_tier: "shared",
  unlocked_index: 1,
  status: "evaluated",
  member_ranking_changed: false,
});
const simulatedLedger = createSimulatedLedger();
const firstIssue = simulatedLedger.issue({ idempotency_key: "baseline:2026q3:0001", recipient: "member:000001", lane: "baseline", units: "1000000" });
const replayedIssue = simulatedLedger.issue({ idempotency_key: "baseline:2026q3:0001", recipient: "member:000001", lane: "baseline", units: "1000000" });
simulatedLedger.issue({ idempotency_key: "bonus:2026w31:0001", recipient: "member:000001", lane: "citizen_bonus", units: "250000" });
assert.equal(firstIssue, replayedIssue);
assert.equal(simulatedLedger.balanceOf("member:000001"), "1250000");
assert.equal(simulatedLedger.events().length, 2);
assert.equal(publicPilotConfig().baseline.award_units, null);
assert.deepEqual(reserveState({}), {
  adapter: "circle-usdc",
  requested: false,
  api_reads_requested: false,
  api_connected: false,
  enabled: false,
  backed: false,
  peg_claim_enabled: false,
  settlement_enabled: false,
});
assert.equal(CIRCLE_RESERVE_PROFILE.mode, "read-only-reserve-reconciliation");
assert.equal(CIRCLE_RESERVE_PROFILE.blockchain, "MATIC-AMOY");
assert.equal(CIRCLE_RESERVE_PROFILE.usdcTokenAddress, "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582");
assert.equal(circleReserveReadiness({}).api_reads_enabled, false);
assert.equal(circleReserveReadiness({ HAPPINESS_USDC_BACKING_CONFIRMED: "true" }).backing_confirmed, false);
assert.throws(() => assertCircleReserveReadReady({}), /happiness_circle_api_reads_disabled/);
assert.throws(() => assertCircleSettlementDisabled({ HAPPINESS_USDC_SETTLEMENT_ENABLED: "true" }), /happiness_usdc_settlement_not_implemented/);
const circleTestEnv = {
  HAPPINESS_CIRCLE_API_READS_ENABLED: "true",
  CIRCLE_API_KEY: "TEST_API_KEY_DO_NOT_LOG",
  HAPPINESS_CIRCLE_WALLET_ID: "wallet-001",
  HAPPINESS_USDC_TREASURY_ADDRESS: "0x1111111111111111111111111111111111111111",
  HAPPINESS_CIRCLE_BLOCKCHAIN: "MATIC-AMOY",
  HAPPINESS_CIRCLE_USDC_TOKEN_ADDRESS: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
};
const circleSnapshot = await fetchCircleReserveSnapshot(circleTestEnv, async (url, options) => {
  assert.equal(url, "https://api.circle.com/v1/w3s/developer/wallets/balances");
  assert.equal(options.method, "GET");
  assert.equal(options.headers.Authorization, "Bearer TEST_API_KEY_DO_NOT_LOG");
  return new Response(JSON.stringify({
    data: {
      wallets: [{
        id: "wallet-001",
        address: "0x1111111111111111111111111111111111111111",
        blockchain: "MATIC-AMOY",
        tokenBalances: [{
          amount: "0",
          token: { tokenAddress: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582" },
        }],
      }],
    },
  }), { status: 200, headers: { "Content-Type": "application/json" } });
});
assert.equal(circleSnapshot.usdc_amount, "0");
assert.equal(circleSnapshot.backing_confirmed, false);
assert.equal(circleSnapshot.settlement_enabled, false);
assert.doesNotMatch(JSON.stringify(circleSnapshot), /TEST_API_KEY_DO_NOT_LOG/);
assert.match(wrangler, /HAPPINESS_CIRCLE_API_READS_ENABLED = "false"/);
assert.match(wrangler, /HAPPINESS_USDC_SETTLEMENT_ENABLED = "false"/);
assert.match(wrangler, /HAPPINESS_APPLE_PASS_TYPE_IDENTIFIER = "pass\.tv\.universalmind\.happiness"/);
assert.equal(publicHappinessConfig().programme.cash_value, false);

assert.match(wallet, /<h1 id="happiness-title">HAPPINESS<\/h1>/);
assert.match(wallet, /\[ I o H \]/);
assert.match(wallet, /Internet of Happiness/);
assert.match(wallet, /Every visit unlocks something new\.<br>We earn, together as one\./);
assert.match(wallet, /How HAPPINESS grows/);
assert.match(wallet, /51% of designated special events and two healthy hours each active week/i);
assert.match(wallet, /Agents and their humans can earn for approved features/i);
assert.match(wallet, /Universal Mind \[ I o H \] Logo 512\.png/);
assert.doesNotMatch(wallet, /crypto|blockchain|stablecoin|USDC|Polygon|ERC-20/i);
assert.match(wallet, /has no cash value and is not available for cash redemption/i);
assert.equal((wallet.match(/data-happiness-category=/g) || []).length, 4);
assert.match(style, /grid-template-columns:\s*repeat\(12, 1fr\)/);
assert.match(style, /@media \(max-width: 980px\)/);
assert.match(wallet, /happiness-wallet-qr-staging\.png/);
assert.match(script, /happiness-wallet-qr-production\.png/);
assert.match(wallet, /href="\/vogue\/iam\/wallet\.css\?v=happiness-wallet-9-technology-submenu-133pct-normal-1"/);
assert.match(wallet, /src="\/vogue\/iam\/wallet\.js\?v=happiness-wallet-5"/);
assert.match(wallet, /href="\/vogue\/iam\/apple-wallet\/pass\.php"/);
assert.match(wallet, /happiness-automation\.php\?public=1/);
assert.doesNotMatch(wallet, /data-happiness-demo-award/);
assert.doesNotMatch(script, /pass\.php\?balance=25/);
assert.match(passTemplate, /"label": "UNIVERSAL CITIZEN"/);
assert.match(passTemplate, /"key": "brand", "label": "", "value": "HAPPINESS"/);
assert.match(passTemplate, /"key": "balance", "label": "AVAILABLE", "value": "\{\{BALANCE\}\}"/);
assert.match(passTemplate, /"key": "ticker", "label": "", "value": "\[ I o H \]"/);
assert.match(passTemplate, /"altText": "Redeem HAPPINESS In-store"/);
for (const asset of ["logo.png", "logo@2x.png", "logo@3x.png", "strip.png", "strip@2x.png", "strip@3x.png"]) {
  assert.match(passBuilder, new RegExp(asset.replace(".", "\\.")));
  assert.ok(fs.existsSync(path.join(root, "apple-wallet", "assets", asset)));
}
assert.match(wallet, /class="happiness-brand"[^>]*>[\s\S]*class="brand-mark"/);
const walletHeader = wallet.match(/<header class="happiness-header">[\s\S]*?<\/header>/)?.[0] || "";
assert.doesNotMatch(walletHeader, /brand-lockup|universalmind|internet of happiness/i);
assert.match(wallet, /class="global-nav-trigger"[^>]*data-nav-open/);
assert.match(wallet, /<strong>explore<\/strong>[\s\S]*learn about Universal Mind/);
assert.match(wallet, /data-global-nav-host/);
assert.match(wallet, /global-navigation\.js\?v=global-navigation-canonical-1/);
assert.match(globalNavigation, /data-global-nav[^>]*aria-hidden="true"/);
assert.match(wallet, /music-television-frame-context\.js\?v=music-tv-frame-14ebf4459d03/);
assert.match(style, /\.happiness-brand \.brand-mark\s*\{[^}]*width:\s*clamp\(64px, 4\.35vw, 90px\)[^}]*animation:\s*mark-spin 3s linear infinite/s);
assert.match(style, /\.global-nav-trigger\s*\{[^}]*width:\s*clamp\(340px, 40vw, 820px\)[^}]*height:\s*clamp\(68px, 5vw, 104px\)/s);
assert.match(globalNavigationStyle, /\.global-nav-menu\s*\{[^}]*top:\s*clamp\(112px, 13\.2vh, 152px\)[^}]*max-height:\s*calc\(100dvh - 190px\)/s);
assert.match(globalNavigationStyle, /\.global-nav \.global-nav-item\.is-active[^}]*color:\s*var\(--global-nav-highlight\)/s);
assert.match(script, /window\.parent\.postMessage\(\{ type: "iam:return-to-television" \}/);
assert.match(script, /url\.searchParams\.set\("musicTelevisionFrame", "1"\)/);
assert.doesNotMatch(globalNavigation.match(/<nav class="global-nav-menu"[\s\S]*?<\/nav>/)?.[0] || "", /wallet\.html|\/wallet\//i);
assert.equal((home.match(/data-happiness-wallet-category=/g) || []).length, 4);
assert.match(home, /adaptive-environment-television\.js\?v=music-tv-bd481dd53682/);
assert.match(televisionPage, /adaptive-environment-television\.js\?v=music-tv-bd481dd53682/);
assert.match(television, /document\.querySelectorAll\("\[data-happiness-wallet-category\]"\)/);
assert.match(television, /walletLink\.setAttribute\("href", `wallet\.html#\$\{category\}`\)/);
assert.match(television, /openInVideoPageLayer\(walletLink\)/);
assert.match(television, /television-wallet-page-open/);
assert.match(televisionCss, /television-page-view-open\.television-wallet-page-open[\s\S]*z-index:\s*31/);
assert.equal((home.match(/data-television-page-close/g) || []).length, 1);
assert.equal((televisionPage.match(/data-television-page-close/g) || []).length, 1);
assert.match(television, /pageClose\?\.addEventListener\("click", \(\) => returnToTelevisionRoom\(\)\)/);
assert.match(televisionCss, /television-page-view-open\.television-wallet-page-open \.adaptive-television-page-close[\s\S]*pointer-events:\s*auto/);
assert.doesNotMatch(wallet, /(?:href|src)="a s s e t s\//);
assert.match(wallet, /data-stream-file="a s s e t s\/Globe Landing Page Video - Sunscreem - Perfection Motion for RMU\.mp4"/);
assert.match(wallet, /Ethereum Diamond Rainbow \[ e o r a \] 3\.png/);
assert.match(wallet, /cloudflare-stream-controller\.js\?v=stream-controller-e6ed1b827651/);
assert.match(style, /\.happiness-background-shade\s*\{[^}]*background:\s*rgba\(0, 0, 0, 0\.77\)/s);
assert.match(style, /\.happiness-card__member img\s*\{[^}]*width:\s*clamp\(54px, 4\.8vw, 75px\)/s);
assert.match(architecture, /It is not currently backed, pegged, cash redeemable/i);
assert.match(architecture, /Adding USDC infrastructure does not itself make HAPPINESS a stablecoin/i);
assert.match(architecture, /It does not decide individual HAPPINESS rewards/i);
assert.match(architecture, /never raw sequence data, an individual result, clinical notes, patient identifiers, mood or diagnosis/i);
assert.match(architecture, /That proof establishes integrity, not scientific meaning/i);
assert.match(architecture, /interface_pending_vendor_diligence/i);
assert.match(architecture, /no promise of appreciation, USDC conversion, cash value, investment return or migration/i);
assert.match(architecture, /not a channel for agents to use, simulate or bot the product/i);
assert.match(architecture, /no rewards for check-ins, clicks, engagement, referrals, sessions or screen time/i);
assert.match(architecture, /rolling 91-day window/i);
assert.match(architecture, /must not be invented in code/i);
assert.match(architecture, /Chainlink CRE is the planned orchestration layer/i);
assert.match(architecture, /can never mint directly to a citizen or agent address/i);
assert.match(architecture, /CRE workflow deployment is currently Early Access/i);
assert.match(architecture, /Circle Wallets read-only reserve reconciliation adapter is implemented/i);
assert.match(architecture, /HappinessCommunityOracle` remains prepared but not deployed/i);
assert.match(architecture, /KeystoneForwarder/);
assert.match(architecture, /Four hours is an optional enhanced-participation pathway, never an employment-status test/i);
assert.match(contract, /contract HappinessRewards is ERC20, AccessControl, Pausable/);
assert.match(contract, /ERC20\("HAPPINESS", "IOH"\)/);
assert.match(contract, /MEMBER_ISSUER_ROLE/);
assert.match(contract, /COMMUNITY_ISSUER_ROLE/);
assert.match(contract, /onlyRole\(MEMBER_ISSUER_ROLE\)/);
assert.match(contract, /onlyRole\(COMMUNITY_ISSUER_ROLE\)/);
assert.match(contract, /bytes32 laneId/);
assert.match(contract, /return 6;/);
assert.match(contract, /MemberTransfersDisabled/);
assert.match(contract, /totalSupply\(\) \+ amount > supplyCap/);
assert.match(oracleContract, /contract HappinessCommunityOracle is IReceiver, AccessControl, Pausable/);
assert.match(oracleContract, /metadata\.length != 64/);
assert.match(oracleContract, /expectedWorkflowId/);
assert.match(oracleContract, /expectedWorkflowAuthor/);
assert.match(oracleContract, /WorkflowIdentityAlreadyConfigured/);
assert.match(oracleContract, /MAX_REPORT_VALIDITY_WINDOW = 30 days/);
assert.match(oracleContract, /amount > maxAmountPerEpoch/);
assert.match(oracleContract, /happiness\.issueCommunityPool\(amount, epochId\)/);
assert.doesNotMatch(contract, /mood|diagnosis|patient|clinical|mRNA/i);
assert.match(htaccess, /RewriteRule \^wallet\/\?\$ \/vogue\/iam\/wallet\.html \[L\]/);
assert.match(redirects, /^\/wallet\/ \/vogue\/iam\/wallet\.html 200$/m);
assert.equal(demoWallet.mode, "staging_preview");
assert.equal(demoWallet.pilot.baseline_award, "citizen governance pending");
assert.equal(demoWallet.balance.available_display, "0");
assert.match(passTemplate, /"storeCard"/);
assert.match(passTemplate, /\{\{PASS_TYPE_IDENTIFIER\}\}/);
for (const asset of ["icon.png", "icon@2x.png", "icon@3x.png"]) {
  assert.ok(fs.existsSync(path.join(root, "apple-wallet/assets", asset)), `Missing Apple Wallet asset: ${asset}`);
}
for (const passFile of ["HAPPINESS.pkpass", "HAPPINESS-DEMO-25.pkpass"]) {
  const bytes = fs.readFileSync(path.join(root, "i  a m/apple-wallet", passFile));
  assert.equal(bytes.subarray(0, 2).toString("ascii"), "PK", `Invalid Apple Wallet archive: ${passFile}`);
}
assert.match(htaccess, /AddType application\/vnd\.apple\.pkpass \.pkpass/);
assert.match(applePassDelivery, /application\/vnd\.apple\.pkpass/);
assert.match(applePassDelivery, /happiness_apple_build_pass/);
assert.match(applePassDelivery, /apple_authentication_token/);
assert.match(applePassLibrary, /webServiceURL/);
assert.match(applePassLibrary, /authenticationToken/);
assert.match(applePassLibrary, /api\.push\.apple\.com\/3\/device/);
assert.match(applePassService, /ApplePass /);
assert.match(applePassService, /pushToken/);
assert.match(applePassService, /not_registered/);
assert.match(happinessControl, /ONE ACTION \/ ONE OUTCOME/);
assert.match(happinessControl, /Circle managed signer/);
assert.match(happinessControlScript, /action: "reconcile"/);
assert.match(happinessAutomation, /issueReward\(address,uint256,bytes32,bytes32\)/);
assert.match(happinessAutomation, /redeemReward\(address,uint256,bytes32\)/);
assert.match(happinessAutomation, /rsa_oaep_md:sha256/);
assert.match(happinessAutomation, /happiness_polygon_balance/);
assert.match(happinessAutomation, /happiness_apple_notify/);
assert.match(happinessAutomation, /another_polygon_confirmation_is_pending/);
assert.doesNotMatch(happinessAutomation, /private.?key|HAPPINESS_SIGNER_KEY/i);

const healthResponse = await happinessWorker.fetch(new Request("https://rewards.example/health"), {});
assert.equal(healthResponse.status, 200);
assert.equal((await healthResponse.json()).ledger, "amoy_deployed_zero_supply");

const circleUnauthorizedResponse = await happinessWorker.fetch(new Request("https://rewards.example/internal/circle/reserve"), {});
assert.equal(circleUnauthorizedResponse.status, 401);
assert.equal((await circleUnauthorizedResponse.json()).error, "not_authorized");

const circleDisabledResponse = await happinessWorker.fetch(new Request("https://rewards.example/internal/circle/reserve", {
  headers: { Authorization: "Bearer test-internal-token" },
}), { HAPPINESS_INTERNAL_TOKEN: "test-internal-token" });
assert.equal(circleDisabledResponse.status, 503);
assert.equal((await circleDisabledResponse.json()).error, "happiness_circle_api_reads_disabled");

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

const agentCardDisabledResponse = await happinessWorker.fetch(new Request("https://rewards.example/.well-known/agent-card.json"), {});
assert.equal(agentCardDisabledResponse.status, 503);
assert.equal((await agentCardDisabledResponse.json()).error, "happiness_a2a_disabled");

const agentCardResponse = await happinessWorker.fetch(new Request("https://rewards.example/.well-known/agent-card.json"), {
  HAPPINESS_A2A_ENABLED: "true",
  HAPPINESS_A2A_PUBLIC_BASE_URL: "https://agents.example",
});
assert.equal(agentCardResponse.status, 200);
assert.equal((await agentCardResponse.json()).supportedInterfaces[0].protocolVersion, "1.0");

const a2aResponse = await happinessWorker.fetch(new Request("https://rewards.example/a2a/v1", {
  method: "POST",
}), {});
assert.equal(a2aResponse.status, 503);
assert.equal((await a2aResponse.json()).error, "happiness_a2a_disabled");

const pilotConfigResponse = await happinessWorker.fetch(new Request("https://rewards.example/v1/pilot"), {});
assert.equal(pilotConfigResponse.status, 200);
assert.equal((await pilotConfigResponse.json()).baseline.award_units, null);

const memberReadResponse = await happinessWorker.fetch(new Request("https://rewards.example/v1/wallet"), {});
assert.equal(memberReadResponse.status, 503);
assert.equal((await memberReadResponse.json()).error, "happiness_member_reads_disabled");

const pilotEvaluationResponse = await happinessWorker.fetch(new Request("https://rewards.example/internal/pilot/evaluate-baseline", {
  method: "POST",
  headers: { Authorization: "Bearer pilot-test-token", "Content-Type": "application/json" },
  body: JSON.stringify({
    designated_events_attended: "6",
    designated_events_available: "10",
    credited_minutes: "1320",
    active_weeks: "11",
    paused_weeks: "2",
  }),
}), { HAPPINESS_PILOT_ENABLED: "true", HAPPINESS_INTERNAL_TOKEN: "pilot-test-token" });
assert.equal(pilotEvaluationResponse.status, 200);
assert.equal((await pilotEvaluationResponse.json()).evaluation.eligible, true);

const blockedPilotEvaluation = await happinessWorker.fetch(new Request("https://rewards.example/internal/pilot/evaluate-baseline", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{}",
}), { HAPPINESS_PILOT_ENABLED: "true", HAPPINESS_INTERNAL_TOKEN: "pilot-test-token" });
assert.equal(blockedPilotEvaluation.status, 401);

const applePassResponse = await happinessWorker.fetch(new Request("https://rewards.example/v1/apple-wallet/pass"), {});
assert.equal(applePassResponse.status, 503);
assert.equal((await applePassResponse.json()).error, "happiness_apple_pass_issuance_disabled");

const appleUpdateResponse = await happinessWorker.fetch(new Request("https://rewards.example/apple-wallet/v1/devices/device-1/registrations/pass.example/serial-1", {
  method: "POST",
}), {});
assert.equal(appleUpdateResponse.status, 503);
assert.equal((await appleUpdateResponse.json()).error, "happiness_apple_pass_updates_disabled");

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
