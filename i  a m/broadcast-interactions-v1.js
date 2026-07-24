(() => {
  "use strict";

  const endpointMeta = document.querySelector('meta[name="iam-broadcast-interaction-endpoint"]');
  const endpoint = String(window.IAM_BROADCAST_INTERACTION_ENDPOINT || endpointMeta?.content || "api/broadcast-interactions.php");
  const SHARED_FORMATS = new Set(["videos", "parties", "radio"]);
  const ALLOWED_BLOOMS = new Set(["flora", "daisy", "aboriginal", "trans", "dove", "medallion"]);
  const STALE_EVENT_MS = 1200;
  const MANTRA_STALE_EVENT_MS = 2500;
  const REMOTE_MANTRA_JITTER_BUFFER_MS = 75;
  const REMOTE_MANTRA_MIN_LEAD_MS = 25;
  const REMOTE_MANTRA_BURST_RESET_MS = 1600;
  const POLL_INTERVAL_MS = 100;
  const POLL_MAX_BACKOFF_MS = 4000;
  const recentEventIds = new Map();
  const locallyRenderedEventIds = new Map();
  let activeState = null;
  let activeKey = "";
  let cursor = 0;
  let generation = 0;
  let pollTimer = 0;
  let pollFailures = 0;
  let activeRequest = null;
  let receivedBlooms = 0;
  let receivedMantras = 0;
  let rejectedInteractions = 0;
  let suppressedLocalEchoes = 0;
  let lastEvent = null;
  let lastRemoteMantraCueMs = 0;
  let lastRemoteMantraTargetMs = 0;

  function makeId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    const values = new Uint32Array(4);
    window.crypto?.getRandomValues?.(values);
    return Array.from(values, (value) => value.toString(16).padStart(8, "0")).join("-");
  }

  function sessionId() {
    const key = "iamBroadcastInteractionSessionV1";
    try {
      const existing = window.sessionStorage.getItem(key);
      if (existing) return existing;
      const created = makeId();
      window.sessionStorage.setItem(key, created);
      return created;
    } catch {
      return makeId();
    }
  }

  const clientSessionId = sessionId();

  function serverNowMs() {
    return Number(window.IAMBroadcastClock?.nowMs?.()) || Date.now();
  }

  function cleanState(state) {
    if (!state || !SHARED_FORMATS.has(state.format)) return null;
    const channelId = String(state.channelId || "");
    const programmeId = String(state.mediaId || "");
    const programmeInstanceId = String(state.programmeInstanceId || "");
    const programmeStartMs = Number(state.programmeStartMs);
    if (!channelId || !programmeId || !programmeInstanceId || !Number.isFinite(programmeStartMs)) return null;
    return {
      channelId,
      format: state.format,
      programmeId,
      programmeInstanceId,
      programmeStartMs,
    };
  }

  function stateKey(state) {
    return state ? `${state.channelId}|${state.programmeInstanceId}` : "";
  }

  function endpointUrl() {
    return new URL(endpoint, window.location.href);
  }

  function updateDataset(state = "idle") {
    document.body.dataset.broadcastInteractionState = state;
    document.body.dataset.broadcastInteractionChannel = activeState?.channelId || "";
    document.body.dataset.broadcastInteractionProgramme = activeState?.programmeId || "";
  }

  function pruneRecentEvents(now = Date.now()) {
    recentEventIds.forEach((at, id) => {
      if (now - at > 120000) recentEventIds.delete(id);
    });
    locallyRenderedEventIds.forEach((at, id) => {
      if (now - at > 120000) locallyRenderedEventIds.delete(id);
    });
  }

  function eventIsNew(message) {
    const eventId = String(message?.event_id || "");
    if (!eventId) return true;
    pruneRecentEvents();
    if (recentEventIds.has(eventId)) return false;
    recentEventIds.set(eventId, Date.now());
    return true;
  }

  function eventIsLocalEcho(message) {
    const sourceEventIds = Array.isArray(message?.source_event_ids) ? message.source_event_ids : [];
    const localEcho = sourceEventIds.some((eventId) => locallyRenderedEventIds.has(String(eventId || "")));
    if (localEcho) suppressedLocalEchoes += 1;
    return localEcho;
  }

  function scheduleBloom(message) {
    const playAt = Number(message.cue_at_ms ?? message.server_play_at_ms);
    if (!Number.isFinite(playAt) || playAt < serverNowMs() - STALE_EVENT_MS) return;
    const delay = Math.max(0, playAt - serverNowMs());
    window.setTimeout(() => {
      receivedBlooms += 1;
      lastEvent = {
        type: "bloom",
        assetId: String(message.asset_id || ""),
        receivedAt: Date.now(),
        participants: Math.max(1, Number(message.participant_count) || 1),
      };
      window.dispatchEvent(new CustomEvent("iam:shared-bloom", {
        detail: {
          type: String(message.asset_id || ""),
          density: Math.max(1, Math.min(3, Number(message.density) || 1)),
          participantCount: Math.max(1, Number(message.participant_count) || 1),
          eventId: String(message.event_id || ""),
        },
      }));
    }, delay);
  }

  function scheduleMantra(message) {
    const cueAt = Number(message.cue_at_ms ?? message.server_play_at_ms);
    const now = serverNowMs();
    if (!Number.isFinite(cueAt) || cueAt < now - MANTRA_STALE_EVENT_MS) return;
    const continuesBurst = lastRemoteMantraCueMs > 0
      && cueAt >= lastRemoteMantraCueMs
      && cueAt - lastRemoteMantraCueMs <= REMOTE_MANTRA_BURST_RESET_MS
      && now <= lastRemoteMantraTargetMs + REMOTE_MANTRA_BURST_RESET_MS;
    const playAt = continuesBurst
      ? Math.max(
          now + REMOTE_MANTRA_MIN_LEAD_MS,
          lastRemoteMantraTargetMs + Math.max(0, cueAt - lastRemoteMantraCueMs)
        )
      : now + REMOTE_MANTRA_JITTER_BUFFER_MS;
    lastRemoteMantraCueMs = cueAt;
    lastRemoteMantraTargetMs = playAt;
    receivedMantras += 1;
    lastEvent = {
      type: "mantra",
      assetId: String(message.asset_id || ""),
      receivedAt: Date.now(),
      participants: Math.max(1, Number(message.participant_count) || 1),
    };
    document.body.dataset.mantraRemoteTransportMs = String(Math.max(0, Math.round(now - cueAt)));
    document.body.dataset.mantraRemoteProgrammePositionMs = String(Math.max(0, Number(message.programme_position_ms) || 0));
    window.IAMMantraSampler?.playShared?.(String(message.asset_id || ""), playAt, {
      eventId: String(message.event_id || ""),
      participantCount: Math.max(1, Number(message.participant_count) || 1),
    });
  }

  function consumePayload(payload) {
    const messages = Array.isArray(payload?.events)
      ? payload.events.slice().sort((left, right) => {
          if (left?.type === "shared_mantra" && right?.type === "shared_mantra") {
            const cueDifference = Number(left.cue_at_ms ?? left.server_play_at_ms)
              - Number(right.cue_at_ms ?? right.server_play_at_ms);
            if (Number.isFinite(cueDifference) && cueDifference !== 0) return cueDifference;
          }
          return (Number(left?.sequence) || 0) - (Number(right?.sequence) || 0);
        })
      : [];
    messages.forEach((message) => {
      cursor = Math.max(cursor, Number(message.sequence) || 0);
      if (!eventIsNew(message)) return;
      if (eventIsLocalEcho(message)) return;
      if (message.type === "shared_bloom") scheduleBloom(message);
      if (message.type === "shared_mantra") scheduleMantra(message);
    });
    cursor = Math.max(cursor, Number(payload?.cursor) || 0);
    if (payload?.mantra_mode) document.body.dataset.mantraShareMode = String(payload.mantra_mode);
    if (payload?.outcome) {
      document.body.dataset.broadcastInteractionLastAcknowledgement = `${payload.kind || "interaction"}:${payload.outcome}`;
      window.dispatchEvent(new CustomEvent("iam:shared-interaction-acknowledged", {
        detail: {
          kind: payload.kind,
          outcome: payload.outcome,
          asset_id: payload.asset_id,
        },
      }));
    }
    if (payload?.error) {
      rejectedInteractions += 1;
      document.body.dataset.broadcastInteractionLastRejection = `${payload.kind || "interaction"}:${payload.error}`;
      window.dispatchEvent(new CustomEvent("iam:shared-interaction-rejected", {
        detail: {
          kind: payload.kind,
          reason: payload.error,
        },
      }));
    }
  }

  function requestFields(state = activeState) {
    return {
      channel_id: state?.channelId || "",
      programme_id: state?.programmeId || "",
      programme_instance_id: state?.programmeInstanceId || "",
      session_id: clientSessionId,
      since: cursor,
    };
  }

  async function fetchPayload(method, body = null, signal = null) {
    const url = endpointUrl();
    const options = {
      method,
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal,
    };
    if (method === "GET") {
      Object.entries(requestFields()).forEach(([key, value]) => url.searchParams.set(key, String(value)));
    } else {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify({ ...requestFields(), ...body });
    }
    const response = await fetch(url.toString(), options);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Interaction request failed (${response.status}).`);
    return payload;
  }

  function clearPollTimer() {
    window.clearTimeout(pollTimer);
    pollTimer = 0;
  }

  function schedulePoll(expectedGeneration, delay = POLL_INTERVAL_MS) {
    clearPollTimer();
    if (!activeState || generation !== expectedGeneration) return;
    pollTimer = window.setTimeout(() => void poll(expectedGeneration), delay);
  }

  async function poll(expectedGeneration) {
    if (!activeState || generation !== expectedGeneration) return;
    const controller = new AbortController();
    activeRequest = controller;
    try {
      const payload = await fetchPayload("GET", null, controller.signal);
      if (!activeState || generation !== expectedGeneration) return;
      consumePayload(payload);
      pollFailures = 0;
      updateDataset("connected");
      window.IAMMantraSampler?.armSharedAudio?.();
      schedulePoll(expectedGeneration);
    } catch (error) {
      if (error?.name === "AbortError" || !activeState || generation !== expectedGeneration) return;
      pollFailures += 1;
      updateDataset("error");
      document.body.dataset.broadcastInteractionError = String(error?.message || error).slice(0, 160);
      schedulePoll(expectedGeneration, Math.min(POLL_MAX_BACKOFF_MS, POLL_INTERVAL_MS * (2 ** pollFailures)));
    } finally {
      if (activeRequest === controller) activeRequest = null;
    }
  }

  function setBroadcast(state) {
    const nextState = cleanState(state);
    if (!nextState) {
      clear("unsupported_or_personal");
      return false;
    }
    const nextKey = stateKey(nextState);
    if (nextKey === activeKey && activeState) return true;
    activeRequest?.abort();
    activeState = nextState;
    activeKey = nextKey;
    cursor = 0;
    pollFailures = 0;
    lastRemoteMantraCueMs = 0;
    lastRemoteMantraTargetMs = 0;
    generation += 1;
    updateDataset("connecting");
    window.IAMMantraSampler?.armSharedAudio?.();
    void poll(generation);
    return true;
  }

  function clear() {
    activeRequest?.abort();
    activeRequest = null;
    activeState = null;
    activeKey = "";
    cursor = 0;
    pollFailures = 0;
    lastRemoteMantraCueMs = 0;
    lastRemoteMantraTargetMs = 0;
    generation += 1;
    clearPollTimer();
    updateDataset("idle");
  }

  function send(type, assetId, { renderedLocally = false, payload = {} } = {}) {
    if (!activeState) return false;
    const expectedGeneration = generation;
    const eventId = makeId();
    if (renderedLocally) locallyRenderedEventIds.set(eventId, Date.now());
    void fetchPayload("POST", {
      type,
      asset_id: assetId,
      event_id: eventId,
      ...payload,
    }).then((payload) => {
      if (activeState && generation === expectedGeneration) consumePayload(payload);
    }).catch((error) => {
      if (!activeState || generation !== expectedGeneration) return;
      updateDataset("error");
      document.body.dataset.broadcastInteractionError = String(error?.message || error).slice(0, 160);
    });
    return true;
  }

  function sendBloom(type) {
    const assetId = String(type || "");
    const cueAt = serverNowMs();
    return ALLOWED_BLOOMS.has(assetId) && send("bloom", assetId, {
      renderedLocally: true,
      payload: { cue_at_ms: Math.round(cueAt) },
    });
  }

  function sendMantra(mantraId) {
    const cueAt = serverNowMs();
    return send("mantra", String(mantraId || ""), {
      renderedLocally: true,
      payload: {
        cue_at_ms: Math.round(cueAt),
        programme_position_ms: Math.max(0, Math.round(cueAt - Number(activeState?.programmeStartMs || cueAt))),
      },
    });
  }

  window.addEventListener("pagehide", () => clear());

  window.IAMBroadcastInteractions = {
    version: "broadcast_interactions_client_v1.3",
    setBroadcast,
    clear,
    sendBloom,
    sendMantra,
    diagnostics() {
      return {
        configured: Boolean(endpoint),
        transport: "same_origin_fast_polling",
        pollIntervalMs: POLL_INTERVAL_MS,
        remoteMantraJitterBufferMs: REMOTE_MANTRA_JITTER_BUFFER_MS,
        state: document.body.dataset.broadcastInteractionState || "idle",
        channelId: activeState?.channelId || "",
        programmeId: activeState?.programmeId || "",
        programmeInstanceId: activeState?.programmeInstanceId || "",
        cursor,
        pollFailures,
        receivedBlooms,
        receivedMantras,
        rejectedInteractions,
        suppressedLocalEchoes,
        lastEvent,
      };
    },
  };

  updateDataset("idle");
})();
