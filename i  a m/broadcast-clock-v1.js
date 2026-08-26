(function () {
  const SCHEDULE_URL = "broadcast-schedule-v1.json?v=broadcast-schedule-ccf5eddadd7b";
  const CLOCK_URL = "api/broadcast-clock.php";
  const CLOCK_PROBES = 3;
  const CLOCK_RESYNC_INTERVAL_MS = 60000;
  const CLOCK_SMOOTHING_FACTOR = .25;
  const CLOCK_MAX_SMOOTHING_STEP_MS = 120;
  const requestedQaOffsetSeconds = Number(new URLSearchParams(window.location.search).get("broadcast_qa_offset_seconds"));
  const qaOffsetSeconds = window.location.hostname === "staging.universalmind.tv" && Number.isFinite(requestedQaOffsetSeconds)
    ? Math.max(-3600, Math.min(3600, requestedQaOffsetSeconds))
    : 0;
  let schedule = null;
  let clockOffsetMs = 0;
  let clockSource = "device_fallback";
  let clockRoundTripMs = null;
  let clockAnchorServerMs = Date.now();
  let clockAnchorPerformanceMs = window.performance?.now?.() || 0;
  let clockLastSynchronizedAt = 0;
  let clockResyncTimer = 0;

  function positiveModulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function normalizedChannel(channel, scheduleEpochMs) {
    const entries = Array.isArray(channel?.schedule) ? channel.schedule : [];
    const channelMediaType = ["audio", "radio", "fashion"].includes(channel?.media_type) ? channel.media_type : "video";
    const available = channel?.available !== false;
    const normalizedEntries = entries.map((entry) => {
      const mediaType = ["audio", "radio", "fashion", "video"].includes(entry?.media_type)
        ? entry.media_type
        : channelMediaType;
      const trackId = String(entry.track_id || "");
      const stationId = String(entry.station_id || "");
      const runwayId = String(entry.runway_id || "");
      return {
        mediaId: mediaType === "radio" ? stationId : mediaType === "fashion" ? runwayId : trackId,
        mediaType,
        trackId,
        stationId,
        runwayId,
        durationSeconds: Number(entry.duration_seconds),
      };
    });
    const cycleSeconds = normalizedEntries.reduce((sum, entry) => sum + entry.durationSeconds, 0);
    const requestedEpochMs = Date.parse(channel?.epoch_utc || "");
    const epochMs = Number.isFinite(requestedEpochMs) ? requestedEpochMs : scheduleEpochMs;
    if (
      !channel?.id ||
      !channel?.format ||
      !channel?.energy_id ||
      !channel?.name ||
      (available && (!normalizedEntries.length || !Number.isFinite(cycleSeconds) || cycleSeconds <= 0))
    ) {
      throw new Error("Invalid broadcast channel schedule.");
    }
    if (normalizedEntries.some((entry) => !entry.mediaId || !Number.isFinite(entry.durationSeconds) || entry.durationSeconds <= 0)) {
      throw new Error(`Invalid broadcast entry in ${channel.id}.`);
    }
    return {
      id: channel.id,
      format: channel.format,
      mediaType: channelMediaType,
      available,
      energyId: channel.energy_id,
      editorialId: channel.editorial_id || channel.id,
      name: channel.name,
      descriptor: channel.descriptor || "",
      description: channel.description || "",
      visualChannelId: channel.visual_channel_id || "",
      epochMs,
      entries: normalizedEntries,
      cycleSeconds,
    };
  }

  function normalizeSchedule(payload) {
    const epochMs = Date.parse(payload?.epoch_utc || "");
    if (!Number.isFinite(epochMs)) throw new Error("Invalid broadcast epoch.");
    const channels = (Array.isArray(payload?.channels) ? payload.channels : [])
      .map((channel) => normalizedChannel(channel, epochMs));
    if (!channels.length) throw new Error("Broadcast schedule contains no channels.");
    return {
      version: payload.version || "broadcast_schedule_v1",
      stage: payload.stage || "",
      epochMs,
      planningMarkets: (Array.isArray(payload.planning_markets) ? payload.planning_markets : [])
        .map((market) => typeof market === "string"
          ? { name: market, timeZone: "" }
          : { name: String(market?.name || ""), timeZone: String(market?.time_zone || "") })
        .filter((market) => market.name),
      channels,
    };
  }

  async function probeClock() {
    const startedAt = Date.now();
    const startedPerformanceAt = window.performance?.now?.() || 0;
    const response = await fetch(`${CLOCK_URL}?probe=${startedAt}`, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    const endedAt = Date.now();
    const endedPerformanceAt = window.performance?.now?.() || startedPerformanceAt;
    if (!response.ok) throw new Error(`Broadcast clock request failed (${response.status}).`);
    const payload = await response.json();
    const serverNowMs = Number(payload?.server_now_ms);
    if (!Number.isFinite(serverNowMs)) throw new Error("Broadcast clock response is invalid.");
    return {
      offsetMs: serverNowMs - ((startedAt + endedAt) / 2),
      roundTripMs: Math.max(0, endedPerformanceAt - startedPerformanceAt),
    };
  }

  function monotonicClientNowMs() {
    const performanceNow = window.performance?.now?.();
    if (!Number.isFinite(performanceNow)) return Date.now() + clockOffsetMs;
    return clockAnchorServerMs + (performanceNow - clockAnchorPerformanceMs);
  }

  function publishClockDiagnostics() {
    document.body.dataset.broadcastClockSource = clockSource;
    document.body.dataset.broadcastClockOffsetMs = clockOffsetMs.toFixed(1);
    document.body.dataset.broadcastClockAnchor = "performance_monotonic";
    document.body.dataset.broadcastClockLastSyncMs = String(clockLastSynchronizedAt || 0);
    if (clockRoundTripMs !== null) {
      document.body.dataset.broadcastClockRoundTripMs = clockRoundTripMs.toFixed(1);
    }
  }

  async function synchronizeClock() {
    const results = await Promise.allSettled(
      Array.from({ length: CLOCK_PROBES }, () => probeClock())
    );
    const successful = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value)
      .sort((a, b) => a.roundTripMs - b.roundTripMs);
    if (!successful.length) return false;
    const sample = successful[0];
    const performanceNow = window.performance?.now?.() || 0;
    const sampledServerNowMs = Date.now() + sample.offsetMs;
    if (clockSource === "device_fallback") {
      clockAnchorServerMs = sampledServerNowMs;
    } else {
      const currentServerNowMs = monotonicClientNowMs();
      const requestedCorrectionMs = (sampledServerNowMs - currentServerNowMs) * CLOCK_SMOOTHING_FACTOR;
      const appliedCorrectionMs = Math.max(
        -CLOCK_MAX_SMOOTHING_STEP_MS,
        Math.min(CLOCK_MAX_SMOOTHING_STEP_MS, requestedCorrectionMs)
      );
      clockAnchorServerMs = currentServerNowMs + appliedCorrectionMs;
    }
    clockAnchorPerformanceMs = performanceNow;
    clockOffsetMs = clockAnchorServerMs - Date.now();
    clockRoundTripMs = sample.roundTripMs;
    clockSource = "server_midpoint_monotonic";
    clockLastSynchronizedAt = Date.now();
    publishClockDiagnostics();
    return true;
  }

  function nowMs() {
    return monotonicClientNowMs() + (qaOffsetSeconds * 1000);
  }

  function startClockResynchronization() {
    if (clockResyncTimer) window.clearInterval(clockResyncTimer);
    clockResyncTimer = window.setInterval(() => {
      synchronizeClock().catch(() => null);
    }, CLOCK_RESYNC_INTERVAL_MS);
  }

  function channelForId(channelId) {
    return schedule?.channels.find((channel) => channel.id === channelId) || null;
  }

  function stateAt(channelId, requestedNowMs = nowMs()) {
    if (!schedule) return null;
    const channel = channelForId(channelId);
    if (!channel?.available) return null;
    const elapsedSeconds = (Number(requestedNowMs) - channel.epochMs) / 1000;
    const cycleIndex = Math.floor(elapsedSeconds / channel.cycleSeconds);
    const cyclePositionSeconds = positiveModulo(elapsedSeconds, channel.cycleSeconds);
    let cursor = 0;
    let entryIndex = 0;
    for (let index = 0; index < channel.entries.length; index += 1) {
      const nextCursor = cursor + channel.entries[index].durationSeconds;
      if (cyclePositionSeconds < nextCursor || index === channel.entries.length - 1) {
        entryIndex = index;
        break;
      }
      cursor = nextCursor;
    }
    const entry = channel.entries[entryIndex];
    const previousEntry = channel.entries[(entryIndex - 1 + channel.entries.length) % channel.entries.length];
    const nextEntry = channel.entries[(entryIndex + 1) % channel.entries.length];
    const offsetSeconds = Math.max(0, Math.min(entry.durationSeconds - 0.05, cyclePositionSeconds - cursor));
    const programmeStartMs = Math.round(channel.epochMs + ((cycleIndex * channel.cycleSeconds + cursor) * 1000));
    const programmeInstanceId = `${channel.id}.${entryIndex}.${programmeStartMs}`;
    return {
      channelId: channel.id,
      format: channel.format,
      mediaType: entry.mediaType,
      available: channel.available,
      energyId: channel.energyId,
      editorialId: channel.editorialId,
      channelName: channel.name,
      channelDescriptor: channel.descriptor,
      channelDescription: channel.description,
      visualChannelId: channel.visualChannelId,
      mediaId: entry.mediaId,
      trackId: entry.trackId,
      stationId: entry.stationId,
      runwayId: entry.runwayId,
      durationSeconds: entry.durationSeconds,
      offsetSeconds,
      remainingSeconds: Math.max(0, entry.durationSeconds - offsetSeconds),
      previousMediaId: previousEntry.mediaId,
      previousTrackId: previousEntry.trackId,
      previousStationId: previousEntry.stationId,
      previousRunwayId: previousEntry.runwayId,
      nextMediaId: nextEntry.mediaId,
      nextTrackId: nextEntry.trackId,
      nextStationId: nextEntry.stationId,
      nextRunwayId: nextEntry.runwayId,
      entryIndex,
      cycleIndex,
      cyclePositionSeconds,
      cycleSeconds: channel.cycleSeconds,
      programmeStartMs,
      programmeInstanceId,
      serverNowMs: Number(requestedNowMs),
    };
  }

  function channelForTrack(trackId) {
    if (!schedule) return null;
    return schedule.channels.find((channel) => channel.entries.some((entry) => entry.trackId === trackId)) || null;
  }

  function channelForMedia(mediaId, format = "") {
    if (!schedule) return null;
    return schedule.channels.find((channel) => (
      (!format || channel.format === format) &&
      channel.entries.some((entry) => entry.mediaId === mediaId)
    )) || null;
  }

  async function initialize() {
    const scheduleResponse = await fetch(SCHEDULE_URL, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!scheduleResponse.ok) throw new Error(`Broadcast schedule request failed (${scheduleResponse.status}).`);
    schedule = normalizeSchedule(await scheduleResponse.json());
    await synchronizeClock().catch(() => null);
    startClockResynchronization();
    document.body.dataset.broadcastClockState = "ready";
    publishClockDiagnostics();
    if (qaOffsetSeconds) document.body.dataset.broadcastClockQaOffsetSeconds = qaOffsetSeconds.toFixed(3);
    window.dispatchEvent(new CustomEvent("iam:broadcast-clock-ready", {
      detail: { version: schedule.version, clockSource },
    }));
    return api;
  }

  const api = {
    version: "broadcast_clock_v1.3",
    ready: null,
    nowMs,
    stateAt,
    channelForTrack,
    channelForMedia,
    channels(format = "") {
      return schedule?.channels
        .filter((channel) => !format || channel.format === format)
        .map((channel) => ({
        id: channel.id,
        format: channel.format,
        mediaType: channel.mediaType,
        available: channel.available,
        energyId: channel.energyId,
        editorialId: channel.editorialId,
        name: channel.name,
        descriptor: channel.descriptor,
        description: channel.description,
        visualChannelId: channel.visualChannelId,
        cycleSeconds: channel.cycleSeconds,
        trackIds: channel.entries.map((entry) => entry.trackId),
        stationIds: channel.entries.map((entry) => entry.stationId),
        runwayIds: channel.entries.map((entry) => entry.runwayId),
        mediaIds: channel.entries.map((entry) => entry.mediaId),
      })) || [];
    },
    diagnostics() {
      return {
        ready: Boolean(schedule),
        scheduleVersion: schedule?.version || "",
        stage: schedule?.stage || "",
        epochMs: schedule?.epochMs || null,
        planningMarkets: schedule?.planningMarkets || [],
        clockSource,
        clockOffsetMs,
        clockRoundTripMs,
        clockAnchor: "performance_monotonic",
        clockLastSynchronizedAt,
        clockResyncIntervalMs: CLOCK_RESYNC_INTERVAL_MS,
        qaOffsetSeconds,
      };
    },
  };

  window.IAMBroadcastClock = api;
  window.addEventListener("pagehide", () => {
    if (clockResyncTimer) window.clearInterval(clockResyncTimer);
    clockResyncTimer = 0;
  }, { once: true });
  document.body.dataset.broadcastClockState = "loading";
  api.ready = initialize().catch((error) => {
    document.body.dataset.broadcastClockState = "error";
    document.body.dataset.broadcastClockError = String(error?.message || error).slice(0, 160);
    return api;
  });
}());
