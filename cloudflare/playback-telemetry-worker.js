const ALLOWED_ORIGINS = new Set([
  "https://staging.universalmind.tv",
  "https://universalmind.tv",
  "https://www.universalmind.tv",
]);

const MAX_BODY_BYTES = 64 * 1024;
const MAX_EVENTS_PER_REQUEST = 40;

function corsHeaders(origin = "") {
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
  if (ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function jsonResponse(body, status = 200, origin = "") {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(origin) },
  });
}

function text(value, maximum = 180) {
  return String(value ?? "").slice(0, maximum);
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function booleanNumber(value) {
  return value ? 1 : 0;
}

function writePlaybackEvent(dataset, event) {
  const sessionId = text(event.session_id, 120) || "anonymous_playback";
  dataset.writeDataPoint({
    indexes: [sessionId],
    blobs: [
      text(event.event_name, 80),
      text(event.role, 20),
      text(event.stream_uid, 80),
      text(event.stream_file, 180),
      text(event.page_path, 180),
      text(event.pause_source, 80),
      text(event.quality_reason, 120),
      text(event.freeze_source, 80),
      text(event.recovery_source, 80),
      text(event.schema_version, 80),
      text(event.broadcast_mode, 40),
      text(event.broadcast_channel_id, 100),
      text(event.programme_instance_id, 160),
      text(event.correction, 80),
      text(event.seek_reason, 80),
      text(event.stream_priority, 40),
      text(event.clock_source, 80),
      text(event.auxiliary_reason, 120),
      text(event.release_reason, 80),
      text(event.transport, 40),
    ],
    doubles: [
      number(event.event_time_ms),
      number(event.current_time),
      number(event.buffer_depth),
      number(event.ready_state),
      number(event.network_state),
      booleanNumber(event.paused),
      number(event.quality_height),
      number(event.quality_cap),
      number(event.bandwidth_estimate),
      number(event.waiting_count),
      number(event.stalled_count),
      number(event.freeze_duration_ms),
      number(event.preload_wait_ms),
      number(event.reveal_wait_ms),
      number(event.buffered_segments),
      number(event.startup_ms),
      number(event.playback_rate),
      number(event.drift_seconds),
      number(event.seek_duration_ms),
      number(event.controller_seek_count),
    ],
  });
}

function writeStructuredLog(event) {
  console.log(JSON.stringify({
    source: "iam_playback_telemetry",
    schema_version: text(event.schema_version, 80),
    event_name: text(event.event_name, 80),
    event_time_ms: number(event.event_time_ms),
    session_id: text(event.session_id, 120),
    page_path: text(event.page_path, 180),
    role: text(event.role, 20),
    stream_uid: text(event.stream_uid, 80),
    stream_file: text(event.stream_file, 180),
    current_time: number(event.current_time),
    buffer_depth: number(event.buffer_depth),
    ready_state: number(event.ready_state),
    network_state: number(event.network_state),
    paused: Boolean(event.paused),
    pause_source: text(event.pause_source, 80),
    quality_height: number(event.quality_height),
    quality_cap: number(event.quality_cap),
    quality_reason: text(event.quality_reason, 120),
    bandwidth_estimate: number(event.bandwidth_estimate),
    waiting_count: number(event.waiting_count),
    stalled_count: number(event.stalled_count),
    freeze_source: text(event.freeze_source, 80),
    freeze_duration_ms: number(event.freeze_duration_ms),
    recovery_source: text(event.recovery_source, 80),
    preload_wait_ms: number(event.preload_wait_ms),
    reveal_wait_ms: number(event.reveal_wait_ms),
    buffered_segments: number(event.buffered_segments),
    startup_ms: number(event.startup_ms),
    playback_rate: number(event.playback_rate),
    drift_seconds: number(event.drift_seconds),
    correction: text(event.correction, 80),
    buffer_before_correction: number(event.buffer_before_correction),
    seeking: Boolean(event.seeking),
    seek_reason: text(event.seek_reason, 80),
    seek_duration_ms: number(event.seek_duration_ms),
    seek_count: number(event.seek_count),
    controller_seek_count: number(event.controller_seek_count),
    broadcast_mode: text(event.broadcast_mode, 40),
    broadcast_channel_id: text(event.broadcast_channel_id, 100),
    programme_instance_id: text(event.programme_instance_id, 160),
    stream_priority: text(event.stream_priority, 40),
    clock_source: text(event.clock_source, 80),
    document_media_count: number(event.document_media_count),
    active_media_count: number(event.active_media_count),
    hidden_active_media_count: number(event.hidden_active_media_count),
    hidden_loading_media_count: number(event.hidden_loading_media_count),
    attached_stream_count: number(event.attached_stream_count),
  }));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      if (!ALLOWED_ORIGINS.has(origin)) return jsonResponse({ ok: false, error: "origin_not_allowed" }, 403, origin);
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse({ ok: true, service: "iam-playback-telemetry", schema: "iam_playback_telemetry_v2" }, 200, origin);
    }

    if (request.method !== "POST" || url.pathname !== "/events") {
      return jsonResponse({ ok: false, error: "not_found" }, 404, origin);
    }
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return jsonResponse({ ok: false, error: "origin_not_allowed" }, 403, origin);
    }
    const declaredLength = Number(request.headers.get("Content-Length") || 0);
    if (declaredLength > MAX_BODY_BYTES) return jsonResponse({ ok: false, error: "payload_too_large" }, 413, origin);

    let payload;
    try {
      const rawBody = await request.text();
      if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
        return jsonResponse({ ok: false, error: "payload_too_large" }, 413, origin);
      }
      payload = JSON.parse(rawBody);
    } catch {
      return jsonResponse({ ok: false, error: "invalid_json" }, 400, origin);
    }

    const events = Array.isArray(payload?.events) ? payload.events.slice(0, MAX_EVENTS_PER_REQUEST) : [];
    if (!events.length) return jsonResponse({ ok: false, error: "events_required" }, 400, origin);

    let accepted = 0;
    for (const event of events) {
      if (!event || typeof event !== "object" || !text(event.event_name, 80)) continue;
      writeStructuredLog(event);
      if (env.PLAYBACK_TELEMETRY?.writeDataPoint) writePlaybackEvent(env.PLAYBACK_TELEMETRY, event);
      accepted += 1;
    }
    return jsonResponse({ ok: true, accepted }, 202, origin);
  },
};
