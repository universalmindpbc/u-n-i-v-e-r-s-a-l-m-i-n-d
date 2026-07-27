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
        },
        reserve: reserveState(env),
        oracle: {
          provider: HAPPINESS_ARCHITECTURE.oracle.provider,
          purpose: HAPPINESS_ARCHITECTURE.oracle.purpose,
          evidence_policy: HAPPINESS_ARCHITECTURE.oracle.evidencePolicy,
          evidence_origin: HAPPINESS_ARCHITECTURE.oracle.evidenceOrigin,
          triall_adapter: HAPPINESS_ARCHITECTURE.oracle.triallAdapterMode,
          enabled: String(env.HAPPINESS_CHAINLINK_ENABLED || "false") === "true",
          don_configured: Boolean(env.HAPPINESS_CHAINLINK_DON_ID),
          subscription_configured: Boolean(env.HAPPINESS_CHAINLINK_SUBSCRIPTION_ID),
          source_pinned: Boolean(env.HAPPINESS_CHAINLINK_SOURCE_HASH),
          consumer_configured: Boolean(env.HAPPINESS_ORACLE_CONSUMER_ADDRESS),
        },
        collective_emissions: {
          mode: HAPPINESS_ARCHITECTURE.emissions.mode,
          enabled: String(env.HAPPINESS_COLLECTIVE_EMISSIONS_ENABLED || "false") === "true",
          thresholds_configured: Boolean(env.HAPPINESS_COLLECTIVE_MIN_UNIQUE_CHECKINS && env.HAPPINESS_COLLECTIVE_MIN_CONTINUITY_BPS),
          caps_configured: Boolean(env.HAPPINESS_COLLECTIVE_EPOCH_MINT_UNITS && env.HAPPINESS_COLLECTIVE_WEEKLY_CAP_UNITS && env.HAPPINESS_COLLECTIVE_TOTAL_CAP_UNITS),
          treasury_configured: Boolean(env.HAPPINESS_COMMUNITY_TREASURY_ADDRESS),
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
          update_service_enabled: false,
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
