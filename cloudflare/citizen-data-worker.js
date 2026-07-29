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
  if (!ALLOWED_ORIGINS.has(origin)) throw new Error("citizen_data_origin_forbidden");
  if (request.headers.get("X-Universal-Mind-Request") !== "citizen-data-v1") {
    throw new Error("citizen_data_request_header_required");
  }
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

const disabledServiceFactory = async () => {
  throw new Error("citizen_data_runtime_not_configured");
};

export default createCitizenDataWorker({ serviceFactory: disabledServiceFactory });

export { COOKIE_NAME, createCitizenDataService };
