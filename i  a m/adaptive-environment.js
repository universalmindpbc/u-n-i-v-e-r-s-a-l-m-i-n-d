(function () {
  const embeddedFrame = window.self !== window.top &&
    new URLSearchParams(window.location.search).get("adaptiveFrame") === "1";

  if (embeddedFrame) {
    document.documentElement.dataset.adaptiveFrame = "embedded";
    document.addEventListener("click", (event) => {
      const homeLink = event.target.closest('a[data-nav-item="home"], a.global-nav-brand');
      if (!homeLink) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      window.top.postMessage({ type: "iam:return-to-television" }, window.location.origin);
    }, true);
    window.__iamAdaptiveEnvironment = {
      init() {},
      startRadio() {
        return window.top.__iamAdaptiveEnvironment?.startRadio?.();
      },
      duckRadio() {
        return window.top.__iamAdaptiveEnvironment?.duckRadio?.();
      },
      restoreRadio() {
        return window.top.__iamAdaptiveEnvironment?.restoreRadio?.();
      },
      stopRadio() {
        return window.top.__iamAdaptiveEnvironment?.stopRadio?.();
      },
      chooseStation() {
        return window.top.__iamAdaptiveEnvironment?.chooseStation?.() || "chill";
      },
      audio: null,
    };
    return;
  }

  if (window.__iamAdaptiveEnvironment?.init) {
    window.__iamAdaptiveEnvironment.init();
    return;
  }

  const stations = {
    calm: {
      label: "Calm",
      url: "https://streamer.radio.co/sb748f24ad/listen",
    },
    chill: {
      label: "Chill",
      url: "https://streams.radio.co/se1a320b47/listen",
    },
    house: {
      label: "House",
      url: "https://s4.radio.co/seeae9c220/listen",
    },
  };
  const streamHosts = [
    "https://streamer.radio.co",
    "https://streams.radio.co",
    "https://s4.radio.co",
  ];

  const stateKey = "iamAdaptiveEnvironmentState";
  const backgroundVideoStateKey = "iamPersistentBackgroundVideoState";
  const inferenceKeys = ["iamLatestInference", "citizenNeedsLatestInference"];
  const normalPages = new Set(["index.html", "problem.html", "solution.html", "demo.html", "technology.html", "adaptive-music-video.html", "our-team.html", "cafe-del-mar-home.html"]);
  const framePages = new Set(["globe.html", "vogue-self-report.html", "technology-citizen-needs.html"]);
  const standalonePages = new Set();
  const baseVolume = 0.68;
  const duckedVolume = 0;
  const restoreDelay = 500;
  const restoreFadeDuration = 4100;
  const vimeoSdkUrl = "https://player.vimeo.com/api/player.js";
  const faviconVersion = "iam-favicon-4";
  const parser = new DOMParser();
  const radio = new Audio();
  radio.preload = "auto";
  radio.volume = 0;
  document.documentElement.dataset.adaptiveEnvironment = "ready";

  let selectedStation = "chill";
  let started = false;
  let fadeFrame = 0;
  let restoreTimer = 0;
  let navigating = false;
  let startPromise = null;
  let typewriterRun = 0;
  let vimeoSdkPromise = null;
  let flowerCueShowTimer = 0;
  let flowerCueHideTimer = 0;
  let homepageRadarArmTimer = 0;
  let persistentHomeShell = null;
  let activeGuestShell = null;
  let persistentHomeBodyState = null;
  let persistentHomeTitle = "";

  function safeGet(store, key) {
    try {
      return store?.getItem(key) || "";
    } catch {
      return "";
    }
  }

  function safeSet(store, key, value) {
    try {
      store?.setItem(key, value);
    } catch {
      // Storage can be unavailable in private or restricted browser modes.
    }
  }

  function ensureStreamHints() {
    streamHosts.forEach((href) => {
      const absoluteHref = new URL(href).href;
      const alreadyPresent = Array.from(document.querySelectorAll('link[rel="preconnect"]'))
        .some((link) => link.href === absoluteHref);

      if (alreadyPresent) return;

      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = href;
      link.crossOrigin = "anonymous";
      document.head.append(link);
    });
  }

  function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent || "");
  }

  function versionedIconHref(path, forceRefresh = false) {
    const url = new URL(path, window.location.origin);
    url.searchParams.set("v", faviconVersion);

    if (forceRefresh && isSafari()) {
      url.searchParams.set("refresh", Date.now().toString(36));
    }

    return url.href;
  }

  function appendIconLink(rel, href, attributes = {}) {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;

    Object.entries(attributes).forEach(([name, value]) => {
      link.setAttribute(name, value);
    });

    document.head.append(link);
  }

  function refreshFavicon({ force = false } = {}) {
    document
      .querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')
      .forEach((link) => link.remove());

    const faviconHref = versionedIconHref("/vogue/iam/favicon.png", force);
    const appleTouchHref = versionedIconHref("/vogue/iam/apple-touch-icon.png", force);

    appendIconLink("icon", faviconHref, {
      type: "image/png",
      sizes: "32x32",
    });
    appendIconLink("shortcut icon", faviconHref, {
      type: "image/png",
    });
    appendIconLink("apple-touch-icon", appleTouchHref, {
      sizes: "180x180",
    });
  }

  function readState() {
    const stored = safeGet(window.localStorage, stateKey);
    if (!stored) return {};

    try {
      return JSON.parse(stored) || {};
    } catch {
      return {};
    }
  }

  function persistState() {
    document.documentElement.dataset.adaptiveRadio = started ? "started" : "idle";
    safeSet(window.localStorage, stateKey, JSON.stringify({
      started,
      station: selectedStation,
      updatedAt: Date.now(),
    }));
  }

  function readStoredInference() {
    const stores = [window.sessionStorage, window.localStorage];

    for (const store of stores) {
      for (const key of inferenceKeys) {
        const value = safeGet(store, key);
        if (!value) continue;

        try {
          return JSON.parse(value);
        } catch {
          continue;
        }
      }
    }

    return {};
  }

  function listFromValue(value) {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string") return [];

    return value
      .split(/[|,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function stationKeyFromValue(value) {
    if (!value) return "";

    if (typeof value === "object") {
      return stationKeyFromValue(
        value.stage_gate ||
        value.stageGate ||
        value.station ||
        value.genre ||
        value.channel ||
        value.label ||
        value.name
      );
    }

    const normalized = String(value).trim().toLowerCase();
    if (/\bcalm\b/.test(normalized)) return "calm";
    if (/\bchill\b/.test(normalized)) return "chill";
    if (/\bhouse\b/.test(normalized)) return "house";

    return "";
  }

  function explicitStationFromInference(inference = {}) {
    const candidates = [
      inference.soundtrack_stage_gate,
      inference.soundtrackStageGate,
      inference.adaptive_environment,
      inference.adaptiveEnvironment,
      inference.soundtrack,
      inference.radio,
      inference.radioStation,
      inference.station,
      inference.genre,
      inference.channel,
    ];

    for (const candidate of candidates) {
      const station = stationKeyFromValue(candidate);
      if (station) return station;
    }

    return "";
  }

  function chooseStation(inference = readStoredInference()) {
    const explicitStation = explicitStationFromInference(inference);
    if (explicitStation) return explicitStation;

    const highlights = listFromValue(inference.highlights);
    const signal = [
      inference.checkin,
      inference.status,
      inference.human_review_relevance,
      inference.interpretation_type,
      ...highlights,
    ].join(" ").toLowerCase();

    if (/\b(anxious|anxiety|panic|worried|worry|fear|afraid|scared|stress|stressed|strain|pressure|tense|overwhelmed|hypervigilance|intrusion|flashback|anger|angry|rage|shame|ashamed|guilt|lonely|alone|isolated|fatigue|tired|exhausted|burnt|burned|sleep|restless|numb)\b/.test(signal)) {
      return "calm";
    }

    if (/\b(joy|happy|delight|excited|energised|energized|motivated|motivation|activated|arousal|wired|alive|purpose|mission|driven|ready|curious|curiosity)\b/.test(signal)) {
      return "house";
    }

    return "chill";
  }

  function updateStationSurface() {
    document.querySelectorAll("[data-adaptive-station]").forEach((node) => {
      const label = stations[selectedStation].label;
      node.dataset.adaptiveTypewriterText = label;
      if (!node.classList.contains("is-typing") && !node.classList.contains("is-typed")) {
        node.textContent = label;
      }
    });
  }

  function primeRadio() {
    if (started) return;

    const station = stations[selectedStation] || stations.chill;
    if (radio.src !== station.url) {
      radio.src = station.url;
    }

    try {
      radio.load();
    } catch {
      // Some browsers defer live stream loading until the user gesture.
    }
  }

  function refreshStationSelection(options = {}) {
    const nextStation = chooseStation();
    const previousStation = selectedStation;
    selectedStation = stations[nextStation] ? nextStation : "chill";
    updateStationSurface();

    if (options.switchLive && started && previousStation !== selectedStation) {
      switchStation(selectedStation);
    } else if (!started) {
      primeRadio();
    }
  }

  function fadeTo(volume, duration = 900) {
    window.cancelAnimationFrame(fadeFrame);

    const startVolume = radio.volume;
    const targetVolume = Math.max(0, Math.min(1, volume));
    const startedAt = performance.now();

    return new Promise((resolve) => {
      function frame(now) {
        const progress = Math.min(1, (now - startedAt) / duration);
        radio.volume = startVolume + ((targetVolume - startVolume) * progress);

        if (progress < 1) {
          fadeFrame = window.requestAnimationFrame(frame);
        } else {
          resolve();
        }
      }

      fadeFrame = window.requestAnimationFrame(frame);
    });
  }

  async function switchStation(stationName) {
    const station = stations[stationName] || stations.chill;
    await fadeTo(0, 450);
    radio.src = station.url;

    try {
      await radio.play();
      await fadeTo(baseVolume, 1100);
    } catch {
      started = false;
      persistState();
    }
  }

  function startRadio() {
    refreshStationSelection();
    dismissOverlay();
    document.body.classList.add("adaptive-typewriter-complete");
    scheduleFlowerCue();

    const station = stations[selectedStation] || stations.chill;
    if (radio.src !== station.url) {
      radio.src = station.url;
    }

    radio.muted = false;
    window.cancelAnimationFrame(fadeFrame);
    radio.volume = 0;
    started = true;
    persistState();

    if (!startPromise || radio.paused) {
      startPromise = radio.play()
        .then(() => {
          started = true;
          persistState();
          return fadeTo(baseVolume, 700).then(() => true);
        })
        .catch(() => {
          started = false;
          persistState();
          return false;
        });
    } else {
      fadeTo(baseVolume, 700);
    }

    return startPromise;
  }

  function isRadioRunning() {
    return started && !radio.paused;
  }

  function dismissOverlay() {
    document.body.classList.add("adaptive-environment-dismissed");
    document.querySelectorAll("[data-adaptive-environment]").forEach((surface) => {
      surface.classList.add("is-dismissed");
      surface.setAttribute("aria-hidden", "true");
    });
  }

  function revealOverlay() {
    clearFlowerCue();
    document.body.classList.remove("homepage-radar-open");
    document.querySelectorAll("[data-homepage-radar]").forEach((radar) => {
      radar.setAttribute("aria-hidden", "true");
    });
    document.body.classList.remove("adaptive-environment-dismissed");
    document.querySelectorAll("[data-adaptive-environment]").forEach((surface) => {
      surface.classList.remove("is-dismissed");
      surface.removeAttribute("aria-hidden");
    });
  }

  function clearFlowerCue() {
    window.clearTimeout(flowerCueShowTimer);
    window.clearTimeout(flowerCueHideTimer);
    flowerCueShowTimer = 0;
    flowerCueHideTimer = 0;
    document.body.classList.remove("flower-cue-visible");
    document.querySelectorAll("[data-flower-cue]").forEach((cue) => {
      cue.setAttribute("aria-hidden", "true");
    });
  }

  function scheduleFlowerCue() {
    const cue = document.querySelector("[data-flower-cue]");
    if (!cue) return;

    clearFlowerCue();
    flowerCueShowTimer = window.setTimeout(() => {
      cue.setAttribute("aria-hidden", "false");
      document.body.classList.add("flower-cue-visible");
    }, 3000);
  }

  function openHomepageRadar() {
    clearFlowerCue();
    window.clearTimeout(homepageRadarArmTimer);
    document.body.classList.add("homepage-radar-open", "homepage-radar-arming", "adaptive-environment-dismissed");
    document.body.classList.remove("homepage-radar-domain-physiological");
    document.querySelectorAll("[data-adaptive-environment]").forEach((surface) => {
      surface.classList.add("is-dismissed");
      surface.setAttribute("aria-hidden", "true");
    });
    document.querySelectorAll("[data-homepage-radar]").forEach((radar) => {
      radar.setAttribute("aria-hidden", "false");
    });
    document.querySelectorAll(".homepage-radar-frame").forEach((frame) => {
      frame.contentWindow?.postMessage({ type: "iam:homepage-radar-disable" }, window.location.origin);
    });
    homepageRadarArmTimer = window.setTimeout(() => {
      document.body.classList.remove("homepage-radar-arming");
      document.querySelectorAll(".homepage-radar-frame").forEach((frame) => {
        frame.contentWindow?.postMessage({ type: "iam:homepage-radar-enable" }, window.location.origin);
      });
    }, 2600);
  }

  function bindHomepageRadar() {
    document.querySelectorAll("[data-homepage-radar-trigger]").forEach((trigger) => {
      if (trigger.dataset.homepageRadarBound === "true") return;
      trigger.dataset.homepageRadarBound = "true";
      trigger.addEventListener("click", openHomepageRadar);
    });

    try {
      if (new URLSearchParams(window.location.search).get("radar") === "1") {
        openHomepageRadar();
      }
    } catch {
      // Ignore malformed preview URLs.
    }
  }

  function bindHomepageRadarMessages() {
    if (window.__iamHomepageRadarMessagesBound) return;
    window.__iamHomepageRadarMessagesBound = true;

    window.addEventListener("message", (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "iam:homepage-radar-domain") return;

      document.body.classList.toggle(
        "homepage-radar-domain-physiological",
        event.data.domain === "Physiological",
      );
    });

    window.addEventListener("message", (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "iam:homepage-radar-highlights") return;

      document.body.classList.toggle(
        "homepage-radar-highlight-physiological",
        Boolean(event.data.hasPhysiological),
      );
    });
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  async function typeLine(line, runId) {
    const text = line.dataset.adaptiveTypewriterText || line.textContent || "";
    const glyphs = Array.from(text);
    const duration = Number(line.dataset.adaptiveTypewriterDuration || 1500);
    const speed = glyphs.length ? duration / glyphs.length : duration;

    line.textContent = "";
    line.classList.add("is-typing");
    line.classList.remove("is-typed");

    for (let index = 0; index < glyphs.length; index += 1) {
      if (runId !== typewriterRun) return;
      line.textContent += glyphs[index];
      await wait(speed);
    }

    if (runId !== typewriterRun) return;
    line.classList.remove("is-typing");
    line.classList.add("is-typed");
    await wait(320);
  }

  async function runTypewriter() {
    const lines = Array.from(document.querySelectorAll("[data-adaptive-typewriter]"));
    if (!lines.length) {
      document.body.classList.add("adaptive-typewriter-complete");
      return;
    }

    const runId = typewriterRun + 1;
    typewriterRun = runId;
    document.body.classList.remove("adaptive-typewriter-complete");

    lines.forEach((line) => {
      line.textContent = "";
      line.classList.remove("is-typing", "is-typed");
    });

    if (typeof window.IAMLocalContext?.revealHomepageContext === "function") {
      await window.IAMLocalContext.revealHomepageContext().catch(() => null);
      if (runId !== typewriterRun) return;
      await wait(180);
    } else {
      await wait(420);
    }

    for (const line of lines) {
      if (runId !== typewriterRun) return;
      await typeLine(line, runId);
    }

    if (runId === typewriterRun) {
      document.body.classList.add("adaptive-typewriter-complete");
    }
  }

  function scheduleRestore() {
    window.clearTimeout(restoreTimer);
    restoreTimer = window.setTimeout(() => {
      if (isRadioRunning()) fadeTo(baseVolume, restoreFadeDuration);
    }, restoreDelay);
  }

  function duckRadio() {
    if (!isRadioRunning()) return;
    window.clearTimeout(restoreTimer);
    fadeTo(duckedVolume, 900);
  }

  function restoreRadio() {
    if (!isRadioRunning()) return;
    scheduleRestore();
  }

  function stopRadio() {
    window.clearTimeout(restoreTimer);
    window.cancelAnimationFrame(fadeFrame);
    radio.pause();
    radio.muted = true;
    radio.volume = 0;
    started = false;
    startPromise = null;
    persistState();
  }

  function bindOverlay() {
    refreshStationSelection();

    const surface = document.querySelector("[data-adaptive-environment]");
    const playButton = document.querySelector("[data-adaptive-play]");

    if (!surface) {
      const deferStoredStartup = document.body.classList.contains("adaptive-video-page");
      if (!deferStoredStartup && readState().started && !isRadioRunning()) {
        startRadio();
      }
      return;
    }

    // Music television has its own intro/typewriter and media controller.
    // Letting the shared radio layer animate the same lines causes duplicate
    // text writes and stalls the runway video while both loops compete.
    if (playButton?.matches("[data-television-play]")) return;

    if (isRadioRunning()) {
      dismissOverlay();
    } else {
      revealOverlay();
      runTypewriter();
    }

    if (playButton && playButton.dataset.adaptiveBound !== "true") {
      playButton.dataset.adaptiveBound = "true";
      playButton.addEventListener("pointerenter", primeRadio);
      playButton.addEventListener("focus", primeRadio);
      playButton.addEventListener("touchstart", primeRadio, { passive: true });
      playButton.addEventListener("pointerdown", () => {
        startRadio();
      });
      playButton.addEventListener("click", () => {
        startRadio();
      });
    }
  }

  function shouldIgnoreVideo(video) {
    return video.closest(".background-video") ||
      video.closest(".induction-background-video") ||
      video.closest(".landing-music-video") ||
      video.matches("[data-music-video]") ||
      (video.muted && !video.controls);
  }

  function bindLocalVideos() {
    document.querySelectorAll("video").forEach((video) => {
      if (video.dataset.adaptiveVideoBound === "true" || shouldIgnoreVideo(video)) return;

      video.dataset.adaptiveVideoBound = "true";
      video.addEventListener("play", duckRadio);
      video.addEventListener("pause", restoreRadio);
      video.addEventListener("ended", restoreRadio);
    });
  }

  function vimeoOriginFromFrame(iframe) {
    try {
      return new URL(iframe.src).origin;
    } catch {
      return "https://player.vimeo.com";
    }
  }

  function postVimeoCommand(iframe, message) {
    if (!iframe.contentWindow) return;

    iframe.contentWindow.postMessage(JSON.stringify(message), vimeoOriginFromFrame(iframe));
  }

  function prepareVimeoFrame(iframe) {
    if (!iframe.id) {
      iframe.id = `iam-vimeo-${Math.random().toString(36).slice(2)}`;
    }

    try {
      const url = new URL(iframe.src);
      url.searchParams.set("api", "1");
      url.searchParams.set("player_id", iframe.id);
      if (iframe.src !== url.href) iframe.src = url.href;
    } catch {
      // If URL parsing fails, keep the frame untouched.
    }
  }

  function subscribeVimeoFrame(iframe) {
    prepareVimeoFrame(iframe);

    ["play", "playing", "pause", "ended", "timeupdate"].forEach((eventName) => {
      postVimeoCommand(iframe, {
        method: "addEventListener",
        value: eventName,
      });
    });

    postVimeoCommand(iframe, { method: "getPaused" });
  }

  function loadVimeoSdk() {
    if (window.Vimeo?.Player) return Promise.resolve(window.Vimeo.Player);
    if (vimeoSdkPromise) return vimeoSdkPromise;

    vimeoSdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = vimeoSdkUrl;
      script.async = true;
      script.onload = () => {
        if (window.Vimeo?.Player) {
          resolve(window.Vimeo.Player);
        } else {
          reject(new Error("Vimeo Player SDK unavailable"));
        }
      };
      script.onerror = () => reject(new Error("Unable to load Vimeo Player SDK"));
      document.head.append(script);
    });

    return vimeoSdkPromise;
  }

  function bindVimeoSdk(iframe) {
    loadVimeoSdk()
      .then((Player) => {
        if (iframe.dataset.adaptiveVimeoSdkBound === "true") return;

        const player = new Player(iframe);
        iframe.dataset.adaptiveVimeoSdkBound = "true";
        player.on("play", duckRadio);
        player.on("playing", duckRadio);
        player.on("pause", restoreRadio);
        player.on("ended", restoreRadio);
      })
      .catch(() => {
        subscribeVimeoFrame(iframe);
      });
  }

  function probeFocusedVimeoFrame() {
    const iframe = document.activeElement;
    if (!iframe?.matches?.('iframe[src*="player.vimeo.com"]')) return;

    // Safari can focus the cross-origin player before Vimeo events arrive.
    duckRadio();
    subscribeVimeoFrame(iframe);
  }

  function bindVimeoFrames() {
    document.querySelectorAll('iframe[src*="player.vimeo.com"]').forEach((iframe) => {
      if (iframe.dataset.adaptiveVimeoBound === "true") return;

      iframe.dataset.adaptiveVimeoBound = "true";
      prepareVimeoFrame(iframe);
      bindVimeoSdk(iframe);
      iframe.addEventListener("load", () => subscribeVimeoFrame(iframe));
      iframe.addEventListener("focus", probeFocusedVimeoFrame);
      iframe.addEventListener("pointerdown", duckRadio);
      iframe.addEventListener("touchstart", duckRadio, { passive: true });
      window.setTimeout(() => subscribeVimeoFrame(iframe), 800);
    });
  }

  function handleVimeoMessage(event) {
    if (!String(event.origin || "").includes("vimeo.com")) return;

    let payload = event.data;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch {
        return;
      }
    }

    const eventName = payload?.event || payload?.method;

    if (eventName === "play" || eventName === "playing" || eventName === "timeupdate") {
      duckRadio();
    } else if (eventName === "pause" || eventName === "ended") {
      restoreRadio();
    } else if (eventName === "getPaused") {
      if (payload.value === false) {
        duckRadio();
      } else if (payload.value === true) {
        restoreRadio();
      }
    }
  }

  function pageNameFromUrl(url) {
    const parts = url.pathname.split("/");
    return parts[parts.length - 1] || "index.html";
  }

  function internalPageUrlFromEvent(event) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
    if (event.target.closest?.("[data-nav-open], [data-nav-close]")) return null;

    const link = event.target.closest?.("a[href]");
    if (!link || link.target || link.hasAttribute("download")) return null;

    if (link.dataset.navItem === "technology") {
      const technologySubmenu = document.querySelector('[data-nav-submenu="technology"]');
      if (technologySubmenu) {
        event.preventDefault();
        document.querySelectorAll("[data-nav-item]").forEach((item) => {
          const isActive = item.dataset.navItem === "technology";
          item.classList.toggle("is-active", isActive);
          if (item.dataset.navItem === "technology") {
            item.setAttribute("aria-expanded", String(isActive));
          }
        });
        technologySubmenu.classList.add("is-open");
        return null;
      }
    }

    const url = new URL(link.getAttribute("href"), window.location.href);
    if (url.origin !== window.location.origin) return null;
    const pageName = pageNameFromUrl(url);
    if (!normalPages.has(pageName) && !framePages.has(pageName)) return null;
    return url;
  }

  function closeGlobalNav() {
    document.body.classList.remove("nav-open");
    document.querySelectorAll("[data-global-nav]").forEach((nav) => {
      nav.classList.remove("is-open");
      nav.setAttribute("aria-hidden", "true");
    });
  }

  function syncBodyAttributes(nextBody) {
    const currentDataAttributes = Array.from(document.body.attributes)
      .filter((attribute) => attribute.name.startsWith("data-"));

    currentDataAttributes.forEach((attribute) => {
      document.body.removeAttribute(attribute.name);
    });

    Array.from(nextBody.attributes).forEach((attribute) => {
      if (attribute.name === "class") {
        document.body.className = attribute.value;
      } else if (attribute.name.startsWith("data-")) {
        document.body.setAttribute(attribute.name, attribute.value);
      }
    });

    document.body.classList.remove("nav-open");
    if (isRadioRunning()) document.body.classList.add("adaptive-environment-dismissed");
  }

  function captureBodyState() {
    return {
      className: document.body.className,
      dataAttributes: Array.from(document.body.attributes)
        .filter((attribute) => attribute.name.startsWith("data-"))
        .map((attribute) => [attribute.name, attribute.value]),
    };
  }

  function restoreBodyState(state) {
    if (!state) return;
    Array.from(document.body.attributes)
      .filter((attribute) => attribute.name.startsWith("data-"))
      .forEach((attribute) => document.body.removeAttribute(attribute.name));
    state.dataAttributes.forEach(([name, value]) => document.body.setAttribute(name, value));
    document.body.className = state.className;
  }

  function hidePersistentHome() {
    if (!persistentHomeShell) return;
    if (persistentHomeShell.classList.contains("iam-persistent-home-hidden")) return;
    persistentHomeBodyState = captureBodyState();
    persistentHomeShell.classList.add("iam-persistent-home-hidden");
    persistentHomeShell.setAttribute("aria-hidden", "true");
  }

  function showPersistentHome(url, replace = false) {
    if (!persistentHomeShell?.isConnected) return false;

    closeGlobalNav();
    activeGuestShell?.remove();
    activeGuestShell = null;
    restoreBodyState(persistentHomeBodyState);
    persistentHomeShell.classList.remove("iam-persistent-home-hidden");
    persistentHomeShell.removeAttribute("aria-hidden");
    document.title = persistentHomeTitle || document.title;
    refreshFavicon({ force: true });

    if (!replace) window.history.pushState({ iamInPlace: true }, "", url.href);
    return true;
  }

  function installGuestShell(currentMain, nextMain) {
    if (persistentHomeShell && currentMain === persistentHomeShell) {
      hidePersistentHome();
      document.body.append(nextMain);
    } else {
      currentMain.replaceWith(nextMain);
    }
    activeGuestShell = nextMain;
  }

  function ensureStyles(nextDocument, pageUrl) {
    nextDocument.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;

      const absoluteHref = new URL(href, pageUrl).href;
      const alreadyLoaded = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .some((existing) => existing.href === absoluteHref);

      if (alreadyLoaded) return;

      const nextLink = document.createElement("link");
      nextLink.rel = "stylesheet";
      nextLink.href = absoluteHref;
      document.head.append(nextLink);
    });
  }

  function ensureScript(src) {
    if (window.IAMSite?.init) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Unable to load ${src}`));
      document.body.append(script);
    });
  }

  function frameUrlFor(url) {
    const frameUrl = new URL(url.href);
    frameUrl.searchParams.set("adaptiveFrame", "1");
    return frameUrl;
  }

  function currentPageShell() {
    if (activeGuestShell?.isConnected) return activeGuestShell;
    if (persistentHomeShell?.isConnected) return persistentHomeShell;
    return document.querySelector(".site-shell, .technology-shell, .globe-page, .adaptive-frame-shell");
  }

  function navigateFrameInPlace(url, replace = false) {
    const currentMain = currentPageShell();
    if (!currentMain) {
      window.location.href = url.href;
      return;
    }

    navigating = true;
    closeGlobalNav();
    if (currentMain === persistentHomeShell) hidePersistentHome();
    document.body.className = isRadioRunning() ? "adaptive-environment-dismissed" : "";
    document.body.classList.add("iam-page-transitioning");

    const shell = document.createElement("main");
    const frame = document.createElement("iframe");

    shell.className = "adaptive-frame-shell";
    shell.setAttribute("aria-label", pageNameFromUrl(url).replace(".html", ""));
    frame.className = "adaptive-frame";
    frame.title = pageNameFromUrl(url).replace(/[-.]/g, " ");
    frame.src = frameUrlFor(url).href;
    shell.append(frame);

    frame.addEventListener("load", () => {
      try {
        document.title = frame.contentDocument?.title || document.title;
        refreshFavicon({ force: true });
      } catch {
        // Cross-frame title access can fail in stricter browser contexts.
      }
    });

    installGuestShell(currentMain, shell);

    if (!replace) {
      window.history.pushState({ iamInPlace: true }, "", url.href);
    }

    document.body.classList.remove("iam-page-transitioning");
    navigating = false;
  }

  async function navigateInPlace(url, replace = false) {
    if (navigating) return;

    if (pageNameFromUrl(url) === "index.html") {
      if (showPersistentHome(url, replace)) return;
      window.location.href = url.href;
      return;
    }

    if (standalonePages.has(pageNameFromUrl(url))) {
      window.location.href = url.href;
      return;
    }

    if (framePages.has(pageNameFromUrl(url))) {
      navigateFrameInPlace(url, replace);
      return;
    }

    navigating = true;
    document.body.classList.add("iam-page-transitioning");

    try {
      const response = await fetch(url.href, { credentials: "same-origin" });
      if (!response.ok) throw new Error(`Navigation failed: ${response.status}`);

      const html = await response.text();
      const nextDocument = parser.parseFromString(html, "text/html");
      const nextMain = nextDocument.querySelector(".site-shell");
      const currentMain = currentPageShell();

      if (!nextMain || !currentMain) throw new Error("Missing page shell");

      closeGlobalNav();
      ensureStyles(nextDocument, url);
      document.title = nextDocument.title || document.title;
      refreshFavicon({ force: true });
      if (currentMain === persistentHomeShell) hidePersistentHome();
      syncBodyAttributes(nextDocument.body);
      const importedMain = document.importNode(nextMain, true);
      if (currentMain !== persistentHomeShell) reusePersistentBackgroundVideo(currentMain, importedMain);
      installGuestShell(currentMain, importedMain);

      if (!replace) {
        window.history.pushState({ iamInPlace: true }, "", url.href);
      }

      await ensureScript("script.js?v=adaptive-env-10");
      window.IAMSite?.init();
      window.IAMLocalContext?.init?.({ refresh: true });
      init();
    } catch (error) {
      window.location.href = url.href;
    } finally {
      document.body.classList.remove("iam-page-transitioning");
      navigating = false;
    }
  }

  function bindNavigation() {
    if (window.__iamAdaptiveNavigationBound) return;
    window.__iamAdaptiveNavigationBound = true;

    document.addEventListener("click", (event) => {
      if (event.target.closest?.("[data-nav-open], [data-nav-close]")) return;

      const url = internalPageUrlFromEvent(event);
      if (!url) return;

      event.preventDefault();
      navigateInPlace(url);
    });

    window.addEventListener("popstate", () => {
      const url = new URL(window.location.href);
      if (normalPages.has(pageNameFromUrl(url))) {
        navigateInPlace(url, true);
      } else {
        window.location.reload();
      }
    });
  }

  function bindInferenceUpdates() {
    if (window.__iamAdaptiveInferenceBound) return;
    window.__iamAdaptiveInferenceBound = true;

    window.addEventListener("iam:inference-updated", () => {
      refreshStationSelection({ switchLive: true });
    });

    window.addEventListener("storage", (event) => {
      if (inferenceKeys.includes(event.key)) {
        refreshStationSelection({ switchLive: true });
      }
    });
  }

  function bindVimeoMessages() {
    if (window.__iamAdaptiveVimeoMessagesBound) return;
    window.__iamAdaptiveVimeoMessagesBound = true;
    window.addEventListener("message", handleVimeoMessage);
    window.addEventListener("blur", () => window.setTimeout(probeFocusedVimeoFrame, 0));
  }

  function backgroundVideoSignature(container) {
    const video = container?.querySelector?.("video");
    const source = video?.dataset?.streamFile || video?.currentSrc || video?.getAttribute("src") || video?.querySelector("source")?.getAttribute("src") || "";
    if (!source) return "";

    try {
      return new URL(source, window.location.href).pathname;
    } catch {
      return source;
    }
  }

  function reusePersistentBackgroundVideo(currentMain, nextMain) {
    const currentBackground = currentMain?.querySelector?.(".background-video");
    const nextBackground = nextMain?.querySelector?.(".background-video");
    if (!currentBackground || !nextBackground) return;
    if (backgroundVideoSignature(currentBackground) !== backgroundVideoSignature(nextBackground)) return;

    nextBackground.replaceWith(currentBackground);
  }

  function persistBackgroundVideoTime() {
    const video = document.querySelector(".background-video video");
    if (!video || !Number.isFinite(video.currentTime)) return;

    safeSet(window.sessionStorage, backgroundVideoStateKey, JSON.stringify({
      signature: backgroundVideoSignature(video.closest(".background-video")),
      currentTime: video.currentTime,
      capturedAt: Date.now(),
    }));
  }

  function restoreBackgroundVideoTime() {
    const video = document.querySelector(".background-video video");
    if (!video) return;

    let state = null;
    try {
      const stored = safeGet(window.sessionStorage, backgroundVideoStateKey);
      state = stored ? JSON.parse(stored) : null;
    } catch {
      state = null;
    }

    if (!state || state.signature !== backgroundVideoSignature(video.closest(".background-video"))) return;
    if (!Number.isFinite(state.currentTime) || Date.now() - Number(state.capturedAt || 0) > 120000) return;

    const applyTime = () => {
      try {
        video.currentTime = state.currentTime;
        video.play?.().catch?.(() => null);
      } catch {
        // Some browsers reject currentTime before enough metadata is available.
      }
    };

    if (video.readyState >= 1) {
      applyTime();
    } else {
      video.addEventListener("loadedmetadata", applyTime, { once: true });
    }
  }

  function init() {
    refreshFavicon({ force: true });
    ensureStreamHints();
    selectedStation = chooseStation();
    updateStationSurface();
    bindOverlay();
    bindHomepageRadar();
    bindHomepageRadarMessages();
    bindLocalVideos();
    bindVimeoFrames();
    bindNavigation();
    bindInferenceUpdates();
    bindVimeoMessages();
    if (!persistentHomeShell && pageNameFromUrl(new URL(window.location.href)) === "index.html") {
      persistentHomeShell = document.querySelector(".site-shell");
      persistentHomeBodyState = captureBodyState();
      persistentHomeTitle = document.title;
    }
    if (!window.__iamPersistentBackgroundVideoRestored) {
      window.__iamPersistentBackgroundVideoRestored = true;
      restoreBackgroundVideoTime();
    }
    if (!window.__iamPersistentBackgroundVideoBound) {
      window.__iamPersistentBackgroundVideoBound = true;
      window.addEventListener("pagehide", persistBackgroundVideoTime);
      window.addEventListener("beforeunload", persistBackgroundVideoTime);
    }
  }

  window.__iamAdaptiveEnvironment = {
    init,
    startRadio,
    duckRadio,
    restoreRadio,
    stopRadio,
    refreshFavicon,
    chooseStation: () => selectedStation,
    audio: radio,
  };

  init();
}());
