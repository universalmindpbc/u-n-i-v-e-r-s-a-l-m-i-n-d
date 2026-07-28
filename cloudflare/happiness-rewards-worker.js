import {
  HAPPINESS_ARCHITECTURE,
  assertA2AReady,
  assertCollectiveEmissionReady,
  assertImpactFundingReady,
  assertMutationReady,
  publicHappinessConfig,
  happinessAgentCard,
  reserveState,
} from "./happiness-rewards-core.js";
import {
  HAPPINESS_PILOT_POLICY,
  assertPilotReady,
  evaluateBaselineEligibility,
  evaluateCitizenBonus,
  pilotReadiness,
  publicPilotConfig,
} from "./happiness-pilot-core.js";

const ALLOWED_ORIGINS = new Set([
  "https://staging.universalmind.tv",
  "https://universalmind.tv",
  "https://www.universalmind.tv",
]);

function headers(origin = "") {
  const value = {
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Idempotency-Key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
  if (ALLOWED_ORIGINS.has(origin)) value["Access-Control-Allow-Origin"] = origin;
  return value;
}

function json(body, status = 200, origin = "") {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers(origin) },
  });
}

function internalAuthorized(request, env) {
  const authorization = request.headers.get("Authorization") || "";
  return Boolean(env.HAPPINESS_INTERNAL_TOKEN) && authorization === `Bearer ${env.HAPPINESS_INTERNAL_TOKEN}`;
}

async function requestJson(request) {
  try {
    return await request.json();
  } catch {
    throw new Error("invalid_json_body");
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      if (!ALLOWED_ORIGINS.has(origin)) return json({ ok: false, error: "origin_not_allowed" }, 403, origin);
      return new Response(null, { status: 204, headers: headers(origin) });
    }

    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ ok: false, error: "origin_not_allowed" }, 403, origin);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({
        ok: true,
        service: "happiness-rewards",
        architecture: HAPPINESS_ARCHITECTURE.schemaVersion,
        ledger: HAPPINESS_ARCHITECTURE.ledger.mode,
      }, 200, origin);
    }

    if (request.method === "GET" && url.pathname === "/v1/config") {
      return json({ ok: true, ...publicHappinessConfig() }, 200, origin);
    }

    if (request.method === "GET" && url.pathname === "/v1/pilot") {
      return json({ ok: true, ...publicPilotConfig() }, 200, origin);
    }

    if (request.method === "GET" && url.pathname === "/v1/wallet") {
      if (String(env.HAPPINESS_MEMBER_READS_ENABLED || "false") !== "true") {
        return json({ ok: false, error: "happiness_member_reads_disabled" }, 503, origin);
      }
      return json({ ok: false, error: "member_identity_adapter_not_activated" }, 501, origin);
    }

    if (request.method === "GET" && url.pathname === "/v1/apple-wallet/pass") {
      if (String(env.HAPPINESS_APPLE_PASS_ISSUANCE_ENABLED || "false") !== "true") {
        return json({ ok: false, error: "happiness_apple_pass_issuance_disabled" }, 503, origin);
      }
      return json({ ok: false, error: "apple_pass_signing_adapter_not_activated" }, 501, origin);
    }

    if (url.pathname.startsWith("/apple-wallet/v1/")) {
      if (String(env.HAPPINESS_APPLE_PASS_UPDATES_ENABLED || "false") !== "true") {
        return json({ ok: false, error: "happiness_apple_pass_updates_disabled" }, 503, origin);
      }
      return json({ ok: false, error: "apple_pass_update_service_not_activated" }, 501, origin);
    }

    if (request.method === "GET" && url.pathname === HAPPINESS_ARCHITECTURE.a2a.discoveryPath) {
      if (String(env.HAPPINESS_A2A_ENABLED || "false") !== "true") {
        return json({ ok: false, error: "happiness_a2a_disabled" }, 503, origin);
      }
      return json(happinessAgentCard(env), 200, origin);
    }

    if (request.method === "GET" && url.pathname === "/internal/readiness") {
      return json({
        ok: true,
        ledger: {
          network: HAPPINESS_ARCHITECTURE.ledger.network,
          chain_id: HAPPINESS_ARCHITECTURE.ledger.chainId,
          contract_configured: Boolean(env.HAPPINESS_POLYGON_CONTRACT_ADDRESS),
          mutations_enabled: String(env.HAPPINESS_MUTATIONS_ENABLED || "false") === "true",
          issuer_address_configured: Boolean(env.HAPPINESS_ISSUER_ADDRESS),
          managed_signer_reference_configured: Boolean(env.HAPPINESS_SIGNER_KEY_REFERENCE),
          raw_signer_key_present: Boolean(env.HAPPINESS_SIGNER_KEY),
        },
        reserve: reserveState(env),
        oracle: {
          provider: HAPPINESS_ARCHITECTURE.oracle.provider,
          execution_model: HAPPINESS_ARCHITECTURE.oracle.executionModel,
          purpose: HAPPINESS_ARCHITECTURE.oracle.purpose,
          evidence_policy: HAPPINESS_ARCHITECTURE.oracle.evidencePolicy,
          evidence_origin: HAPPINESS_ARCHITECTURE.oracle.evidenceOrigin,
          triall_adapter: HAPPINESS_ARCHITECTURE.oracle.triallAdapterMode,
          enabled: String(env.HAPPINESS_CHAINLINK_ENABLED || "false") === "true",
          cre_enabled: String(env.HAPPINESS_CHAINLINK_CRE_ENABLED || "false") === "true",
          workflow_configured: Boolean(env.HAPPINESS_CHAINLINK_CRE_WORKFLOW_ID),
          workflow_pinned: Boolean(env.HAPPINESS_CHAINLINK_CRE_WORKFLOW_HASH),
          capability_config_pinned: Boolean(env.HAPPINESS_CHAINLINK_CRE_CAPABILITY_CONFIG_HASH),
          consumer_configured: Boolean(env.HAPPINESS_ORACLE_CONSUMER_ADDRESS),
        },
        collective_emissions: {
          mode: HAPPINESS_ARCHITECTURE.emissions.mode,
          enabled: String(env.HAPPINESS_COLLECTIVE_EMISSIONS_ENABLED || "false") === "true",
          thresholds_configured: Boolean(env.HAPPINESS_COLLECTIVE_MIN_UNIQUE_CHECKINS && env.HAPPINESS_COLLECTIVE_MIN_CONTINUITY_BPS),
          caps_configured: Boolean(env.HAPPINESS_COLLECTIVE_EPOCH_MINT_UNITS && env.HAPPINESS_COLLECTIVE_WEEKLY_CAP_UNITS && env.HAPPINESS_COLLECTIVE_TOTAL_CAP_UNITS),
          treasury_configured: Boolean(env.HAPPINESS_COMMUNITY_TREASURY_ADDRESS),
        },
        pilot: {
          ...pilotReadiness(env),
          policy: HAPPINESS_PILOT_POLICY.schemaVersion,
        },
        a2a: {
          protocol: HAPPINESS_ARCHITECTURE.a2a.protocol,
          protocol_version: HAPPINESS_ARCHITECTURE.a2a.protocolVersion,
          purpose: HAPPINESS_ARCHITECTURE.a2a.purpose,
          enabled: String(env.HAPPINESS_A2A_ENABLED || "false") === "true",
          rewards_enabled: String(env.HAPPINESS_A2A_REWARDS_ENABLED || "false") === "true",
          issuer_configured: Boolean(env.HAPPINESS_A2A_ISSUER_ID),
          approval_quorum_configured: Boolean(env.HAPPINESS_A2A_APPROVER_QUORUM),
          evaluation_policy_pinned: Boolean(env.HAPPINESS_A2A_EVALUATION_POLICY_HASH),
          synthetic_platform_activity_rewarded: false,
        },
        apple_wallet: {
          pass_type_configured: Boolean(env.HAPPINESS_APPLE_PASS_TYPE_IDENTIFIER),
          signing_certificate_configured: Boolean(env.HAPPINESS_APPLE_PASS_CERTIFICATE),
          team_identifier_configured: Boolean(env.HAPPINESS_APPLE_TEAM_IDENTIFIER),
          web_service_url_configured: Boolean(env.HAPPINESS_APPLE_WEB_SERVICE_URL),
          issuance_enabled: String(env.HAPPINESS_APPLE_PASS_ISSUANCE_ENABLED || "false") === "true",
          update_service_enabled: String(env.HAPPINESS_APPLE_PASS_UPDATES_ENABLED || "false") === "true",
        },
      }, 200, origin);
    }

    if (request.method === "POST" && url.pathname === "/v1/earn") {
      try {
        assertMutationReady(env);
      } catch (error) {
        return json({ ok: false, error: error.message }, 503, origin);
      }
      return json({ ok: false, error: "polygon_adapter_not_activated" }, 501, origin);
    }

    if (request.method === "POST" && url.pathname === "/internal/funding-release") {
      try {
        assertImpactFundingReady(env);
      } catch (error) {
        return json({ ok: false, error: error.message }, 503, origin);
      }
      return json({ ok: false, error: "impact_funding_adapter_not_activated" }, 501, origin);
    }

    if (request.method === "POST" && url.pathname === "/internal/collective-emission") {
      try {
        assertCollectiveEmissionReady(env);
      } catch (error) {
        return json({ ok: false, error: error.message }, 503, origin);
      }
      return json({ ok: false, error: "collective_emission_adapter_not_activated" }, 501, origin);
    }

    if (request.method === "POST" && url.pathname === HAPPINESS_ARCHITECTURE.a2a.servicePath) {
      try {
        assertA2AReady(env);
      } catch (error) {
        return json({ ok: false, error: error.message }, 503, origin);
      }
      return json({ ok: false, error: "a2a_innovation_adapter_not_activated" }, 501, origin);
    }

    if (request.method === "POST" && url.pathname === "/internal/pilot/evaluate-baseline") {
      try {
        assertPilotReady(env);
        if (!internalAuthorized(request, env)) return json({ ok: false, error: "not_authorized" }, 401, origin);
        return json({ ok: true, evaluation: evaluateBaselineEligibility(await requestJson(request)) }, 200, origin);
      } catch (error) {
        return json({ ok: false, error: error.message }, error.message === "happiness_pilot_disabled" ? 503 : 400, origin);
      }
    }

    if (request.method === "POST" && url.pathname === "/internal/pilot/evaluate-bonus") {
      try {
        assertPilotReady(env);
        if (!internalAuthorized(request, env)) return json({ ok: false, error: "not_authorized" }, 401, origin);
        const body = await requestJson(request);
        return json({ ok: true, evaluation: evaluateCitizenBonus(body.intent, body.history) }, 200, origin);
      } catch (error) {
        return json({ ok: false, error: error.message }, error.message === "happiness_pilot_disabled" ? 503 : 400, origin);
      }
    }

    if (request.method === "POST" && url.pathname === "/v1/redeem") {
      try {
        assertMutationReady(env);
      } catch (error) {
        return json({ ok: false, error: error.message }, 503, origin);
      }
      return json({ ok: false, error: "polygon_adapter_not_activated" }, 501, origin);
    }

    return json({ ok: false, error: "not_found" }, 404, origin);
  },
};
