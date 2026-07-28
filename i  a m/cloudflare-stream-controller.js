(function () {
  const catalogue = window.IAMCloudflareStream;
  if (!catalogue) return;

  const HLS_LIBRARY_URL = "https://cdn.jsdelivr.net/npm/hls.js@1.6.16/dist/hls.min.js";
  const TELEMETRY_ENDPOINT = document.querySelector('meta[name="iam-playback-telemetry-endpoint"]')?.content || "";
  const TELEMETRY_SCHEMA_VERSION = "iam_playback_telemetry_v2";
  const TELEMETRY_SESSION_KEY = "iamPlaybackTelemetrySession";
  const TELEMETRY_FLUSH_MS = 5000;
  const TELEMETRY_HEARTBEAT_MS = 10000;
  const FASHION_PRELOAD_TARGET_SECONDS = 12;
  const FASHION_REVEAL_MINIMUM_SECONDS = 8;
  const FASHION_FIRST_FALLBACK_MS = 1250;
  const FASHION_SECOND_FALLBACK_MS = 2000;
  const MUSIC_LOW_BUFFER_SECONDS = 8;
  const MUSIC_CRITICAL_BUFFER_SECONDS = 3;
  const FASHION_LOW_BUFFER_SECONDS = 8;
  const FASHION_CRITICAL_BUFFER_SECONDS = 3;
  const MUSIC_RECOVERY_BUFFER_SECONDS = 15;
  const MUSIC_HIGH_QUALITY_BUFFER_SECONDS = 24;
  const QUALITY_RECOVERY_HOLD_MS = 15000;
  const QUALITY_THROUGHPUT_MARGIN = 1.55;
  const HLS_ERROR_TELEMETRY_THROTTLE_MS = 15000;
  const states = new Map();
  const telemetryQueue = [];
  let hlsLibraryPromise = null;

  function now() {
    return window.performance?.now?.() || Date.now();
  }

  function randomId(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
    return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  }

  function telemetrySessionId() {
    try {
      const existing = window.sessionStorage.getItem(TELEMETRY_SESSION_KEY);
      if (existing) return existing;
      const created = randomId("playback");
      window.sessionStorage.setItem(TELEMETRY_SESSION_KEY, created);
      return created;
    } catch {
      return randomId("playback");
    }
  }

  const playbackSessionId = telemetrySessionId();

  function finiteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function connectionIsConstrained() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return Boolean(connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || ""));
  }

  function qaThrottleKbps() {
    if (window.location.hostname !== "staging.universalmind.tv") return 0;
    const requested = finiteNumber(new URLSearchParams(window.location.search).get("qaThrottleKbps"), 0);
    return requested > 0 ? Math.max(128, Math.min(20000, requested)) : 0;
  }

  function estimatedBandwidthKbps() {
    const qaBandwidth = qaThrottleKbps();
    if (qaBandwidth > 0) return qaBandwidth;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const downlinkMbps = finiteNumber(connection?.downlink, 0);
    return downlinkMbps > 0 ? downlinkMbps * 1000 : 0;
  }

  function createQaThrottledFragmentLoader(Hls, kilobitsPerSecond) {
    const BaseLoader = Hls.DefaultConfig.loader;
    return class QaThrottledFragmentLoader extends BaseLoader {
      constructor(config) {
        super(config);
        this.qaThrottleTimer = 0;
      }

      load(context, config, callbacks) {
        const requestedAt = now();
        const onSuccess = callbacks.onSuccess;
        super.load(context, config, {
          ...callbacks,
          onSuccess: (response, stats, loadContext, networkDetails) => {
            const byteLength = finiteNumber(
              stats?.loaded || response?.data?.byteLength || response?.data?.length,
              0
            );
            const simulatedDurationMs = byteLength > 0 ? (byteLength * 8) / kilobitsPerSecond : 0;
            const delayMs = Math.max(0, simulatedDurationMs - (now() - requestedAt));
            const complete = () => {
              this.qaThrottleTimer = 0;
              if (stats?.loading) stats.loading.end = now();
              if (stats) stats.bwEstimate = kilobitsPerSecond * 1000;
              onSuccess(response, stats, loadContext, networkDetails);
            };
            if (delayMs > 0) this.qaThrottleTimer = window.setTimeout(complete, delayMs);
            else complete();
          },
        });
      }

      abort() {
        window.clearTimeout(this.qaThrottleTimer);
        this.qaThrottleTimer = 0;
        super.abort();
      }

      destroy() {
        window.clearTimeout(this.qaThrottleTimer);
        this.qaThrottleTimer = 0;
        super.destroy();
      }
    };
  }

  function configuredCapFor(role, video = null) {
    const requestedMaximum = Number(video?.dataset.streamMaxHeight);
    if (Number.isFinite(requestedMaximum) && requestedMaximum >= 240) {
      return Math.max(240, Math.min(1080, requestedMaximum));
    }
    if (role === "fashion") return 360;
    return connectionIsConstrained() ? 720 : 1080;
  }

  function initialAdaptiveCap(role) {
    if (role === "fashion") return 360;
    const estimatedKbps = estimatedBandwidthKbps();
    if (estimatedKbps > 0 && estimatedKbps <= 1500) return 360;
    if (estimatedKbps > 0 && estimatedKbps <= 3000) return 480;
    return connectionIsConstrained() ? 480 : 720;
  }

  function effectiveCap(state) {
    return Math.min(configuredCapFor(state.role, state.video), finiteNumber(state.adaptiveCap, initialAdaptiveCap(state.role)));
  }

  function bufferedAhead(video) {
    if (!video?.buffered?.length) return 0;
    const currentTime = finiteNumber(video.currentTime, 0);
    for (let index = 0; index < video.buffered.length; index += 1) {
      const start = finiteNumber(video.buffered.start(index), 0);
      const end = finiteNumber(video.buffered.end(index), 0);
      if (currentTime + 0.12 >= start && currentTime <= end + 0.12) {
        return Math.max(0, end - currentTime);
      }
    }
    return 0;
  }

  function loadHlsLibrary() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (hlsLibraryPromise) return hlsLibraryPromise;
    hlsLibraryPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = HLS_LIBRARY_URL;
      script.async = true;
      script.onload = () => resolve(window.Hls || null);
      script.onerror = () => resolve(null);
      document.head.append(script);
    });
    return hlsLibraryPromise;
  }

  function variantHeight(attributes) {
    const match = String(attributes || "").match(/RESOLUTION=\d+x(\d+)/i);
    return match ? Number(match[1]) : 0;
  }

  async function nativeVariantFor(masterUrl, maximumHeight) {
    try {
      const response = await fetch(masterUrl, { mode: "cors" });
      if (!response.ok) return masterUrl;
      const lines = (await response.text()).split(/\r?\n/);
      const variants = [];
      for (let index = 0; index < lines.length - 1; index += 1) {
        if (!lines[index].startsWith("#EXT-X-STREAM-INF")) continue;
        const uri = lines[index + 1]?.trim();
        if (!uri || uri.startsWith("#")) continue;
        variants.push({ height: variantHeight(lines[index]), url: new URL(uri, masterUrl).href });
      }
      const eligible = variants.filter((variant) => variant.height && variant.height <= maximumHeight);
      eligible.sort((left, right) => right.height - left.height);
      return eligible[0]?.url || variants.sort((left, right) => left.height - right.height)[0]?.url || masterUrl;
    } catch {
      return masterUrl;
    }
  }

  function levelAtOrBelow(state, maximumHeight) {
    if (!state.hls?.levels?.length) return null;
    return state.hls.levels
      .map((level, index) => ({
        index,
        height: finiteNumber(level.height, 0),
        bitrate: finiteNumber(level.bitrate || level.maxBitrate, 0),
      }))
      .filter((level) => level.height && level.height <= maximumHeight)
      .sort((left, right) => right.height - left.height)[0] || null;
  }

  function currentQualityHeight(state) {
    const currentLevel = finiteNumber(state.hls?.currentLevel, -1);
    const loadLevel = finiteNumber(state.hls?.loadLevel, -1);
    const index = currentLevel >= 0 ? currentLevel : loadLevel;
    return finiteNumber(state.hls?.levels?.[index]?.height || state.video.videoHeight, 0);
  }

  function effectiveFashionCap(state) {
    return Math.min(configuredCapFor("fashion", state.video), finiteNumber(state.adaptiveCap, 360));
  }

  function capHlsLevel(state) {
    if (!state.hls?.levels?.length) return;
    const maximumHeight = effectiveCap(state);
    const selected = levelAtOrBelow(state, maximumHeight) || levelAtOrBelow(state, Number.POSITIVE_INFINITY);
    if (!selected) return;
    state.hls.autoLevelCapping = selected.index;
    state.video.dataset.streamEffectiveMaxHeight = String(maximumHeight);
    state.video.dataset.streamLevelCap = String(selected.index);
  }

  function setMaxHeight(video, maximumHeight = null, reason = "runtime") {
    if (!video) return 0;
    const previousMaximum = video.dataset.streamMaxHeight || "automatic";
    const requestedMaximum = Number(maximumHeight);
    if (Number.isFinite(requestedMaximum) && requestedMaximum >= 240) {
      video.dataset.streamMaxHeight = String(Math.max(240, Math.min(1080, Math.round(requestedMaximum))));
    } else {
      delete video.dataset.streamMaxHeight;
    }

    const state = states.get(video);
    const role = state?.role || video.dataset.streamRole || "music";
    const effectiveMaximum = state ? effectiveCap(state) : configuredCapFor(role, video);
    video.dataset.streamEffectiveMaxHeight = String(effectiveMaximum);
    if (state?.hls) capHlsLevel(state);
    if (state) {
      recordTelemetry(state, "quality_cap_changed", {
        quality_cap_previous: previousMaximum,
        quality_cap_requested: video.dataset.streamMaxHeight || "automatic",
        quality_cap: effectiveMaximum,
        quality_cap_reason: String(reason || "runtime").slice(0, 80),
      });
    }
    return effectiveMaximum;
  }

  function elementIsHidden(element) {
    if (!element?.isConnected) return true;
    let current = element;
    while (current && current !== document.body) {
      if (current.hasAttribute?.("hidden") || current.hasAttribute?.("inert")) return true;
      const style = window.getComputedStyle?.(current);
      if (style && (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0)) return true;
      current = current.parentElement;
    }
    const rect = element.getBoundingClientRect?.();
    return Boolean(rect && (rect.width <= 0 || rect.height <= 0));
  }

  function mediaInventory() {
    const media = Array.from(document.querySelectorAll("video, audio"));
    const active = media.filter((item) => !item.paused && !item.ended && item.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA);
    const hiddenActive = active.filter(elementIsHidden);
    const hiddenLoading = media.filter((item) => (
      elementIsHidden(item) &&
      !item.hasAttribute("data-stream-standby") &&
      (states.has(item) || Boolean(item.currentSrc) || item.networkState === HTMLMediaElement.NETWORK_LOADING)
    ));
    return {
      document_media_count: media.length,
      active_media_count: active.length,
      hidden_active_media_count: hiddenActive.length,
      hidden_loading_media_count: hiddenLoading.length,
      attached_stream_count: states.size,
    };
  }

  function telemetryBase(eventName, media = null, extra = {}) {
    const inventory = mediaInventory();
    return {
      schema_version: TELEMETRY_SCHEMA_VERSION,
      event_name: String(eventName || "playback_event").slice(0, 80),
      event_time: new Date().toISOString(),
      event_time_ms: Date.now(),
      session_id: playbackSessionId,
      page_path: window.location.pathname,
      playback_rate: finiteNumber(media?.playbackRate, 1),
      broadcast_mode: document.body.dataset.broadcastMode || "personal",
      broadcast_channel_id: document.body.dataset.broadcastChannelId || "",
      programme_instance_id: document.body.dataset.broadcastProgrammeInstanceId || "",
      correction: document.body.dataset.broadcastCorrection || "",
      clock_source: document.body.dataset.broadcastClockSource || "",
      ...inventory,
      ...extra,
    };
  }

  function telemetrySnapshot(state, eventName, extra = {}) {
    return {
      ...telemetryBase(eventName, state.video),
      role: state.role,
      stream_uid: state.asset?.uid || "",
      stream_file: String(state.asset?.fileName || "").slice(0, 180),
      stream_priority: state.video.dataset.streamPriority || "optional",
      transport: state.transport || (state.hls ? "hls.js" : "html_media"),
      current_time: finiteNumber(state.video.currentTime, 0),
      buffer_depth: bufferedAhead(state.video),
      ready_state: finiteNumber(state.video.readyState, 0),
      network_state: finiteNumber(state.video.networkState, 0),
      paused: Boolean(state.video.paused),
      quality_height: currentQualityHeight(state),
      quality_cap: effectiveCap(state),
      bandwidth_estimate: finiteNumber(state.hls?.bandwidthEstimate, 0),
      waiting_count: state.waitingCount,
      stalled_count: state.stalledCount,
      buffered_segments: state.bufferedSegments.size,
      ...extra,
    };
  }

  function recordTelemetry(state, eventName, extra = {}) {
    if (!TELEMETRY_ENDPOINT || !state) return;
    telemetryQueue.push(telemetrySnapshot(state, eventName, extra));
    if (telemetryQueue.length > 120) telemetryQueue.splice(0, telemetryQueue.length - 120);
    if (telemetryQueue.length >= 20) flushTelemetry();
  }

  function recordMediaEvent(media, eventName, extra = {}) {
    const state = states.get(media);
    if (state) {
      recordTelemetry(state, eventName, extra);
      return;
    }
    if (!TELEMETRY_ENDPOINT) return;
    telemetryQueue.push(telemetryBase(eventName, media, {
      role: String(extra.role || media?.dataset?.streamRole || "audio").slice(0, 20),
      stream_priority: media?.dataset?.streamPriority || "primary",
      transport: media instanceof HTMLVideoElement ? "html_video" : "html_audio",
      current_time: finiteNumber(media?.currentTime, 0),
      buffer_depth: bufferedAhead(media),
      ready_state: finiteNumber(media?.readyState, 0),
      network_state: finiteNumber(media?.networkState, 0),
      paused: Boolean(media?.paused),
      ...extra,
    }));
    if (telemetryQueue.length > 120) telemetryQueue.splice(0, telemetryQueue.length - 120);
    if (telemetryQueue.length >= 20) flushTelemetry();
  }

  function flushTelemetry(useBeacon = false) {
    if (!TELEMETRY_ENDPOINT || !telemetryQueue.length) return;
    const events = telemetryQueue.splice(0, 40);
    const body = JSON.stringify({ schema_version: TELEMETRY_SCHEMA_VERSION, events });
    if (useBeacon && navigator.sendBeacon) {
      const accepted = navigator.sendBeacon(
        TELEMETRY_ENDPOINT,
        new Blob([body], { type: "text/plain;charset=UTF-8" })
      );
      if (!accepted) telemetryQueue.unshift(...events);
      return;
    }
    fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      body,
      cache: "no-store",
      credentials: "omit",
      keepalive: true,
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
    }).catch(() => {
      telemetryQueue.unshift(...events);
    });
  }

  function shouldFashionPlay(state) {
    return state.role === "fashion" && state.wantsPlayback && state.isVisible && !state.auxiliarySuspended && !document.hidden;
  }

  function pauseFashion(state, source = "user_selection") {
    if (state.role !== "fashion" || state.video.paused) return;
    state.pendingPauseSource = source;
    state.video.pause();
  }

  function resumeFashion(state) {
    if (!shouldFashionPlay(state)) return;
    state.hls?.startLoad?.();
    state.video.play().catch(() => {});
  }

  function setAdaptiveQualityCap(state, height, reason) {
    if (!state) return false;
    const maximum = configuredCapFor(state.role, state.video);
    const nextCap = Math.max(240, Math.min(maximum, finiteNumber(height, initialAdaptiveCap(state.role))));
    if (state.adaptiveCap === nextCap) return false;
    const previousCap = state.adaptiveCap;
    state.adaptiveCap = nextCap;
    state.video.dataset.streamAdaptiveCap = String(nextCap);
    capHlsLevel(state);
    recordTelemetry(state, "quality_cap_change", {
      previous_quality_cap: previousCap,
      quality_cap: nextCap,
      quality_reason: reason,
    });
    return true;
  }

  function setFashionQualityCap(state, height, reason) {
    if (state.role !== "fashion") return;
    setAdaptiveQualityCap(state, Math.max(360, Math.min(720, height)), reason);
  }

  function setAuxiliaryLoadingSuspended(state, suspended, reason) {
    if (state.role !== "fashion" || state.video.dataset.streamPriority === "primary") return;
    if (!suspended && (state.video.dataset.streamPriority || "optional") === "optional") return;
    if (Boolean(state.auxiliarySuspended) === Boolean(suspended)) return;
    state.auxiliarySuspended = Boolean(suspended);
    state.video.dataset.streamAuxiliaryState = suspended ? "suspended" : "available";
    if (suspended) {
      state.hls?.stopLoad?.();
      pauseFashion(state, reason || "primary_buffer_protection");
    } else if (state.preloadRequested || state.wantsPlayback) {
      state.hls?.startLoad?.();
      if (state.wantsPlayback) resumeFashion(state);
    }
    recordTelemetry(state, suspended ? "auxiliary_stream_suspended" : "auxiliary_stream_resumed", {
      auxiliary_reason: reason,
    });
  }

  function fashionHasRecoveryMargin(state) {
    if (!state.hls?.levels?.length) return true;
    const target = levelAtOrBelow(state, Math.min(720, configuredCapFor("fashion", state.video)));
    const estimate = finiteNumber(state.hls.bandwidthEstimate, 0);
    return Boolean(target?.bitrate && estimate >= target.bitrate * QUALITY_THROUGHPUT_MARGIN);
  }

  function manageFashionQualityFromMusic(musicState, trigger = "buffer_sample") {
    if (musicState.role !== "music" || musicState.video.paused || musicState.video.currentTime <= 0) return;
    const musicBuffer = bufferedAhead(musicState.video);
    const timestamp = now();

    if (musicBuffer < MUSIC_CRITICAL_BUFFER_SECONDS) {
      musicState.healthySince = 0;
      setAdaptiveQualityCap(musicState, 360, `${trigger}_critical_music_buffer`);
      states.forEach((state) => {
        if (state.role === "fashion") {
          setFashionQualityCap(state, 360, `${trigger}_critical_music_buffer`);
          setAuxiliaryLoadingSuspended(state, true, `${trigger}_critical_music_buffer`);
        }
      });
      return;
    }

    if (musicBuffer < MUSIC_LOW_BUFFER_SECONDS) {
      musicState.healthySince = 0;
      setAdaptiveQualityCap(musicState, 480, `${trigger}_low_music_buffer`);
      states.forEach((state) => {
        if (state.role === "fashion" && state.adaptiveCap > 480) {
          setFashionQualityCap(state, 480, `${trigger}_low_music_buffer`);
        }
        if (state.role === "fashion") setAuxiliaryLoadingSuspended(state, true, `${trigger}_low_music_buffer`);
      });
      return;
    }

    if (musicBuffer < MUSIC_RECOVERY_BUFFER_SECONDS) {
      musicState.healthySince = 0;
      return;
    }

    if (!musicState.healthySince) musicState.healthySince = timestamp;
    if (timestamp - musicState.healthySince < QUALITY_RECOVERY_HOLD_MS) return;

    const configuredMaximum = configuredCapFor("music", musicState.video);
    const nextMusicCap = musicBuffer >= MUSIC_HIGH_QUALITY_BUFFER_SECONDS && musicState.adaptiveCap >= 720
      ? configuredMaximum
      : Math.min(720, configuredMaximum);
    const targetLevel = levelAtOrBelow(musicState, nextMusicCap);
    const estimate = finiteNumber(musicState.hls?.bandwidthEstimate, 0);
    if (!targetLevel?.bitrate || estimate >= targetLevel.bitrate * QUALITY_THROUGHPUT_MARGIN) {
      if (setAdaptiveQualityCap(musicState, nextMusicCap, "sustained_buffer_and_throughput_recovery")) {
        musicState.healthySince = timestamp;
      }
    }

    states.forEach((state) => {
      if (state.role === "fashion") setAuxiliaryLoadingSuspended(state, false, "primary_buffer_recovered");
      if (
        state.role === "fashion" &&
        state.adaptiveCap < 720 &&
        bufferedAhead(state.video) >= MUSIC_RECOVERY_BUFFER_SECONDS &&
        fashionHasRecoveryMargin(state)
      ) {
        setFashionQualityCap(state, 720, "sustained_buffer_and_throughput_recovery");
      }
    });
  }

  function manageFashionBuffer(state, trigger = "fashion_buffer_sample") {
    if (state.role !== "fashion" || !state.wantsPlayback || state.video.paused) return;
    const fashionBuffer = bufferedAhead(state.video);
    if (fashionBuffer < FASHION_CRITICAL_BUFFER_SECONDS) {
      setFashionQualityCap(state, 360, `${trigger}_critical_fashion_buffer`);
      state.hls?.startLoad?.();
      if (!document.hidden) state.video.play().catch(() => {});
      return;
    }
    if (fashionBuffer < FASHION_LOW_BUFFER_SECONDS) {
      setFashionQualityCap(state, 480, `${trigger}_low_fashion_buffer`);
      state.hls?.startLoad?.();
    }
  }

  function beginFreeze(state, source) {
    if (state.freezeStartedAt) return;
    state.freezeStartedAt = now();
    state.freezeSource = source;
    state.video.dataset.streamFreezeState = source;
    recordTelemetry(state, source, { freeze_source: source });
  }

  function endFreeze(state, recoverySource = "playing") {
    if (!state.freezeStartedAt) return;
    const duration = Math.max(0, now() - state.freezeStartedAt);
    recordTelemetry(state, "freeze_end", {
      freeze_source: state.freezeSource || "unknown",
      freeze_duration_ms: Math.round(duration),
      recovery_source: recoverySource,
    });
    state.video.dataset.streamLastFreezeDurationMs = String(Math.round(duration));
    state.video.dataset.streamFreezeState = "";
    state.freezeStartedAt = 0;
    state.freezeSource = "";
  }

  function stageVideoReveal(video, role) {
    video.dataset.streamReveal = "pending";
    video.style.setProperty("--stream-reveal-delay", role === "fashion" ? "300ms" : "80ms");
    video.parentElement?.setAttribute("aria-busy", "true");

    let revealed = false;
    const reveal = () => {
      if (revealed || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      revealed = true;
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          video.dataset.streamReveal = "ready";
          video.parentElement?.removeAttribute("aria-busy");
        });
      });
    };

    ["loadeddata", "canplay", "playing"].forEach((eventName) => {
      video.addEventListener(eventName, reveal, { once: true });
    });
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) reveal();
  }

  function waitForBuffer(state, minimumSeconds, options = {}) {
    return new Promise((resolve) => {
      let settled = false;
      let interval = 0;
      const startedAt = now();

      const finish = (cancelled = false) => {
        if (settled) return;
        settled = true;
        window.clearInterval(interval);
        ["progress", "loadeddata", "canplay", "durationchange"].forEach((eventName) => {
          state.video.removeEventListener(eventName, check);
        });
        state.bufferWaiters.delete(cancel);
        resolve({
          cancelled,
          bufferSeconds: bufferedAhead(state.video),
          waitedMs: Math.max(0, now() - startedAt),
          qualityHeight: currentQualityHeight(state),
          bufferedSegments: state.bufferedSegments.size,
        });
      };

      const check = () => {
        const hasDecodedFrame = state.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
        const hasMinimumSeconds = bufferedAhead(state.video) + 0.15 >= minimumSeconds;
        const hasTwoSegments = Boolean(options.allowTwoSegments && state.bufferedSegments.size >= 2);
        if (hasDecodedFrame && (hasMinimumSeconds || hasTwoSegments)) finish(false);
      };

      const cancel = () => finish(true);
      state.bufferWaiters.add(cancel);
      ["progress", "loadeddata", "canplay", "durationchange"].forEach((eventName) => {
        state.video.addEventListener(eventName, check);
      });
      interval = window.setInterval(check, 150);
      check();
    });
  }

  function preloadMedia(video, options = {}) {
    const state = states.get(video);
    if (!state) return Promise.resolve(null);
    const targetSeconds = Math.max(
      state.role === "fashion" ? FASHION_REVEAL_MINIMUM_SECONDS : 4,
      finiteNumber(options.targetSeconds, FASHION_PRELOAD_TARGET_SECONDS)
    );
    state.preloadRequested = true;
    state.preloadTargetSeconds = targetSeconds;
    video.preload = "auto";
    video.dataset.streamPreload = "loading";
    state.hls?.startLoad?.();

    if (bufferedAhead(video) + 0.15 >= targetSeconds && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      video.dataset.streamPreload = "ready";
      if (!state.wantsPlayback && !state.revealPending) state.hls?.stopLoad?.();
      return Promise.resolve({ bufferSeconds: bufferedAhead(video), waitedMs: 0, qualityHeight: currentQualityHeight(state) });
    }

    if (state.preloadPromise) return state.preloadPromise;
    recordTelemetry(state, "preload_start", { preload_target_seconds: targetSeconds });
    state.preloadPromise = waitForBuffer(state, targetSeconds)
      .then((result) => {
        if (result?.cancelled) return result;
        video.dataset.streamPreload = "ready";
        recordTelemetry(state, "preload_ready", {
          preload_target_seconds: targetSeconds,
          preload_wait_ms: Math.round(result.waitedMs),
        });
        if (!state.wantsPlayback && !state.revealPending) state.hls?.stopLoad?.();
        return result;
      })
      .finally(() => {
        state.preloadPromise = null;
      });
    return state.preloadPromise;
  }

  function preloadFashion(video, options = {}) {
    const state = states.get(video);
    if (!state || state.role !== "fashion") return Promise.resolve(null);
    return preloadMedia(video, options);
  }

  async function prepareFashionReveal(video, options = {}) {
    const state = states.get(video);
    if (!state || state.role !== "fashion") return null;
    const minimumSeconds = Math.max(4, finiteNumber(options.minimumSeconds, FASHION_REVEAL_MINIMUM_SECONDS));
    const firstFallbackMs = Math.max(250, finiteNumber(options.firstFallbackMs, FASHION_FIRST_FALLBACK_MS));
    const secondFallbackMs = Math.max(firstFallbackMs + 250, finiteNumber(options.secondFallbackMs, FASHION_SECOND_FALLBACK_MS));
    const requestedAt = now();
    state.revealPending = true;
    state.hls?.startLoad?.();
    recordTelemetry(state, "reveal_requested", { reveal_minimum_seconds: minimumSeconds });

    const fallTo480 = window.setTimeout(() => {
      if (bufferedAhead(video) + 0.15 < minimumSeconds) {
        setFashionQualityCap(state, 480, "reveal_wait_exceeded_1250ms");
      }
    }, firstFallbackMs);
    const fallTo360 = window.setTimeout(() => {
      if (bufferedAhead(video) + 0.15 < minimumSeconds) {
        setFashionQualityCap(state, 360, "reveal_wait_exceeded_2000ms");
      }
    }, secondFallbackMs);

    const result = await waitForBuffer(state, minimumSeconds, { allowTwoSegments: true });
    window.clearTimeout(fallTo480);
    window.clearTimeout(fallTo360);
    state.revealPending = false;
    if (!result?.cancelled) {
      recordTelemetry(state, "reveal_ready", {
        reveal_wait_ms: Math.round(now() - requestedAt),
        reveal_minimum_seconds: minimumSeconds,
      });
    }
    return result;
  }

  function noteFashionReveal(video) {
    const state = states.get(video);
    if (!state || state.role !== "fashion") return;
    recordTelemetry(state, "fashion_revealed", { crossfade_ms: 300 });
  }

  async function attach(video, options = {}) {
    if (!video) return null;
    if (states.has(video)) return states.get(video);
    const asset = catalogue.assetFor(options.fileName || video.dataset.streamFile || video.currentSrc || video.src);
    if (!asset) return null;

    const role = options.role === "fashion" ? "fashion" : "music";
    const state = {
      video,
      asset,
      role,
      hls: null,
      isVisible: true,
      wantsPlayback: Boolean(options.autoplay || video.autoplay),
      preloadRequested: Boolean(options.preload),
      preloadTargetSeconds: finiteNumber(options.preloadTargetSeconds, FASHION_PRELOAD_TARGET_SECONDS),
      preloadPromise: null,
      revealPending: false,
      pendingPauseSource: "",
      keepAlive: video.hasAttribute("data-stream-keep-alive"),
      nativeAdaptive: false,
      transport: "pending",
      adaptiveCap: Math.min(configuredCapFor(role, video), initialAdaptiveCap(role)),
      waitingCount: 0,
      stalledCount: 0,
      freezeStartedAt: 0,
      freezeSource: "",
      healthySince: 0,
      stationarySince: 0,
      lastClockTime: finiteNumber(video.currentTime, 0),
      lastHeartbeatAt: 0,
      bufferWaiters: new Set(),
      bufferedSegments: new Set(),
      lastHlsErrorAt: 0,
      lastHlsErrorKey: "",
      seekCount: 0,
      controlledSeekCount: 0,
      seekingStartedAt: 0,
      auxiliarySuspended: false,
    };
    states.set(video, state);
    video.dataset.streamRole = role;
    video.dataset.streamUid = asset.uid;
    video.dataset.streamFile = asset.fileName;
    video.dataset.streamAdaptiveCap = String(state.adaptiveCap);
    video.dataset.streamWaitingCount = "0";
    video.dataset.streamStalledCount = "0";
    video.dataset.streamFreezeState = "";
    video.dataset.streamLastFreezeDurationMs = "0";
    video.dataset.streamPlaybackRate = finiteNumber(video.playbackRate, 1).toFixed(3);
    video.dataset.streamSeekCount = "0";
    video.dataset.streamControlledSeekCount = "0";
    video.crossOrigin = "anonymous";
    stageVideoReveal(video, role);

    if (role === "fashion") {
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.setAttribute("muted", "");
      if (state.preloadRequested) video.preload = "auto";
    }

    video.addEventListener("play", () => {
      if (role === "fashion") state.wantsPlayback = true;
      recordTelemetry(state, "play");
    });
    video.addEventListener("pause", () => {
      const pauseSource = state.pendingPauseSource || "browser_or_user";
      state.pendingPauseSource = "";
      if (role === "fashion" && pauseSource === "browser_or_user") state.wantsPlayback = false;
      endFreeze(state, "pause");
      recordTelemetry(state, "pause", { pause_source: pauseSource });
    });
    video.addEventListener("waiting", () => {
      state.waitingCount += 1;
      video.dataset.streamWaitingCount = String(state.waitingCount);
      beginFreeze(state, "waiting");
      if (role === "music") manageFashionQualityFromMusic(state, "waiting");
      else manageFashionBuffer(state, "waiting");
    });
    video.addEventListener("stalled", () => {
      state.stalledCount += 1;
      video.dataset.streamStalledCount = String(state.stalledCount);
      beginFreeze(state, "stalled");
      if (role === "music") manageFashionQualityFromMusic(state, "stalled");
      else manageFashionBuffer(state, "stalled");
    });
    video.addEventListener("playing", () => {
      endFreeze(state, "playing");
      const requestedAt = finiteNumber(video.dataset.streamPlayRequestedAt, 0);
      const startupMs = requestedAt > 0 ? Math.max(0, now() - requestedAt) : 0;
      if (startupMs > 0) video.dataset.streamStartupMs = String(Math.round(startupMs));
      recordTelemetry(state, "playing", { startup_ms: Math.round(startupMs) });
      if (role === "music") manageFashionQualityFromMusic(state, "playing");
    });
    video.addEventListener("error", () => {
      recordTelemetry(state, "media_error", { media_error_code: finiteNumber(video.error?.code, 0) });
    });
    video.addEventListener("ratechange", () => {
      const requestedRate = finiteNumber(video.playbackRate, 1);
      video.dataset.streamPlaybackRate = requestedRate.toFixed(3);
      recordTelemetry(state, "ratechange", { playback_rate: requestedRate });
      if (Math.abs(requestedRate - 1) > .0001) {
        video.playbackRate = 1;
        video.dataset.streamRateGuard = "normalized_to_1";
      }
    });
    video.addEventListener("seeking", () => {
      state.seekCount += 1;
      state.seekingStartedAt = now();
      video.dataset.streamSeekCount = String(state.seekCount);
      recordTelemetry(state, "seeking", {
        controller_seek_count: state.controlledSeekCount,
        seek_count: state.seekCount,
      });
    });
    video.addEventListener("seeked", () => {
      const seekDurationMs = state.seekingStartedAt ? Math.max(0, now() - state.seekingStartedAt) : 0;
      state.seekingStartedAt = 0;
      video.dataset.streamLastSeekDurationMs = String(Math.round(seekDurationMs));
      recordTelemetry(state, "seeked", {
        controller_seek_count: state.controlledSeekCount,
        seek_count: state.seekCount,
        seek_duration_ms: Math.round(seekDurationMs),
      });
    });

    if (state.keepAlive) {
      const resumePersistentVideo = () => {
        if (!state.wantsPlayback || state.auxiliarySuspended || document.hidden) return;
        state.hls?.startLoad?.();
        video.play().catch(() => {});
      };
      video.addEventListener("canplay", resumePersistentVideo);
      video.addEventListener("ended", () => {
        const requestedLoopStart = Number(video.dataset.loopStart || 0);
        const restartAt = Number.isFinite(video.duration) && video.duration > requestedLoopStart
          ? requestedLoopStart
          : 0;
        try { video.currentTime = restartAt; } catch {}
        resumePersistentVideo();
      });
      video.addEventListener("pause", () => {
        if (state.wantsPlayback && !document.hidden) window.setTimeout(resumePersistentVideo, 80);
      });
    }

    const Hls = await loadHlsLibrary();
    if (Hls?.isSupported?.()) {
      const throttleKbps = qaThrottleKbps();
      const hlsConfig = {
        autoStartLoad: state.wantsPlayback || state.preloadRequested,
        capLevelToPlayerSize: role === "fashion",
        startLevel: 0,
        maxLiveSyncPlaybackRate: 1,
        abrBandWidthFactor: .75,
        abrBandWidthUpFactor: .6,
        maxBufferLength: role === "fashion" ? 24 : 30,
        maxMaxBufferLength: role === "fashion" ? 30 : 60,
        backBufferLength: role === "fashion" ? 10 : 30,
      };
      if (throttleKbps > 0) {
        hlsConfig.fLoader = createQaThrottledFragmentLoader(Hls, throttleKbps);
        // The staging loader releases a completed fragment only after its
        // simulated transfer time. Give that deterministic delay enough room
        // to finish even at the 1 Mbps proof profile instead of tripping the
        // normal request deadline and turning the test into a retry loop.
        hlsConfig.fragLoadPolicy = {
          default: {
            maxTimeToFirstByteMs: 30000,
            maxLoadTimeMs: 600000,
            timeoutRetry: {
              maxNumRetry: 2,
              retryDelayMs: 0,
              maxRetryDelayMs: 0,
            },
            errorRetry: {
              maxNumRetry: 4,
              retryDelayMs: 1000,
              maxRetryDelayMs: 8000,
            },
          },
        };
        video.dataset.streamQaThrottleKbps = String(throttleKbps);
      }
      const hls = new Hls(hlsConfig);
      state.hls = hls;
      state.transport = "hls.js";
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        capHlsLevel(state);
        recordTelemetry(state, "manifest_ready");
        if (state.preloadRequested) preloadMedia(video, { targetSeconds: state.preloadTargetSeconds });
        if (state.wantsPlayback) video.play().catch(() => {});
      });
      hls.on(Hls.Events.LEVELS_UPDATED, () => capHlsLevel(state));
      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        video.dataset.streamQualityHeight = String(finiteNumber(hls.levels?.[data?.level]?.height, 0));
        recordTelemetry(state, "quality_level", {
          quality_height: finiteNumber(hls.levels?.[data?.level]?.height, 0),
        });
      });
      hls.on(Hls.Events.FRAG_BUFFERED, (_event, data) => {
        const fragment = data?.frag;
        if (fragment?.type && fragment.type !== "main") return;
        const fragmentKey = `${fragment?.level ?? ""}:${fragment?.sn ?? fragment?.url ?? ""}`;
        if (fragmentKey !== ":") state.bufferedSegments.add(fragmentKey);
        video.dataset.streamBufferedSegments = String(state.bufferedSegments.size);
        video.dataset.streamBandwidthEstimate = String(Math.round(finiteNumber(hls.bandwidthEstimate, 0)));
        if (
          role === "fashion" &&
          state.preloadRequested &&
          !state.wantsPlayback &&
          !state.revealPending &&
          bufferedAhead(video) + 0.15 >= state.preloadTargetSeconds
        ) {
          hls.stopLoad();
        }
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        const errorKey = `${data?.type || "unknown"}:${data?.details || "unknown"}:${Boolean(data?.fatal)}`;
        const errorAt = now();
        if (errorKey !== state.lastHlsErrorKey || errorAt - state.lastHlsErrorAt >= HLS_ERROR_TELEMETRY_THROTTLE_MS) {
          state.lastHlsErrorKey = errorKey;
          state.lastHlsErrorAt = errorAt;
          recordTelemetry(state, "hls_error", {
            hls_error_type: String(data?.type || "").slice(0, 80),
            hls_error_detail: String(data?.details || "").slice(0, 120),
            hls_error_fatal: Boolean(data?.fatal),
          });
        }
        if (role === "music" && data?.details?.includes?.("buffer")) {
          manageFashionQualityFromMusic(state, "hls_buffer_error");
        }
        if (role === "fashion" && (data?.details?.includes?.("buffer") || data?.type === Hls.ErrorTypes.NETWORK_ERROR)) {
          manageFashionBuffer(state, "hls_error");
          if (!state.auxiliarySuspended) hls.startLoad();
        }
        if (!data?.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && !state.auxiliarySuspended) hls.startLoad();
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
      });
      hls.loadSource(asset.hls);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      state.nativeAdaptive = role === "fashion" && state.preloadRequested;
      state.transport = "native_hls";
      video.dataset.streamEffectiveMaxHeight = String(effectiveCap(state));
      video.src = state.nativeAdaptive
        ? asset.hls
        : (role === "fashion" ? await nativeVariantFor(asset.hls, effectiveCap(state)) : asset.hls);
      video.load();
      if (state.preloadRequested) preloadMedia(video, { targetSeconds: state.preloadTargetSeconds });
    } else {
      state.transport = "html_media";
      video.src = asset.hls;
      video.load();
    }

    observer?.observe(video);
    recordTelemetry(state, "stream_attached", { preload_requested: state.preloadRequested });
    if (state.wantsPlayback) video.play().catch(() => {});
    return state;
  }

  function detach(video) {
    const state = states.get(video);
    observer?.unobserve(video);
    state?.bufferWaiters?.forEach((cancel) => cancel());
    state?.hls?.stopLoad?.();
    state?.hls?.destroy?.();
    if (state) recordTelemetry(state, "stream_detached");
    states.delete(video);
  }

  function release(video, reason = "inactive_media") {
    if (!video) return;
    const state = states.get(video);
    if (state) recordTelemetry(state, "stream_released", { release_reason: String(reason).slice(0, 80) });
    detach(video);
    try {
      video.pause();
      video.removeAttribute("src");
      while (video.firstChild) video.removeChild(video.firstChild);
      if (video.srcObject) video.srcObject = null;
      video.preload = "none";
      video.load();
    } catch {}
    delete video.__iamStreamAttachPromise;
    video.dataset.streamReleaseReason = String(reason).slice(0, 80);
    video.dataset.televisionStreamAttach = "released";
  }

  function setPriority(video, priority = "optional") {
    if (!video) return;
    video.dataset.streamPriority = String(priority || "optional");
    const state = states.get(video);
    if (state && priority === "primary") setAuxiliaryLoadingSuspended(state, false, "promoted_to_primary");
  }

  function noteControlledSeek(media, details = {}) {
    const state = states.get(media);
    if (state) {
      state.controlledSeekCount += 1;
      media.dataset.streamControlledSeekCount = String(state.controlledSeekCount);
    }
    recordMediaEvent(media, "controller_seek", {
      controller_seek_count: state?.controlledSeekCount || finiteNumber(details.controller_seek_count, 1),
      buffer_before_correction: bufferedAhead(media),
      ...details,
    });
  }

  function simulateNetworkOutage(video, durationMs = 3000) {
    if (window.location.hostname !== "staging.universalmind.tv") return false;
    const state = states.get(video);
    if (!state?.hls) return false;
    const boundedDurationMs = Math.max(250, Math.min(10000, finiteNumber(durationMs, 3000)));
    state.hls.stopLoad();
    video.dataset.streamQaOutage = "active";
    recordTelemetry(state, "qa_network_outage_start", { outage_duration_ms: boundedDurationMs });
    window.setTimeout(() => {
      if (!states.has(video)) return;
      state.hls.startLoad();
      video.dataset.streamQaOutage = "recovered";
      recordTelemetry(state, "qa_network_outage_end", { outage_duration_ms: boundedDurationMs });
    }, boundedDurationMs);
    return true;
  }

  function setFashionActive(video, active, source = "user_selection") {
    const state = states.get(video);
    if (!state || state.role !== "fashion") return;
    state.wantsPlayback = Boolean(active);
    if (active) resumeFashion(state);
    else pauseFashion(state, source);
  }

  function play(video) {
    const state = states.get(video);
    if (state) {
      state.wantsPlayback = true;
      state.hls?.startLoad?.();
    }
    return video.play();
  }

  function upgradeDocumentVideos(root = document) {
    root.querySelectorAll("video").forEach((video) => {
      if (video.hasAttribute("data-stream-deferred")) return;
      const source = video.dataset.streamFile || video.currentSrc || video.getAttribute("src") || video.querySelector("source")?.getAttribute("src");
      const asset = catalogue.assetFor(source);
      if (!asset || states.has(video)) return;
      const isFashion = /Homepage - Hero Background|Globe Landing Page Video/.test(asset.fileName);
      video.dataset.streamFile = asset.fileName;
      attach(video, {
        fileName: asset.fileName,
        role: video.dataset.streamRole || (isFashion ? "fashion" : "music"),
        autoplay: video.autoplay,
      });
    });
  }

  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const state = states.get(entry.target);
        if (!state || state.role !== "fashion") return;
        state.isVisible = entry.isIntersecting && entry.intersectionRatio > 0;
        if (state.isVisible) resumeFashion(state);
      });
    }, { threshold: 0.01 })
    : null;

  document.addEventListener("visibilitychange", () => {
    states.forEach((state) => {
      if (state.role !== "fashion") return;
      if (!document.hidden) resumeFashion(state);
    });
    if (document.hidden) flushTelemetry(true);
  });

  window.addEventListener("pagehide", () => flushTelemetry(true));

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  connection?.addEventListener?.("change", () => {
    states.forEach((state) => {
      capHlsLevel(state);
      if (connectionIsConstrained() && state.role === "fashion") {
        setFashionQualityCap(state, 360, "constrained_connection");
      }
    });
  });

  window.setInterval(() => {
    const timestamp = now();
    states.forEach((state) => {
      const currentTime = finiteNumber(state.video.currentTime, 0);
      state.video.dataset.streamBufferDepth = bufferedAhead(state.video).toFixed(3);
      state.video.dataset.streamQualityHeight = String(currentQualityHeight(state));
      state.video.dataset.streamBandwidthEstimate = String(Math.round(finiteNumber(state.hls?.bandwidthEstimate, 0)));
      const effectiveMaximum = effectiveCap(state);
      if (state.video.dataset.streamEffectiveMaxHeight !== String(effectiveMaximum)) capHlsLevel(state);
      if (Math.abs(finiteNumber(state.video.playbackRate, 1) - 1) > .0001) state.video.playbackRate = 1;
      state.video.dataset.streamPlaybackRate = finiteNumber(state.video.playbackRate, 1).toFixed(3);
      const activelyExpected = state.wantsPlayback && !state.video.paused && !document.hidden && state.isVisible;
      if (activelyExpected) {
        if (currentTime > state.lastClockTime + 0.08) {
          state.stationarySince = 0;
          endFreeze(state, "clock_advanced");
        } else if (!state.stationarySince) {
          state.stationarySince = timestamp;
        } else if (timestamp - state.stationarySince >= 1500) {
          beginFreeze(state, "clock_stalled");
        }
      } else {
        state.stationarySince = 0;
      }
      state.lastClockTime = currentTime;

      if (state.role === "music") manageFashionQualityFromMusic(state, "periodic_buffer_sample");
      if (state.role === "fashion") manageFashionBuffer(state, "periodic_buffer_sample");
      if (timestamp - state.lastHeartbeatAt >= TELEMETRY_HEARTBEAT_MS) {
        state.lastHeartbeatAt = timestamp;
        recordTelemetry(state, "playback_heartbeat");
      }
    });
  }, 1000);

  if (TELEMETRY_ENDPOINT) window.setInterval(() => flushTelemetry(), TELEMETRY_FLUSH_MS);

  window.IAMStreamController = Object.freeze({
    attach,
    detach,
    release,
    play,
    setFashionActive,
    preloadMedia,
    preloadFashion,
    prepareFashionReveal,
    noteFashionReveal,
    noteControlledSeek,
    recordMediaEvent,
    setPriority,
    setMaxHeight,
    bufferedAhead,
    mediaInventory,
    simulateNetworkOutage,
    upgradeDocumentVideos,
    assetFor: catalogue.assetFor,
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => upgradeDocumentVideos(), { once: true });
  } else {
    upgradeDocumentVideos();
  }
}());
