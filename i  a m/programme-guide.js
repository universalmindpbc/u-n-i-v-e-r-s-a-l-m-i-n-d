(() => {
  "use strict";

  const MODES = ["videos", "parties", "radio"];
  const MODE_LABELS = { videos: "VIDEOS", parties: "PARTIES", radio: "RADIO" };
  const DEFAULT_ROOMS = {
    videos: "modul8-infinity",
    parties: "modul8-infinity",
    radio: "modul8-infinity",
  };
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Australia/Sydney";
  const TIME_ZONES = {
    local: localTimeZone,
    "Australia/Sydney": "Australia/Sydney",
    "America/Los_Angeles": "America/Los_Angeles",
    "Europe/Madrid": "Europe/Madrid",
  };
  const ZONE_LABELS = {
    local: "LOCAL TIME",
    "Australia/Sydney": "SYDNEY TIME",
    "America/Los_Angeles": "LOS ANGELES TIME",
    "Europe/Madrid": "IBIZA TIME",
  };
  const EDITORIAL_TRACKS = {
    "max-richter-cercle-odyssey-paris": { artist: "Max Richter", title: "Cercle Odyssey, Paris" },
    "olafur-arnalds-hafursey-iceland-cercle": { artist: "Ólafur Arnalds", title: "Hafursey, Iceland" },
    "sasha-ibiza-boat-at-sunset-freqways": { artist: "Sasha", title: "Ibiza Boat at Sunset" },
    "ben-bohmer-cappadocia-cercle": { artist: "Ben Böhmer", title: "Cappadocia, Turkey" },
    "peggy-gou-palais-des-beaux-arts-cercle": { artist: "Peggy Gou", title: "Palais des Beaux-Arts, Lille" },
    "miss-monique-biosphere-montreal-cercle": { artist: "Miss Monique", title: "Biosphere, Montreal" },
    "nina-kraviz-eiffel-tower-cercle": { artist: "Nina Kraviz", title: "Eiffel Tower, Paris" },
    "nastia-drum-bass-sunset-the-lab-ibiza": { artist: "NASTIA", title: "Drum & Bass Sunset · The Lab Ibiza" },
    "carl-cox-chateau-de-chambord-cercle": { artist: "Carl Cox", title: "Château de Chambord, France" },
    "zip-perlon-air-festival-2007": { artist: "Zip", title: "Perlon · Air Festival, 2007" },
    "zip-sammy-d-perlon-betalounge-2000": { artist: "Zip & Sammy D", title: "Perlon · Betalounge, 2000" },
  };

  const programPanel = document.querySelector("[data-program-panel]");
  const programScroll = document.querySelector("[data-program-scroll]");
  const programScrim = document.querySelector(".program-scrim");
  const cardRail = document.querySelector("[data-program-channel-rail]");
  const moreButton = document.querySelector("[data-program-more]");
  const channelsButton = document.querySelector("[data-program-channels]");
  const historySection = document.querySelector("[data-program-history]");
  const modeButtons = Array.from(document.querySelectorAll("[data-program-mode]"));
  const zoneButtons = Array.from(document.querySelectorAll("[data-program-panel] [data-zone]"));
  const openButtons = Array.from(document.querySelectorAll("[data-program-open]"));
  const enterLiveButton = document.querySelector("[data-enter-live]");

  if (!programPanel || !programScroll || !programScrim || !cardRail || !moreButton || !channelsButton || !enterLiveButton) return;

  let schedule = null;
  let catalogueTracks = new Map();
  let radioStations = new Map();
  let activeMode = "videos";
  let activeRooms = { ...DEFAULT_ROOMS };
  let activeZone = "local";
  let expanded = false;
  let renderTimer = 0;
  let initializeError = null;
  let previouslyFocusedElement = null;
  let previewVideo = null;
  let previewCard = null;
  let programmeItems = [];
  let programmeCardsSignature = "";

  function positiveModulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function serverNow() {
    return window.IAMBroadcastClock?.nowMs?.() || Date.now();
  }

  function modeIs(value) {
    return MODES.includes(value) ? value : "videos";
  }

  function humanizeTrackId(trackId) {
    return String(trackId || "Scheduled programme")
      .split("-")
      .filter(Boolean)
      .map((word) => word.length > 3 ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word)
      .join(" ");
  }

  function trackFor(entry) {
    const stationId = String(entry?.station_id || "");
    if (stationId) {
      const station = radioStations.get(stationId);
      return {
        artist: String(station?.provider || station?.artist || "Live radio"),
        title: String(station?.display_title || station?.title || humanizeTrackId(stationId)),
      };
    }
    const trackId = String(entry?.track_id || "");
    const editorial = EDITORIAL_TRACKS[trackId];
    if (editorial) return editorial;
    const record = catalogueTracks.get(trackId);
    if (record) {
      return {
        artist: String(record.artist || "Universal Mind"),
        title: String(record.title || humanizeTrackId(trackId)),
      };
    }
    const runtimeMetadata = window.IAMCueSheet?.metadataAt?.(trackId, 0);
    if (runtimeMetadata?.artist && runtimeMetadata?.title) {
      return {
        artist: String(runtimeMetadata.artist),
        title: String(runtimeMetadata.title),
      };
    }
    return { artist: "Universal Mind", title: humanizeTrackId(trackId) };
  }

  function channelsForMode(mode = activeMode) {
    return (Array.isArray(schedule?.channels) ? schedule.channels : [])
      .filter((channel) => channel?.format === mode);
  }

  function roomIdForChannel(channel) {
    return String(channel?.id || "")
      .replace(/^video-/, "")
      .replace(/^party-/, "")
      .replace(/^radio-/, "");
  }

  function roomName(roomId) {
    const channel = channelsForMode().find((candidate) => roomIdForChannel(candidate) === roomId);
    return String(channel?.name || humanizeTrackId(roomId));
  }

  function activeRoom() {
    return activeRooms[activeMode] || DEFAULT_ROOMS[activeMode];
  }

  function channelForRoom(roomId = activeRoom(), mode = activeMode) {
    return channelsForMode(mode).find((channel) => roomIdForChannel(channel) === roomId) || null;
  }

  function timelineFor(channel, nowMs) {
    const entries = Array.isArray(channel?.schedule) ? channel.schedule : [];
    const epochMs = Date.parse(channel?.epoch_utc || schedule?.epoch_utc || "");
    const cycleSeconds = entries.reduce((sum, entry) => sum + Number(entry.duration_seconds || 0), 0);
    if (!entries.length || !Number.isFinite(epochMs) || cycleSeconds <= 0) return null;

    const elapsedSeconds = (nowMs - epochMs) / 1000;
    const cycleIndex = Math.floor(elapsedSeconds / cycleSeconds);
    const cyclePosition = positiveModulo(elapsedSeconds, cycleSeconds);
    let cursor = 0;
    let currentIndex = 0;

    for (let index = 0; index < entries.length; index += 1) {
      const nextCursor = cursor + Number(entries[index].duration_seconds || 0);
      if (cyclePosition < nextCursor || index === entries.length - 1) {
        currentIndex = index;
        break;
      }
      cursor = nextCursor;
    }

    return {
      entries,
      currentIndex,
      currentStart: epochMs + ((cycleIndex * cycleSeconds + cursor) * 1000),
    };
  }

  function eventRecord(entry, startMs) {
    const durationMs = Math.max(1000, Number(entry?.duration_seconds || 0) * 1000);
    return {
      entry,
      startMs,
      endMs: startMs + durationMs,
      track: trackFor(entry),
    };
  }

  function upcomingEvents(channel, nowMs, requestedHours, maximumEvents) {
    const timeline = timelineFor(channel, nowMs);
    if (!timeline) return [];
    const horizonEnd = nowMs + (requestedHours * 60 * 60 * 1000);
    const events = [];
    let index = timeline.currentIndex;
    let startMs = timeline.currentStart;

    while ((startMs < horizonEnd || events.length < 2) && events.length < maximumEvents) {
      const event = eventRecord(timeline.entries[index], startMs);
      events.push(event);
      startMs = event.endMs;
      index = (index + 1) % timeline.entries.length;
    }
    return events;
  }

  function previousEvents(channel, nowMs, count = 3) {
    const timeline = timelineFor(channel, nowMs);
    if (!timeline) return [];
    const events = [];
    let index = timeline.currentIndex;
    let startMs = timeline.currentStart;
    for (let position = 0; position < count; position += 1) {
      index = (index - 1 + timeline.entries.length) % timeline.entries.length;
      const entry = timeline.entries[index];
      startMs -= Math.max(1000, Number(entry?.duration_seconds || 0) * 1000);
      events.unshift(eventRecord(entry, startMs));
    }
    return events;
  }

  function timeZone() {
    return TIME_ZONES[activeZone] || TIME_ZONES.local;
  }

  function timeLabel(ms) {
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: timeZone(),
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(ms));
  }

  function dateLabel(ms) {
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: timeZone(),
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(ms)).toUpperCase();
  }

  function durationLabel(seconds) {
    const totalMinutes = Math.max(1, Math.round(Number(seconds) / 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (!hours) return `${minutes}M`;
    return minutes ? `${hours}H ${String(minutes).padStart(2, "0")}M` : `${hours}H`;
  }

  function remainingLabel(ms) {
    const minutes = Math.max(1, Math.ceil(ms / 60000));
    if (minutes < 60) return `${String(minutes).padStart(2, "0")} MIN REMAIN`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return `${hours}H ${String(remainder).padStart(2, "0")}M REMAIN`;
  }

  function setText(selector, value) {
    const element = programPanel.querySelector(selector);
    if (element) element.textContent = value;
  }

  function createEventListItem(event) {
    const item = document.createElement("li");
    const time = document.createElement("time");
    const details = document.createElement("div");
    const artist = document.createElement("strong");
    const title = document.createElement("small");
    const duration = document.createElement("em");
    time.dateTime = new Date(event.startMs).toISOString();
    time.textContent = timeLabel(event.startMs);
    artist.textContent = event.track.artist;
    title.textContent = event.track.title;
    duration.textContent = durationLabel(event.entry.duration_seconds);
    details.append(artist, title);
    item.append(time, details, duration);
    return item;
  }

  function renderList(selector, events) {
    const list = programPanel.querySelector(selector);
    if (list) list.replaceChildren(...events.map(createEventListItem));
  }

  function fallbackProgrammeItem(channel, nowMs) {
    const current = upcomingEvents(channel, nowMs, 1, 1)[0];
    return {
      broadcastChannelId: channel.id,
      broadcastChannelName: channel.name,
      broadcastDescriptor: channel.descriptor,
      broadcastDescription: channel.description,
      artist: current?.track.artist || channel.name,
      title: current?.track.title || "Live now",
      unavailable: channel.available === false,
      previewVideoSrc: "",
      previewStart: 8,
      thumbnailUrl: "",
      radioLogoSrc: "",
      radioLogoAlt: "",
      cardPalette: [],
      audioOnly: false,
    };
  }

  function stopCardPreview() {
    if (!previewVideo) return;
    if (previewVideo.dataset.streamRole === "fashion") {
      window.IAMStreamController?.setFashionActive?.(previewVideo, false, "programme_preview_closed");
    }
    try { previewVideo.pause(); } catch {}
    window.IAMStreamController?.detach?.(previewVideo);
    previewVideo.remove();
    previewCard?.classList.remove("is-previewing");
    previewVideo = null;
    previewCard = null;
  }

  async function startCardPreview(card) {
    if (!document.body.classList.contains("television-program-open") || !card || card === previewCard) return;
    const item = (window.IAMMusicChannels?.programmeItems?.(activeMode) || [])
      .find((candidate) => candidate.broadcastChannelId === card.dataset.channelId) ||
      programmeItems.find((candidate) => candidate.broadcastChannelId === card.dataset.channelId);
    const media = card.querySelector(".program-channel-card__media");
    const source = item?.previewVideoSrc;
    if (!source || !media || item.unavailable || activeMode === "radio" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    stopCardPreview();
    const video = document.createElement("video");
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("muted", "");
    video.setAttribute("aria-hidden", "true");
    video.dataset.streamRole = item.audioOnly ? "fashion" : "music-preview";
    video.dataset.streamMaxHeight = "360";
    if (item.audioOnly) video.__iamFashionSource = source;
    previewVideo = video;
    previewCard = card;
    card.classList.add("is-previewing");
    media.append(video);
    const previewStart = Math.max(0, Number(item.previewStart || 8));
    const resetPreview = () => {
      try { video.currentTime = Math.min(previewStart, Math.max(0, Number(video.duration || previewStart) - 0.5)); } catch {}
    };
    video.addEventListener("loadedmetadata", resetPreview, { once: true });
    video.addEventListener("timeupdate", () => {
      if (video.currentTime >= Math.min(Number(video.duration || previewStart + 10), previewStart + 10) - 0.08) resetPreview();
    });
    try {
      await window.IAMStreamController?.attach?.(video, {
        fileName: source,
        role: item.audioOnly ? "fashion" : "music",
        autoplay: false,
        preload: true,
        preloadTargetSeconds: 10,
      });
      if (video !== previewVideo || !document.body.classList.contains("television-program-open")) return;
      resetPreview();
      if (item.audioOnly) window.IAMStreamController?.setFashionActive?.(video, true, "programme_preview");
      await video.play();
    } catch {
      if (video === previewVideo) stopCardPreview();
    }
  }

  function createChannelCard(channel, item, position) {
    const roomId = roomIdForChannel(channel);
    const card = document.createElement("button");
    const media = document.createElement("span");
    const copy = document.createElement("span");
    const descriptor = document.createElement("small");
    const artist = document.createElement("strong");
    const title = document.createElement("span");
    const live = document.createElement("span");
    const room = document.createElement("span");
    card.type = "button";
    card.className = "program-channel-card";
    card.dataset.room = roomId;
    card.dataset.channelId = channel.id;
    card.setAttribute("aria-current", String(roomId === activeRoom()));
    card.setAttribute("aria-label", `Inspect ${channel.name}: ${item.artist} — ${item.title}`);
    card.disabled = item.unavailable === true;
    media.className = "program-channel-card__media";
    copy.className = "program-channel-card__copy";
    descriptor.textContent = item.broadcastDescriptor || item.broadcastDescription || channel.description || "LIVE MUSIC";
    artist.textContent = item.artist || channel.name;
    title.textContent = item.title || "Live now";
    live.className = "program-channel-card__live";
    live.textContent = "LIVE";
    room.className = "program-channel-card__room";
    room.textContent = channel.name;

    if (activeMode === "radio" && item.radioLogoSrc) {
      const palette = Array.isArray(item.cardPalette) && item.cardPalette.length >= 2 ? item.cardPalette : ["#17231d", "#49564d"];
      media.style.setProperty("--program-card-a", palette[0]);
      media.style.setProperty("--program-card-b", palette[1]);
      media.classList.add("program-channel-card__media--radio");
      const logo = document.createElement("img");
      logo.src = item.radioLogoSrc;
      logo.alt = item.radioLogoAlt || item.artist || channel.name;
      logo.loading = position < 5 ? "eager" : "lazy";
      media.append(logo);
    } else if (item.thumbnailUrl) {
      const image = document.createElement("img");
      image.src = item.thumbnailUrl;
      image.alt = "";
      image.loading = position < 5 ? "eager" : "lazy";
      media.append(image);
    } else {
      const placeholder = document.createElement("span");
      placeholder.className = "program-channel-card__placeholder";
      placeholder.textContent = channel.name;
      media.append(placeholder);
    }

    if (item.previewVideoSrc && activeMode !== "radio") {
      const previewLabel = document.createElement("span");
      previewLabel.className = "program-channel-card__preview-label";
      previewLabel.textContent = "10S LIVE PREVIEW";
      media.append(previewLabel);
    }
    media.append(live, room);
    copy.append(descriptor, artist, title);
    card.append(media, copy);
    card.addEventListener("pointerenter", () => startCardPreview(card));
    card.addEventListener("pointerleave", () => {
      if (previewCard === card) stopCardPreview();
    });
    card.addEventListener("focus", () => startCardPreview(card));
    card.addEventListener("blur", () => {
      if (previewCard === card) stopCardPreview();
    });
    card.addEventListener("click", (event) => {
      event.preventDefault();
      activeRooms[activeMode] = roomId;
      expanded = false;
      stopCardPreview();
      renderCards();
      renderSchedule();
      programScroll.scrollTop = 0;
    });
    return card;
  }

  function renderCards() {
    const nowMs = serverNow();
    const liveItems = window.IAMMusicChannels?.programmeItems?.(activeMode) || [];
    const itemByChannel = new Map(liveItems.map((item) => [item.broadcastChannelId, item]));
    const nextProgrammeItems = channelsForMode().map((channel) => itemByChannel.get(channel.id) || fallbackProgrammeItem(channel, nowMs));
    const nextSignature = JSON.stringify({
      mode: activeMode,
      room: activeRoom(),
      items: nextProgrammeItems.map((item) => [
        item.broadcastChannelId,
        item.artist,
        item.title,
        item.previewVideoSrc,
        item.unavailable === true,
      ]),
    });
    if (nextSignature === programmeCardsSignature) {
      programmeItems = nextProgrammeItems;
      return;
    }
    stopCardPreview();
    programmeCardsSignature = nextSignature;
    programmeItems = nextProgrammeItems;
    cardRail.replaceChildren(...channelsForMode().map((channel, position) => {
      const item = programmeItems.find((candidate) => candidate.broadcastChannelId === channel.id) || fallbackProgrammeItem(channel, nowMs);
      return createChannelCard(channel, item, position);
    }));
    cardRail.style.setProperty("--program-channel-count", String(Math.max(1, channelsForMode().length)));
  }

  function renderSchedule() {
    const nowMs = serverNow();
    const currentChannel = channelForRoom();
    const requestedHours = activeMode === "videos" ? 24 : (expanded ? 24 : 6);
    const maximumEvents = activeMode === "videos" ? (expanded ? 512 : 9) : (expanded ? 256 : 64);
    const events = upcomingEvents(currentChannel, nowMs, requestedHours, maximumEvents);
    const visibleEvents = activeMode === "videos" && !expanded ? events.slice(0, 9) : events;
    const current = visibleEvents[0];
    const next = visibleEvents[1] || visibleEvents[0];
    if (!current || !next) return false;

    programPanel.dataset.programMode = activeMode;
    setText("[data-zone-label]", ZONE_LABELS[activeZone] || ZONE_LABELS.local);
    setText("[data-date-label]", dateLabel(nowMs));
    setText("[data-footer-zone]", activeZone === "local"
      ? `your local time · ${timeZone()}`
      : `${(ZONE_LABELS[activeZone] || "TIME").toLowerCase()} · ${timeZone()}`);

    setText("[data-now-time]", timeLabel(current.startMs));
    setText("[data-now-remaining]", remainingLabel(current.endMs - nowMs));
    setText("[data-now-room]", roomName(activeRoom()));
    setText("[data-now-artist]", current.track.artist);
    setText("[data-now-title]", current.track.title);
    setText("[data-next-time]", timeLabel(next.startMs));
    setText("[data-next-artist]", next.track.artist);
    setText("[data-next-title]", next.track.title);
    setText("[data-next-duration]", durationLabel(next.entry.duration_seconds));

    const videoDefault = activeMode === "videos" && !expanded;
    setText("[data-horizon-label]", videoDefault ? "NEXT 8 VIDEOS" : (expanded ? "NEXT 24 HOURS" : "NEXT 6 HOURS"));
    setText("[data-more-label]", expanded ? "LESS" : "MORE");
    setText("[data-more-range]", activeMode === "videos"
      ? (expanded ? "SHOW NEXT 8" : "VIEW FULL DAY")
      : (expanded ? "RETURN TO 6 HOURS" : "VIEW 24 HOURS"));
    moreButton.setAttribute("aria-expanded", String(expanded));
    renderList("[data-later-list]", visibleEvents.slice(2));

    const showHistory = activeMode === "videos";
    historySection.hidden = !showHistory;
    if (showHistory) renderList("[data-history-list]", previousEvents(currentChannel, nowMs, 3));

    modeButtons.forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.programMode === activeMode));
    });
    zoneButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.zone === activeZone));
    });
    return true;
  }

  function syncFromLiveBroadcast() {
    const state = window.IAMMusicChannels?.getState?.() || {};
    activeMode = modeIs(state.mode || document.body.dataset.musicChannelMode);
    const activeItemId = String(state.activeItemId || document.body.dataset.musicChannelItem || "");
    const activeItemRoom = activeItemId.replace(/^broadcast-(?:video|party|radio)-/, "");
    const activeItemChannel = channelsForMode(activeMode)
      .find((channel) => roomIdForChannel(channel) === activeItemRoom);
    const channelId = String(state.broadcast?.channelId || "");
    const liveChannel = (Array.isArray(schedule?.channels) ? schedule.channels : []).find((channel) => channel.id === channelId);
    if (activeItemChannel) {
      activeRooms[activeMode] = roomIdForChannel(activeItemChannel);
    } else if (liveChannel && MODES.includes(liveChannel.format)) {
      activeMode = liveChannel.format;
      activeRooms[activeMode] = roomIdForChannel(liveChannel);
    }
    if (!channelForRoom(activeRooms[activeMode], activeMode)) {
      activeRooms[activeMode] = roomIdForChannel(channelsForMode(activeMode)[0]) || DEFAULT_ROOMS[activeMode];
    }
  }

  function selectMode(mode) {
    if (!MODES.includes(mode)) return;
    stopCardPreview();
    activeMode = mode;
    expanded = false;
    if (!channelForRoom(activeRooms[activeMode], activeMode)) {
      activeRooms[activeMode] = roomIdForChannel(channelsForMode(activeMode)[0]) || DEFAULT_ROOMS[activeMode];
    }
    renderCards();
    renderSchedule();
    programScroll.scrollTop = 0;
  }

  async function openProgram(event) {
    event?.preventDefault();
    event?.stopPropagation();
    previouslyFocusedElement = event?.currentTarget || document.activeElement;
    openButtons.forEach((button) => button.setAttribute("aria-busy", "true"));
    await ready;
    openButtons.forEach((button) => button.removeAttribute("aria-busy"));
    if (initializeError || !schedule) {
      document.body.dataset.programGuideState = "unavailable";
      return;
    }

    syncFromLiveBroadcast();
    expanded = false;
    enterLiveButton.disabled = false;
    enterLiveButton.textContent = "ENTER LIVE";
    programScroll.scrollTop = 0;
    renderCards();
    renderSchedule();
    document.body.classList.add("television-program-open");
    document.body.dataset.programGuideState = "open";
    programPanel.setAttribute("aria-hidden", "false");
    programPanel.removeAttribute("inert");
    programScrim.hidden = false;
    openButtons.forEach((button) => button.setAttribute("aria-expanded", "true"));
    window.setTimeout(() => programPanel.querySelector("[data-program-close]")?.focus({ preventScroll: true }), 220);
  }

  function closeProgram(event, { restoreFocus = true } = {}) {
    event?.preventDefault();
    event?.stopPropagation();
    stopCardPreview();
    document.body.classList.remove("television-program-open");
    document.body.dataset.programGuideState = schedule ? "ready" : "loading";
    programPanel.setAttribute("aria-hidden", "true");
    programPanel.setAttribute("inert", "");
    programScrim.hidden = true;
    openButtons.forEach((button) => button.setAttribute("aria-expanded", "false"));
    if (restoreFocus) previouslyFocusedElement?.focus?.({ preventScroll: true });
  }

  async function enterLive(event) {
    event.preventDefault();
    event.stopPropagation();
    const channelId = channelForRoom()?.id || "";
    if (!channelId || !window.IAMMusicChannels?.joinBroadcast) return;
    enterLiveButton.disabled = true;
    enterLiveButton.textContent = "TUNING…";
    document.body.dataset.programLiveState = "tuning";
    document.body.dataset.programLiveChannel = channelId;
    try {
      window.IAMMusicChannels.setMode?.(activeMode);
      const joinRequest = window.IAMMusicChannels.joinBroadcast(channelId);
      document.body.dataset.programLiveState = "joining";
      enterLiveButton.disabled = false;
      enterLiveButton.textContent = "ENTER LIVE";
      closeProgram(null, { restoreFocus: false });
      await joinRequest;
      document.body.dataset.programLiveState = "joined";
    } catch (error) {
      document.body.dataset.programLiveState = "error";
      document.body.dataset.programLiveError = String(error?.message || error).slice(0, 120);
      enterLiveButton.textContent = "TRY AGAIN";
      window.setTimeout(() => {
        enterLiveButton.textContent = "ENTER LIVE";
      }, 1800);
    } finally {
      enterLiveButton.disabled = false;
      if (!document.body.classList.contains("television-program-open")) enterLiveButton.textContent = "ENTER LIVE";
    }
  }

  function exploreChannels(event) {
    event.preventDefault();
    event.stopPropagation();
    closeProgram(null, { restoreFocus: false });
    window.IAMMusicChannels?.openChannels?.(activeMode);
  }

  modeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      selectMode(button.dataset.programMode || "videos");
    });
  });
  zoneButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      activeZone = button.dataset.zone || "local";
      renderSchedule();
    });
  });
  moreButton.addEventListener("click", (event) => {
    event.preventDefault();
    expanded = !expanded;
    renderSchedule();
    if (!expanded) programScroll.scrollTop = 0;
  });
  channelsButton.addEventListener("click", exploreChannels);
  openButtons.forEach((button) => {
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", openProgram);
  });
  document.querySelectorAll("[data-program-close]").forEach((button) => {
    button.addEventListener("click", closeProgram);
  });
  programPanel.addEventListener("click", (event) => event.stopPropagation());
  enterLiveButton.addEventListener("click", enterLive);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !document.body.classList.contains("television-program-open")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeProgram(event);
  }, true);
  window.addEventListener("iam:music-channels-ready", () => {
    if (!schedule) return;
    renderCards();
    if (document.body.classList.contains("television-program-open")) renderSchedule();
  });

  async function initialize() {
    document.body.dataset.programGuideState = "loading";
    const [scheduleResponse, catalogueResponse, stationsResponse] = await Promise.all([
      fetch("broadcast-schedule-v1.json?v=programme-guide-app-2", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      }),
      fetch("adaptive-music-video-catalogue-v1.11.json?v=programme-guide-app-2", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      }),
      fetch("radio-station-tensor-notion-export-v1.0.json?v=programme-guide-app-2", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      }),
    ]);
    if (!scheduleResponse.ok) throw new Error(`Schedule ${scheduleResponse.status}`);
    if (!catalogueResponse.ok) throw new Error(`Catalogue ${catalogueResponse.status}`);
    if (!stationsResponse.ok) throw new Error(`Radio catalogue ${stationsResponse.status}`);
    schedule = await scheduleResponse.json();
    const catalogue = await catalogueResponse.json();
    const stations = await stationsResponse.json();
    catalogueTracks = new Map((Array.isArray(catalogue?.tracks) ? catalogue.tracks : [])
      .filter((track) => track?.id)
      .map((track) => [String(track.id), track]));
    radioStations = new Map((Array.isArray(stations?.records) ? stations.records : [])
      .filter((station) => station?.id)
      .map((station) => [String(station.id), station]));
    await window.IAMBroadcastClock?.ready;
    syncFromLiveBroadcast();
    renderCards();
    renderSchedule();
    document.body.dataset.programGuideState = "ready";
    renderTimer = window.setInterval(() => {
      if (!document.body.classList.contains("television-program-open")) return;
      renderCards();
      renderSchedule();
    }, 30000);
  }

  const ready = initialize().catch((error) => {
    initializeError = error;
    document.body.dataset.programGuideState = "unavailable";
    document.body.dataset.programGuideError = String(error?.message || error).slice(0, 120);
  });

  window.addEventListener("pagehide", () => {
    if (renderTimer) window.clearInterval(renderTimer);
    renderTimer = 0;
    stopCardPreview();
  }, { once: true });

  window.IAMProgrammeGuide = {
    version: "programme_guide_live_destination_v2",
    ready,
    open: openProgram,
    close: closeProgram,
    selectMode,
    getState() {
      return {
        open: document.body.classList.contains("television-program-open"),
        activeMode,
        activeRoom: activeRoom(),
        activeChannelId: channelForRoom()?.id || "",
        activeZone,
        timeZone: timeZone(),
        expanded,
        scheduleVersion: schedule?.version || "",
        catalogueTrackCount: catalogueTracks.size,
        liveCardCount: cardRail.children.length,
        previewingChannelId: previewCard?.dataset.channelId || "",
        clockSource: window.IAMBroadcastClock?.diagnostics?.().clockSource || "device_fallback",
        error: initializeError ? String(initializeError?.message || initializeError) : "",
      };
    },
  };
})();
