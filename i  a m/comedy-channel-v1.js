(() => {
  "use strict";

  const world = document.querySelector("[data-comedy-world]");
  const video = document.querySelector("[data-comedy-video]");
  const startButton = document.querySelector("[data-comedy-start]");
  const catalogue = window.IAMProgrammeCatalogue;
  if (!world || !video || !startButton || !catalogue) return;

  const COMEDY_SOUND_OUTPUT_MULTIPLIER = 0.11;
  const programmes = catalogue.comedyProgrammes;
  const cycleSeconds = Number(catalogue.totalComedySeconds || 0);
  const epochMs = Date.parse(catalogue.comedyEpochUtc);
  let active = false;
  let activeSegmentFile = "";
  let syncTimer = 0;
  let attachSequence = 0;
  let returnProgramme = null;
  let cropInspectionTimer = 0;
  let cropInspectionAttempts = 0;
  const cropCandidates = [];
  const cropCache = new Map();

  function positiveModulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function serverNowMs() {
    return window.IAMBroadcastClock?.nowMs?.() || Date.now();
  }

  function stateAt(nowMs = serverNowMs()) {
    const cycleOffset = positiveModulo((nowMs - epochMs) / 1000, cycleSeconds);
    let programmeCursor = 0;
    let programme = programmes[0];
    for (const candidate of programmes) {
      const programmeEnd = programmeCursor + Number(candidate.durationSeconds || 0);
      if (cycleOffset < programmeEnd) {
        programme = candidate;
        break;
      }
      programmeCursor = programmeEnd;
    }

    const programmeOffset = Math.max(0, cycleOffset - programmeCursor);
    let segmentCursor = 0;
    let segment = programme.segments[0];
    for (const candidate of programme.segments) {
      const segmentEnd = segmentCursor + Number(candidate.durationSeconds || 0);
      if (programmeOffset < segmentEnd) {
        segment = candidate;
        break;
      }
      segmentCursor = segmentEnd;
    }

    return {
      programme,
      programmeOffset,
      segment,
      segmentOffset: Math.max(0, programmeOffset - segmentCursor),
    };
  }

  function thumbnailUrl(fileName) {
    const asset = window.IAMCloudflareStream?.assetFor?.(fileName);
    if (!asset?.uid) return "";
    const host = window.IAMCloudflareStream.customerHost;
    return `https://${host}/${asset.uid}/thumbnails/thumbnail.jpg?time=8s&height=360`;
  }

  function updateNowPlaying(state) {
    const segmentSuffix = state.programme.segments.length > 1 ? ` · ${state.segment.title}` : "";
    document.body.dataset.comedyProgramme = state.programme.id;
    document.body.dataset.comedyProgrammeTitle = state.programme.title;
    document.body.dataset.comedyProgrammeArtist = state.programme.artist || "";
    document.body.dataset.comedySegment = state.segment.fileName;
    document.body.dataset.comedySegmentTitle = state.segment.title || "";
    document.body.dataset.comedyNowPlayingLabel = `${state.programme.title}${segmentSuffix}`;
    document.body.dataset.comedyTargetSeconds = state.segmentOffset.toFixed(3);
    video.setAttribute("aria-label", `${state.programme.title}${segmentSuffix}`);
    window.IAMTelevisionRoom?.refreshViewingState?.();
  }

  function applyCropScale(scale = 1, bars = "none", state = "ready") {
    const normalizedScale = Math.max(1, Math.min(1.6, Number(scale) || 1));
    video.style.setProperty("--comedy-crop-scale", normalizedScale.toFixed(4));
    video.dataset.comedyCropScale = normalizedScale.toFixed(4);
    video.dataset.comedyCropBars = bars;
    video.dataset.comedyCropState = state;
  }

  function resetCropInspection(fileName) {
    if (cropInspectionTimer) window.clearTimeout(cropInspectionTimer);
    cropInspectionTimer = 0;
    cropInspectionAttempts = 0;
    cropCandidates.length = 0;
    const cached = cropCache.get(fileName);
    if (cached) applyCropScale(cached.scale, cached.bars, "cached");
    else applyCropScale(1, "pending", "sampling");
  }

  function analyseEncodedBars() {
    if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) return null;
    const width = 192;
    const height = 108;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    try {
      context.drawImage(video, 0, 0, width, height);
    } catch {
      return null;
    }
    let pixels;
    try {
      pixels = context.getImageData(0, 0, width, height).data;
    } catch {
      return null;
    }
    const luminanceAt = (x, y) => {
      const index = ((y * width) + x) * 4;
      return (pixels[index] * 0.2126) + (pixels[index + 1] * 0.7152) + (pixels[index + 2] * 0.0722);
    };
    let centralBright = 0;
    let centralTotal = 0;
    for (let y = Math.floor(height * 0.25); y < Math.ceil(height * 0.75); y += 2) {
      for (let x = Math.floor(width * 0.25); x < Math.ceil(width * 0.75); x += 2) {
        centralTotal += 1;
        if (luminanceAt(x, y) > 34) centralBright += 1;
      }
    }
    if (!centralTotal || (centralBright / centralTotal) < 0.075) return null;

    const darkLine = (axis, position) => {
      const length = axis === "x" ? height : width;
      let dark = 0;
      for (let point = 0; point < length; point += 1) {
        const luminance = axis === "x" ? luminanceAt(position, point) : luminanceAt(point, position);
        if (luminance <= 18) dark += 1;
      }
      return dark / length >= 0.93;
    };
    const scan = (axis, fromStart) => {
      const length = axis === "x" ? width : height;
      const maximum = Math.floor(length * 0.28);
      let count = 0;
      for (let offset = 0; offset < maximum; offset += 1) {
        const position = fromStart ? offset : length - offset - 1;
        if (!darkLine(axis, position)) break;
        count += 1;
      }
      return count;
    };
    const left = scan("x", true);
    const right = scan("x", false);
    const top = scan("y", true);
    const bottom = scan("y", false);
    const horizontalBars = left + right >= 4;
    const verticalBars = top + bottom >= 4;
    if (!horizontalBars && !verticalBars) return { scale: 1, bars: "none" };
    const activeWidth = Math.max(1, width - (horizontalBars ? left + right : 0));
    const activeHeight = Math.max(1, height - (verticalBars ? top + bottom : 0));
    const scale = Math.min(1.6, Math.max(width / activeWidth, height / activeHeight));
    return {
      scale,
      bars: [`l${left}`, `r${right}`, `t${top}`, `b${bottom}`].join("-"),
    };
  }

  function inspectCrop() {
    cropInspectionTimer = 0;
    if (!active || !activeSegmentFile || cropCache.has(activeSegmentFile)) return;
    cropInspectionAttempts += 1;
    const candidate = analyseEncodedBars();
    if (candidate) {
      cropCandidates.push(candidate);
      applyCropScale(candidate.scale, candidate.bars, "sampling");
    }
    const latest = cropCandidates[cropCandidates.length - 1];
    const previous = cropCandidates[cropCandidates.length - 2];
    const confirmed = latest && previous && Math.abs(latest.scale - previous.scale) <= 0.045;
    if (confirmed || cropInspectionAttempts >= 6) {
      const selected = confirmed
        ? { scale: (latest.scale + previous.scale) / 2, bars: latest.bars }
        : (cropCandidates.sort((left, right) => right.scale - left.scale)[0] || { scale: 1, bars: "none" });
      cropCache.set(activeSegmentFile, selected);
      applyCropScale(selected.scale, selected.bars, "ready");
      return;
    }
    cropInspectionTimer = window.setTimeout(inspectCrop, 620);
  }

  function scheduleCropInspection(delay = 120) {
    if (cropInspectionTimer || !active || cropCache.has(activeSegmentFile)) return;
    cropInspectionTimer = window.setTimeout(inspectCrop, delay);
  }

  async function waitForMetadata() {
    if (video.readyState >= 1) return;
    await new Promise((resolve) => {
      const timeout = window.setTimeout(resolve, 6000);
      video.addEventListener("loadedmetadata", () => {
        window.clearTimeout(timeout);
        resolve();
      }, { once: true });
    });
  }

  async function requestPlayback() {
    video.muted = false;
    video.volume = 1;
    window.IAMEMDR?.setAudioSource?.(video);
    try {
      const playAttempt = window.IAMStreamController?.play?.(video) || video.play();
      window.IAMQuantumTree?.ensurePlaying?.();
      await playAttempt;
      startButton.hidden = true;
      document.body.dataset.comedyPlaybackState = "playing";
      return true;
    } catch (error) {
      startButton.hidden = false;
      document.body.dataset.comedyPlaybackState = "awaiting-gesture";
      document.body.dataset.comedyPlaybackError = String(error?.message || error).slice(0, 140);
      return false;
    }
  }

  async function attachState(state, { play = true } = {}) {
    const sequence = ++attachSequence;
    updateNowPlaying(state);
    if (!state.segment.fileName) return false;
    try {
      await window.IAMStreamReady;
      if (sequence !== attachSequence || !active) return false;
      video.crossOrigin = "anonymous";
      window.IAMStreamController?.setPriority?.(video, "primary");
      await window.IAMStreamController?.attach?.(video, {
        fileName: state.segment.fileName,
        role: "music",
        autoplay: false,
        preload: true,
        preloadTargetSeconds: 12,
      });
      if (sequence !== attachSequence || !active) return false;
      activeSegmentFile = state.segment.fileName;
      resetCropInspection(activeSegmentFile);
      await waitForMetadata();
      if (sequence !== attachSequence || !active) return false;
      try { video.currentTime = state.segmentOffset; } catch {}
      document.body.dataset.comedyStreamFile = activeSegmentFile;
      if (play) await requestPlayback();
      scheduleCropInspection();
      window.dispatchEvent(new CustomEvent("iam:comedy-programme-change", { detail: state }));
      return true;
    } catch (error) {
      startButton.hidden = false;
      document.body.dataset.comedyPlaybackState = "error";
      document.body.dataset.comedyPlaybackError = String(error?.message || error).slice(0, 140);
      return false;
    }
  }

  async function synchronize(force = false) {
    if (!active) return false;
    const state = stateAt();
    updateNowPlaying(state);
    if (force || activeSegmentFile !== state.segment.fileName) return attachState(state);
    const drift = Number(video.currentTime || 0) - state.segmentOffset;
    document.body.dataset.comedyDriftSeconds = drift.toFixed(3);
    if (Math.abs(drift) > 3.5) {
      try { video.currentTime = state.segmentOffset; } catch {}
    }
    return true;
  }

  function startSynchronization() {
    if (syncTimer) window.clearInterval(syncTimer);
    syncTimer = window.setInterval(() => synchronize(false).catch(() => {}), 3000);
  }

  async function joinBroadcast() {
    window.IAMTelevisionRoom?.preparePresentationEntry?.();
    if (!active) {
      returnProgramme = window.IAMTelevisionRoom?.suspendProgrammeForPresentation?.("comedy") || null;
    }
    active = true;
    document.body.dataset.comedySoundOutputMultiplier = COMEDY_SOUND_OUTPUT_MULTIPLIER.toFixed(2);
    document.body.classList.add("television-comedy-active");
    document.body.dataset.comedyChannel = catalogue.comedyChannelId;
    world.setAttribute("aria-hidden", "false");
    window.dispatchEvent(new CustomEvent("iam:comedy-presentation-change", {
      detail: { active: true, video },
    }));
    startButton.hidden = false;
    startSynchronization();
    return synchronize(true);
  }

  async function closeComedy({ restoreProgramme = true } = {}) {
    if (!active) return;
    active = false;
    attachSequence += 1;
    if (syncTimer) window.clearInterval(syncTimer);
    syncTimer = 0;
    if (cropInspectionTimer) window.clearTimeout(cropInspectionTimer);
    cropInspectionTimer = 0;
    try { video.pause(); } catch {}
    window.IAMStreamController?.release?.(video, "comedy_closed");
    activeSegmentFile = "";
    document.body.classList.remove("television-comedy-active");
    delete document.body.dataset.comedySoundOutputMultiplier;
    world.setAttribute("aria-hidden", "true");
    window.dispatchEvent(new CustomEvent("iam:comedy-presentation-change", {
      detail: { active: false, video },
    }));
    delete document.body.dataset.comedyChannel;
    delete document.body.dataset.comedyProgramme;
    delete document.body.dataset.comedyProgrammeTitle;
    delete document.body.dataset.comedyProgrammeArtist;
    delete document.body.dataset.comedySegment;
    delete document.body.dataset.comedySegmentTitle;
    delete document.body.dataset.comedyNowPlayingLabel;
    delete document.body.dataset.comedyStreamFile;
    applyCropScale(1, "none", "idle");
    const resume = returnProgramme;
    returnProgramme = null;
    window.IAMTelevisionRoom?.refreshViewingState?.();
    if (restoreProgramme) await window.IAMTelevisionRoom?.resumeProgrammeFromPresentation?.(resume || {});
  }

  startButton.addEventListener("click", (event) => {
    event.preventDefault();
    synchronize(true).catch(() => {});
  });
  video.addEventListener("ended", () => synchronize(true).catch(() => {}));
  video.addEventListener("loadeddata", () => scheduleCropInspection());
  video.addEventListener("playing", () => scheduleCropInspection());
  video.addEventListener("timeupdate", () => {
    scheduleCropInspection(80);
    window.IAMTelevisionRoom?.refreshViewingState?.();
  });

  window.IAMComedyChannel = {
    version: "comedy_channel_v1",
    joinBroadcast,
    close: closeComedy,
    leaveForNavigation() {
      return closeComedy({ restoreProgramme: false });
    },
    programmeItems() {
      const state = stateAt();
      const source = state.segment.fileName;
      return [{
        id: catalogue.comedyChannelId,
        mode: "comedy",
        broadcastChannelId: catalogue.comedyChannelId,
        broadcastChannelName: "Comedy",
        broadcastDescriptor: "JARRAD WRIGHT MULTIVERSE",
        broadcastDescription: "Australian animation · comedy",
        artist: state.programme.artist,
        title: state.programme.title,
        unavailable: Boolean(window.IAMCloudflareStream) && !window.IAMCloudflareStream.assetFor?.(source),
        previewVideoSrc: source,
        previewStart: Math.max(8, Math.min(90, state.segmentOffset)),
        thumbnailUrl: thumbnailUrl(source),
        audioOnly: false,
      }];
    },
    getState() {
      return { active, ...stateAt() };
    },
  };

  window.dispatchEvent(new CustomEvent("iam:comedy-ready"));
  if (new URLSearchParams(window.location.search).get("comedy") === "1") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => joinBroadcast().catch(() => {}), { once: true });
    else joinBroadcast().catch(() => {});
  }
})();
