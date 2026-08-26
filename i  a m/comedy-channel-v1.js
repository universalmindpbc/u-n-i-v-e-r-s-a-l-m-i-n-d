(() => {
  "use strict";

  const world = document.querySelector("[data-comedy-world]");
  const video = document.querySelector("[data-comedy-video]");
  const startButton = document.querySelector("[data-comedy-start]");
  const closeButton = document.querySelector("[data-comedy-close]");
  const nowPlaying = document.querySelector("[data-comedy-now]");
  const catalogue = window.IAMProgrammeCatalogue;
  if (!world || !video || !startButton || !closeButton || !catalogue) return;

  const programmes = catalogue.comedyProgrammes;
  const cycleSeconds = Number(catalogue.totalComedySeconds || 0);
  const epochMs = Date.parse(catalogue.comedyEpochUtc);
  let active = false;
  let activeSegmentFile = "";
  let syncTimer = 0;
  let attachSequence = 0;
  let returnProgramme = null;

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
    nowPlaying.textContent = `COMEDY · ${state.programme.title}${segmentSuffix}`;
    document.body.dataset.comedyProgramme = state.programme.id;
    document.body.dataset.comedySegment = state.segment.fileName;
    document.body.dataset.comedyTargetSeconds = state.segmentOffset.toFixed(3);
    video.setAttribute("aria-label", `${state.programme.title}${segmentSuffix}`);
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
    try {
      await (window.IAMStreamController?.play?.(video) || video.play());
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
      await waitForMetadata();
      if (sequence !== attachSequence || !active) return false;
      try { video.currentTime = state.segmentOffset; } catch {}
      document.body.dataset.comedyStreamFile = activeSegmentFile;
      if (play) await requestPlayback();
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
    document.body.classList.add("television-comedy-active");
    document.body.dataset.comedyChannel = catalogue.comedyChannelId;
    world.setAttribute("aria-hidden", "false");
    startButton.hidden = false;
    startSynchronization();
    return synchronize(true);
  }

  async function closeComedy() {
    if (!active) return;
    active = false;
    attachSequence += 1;
    if (syncTimer) window.clearInterval(syncTimer);
    syncTimer = 0;
    try { video.pause(); } catch {}
    window.IAMStreamController?.release?.(video, "comedy_closed");
    activeSegmentFile = "";
    document.body.classList.remove("television-comedy-active");
    world.setAttribute("aria-hidden", "true");
    delete document.body.dataset.comedyChannel;
    delete document.body.dataset.comedyProgramme;
    delete document.body.dataset.comedySegment;
    delete document.body.dataset.comedyStreamFile;
    const resume = returnProgramme;
    returnProgramme = null;
    await window.IAMTelevisionRoom?.resumeProgrammeFromPresentation?.(resume || {});
  }

  startButton.addEventListener("click", (event) => {
    event.preventDefault();
    synchronize(true).catch(() => {});
  });
  closeButton.addEventListener("click", (event) => {
    event.preventDefault();
    closeComedy().catch(() => {});
  });
  video.addEventListener("ended", () => synchronize(true).catch(() => {}));

  window.IAMComedyChannel = {
    version: "comedy_channel_v1",
    joinBroadcast,
    close: closeComedy,
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
