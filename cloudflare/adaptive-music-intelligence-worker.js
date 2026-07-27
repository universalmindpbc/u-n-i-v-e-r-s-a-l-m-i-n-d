const DEFAULT_MAX_RESULTS = 8;
const CYANITE_GRAPHQL_URL = "https://api.cyanite.ai/graphql";
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";

const allowedOrigins = new Set([
  "https://universalmind.tv",
  "https://www.universalmind.tv",
  "https://staging.universalmind.tv",
  "http://127.0.0.1:8126",
  "http://localhost:8126",
  "http://127.0.0.1:5191",
  "http://localhost:5191",
]);

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = origin && allowedOrigins.has(origin) ? origin : "https://universalmind.tv";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

function cleanString(value, maxLength = 180) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanArray(value, maxItems = 8) {
  return Array.isArray(value)
    ? value.map((item) => cleanString(item, 64)).filter(Boolean).slice(0, maxItems)
    : [];
}

function buildMusicQuery(body) {
  const checkin = cleanString(body.checkin || body.citizen_checkin || "", 160);
  const inference = body.inference && typeof body.inference === "object" ? body.inference : {};
  const environmentFunction = body.environment_function && typeof body.environment_function === "object"
    ? body.environment_function
    : {};
  const context = body.environment_context && typeof body.environment_context === "object"
    ? body.environment_context
    : {};
  const needs = cleanArray(inference.top_needs_used || inference.highlights || body.top_needs, 4);
  const requestedMusicRoom = cleanString(inference.selected_music_room || body.music_room || "", 32).toLowerCase();
  const allowedMusicRooms = new Set(["inner-planes", "champagne-bohemia", "modul8-infinity", "james-bondage", "safety-cushion"]);
  const musicRoom = allowedMusicRooms.has(requestedMusicRoom) ? requestedMusicRoom : "";
  const primaryFunction = cleanString(environmentFunction.primary_function || "Soul + Restoration", 80);
  const location = cleanString(context.location_label, 64);
  const weather = cleanString(context.weather_condition, 40);

  return {
    q: [
      "official music video",
      "electronic dance music",
      musicRoom,
      primaryFunction,
      ...needs,
      location,
      weather,
      checkin,
    ].filter(Boolean).join(" "),
    needs,
    music_room: musicRoom,
    primary_function: primaryFunction,
  };
}

function buildProviderPlan(body) {
  const musicQuery = buildMusicQuery(body);

  return {
    feature_version: "adaptive_music_intelligence_v0.1",
    priority_order: [
      "universal_mind_seed_catalogue",
      "trusted_catalogue",
      "gracenote",
      "cyanite_fallback",
      "musixmatch_lyric_safety",
      "youtube_data_api",
      "gpt_editorial_review",
    ],
    provider_queries: {
      gracenote: {
        status: "requires_licensed_adapter",
        role: "primary genre, mood, style and artist relationship metadata",
        query: {
          genre: ["electronic", "dance"],
          mood: musicQuery.needs,
          style: [musicQuery.music_room, musicQuery.primary_function].filter(Boolean),
        },
        call_policy: "server_side_only_when_GRACENOTE_credentials_and_contract_endpoint_are_configured",
      },
      cyanite: {
        status: "ready_when_CYANITE_ACCESS_TOKEN_and_catalogue_audio_records_are_configured",
        role: "contingency metadata and audio similarity if Gracenote fails",
        query: {
          mood: musicQuery.needs,
          energy: cleanString(body.environment_function?.intensity || "variable", 24),
          emotional_function: musicQuery.primary_function,
        },
        call_policy: "server_side_graphql; use with authorised catalogue tracks, not scraped YouTube audio",
      },
      musixmatch: {
        status: "ready_when_MUSIXMATCH_API_KEY_is_configured",
        role: "lyric context, youth appropriateness and emotional trajectory review",
        query: {
          candidate_pool: "post-metadata shortlist",
          avoid: ["graphic self-harm", "hate", "explicit violence", "despair_without_movement"],
          prefer: ["hope", "connection", "agency", "awe"],
        },
        call_policy: "server_side_only; return safety metadata, not full lyrics unless licensed for display",
      },
      youtube: {
        status: "ready_when_YOUTUBE_API_KEY_is_configured",
        role: "official video discovery and embeddability validation",
        search_list_query: {
          part: "snippet",
          type: "video",
          videoCategoryId: "10",
          videoEmbeddable: "true",
          videoSyndicated: "true",
          safeSearch: "strict",
          order: "relevance",
          relevanceLanguage: "en",
          topicId: "/m/02lkt",
          maxResults: DEFAULT_MAX_RESULTS,
          q: musicQuery.q,
        },
      },
    },
  };
}

function providerCredentialAudit(env) {
  return {
    gracenote: {
      configured: Boolean(env.GRACENOTE_API_KEY || (env.GRACENOTE_CLIENT_ID && env.GRACENOTE_CLIENT_TAG)),
      call_attempted: false,
      status: "requires_licensed_adapter",
      reason: "No Gracenote contract-specific endpoint/adapter is configured in this worker.",
    },
    cyanite: {
      configured: Boolean(env.CYANITE_ACCESS_TOKEN),
      call_attempted: Boolean(env.CYANITE_ACCESS_TOKEN),
      status: env.CYANITE_ACCESS_TOKEN ? "credential_test_attempted" : "missing_credentials",
      reason: env.CYANITE_ACCESS_TOKEN
        ? "Credential test can run; catalogue/audio matching still requires authorised Cyanite library records."
        : "CYANITE_ACCESS_TOKEN is not configured.",
    },
    musixmatch: {
      configured: Boolean(env.MUSIXMATCH_API_KEY),
      call_attempted: false,
      status: env.MUSIXMATCH_API_KEY ? "adapter_pending" : "missing_credentials",
      reason: env.MUSIXMATCH_API_KEY
        ? "API key exists, but the lyrics safety adapter is not implemented yet."
        : "MUSIXMATCH_API_KEY is not configured.",
    },
    youtube_api: {
      configured: Boolean(env.YOUTUBE_API_KEY),
      call_attempted: Boolean(env.YOUTUBE_API_KEY),
      status: env.YOUTUBE_API_KEY ? "candidate_search_attempted" : "missing_credentials",
      reason: env.YOUTUBE_API_KEY
        ? "YouTube Data API search/list validation will run."
        : "YOUTUBE_API_KEY is not configured.",
    },
  };
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Request failed with ${response.status}`);
  }
  return payload;
}

async function searchYouTube(body, env) {
  if (!env.YOUTUBE_API_KEY) {
    return {
      status: "unavailable",
      reason: "YOUTUBE_API_KEY is not configured.",
      candidates: [],
    };
  }

  const providerPlan = buildProviderPlan(body);
  const searchParams = new URLSearchParams({
    ...providerPlan.provider_queries.youtube.search_list_query,
    key: env.YOUTUBE_API_KEY,
  });
  const searchPayload = await fetchJson(`${YOUTUBE_SEARCH_URL}?${searchParams.toString()}`);
  const videoIds = (searchPayload.items || [])
    .map((item) => item.id?.videoId)
    .filter(Boolean)
    .slice(0, DEFAULT_MAX_RESULTS);

  if (!videoIds.length) {
    return {
      status: "used",
      reason: "No YouTube music-video candidates returned.",
      candidates: [],
    };
  }

  const videosParams = new URLSearchParams({
    part: "snippet,status,contentDetails",
    id: videoIds.join(","),
    key: env.YOUTUBE_API_KEY,
  });
  const videosPayload = await fetchJson(`${YOUTUBE_VIDEOS_URL}?${videosParams.toString()}`);
  const byId = new Map((videosPayload.items || []).map((item) => [item.id, item]));

  return {
    status: "used",
    candidates: videoIds.map((videoId) => {
      const details = byId.get(videoId) || {};
      return {
        youtube_video_id: videoId,
        title: details.snippet?.title || null,
        channel_title: details.snippet?.channelTitle || null,
        published_at: details.snippet?.publishedAt || null,
        youtube_embed_status: details.status?.embeddable ? "api_confirmed" : "not_embeddable",
        privacy_status: details.status?.privacyStatus || null,
        duration: details.contentDetails?.duration || null,
        source_priority: "youtube_search",
      };
    }),
  };
}

async function testCyaniteCredentials(env) {
  if (!env.CYANITE_ACCESS_TOKEN) {
    return {
      status: "missing_credentials",
      call_attempted: false,
      reason: "CYANITE_ACCESS_TOKEN is not configured.",
    };
  }

  const payload = await fetchJson(CYANITE_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.CYANITE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      query: "query AdaptiveMusicCyaniteCredentialCheck { libraryTracks(first: 1) { edges { node { id } } } }",
    }),
  });

  return {
    status: "credential_test_used",
    call_attempted: true,
    available_library_tracks: payload?.data?.libraryTracks?.edges?.length || 0,
    reason: "Cyanite credential check succeeded. Candidate matching still requires authorised catalogue/audio records.",
  };
}

async function handleMusicIntelligence(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request),
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(request, 405, { error: "Method not allowed." });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(request, 400, { error: "Invalid JSON request." });
  }

  const providerPlan = buildProviderPlan(body);
  const credentialAudit = providerCredentialAudit(env);
  let cyaniteResult;
  try {
    cyaniteResult = await testCyaniteCredentials(env);
  } catch (error) {
    cyaniteResult = {
      status: "failed",
      call_attempted: true,
      reason: error.message,
    };
  }

  let youtubeResult;
  try {
    youtubeResult = await searchYouTube(body, env);
  } catch (error) {
    youtubeResult = {
      status: "failed",
      reason: error.message,
      candidates: [],
    };
  }

  return jsonResponse(request, 200, {
    feature_version: "adaptive_music_intelligence_v0.1",
    generated_at: new Date().toISOString(),
    provider_plan: providerPlan,
    provider_credential_audit: credentialAudit,
    music_metadata_sources: {
      gracenote: credentialAudit.gracenote.status,
      cyanite: cyaniteResult.status,
      musixmatch: credentialAudit.musixmatch.status,
      youtube_api: youtubeResult.status,
    },
    gracenote_result: {
      status: credentialAudit.gracenote.status,
      call_attempted: false,
      reason: credentialAudit.gracenote.reason,
    },
    cyanite_result: cyaniteResult,
    musixmatch_result: {
      status: credentialAudit.musixmatch.status,
      call_attempted: false,
      reason: credentialAudit.musixmatch.reason,
    },
    youtube_result: youtubeResult,
    editorial_review_status: "client_or_gpt_review_required",
    rule: "YouTube may suggest. Universal Mind decides.",
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.endsWith("/adaptive-music-intelligence")) {
      return jsonResponse(request, 404, { error: "Not found." });
    }

    return handleMusicIntelligence(request, env);
  },
};
