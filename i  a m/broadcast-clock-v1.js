(function () {
  const SCHEDULE_URL = "broadcast-schedule-v1.json?v=broadcast-schedule-v1-1";
  const CLOCK_URL = "api/broadcast-clock.php";
  const CLOCK_PROBES = 3;
  let schedule = null;
  let clockOffsetMs = 0;
  let clockSource = "device_fallback";
  let clockRoundTripMs = null;

  function positiveModulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function normalizedChannel(channel) {
    const entries = Array.isArray(channel?.schedule) ? channel.schedule : [];
    const mediaType = channel?.media_type === "radio" ? "radio" : "video";
    const normalizedEntries = entries.map((entry) => {
      const trackId = String(entry.track_id || "");
      const stationId = String(entry.station_id || "");
      return {
        mediaId: mediaType === "radio" ? stationId : trackId,
        trackId,
        stationId,
        durationSeconds: Number(entry.duration_seconds),
      };
    });
    const cycleSeconds = normalizedEntries.reduce((sum, entry) => sum + entry.durationSeconds, 0);
    if (!channel?.id || !channel?.format || !channel?.energy_id || !channel?.name || !normalizedEntries.length || !Number.isFinite(cycleSeconds) || cycleSeconds <= 0) {
      throw new Error("Invalid broadcast channel schedule.");
    }
    if (normalizedEntries.some((entry) => !entry.mediaId || !Number.isFinite(entry.durationSeconds) || entry.durationSeconds <= 0)) {
      throw new Error(`Invalid broadcast entry in ${channel.id}.`);
    }
    return {
      id: channel.id,
      format: channel.format,
      mediaType,
      energyId: channel.energy_id,
      name: channel.name,
      description: channel.description || "",
      entries: normalizedEntries,
      cycleSeconds,
    };
  }

  function normalizeSchedule(payload) {
    const epochMs = Date.parse(payload?.epoch_utc || "");
    if (!Number.isFinite(epochMs)) throw new Error("Invalid broadcast epoch.");
    const channels = (Array.isArray(payload?.channels) ? payload.channels : []).map(normalizedChannel);
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
    const response = await fetch(`${CLOCK_URL}?probe=${startedAt}`, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    const endedAt = Date.now();
    if (!response.ok) throw new Error(`Broadcast clock request failed (${response.status}).`);
    const payload = await response.json();
    const serverNowMs = Number(payload?.server_now_ms);
    if (!Number.isFinite(serverNowMs)) throw new Error("Broadcast clock response is invalid.");
    return {
      offsetMs: serverNowMs - ((startedAt + endedAt) / 2),
      roundTripMs: endedAt - startedAt,
    };
  }

  async function synchronizeClock() {
    const results = await Promise.allSettled(
      Array.from({ length: CLOCK_PROBES }, () => probeClock())
    );
    const successful = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value)
      .sort((a, b) => a.roundTripMs - b.roundTripMs);
    if (!successful.length) return;
    clockOffsetMs = successful[0].offsetMs;
    clockRoundTripMs = successful[0].roundTripMs;
    clockSource = "server_midpoint";
  }

  function nowMs() {
    return Date.now() + clockOffsetMs;
  }

  function channelForId(channelId) {
    return schedule?.channels.find((channel) => channel.id === channelId) || null;
  }

  function stateAt(channelId, requestedNowMs = nowMs()) {
    if (!schedule) return null;
    const channel = channelForId(channelId);
    if (!channel) return null;
    const elapsedSeconds = (Number(requestedNowMs) - schedule.epochMs) / 1000;
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
    const nextEntry = channel.entries[(entryIndex + 1) % channel.entries.length];
    const offsetSeconds = Math.max(0, Math.min(entry.durationSeconds - 0.05, cyclePositionSeconds - cursor));
    return {
      channelId: channel.id,
      format: channel.format,
      mediaType: channel.mediaType,
      energyId: channel.energyId,
      channelName: channel.name,
      channelDescription: channel.description,
      mediaId: entry.mediaId,
      trackId: entry.trackId,
      stationId: entry.stationId,
      durationSeconds: entry.durationSeconds,
      offsetSeconds,
      remainingSeconds: Math.max(0, entry.durationSeconds - offsetSeconds),
      nextMediaId: nextEntry.mediaId,
      nextTrackId: nextEntry.trackId,
      nextStationId: nextEntry.stationId,
      entryIndex,
      cyclePositionSeconds,
      cycleSeconds: channel.cycleSeconds,
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
    document.body.dataset.broadcastClockState = "ready";
    document.body.dataset.broadcastClockSource = clockSource;
    document.body.dataset.broadcastClockOffsetMs = clockOffsetMs.toFixed(1);
    if (clockRoundTripMs !== null) document.body.dataset.broadcastClockRoundTripMs = String(clockRoundTripMs);
    window.dispatchEvent(new CustomEvent("iam:broadcast-clock-ready", {
      detail: { version: schedule.version, clockSource },
    }));
    return api;
  }

  const api = {
    version: "broadcast_clock_v1.1",
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
        energyId: channel.energyId,
        name: channel.name,
        description: channel.description,
        cycleSeconds: channel.cycleSeconds,
        trackIds: channel.entries.map((entry) => entry.trackId),
        stationIds: channel.entries.map((entry) => entry.stationId),
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
      };
    },
  };

  window.IAMBroadcastClock = api;
  document.body.dataset.broadcastClockState = "loading";
  api.ready = initialize().catch((error) => {
    document.body.dataset.broadcastClockState = "error";
    document.body.dataset.broadcastClockError = String(error?.message || error).slice(0, 160);
    return api;
  });
}());
