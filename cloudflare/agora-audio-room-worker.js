const DEFAULT_CHANNEL_NAME = "Chillout Pod";
const DEFAULT_TOKEN_TTL_SECONDS = 3600;

const allowedOrigins = new Set([
  "https://universalmind.tv",
  "https://www.universalmind.tv",
  "http://127.0.0.1:8126",
  "http://localhost:8126",
  "http://127.0.0.1:8125",
  "http://localhost:8125",
  "http://127.0.0.1:5191",
  "http://localhost:5191",
]);

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = origin && allowedOrigins.has(origin) ? origin : "https://universalmind.tv";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function jsonResponse(request, status, payload) {
  return Response.json(payload, {
    status,
    headers: {
      ...corsHeaders(request),
      "Cache-Control": "no-store",
    },
  });
}

function cleanString(value, maxLength = 80) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizeRoom(value) {
  return cleanString(value, 80).toLowerCase();
}

async function readBody(request) {
  if (request.method !== "POST") return {};

  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function handleAgoraToken(request, env) {
  if (!["GET", "POST"].includes(request.method)) {
    return jsonResponse(request, 405, { error: "Method not allowed." });
  }

  const url = new URL(request.url);
  const body = await readBody(request);
  const configuredChannel = cleanString(env.AGORA_AUDIO_ROOM_CHANNEL || DEFAULT_CHANNEL_NAME, 80);
  const requestedChannel = cleanString(
    body.channel ||
    body.channelName ||
    url.searchParams.get("channel") ||
    configuredChannel,
    80
  );

  if (normalizeRoom(requestedChannel) !== normalizeRoom(configuredChannel)) {
    return jsonResponse(request, 403, {
      error: "Audio room is not available.",
      allowed_channel: configuredChannel,
    });
  }

  const appId = cleanString(env.AGORA_APP_ID, 64);
  const token = cleanString(env.AGORA_CHILLOUT_POD_RTC_TOKEN, 4096);

  if (!appId || !token) {
    return jsonResponse(request, 503, {
      error: "Agora audio room credentials are not configured.",
      required_secrets: ["AGORA_CHILLOUT_POD_RTC_TOKEN"],
      required_vars: ["AGORA_APP_ID", "AGORA_AUDIO_ROOM_CHANNEL"],
    });
  }

  return jsonResponse(request, 200, {
    app_id: appId,
    channel: configuredChannel,
    token,
    uid: null,
    role: "publisher",
    token_source: "agora_console_temporary_rtc_token",
    token_ttl_seconds: Number(env.AGORA_TOKEN_TTL_SECONDS || DEFAULT_TOKEN_TTL_SECONDS),
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }

    const url = new URL(request.url);
    if (!url.pathname.endsWith("/agora-audio-token")) {
      return jsonResponse(request, 404, { error: "Not found." });
    }

    return handleAgoraToken(request, env);
  },
};
