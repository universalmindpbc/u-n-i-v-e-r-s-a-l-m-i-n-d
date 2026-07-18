(function () {
  const catalogue = window.IAMCloudflareStream;
  if (!catalogue) return;

  const HLS_LIBRARY_URL = "https://cdn.jsdelivr.net/npm/hls.js@1.6.13/dist/hls.min.js";
  const TELEMETRY_ENDPOINT = document.querySelector('meta[name="iam-playback-telemetry-endpoint"]')?.content || "";
  const TELEMETRY_SCHEMA_VERSION = "iam_playback_telemetry_v1";
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
  const QUALITY_RECOVERY_HOLD_MS = 5000;
  const QUALITY_THROUGHPUT_MARGIN = 1.7;
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

  function capFor(role, video = null) {
    const requestedMaximum = Number(video?.dataset.streamMaxHeight);
    if (Number.isFinite(requestedMaximum) && requestedMaximum >= 240) {
      return Math.max(240, Math.min(1080, requestedMaximum));
    }
    if (role === "fashion") return 360;
    return connectionIsConstrained() ? 720 : 1080;
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
    return Math.min(capFor("fashion", state.video), finiteNumber(state.adaptiveCap, 720));
  }

  function capHlsLevel(state) {
    if (!state.hls?.levels?.length) return;
    const maximumHeight = state.role === "fashion" ? effectiveFashionCap(state) : capFor(state.role, state.video);
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
    const effectiveMaximum = capFor(role, video);
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

  function telemetrySnapshot(state, eventName, extra = {}) {
    return {
      schema_version: TELEMETRY_SCHEMA_VERSION,
      event_name: String(eventName || "playback_event").slice(0, 80),
      event_time: new Date().toISOString(),
      event_time_ms: Date.now(),
      session_id: playbackSessionId,
      page_path: window.location.pathname,
      role: state.role,
      stream_uid: state.asset?.uid || "",
      stream_file: String(state.asset?.fileName || "").slice(0, 180),
      current_time: finiteNumber(state.video.currentTime, 0),
      buffer_depth: bufferedAhead(state.video),
      ready_state: finiteNumber(state.video.readyState, 0),
      network_state: finiteNumber(state.video.networkState, 0),
      paused: Boolean(state.video.paused),
      quality_height: currentQualityHeight(state),
      quality_cap: state.role === "fashion" ? effectiveFashionCap(state) : capFor(state.role, state.video),
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
    return state.role === "fashion" && state.wantsPlayback && state.isVisible && !document.hidden;
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

  function setFashionQualityCap(state, height, reason) {
    if (state.role !== "fashion") return;
    const nextCap = Math.max(360, Math.min(720, finiteNumber(height, 720)));
    if (state.adaptiveCap === nextCap) return;
    const previousCap = state.adaptiveCap;
    state.adaptiveCap = nextCap;
    state.video.dataset.streamAdaptiveCap = String(nextCap);
    capHlsLevel(state);
    recordTelemetry(state, "quality_cap_change", {
      previous_quality_cap: previousCap,
      quality_cap: nextCap,
      quality_reason: reason,
    });
  }

  function fashionHasRecoveryMargin(state) {
    if (!state.hls?.levels?.length) return true;
    const target = levelAtOrBelow(state, Math.min(720, capFor("fashion", state.video)));
    const estimate = finiteNumber(state.hls.bandwidthEstimate, 0);
    return Boolean(target?.bitrate && estimate >= target.bitrate * QUALITY_THROUGHPUT_MARGIN);
  }

  function manageFashionQualityFromMusic(musicState, trigger = "buffer_sample") {
    if (musicState.role !== "music" || musicState.video.paused || musicState.video.currentTime <= 0) return;
    const musicBuffer = bufferedAhead(musicState.video);
    const timestamp = now();

    if (musicBuffer < MUSIC_CRITICAL_BUFFER_SECONDS) {
      musicState.healthySince = 0;
      states.forEach((state) => {
        if (state.role === "fashion") setFashionQualityCap(state, 360, `${trigger}_critical_music_buffer`);
      });
      return;
    }

    if (musicBuffer < MUSIC_LOW_BUFFER_SECONDS) {
      musicState.healthySince = 0;
      states.forEach((state) => {
        if (state.role === "fashion" && state.adaptiveCap > 480) {
          setFashionQualityCap(state, 480, `${trigger}_low_music_buffer`);
        }
      });
      return;
    }

    if (musicBuffer < MUSIC_RECOVERY_BUFFER_SECONDS) {
      musicState.healthySince = 0;
      return;
    }

    if (!musicState.healthySince) musicState.healthySince = timestamp;
    if (timestamp - musicState.healthySince < QUALITY_RECOVERY_HOLD_MS) return;

    states.forEach((state) => {
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

  function preloadFashion(video, options = {}) {
    const state = states.get(video);
    if (!state || state.role !== "fashion") return Promise.resolve(null);
    const targetSeconds = Math.max(
      FASHION_REVEAL_MINIMUM_SECONDS,
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
      adaptiveCap: role === "fashion" ? Math.min(720, capFor(role, video)) : capFor(role, video),
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

    if (state.keepAlive) {
      const resumePersistentVideo = () => {
        if (!state.wantsPlayback || document.hidden) return;
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
        startLevel: -1,
        maxBufferLength: role === "fashion" ? 24 : 30,
        maxMaxBufferLength: role === "fashion" ? 30 : 60,
        backBufferLength: role === "fashion" ? 10 : 30,
      };
      if (throttleKbps > 0) {
        hlsConfig.fLoader = createQaThrottledFragmentLoader(Hls, throttleKbps);
        video.dataset.streamQaThrottleKbps = String(throttleKbps);
      }
      const hls = new Hls(hlsConfig);
      state.hls = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        capHlsLevel(state);
        recordTelemetry(state, "manifest_ready");
        if (state.preloadRequested) preloadFashion(video, { targetSeconds: state.preloadTargetSeconds });
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
          hls.startLoad();
        }
        if (!data?.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
      });
      hls.loadSource(asset.hls);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      state.nativeAdaptive = role === "fashion" && state.preloadRequested;
      video.dataset.streamEffectiveMaxHeight = String(capFor(role, video));
      video.src = state.nativeAdaptive
        ? asset.hls
        : (role === "fashion" ? await nativeVariantFor(asset.hls, capFor(role, video)) : asset.hls);
      video.load();
      if (state.preloadRequested) preloadFashion(video, { targetSeconds: state.preloadTargetSeconds });
    } else {
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
      const effectiveMaximum = state.role === "fashion" ? effectiveFashionCap(state) : capFor(state.role, state.video);
      if (state.video.dataset.streamEffectiveMaxHeight !== String(effectiveMaximum)) capHlsLevel(state);
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
    play,
    setFashionActive,
    preloadFashion,
    prepareFashionReveal,
    noteFashionReveal,
    setMaxHeight,
    bufferedAhead,
    upgradeDocumentVideos,
    assetFor: catalogue.assetFor,
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => upgradeDocumentVideos(), { once: true });
  } else {
    upgradeDocumentVideos();
  }
}());
