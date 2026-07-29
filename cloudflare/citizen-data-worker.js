import { createCitizenDataService } from "./citizen-data-core.js";

const COOKIE_NAME = "__Host-um_citizen_session_v1";
const ALLOWED_ORIGINS = new Set([
  "https://universalmind.tv",
  "https://www.universalmind.tv",
  "https://staging.universalmind.tv",
]);

function enabled(env, key) {
  return String(env?.[key] || "false") === "true";
}

function parseCookie(request) {
  const cookies = request.headers.get("Cookie") || "";
  for (const item of cookies.split(";")) {
    const [name, ...valueParts] = item.trim().split("=");
    if (name === COOKIE_NAME) return decodeURIComponent(valueParts.join("="));
  }
  return "";
}

function response(status, payload, extraHeaders = {}) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, private",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

function errorResponse(error) {
  const code = String(error?.message || "citizen_data_unavailable").split(":")[0];
  if (/active_consent/.test(code)) return response(403, { error: code });
  if (/required|invalid|not_allowed|forbidden|not_published/.test(code)) return response(400, { error: code });
  if (/credential/.test(code)) return response(401, { error: code });
  console.error("Citizen data request failed", { code });
  return response(503, { error: "citizen_data_unavailable" });
}

async function requestJson(request, maxBytes = 32768) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > maxBytes) throw new Error("citizen_data_request_too_large");
  const text = await request.text();
  if (!text || new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new Error("citizen_data_request_invalid");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("citizen_data_request_invalid");
  }
}

function assertTrustedMutation(request) {
  const origin = request.headers.get("Origin") || "";
  const requestOrigin = new URL(request.url).origin;
  if (!ALLOWED_ORIGINS.has(origin) || origin !== requestOrigin) {
    throw new Error("citizen_data_origin_forbidden");
  }
  if (request.headers.get("X-Universal-Mind-Request") !== "citizen-data-v1") {
    throw new Error("citizen_data_request_header_required");
  }
}

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function signBackendBody(secret, timestamp, nonce, body) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}\n${nonce}\n${body}`),
  );
  return bytesToHex(signature);
}

export function createRemoteCitizenDataService(env, backendFetch = fetch) {
  const backendUrl = String(env?.CITIZEN_DATA_BACKEND_URL || "").trim();
  const sharedSecret = String(env?.CITIZEN_DATA_BACKEND_SHARED_SECRET || "").trim();
  if (!backendUrl || !sharedSecret) throw new Error("citizen_data_backend_not_configured");

  async function invoke(operation, credential = "", payload = {}) {
    const body = JSON.stringify({ operation, credential, payload });
    const timestamp = String(Date.now());
    const nonce = crypto.randomUUID();
    const signature = await signBackendBody(sharedSecret, timestamp, nonce, body);
    const backendResponse = await backendFetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Universal-Mind-Edge-Timestamp": timestamp,
        "X-Universal-Mind-Edge-Nonce": nonce,
        "X-Universal-Mind-Edge-Signature": signature,
      },
      body,
      redirect: "error",
    });
    const result = await backendResponse.json().catch(() => ({}));
    if (!backendResponse.ok) throw new Error(result.error || "citizen_data_backend_unavailable");
    return result;
  }

  return Object.freeze({
    consentStatus: (credential) => invoke("consentStatus", credential),
    acceptCoreConsent: (payload) => invoke("acceptCoreConsent", "", payload),
    startSession: (credential, payload) => invoke("startSession", credential, payload),
    recordCheckin: (credential, payload) => invoke("recordCheckin", credential, payload),
    startConversation: (credential, payload) => invoke("startConversation", credential, payload),
    recordConversationTurn: (credential, payload) => invoke("recordConversationTurn", credential, payload),
    requestExport: (credential) => invoke("requestExport", credential),
    requestErasure: (credential) => invoke("requestErasure", credential),
  });
}

export function createCitizenDataWorker({ serviceFactory }) {
  if (typeof serviceFactory !== "function") throw new Error("citizen_data_service_factory_required");

  return {
    async fetch(request, env) {
      if (!enabled(env, "CITIZEN_DATA_ENABLED")) {
        return response(503, { error: "citizen_data_foundation_disabled" });
      }

      const url = new URL(request.url);
      if (request.method === "OPTIONS") return new Response(null, { status: 204 });
      if (env?.CITIZEN_DATA_RATE_LIMITER?.limit) {
        const rateKey = request.headers.get("CF-Connecting-IP") || "unidentified";
        const rate = await env.CITIZEN_DATA_RATE_LIMITER.limit({ key: rateKey });
        if (!rate?.success) return response(429, { error: "citizen_data_rate_limited" });
      }
      const service = await serviceFactory(env);
      const credential = parseCookie(request);

      try {
        if (request.method === "GET" && url.pathname.endsWith("/v1/consent/status")) {
          return response(200, await service.consentStatus(credential));
        }

        assertTrustedMutation(request);

        if (request.method === "POST" && url.pathname.endsWith("/v1/consent/accept")) {
          const accepted = await service.acceptCoreConsent(await requestJson(request));
          return response(201, {
            consent_granted: true,
            consent_document_version: accepted.documentVersion,
            purposes: accepted.purposes,
            expires_at: accepted.expiresAt,
          }, {
            "Set-Cookie": `${COOKIE_NAME}=${encodeURIComponent(accepted.rawCredential)}; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Strict`,
          });
        }

        if (request.method === "POST" && url.pathname.endsWith("/v1/sessions")) {
          return response(201, await service.startSession(credential, await requestJson(request)));
        }

        if (request.method === "POST" && url.pathname.endsWith("/v1/checkins")) {
          return response(202, await service.recordCheckin(credential, await requestJson(request)));
        }

        if (request.method === "POST" && url.pathname.endsWith("/v1/conversations")) {
          return response(201, await service.startConversation(credential, await requestJson(request)));
        }

        if (request.method === "POST" && url.pathname.endsWith("/v1/conversation-turns")) {
          return response(202, await service.recordConversationTurn(credential, await requestJson(request)));
        }

        if (request.method === "POST" && url.pathname.endsWith("/v1/data/export")) {
          return response(202, await service.requestExport(credential));
        }

        if (request.method === "DELETE" && url.pathname.endsWith("/v1/data")) {
          const erased = await service.requestErasure(credential);
          return response(202, erased, {
            "Set-Cookie": `${COOKIE_NAME}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict`,
          });
        }

        return response(404, { error: "citizen_data_route_not_found" });
      } catch (error) {
        return errorResponse(error);
      }
    },
  };
}

export default createCitizenDataWorker({ serviceFactory: createRemoteCitizenDataService });

export { COOKIE_NAME, createCitizenDataService };
