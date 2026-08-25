(() => {
  "use strict";

  const MODES = ["videos", "parties", "radio"];
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
  const APPROVED_EDITORIAL_TRACKS = {
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

  const guide = document.querySelector("[data-program-guide]");
  const worldList = document.querySelector("[data-program-worlds]");
  const scheduleList = document.querySelector("[data-program-list]");
  const modeButtons = Array.from(document.querySelectorAll("[data-program-mode]"));
  const zoneButtons = Array.from(document.querySelectorAll("[data-zone]"));
  const rangeButtons = Array.from(document.querySelectorAll("[data-program-range]"));
  const enterLiveButton = document.querySelector("[data-enter-live]");

  let schedule = null;
  let catalogueTracks = new Map();
  let programmeTracks = new Map();
  let radioStations = new Map();
  let activeMode = "videos";
  let activeZone = "local";
  let activeRange = "short";
  let renderTimer = 0;
  let initializeError = null;
  const activeChannelIds = { videos: "", parties: "", radio: "" };

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  function positiveModulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function serverNow() {
    return window.IAMBroadcastClock?.nowMs?.() || Date.now();
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
    const totalMinutes = Math.max(1, Math.round(Number(seconds || 0) / 60));
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

  function humanize(value) {
    return String(value || "Scheduled programme")
      .split("-")
      .filter(Boolean)
      .map((word) => word.length > 2 ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word.toUpperCase())
      .join(" ");
  }

  function channelsForMode(mode = activeMode) {
    return (Array.isArray(schedule?.channels) ? schedule.channels : [])
      .filter((channel) => channel?.format === mode && channel?.internal !== true);
  }

  function activeChannel() {
    const channels = channelsForMode();
    return channels.find((channel) => channel.id === activeChannelIds[activeMode]) || channels[0] || null;
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

  function metadataFor(entry) {
    const stationId = String(entry?.station_id || "");
    if (stationId) {
      const station = radioStations.get(stationId);
      return {
        artist: String(station?.provider || station?.artist || "Live radio"),
        title: String(station?.display_title || station?.title || humanize(stationId)),
      };
    }

    const trackId = String(entry?.track_id || "");
    if (APPROVED_EDITORIAL_TRACKS[trackId]) return APPROVED_EDITORIAL_TRACKS[trackId];
    const catalogue = catalogueTracks.get(trackId);
    if (catalogue) {
      return {
        artist: String(catalogue.artist || "Universal Mind"),
        title: String(catalogue.title || humanize(trackId)),
      };
    }
    const programme = programmeTracks.get(trackId);
    if (programme) return programme;
    return { artist: "Universal Mind", title: humanize(trackId) };
  }

  function eventRecord(entry, startMs) {
    const durationMs = Math.max(1000, Number(entry?.duration_seconds || 0) * 1000);
    return {
      entry,
      startMs,
      endMs: startMs + durationMs,
      metadata: metadataFor(entry),
    };
  }

  function upcomingEvents(channel, nowMs) {
    const timeline = timelineFor(channel, nowMs);
    if (!timeline) return [];
    const shortVideos = activeMode === "videos" && activeRange === "short";
    const horizonHours = activeRange === "day" ? 24 : 6;
    const horizonEnd = nowMs + (horizonHours * 60 * 60 * 1000);
    const minimumEvents = shortVideos ? 9 : 2;
    const maximumEvents = activeRange === "day" ? (activeMode === "videos" ? 512 : 256) : (shortVideos ? 9 : 64);
    const events = [];
    let index = timeline.currentIndex;
    let startMs = timeline.currentStart;

    while ((shortVideos ? events.length < 9 : (startMs < horizonEnd || events.length < minimumEvents)) && events.length < maximumEvents) {
      const event = eventRecord(timeline.entries[index], startMs);
      events.push(event);
      startMs = event.endMs;
      index = (index + 1) % timeline.entries.length;
    }
    return events;
  }

  function createWorldButton(channel, index) {
    const button = document.createElement("button");
    const number = document.createElement("span");
    const name = document.createElement("strong");
    const descriptor = document.createElement("span");
    const description = document.createElement("small");
    button.type = "button";
    button.className = "program-world";
    button.dataset.channelId = channel.id;
    button.setAttribute("aria-current", String(channel.id === activeChannel()?.id));
    button.setAttribute("aria-label", `${channel.name}, ${channel.descriptor}, ${channel.description}`);
    number.className = "program-world__number";
    number.textContent = String(index + 1).padStart(2, "0");
    name.textContent = channel.name;
    descriptor.textContent = channel.descriptor;
    description.textContent = channel.description;
    button.append(number, name, descriptor, description);
    button.addEventListener("click", () => {
      activeChannelIds[activeMode] = channel.id;
      activeRange = "short";
      render();
    });
    return button;
  }

  function createScheduleItem(event, index) {
    const item = document.createElement("li");
    const time = document.createElement("time");
    const copy = document.createElement("div");
    const artist = document.createElement("strong");
    const title = document.createElement("small");
    const duration = document.createElement("em");
    item.className = "program-schedule__item";
    item.classList.toggle("is-current", index === 0);
    time.dateTime = new Date(event.startMs).toISOString();
    time.textContent = timeLabel(event.startMs);
    artist.textContent = event.metadata.artist;
    title.textContent = event.metadata.title;
    duration.textContent = durationLabel(event.entry.duration_seconds);
    copy.append(artist, title);
    item.append(time, copy, duration);
    return item;
  }

  function renderModeControls() {
    modeButtons.forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.programMode === activeMode));
    });
    MODES.forEach((mode) => {
      setText(`[data-mode-count="${mode}"]`, String(channelsForMode(mode).length).padStart(2, "0"));
    });
    zoneButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.zone === activeZone));
    });
    rangeButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.programRange === activeRange));
    });
  }

  function renderWorlds() {
    const channels = channelsForMode();
    worldList.style.setProperty("--program-world-count", String(Math.max(1, channels.length)));
    worldList.replaceChildren(...channels.map(createWorldButton));
  }

  function renderSchedule() {
    const nowMs = serverNow();
    const channel = activeChannel();
    const events = upcomingEvents(channel, nowMs);
    const current = events[0];
    if (!channel || !current) return false;

    setText("[data-zone-label]", ZONE_LABELS[activeZone] || ZONE_LABELS.local);
    setText("[data-date-label]", dateLabel(nowMs));
    setText("[data-world-name]", channel.name);
    setText("[data-world-descriptor]", channel.descriptor);
    setText("[data-world-description]", channel.description);
    setText("[data-now-time]", timeLabel(current.startMs));
    setText("[data-now-remaining]", remainingLabel(current.endMs - nowMs));
    setText("[data-now-artist]", current.metadata.artist);
    setText("[data-now-title]", current.metadata.title);
    setText("[data-short-range-label]", activeMode === "videos" ? "NEXT 8" : "NEXT 6 HOURS");
    setText("[data-horizon-label]", activeRange === "day"
      ? "NEXT 24 HOURS"
      : (activeMode === "videos" ? "NEXT 8 VIDEOS" : "NEXT 6 HOURS"));
    setText("[data-footer-zone]", activeZone === "local"
      ? `your local time · ${timeZone()}`
      : `${(ZONE_LABELS[activeZone] || "TIME").toLowerCase()} · ${timeZone()}`);
    scheduleList.replaceChildren(...events.map(createScheduleItem));
    document.body.dataset.programMode = activeMode;
    document.body.dataset.programChannel = channel.id;
    document.body.dataset.programRange = activeRange;
    return true;
  }

  function render() {
    if (!schedule) return;
    renderModeControls();
    renderWorlds();
    renderSchedule();
  }

  function selectMode(mode) {
    if (!MODES.includes(mode)) return;
    activeMode = mode;
    activeRange = "short";
    if (!channelsForMode().some((channel) => channel.id === activeChannelIds[activeMode])) {
      activeChannelIds[activeMode] = channelsForMode()[0]?.id || "";
    }
    render();
  }

  function initializeProgrammeMetadata(records) {
    programmeTracks = new Map();
    (Array.isArray(records) ? records : []).forEach((record) => {
      try {
        const profile = JSON.parse(record?.["JSON Profile"] || "{}");
        const trackId = String(profile?.selected_track_id || "");
        if (!trackId) return;
        programmeTracks.set(trackId, {
          artist: String(record?.Artist || "Universal Mind"),
          title: String(record?.Track || humanize(trackId)),
        });
      } catch {}
    });
  }

  async function initialize() {
    if (!guide || !worldList || !scheduleList || !enterLiveButton) return;
    const [scheduleResponse, catalogueResponse, stationsResponse, programmeResponse] = await Promise.all([
      fetch("broadcast-schedule-v1.json?v=public-program-guide-1", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      }),
      fetch("adaptive-music-video-catalogue-v1.11.json?v=public-program-guide-1", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      }),
      fetch("radio-station-tensor-notion-export-v1.0.json?v=public-program-guide-1", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      }),
      fetch("programme-tensor-approved-notion-export-v1.0.json?v=public-program-guide-1", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      }),
    ]);
    if (!scheduleResponse.ok) throw new Error(`Schedule ${scheduleResponse.status}`);
    if (!catalogueResponse.ok) throw new Error(`Catalogue ${catalogueResponse.status}`);
    if (!stationsResponse.ok) throw new Error(`Radio catalogue ${stationsResponse.status}`);
    if (!programmeResponse.ok) throw new Error(`Programme catalogue ${programmeResponse.status}`);

    schedule = await scheduleResponse.json();
    const catalogue = await catalogueResponse.json();
    const stations = await stationsResponse.json();
    const programmes = await programmeResponse.json();
    catalogueTracks = new Map((Array.isArray(catalogue?.tracks) ? catalogue.tracks : [])
      .filter((track) => track?.id)
      .map((track) => [String(track.id), track]));
    radioStations = new Map((Array.isArray(stations?.records) ? stations.records : [])
      .filter((station) => station?.id)
      .map((station) => [String(station.id), station]));
    initializeProgrammeMetadata(programmes?.records);
    await window.IAMBroadcastClock?.ready;
    MODES.forEach((mode) => {
      activeChannelIds[mode] = channelsForMode(mode)[0]?.id || "";
    });
    render();
    guide.setAttribute("aria-busy", "false");
    document.body.dataset.programGuideState = "ready";
    renderTimer = window.setInterval(renderSchedule, 30000);
  }

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => selectMode(button.dataset.programMode || "videos"));
  });
  zoneButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeZone = button.dataset.zone || "local";
      renderModeControls();
      renderSchedule();
    });
  });
  rangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeRange = button.dataset.programRange === "day" ? "day" : "short";
      renderModeControls();
      renderSchedule();
    });
  });
  enterLiveButton?.addEventListener("click", () => {
    document.body.dataset.programLiveState = "induction";
    document.body.dataset.programLiveChannel = activeChannel()?.id || "";
    window.location.assign("induction.html");
  });

  const globalNav = document.querySelector("[data-global-nav]");
  const openButtons = Array.from(document.querySelectorAll("[data-nav-open]"));
  const closeButtons = Array.from(document.querySelectorAll("[data-nav-close]"));
  const navItems = Array.from(document.querySelectorAll("[data-nav-item]"));
  const submenus = new Map(Array.from(document.querySelectorAll("[data-nav-submenu]"))
    .map((submenu) => [submenu.dataset.navSubmenu, submenu]));

  function setActiveNavigation(itemName) {
    navItems.forEach((item) => {
      const active = item.dataset.navItem === itemName;
      item.classList.toggle("is-active", active);
      if (submenus.has(item.dataset.navItem)) item.setAttribute("aria-expanded", String(active));
    });
    submenus.forEach((submenu, name) => {
      submenu.classList.toggle("is-open", name === itemName && !submenu.hasAttribute("data-mobile-editorial-hidden"));
    });
  }

  function openNavigation() {
    if (!globalNav) return;
    setActiveNavigation("program");
    document.body.classList.add("nav-open");
    globalNav.classList.add("is-open");
    globalNav.setAttribute("aria-hidden", "false");
  }

  function closeNavigation() {
    if (!globalNav) return;
    document.body.classList.remove("nav-open");
    globalNav.classList.remove("is-open");
    globalNav.setAttribute("aria-hidden", "true");
  }

  openButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (document.body.classList.contains("nav-open")) closeNavigation();
      else openNavigation();
    });
  });
  closeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeNavigation();
    });
  });
  navItems.forEach((item) => {
    item.addEventListener("mouseenter", () => setActiveNavigation(item.dataset.navItem || ""));
    item.addEventListener("focus", () => setActiveNavigation(item.dataset.navItem || ""));
    if (item.tagName === "A" && submenus.has(item.dataset.navItem)) {
      item.addEventListener("click", (event) => {
        const submenu = submenus.get(item.dataset.navItem);
        if (!submenu || submenu.hasAttribute("data-mobile-editorial-hidden")) return;
        event.preventDefault();
        setActiveNavigation(item.dataset.navItem || "");
      });
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !document.body.classList.contains("nav-open")) return;
    event.preventDefault();
    closeNavigation();
    openButtons[0]?.focus({ preventScroll: true });
  });

  const ready = initialize().catch((error) => {
    initializeError = error;
    guide?.setAttribute("aria-busy", "false");
    document.body.dataset.programGuideState = "unavailable";
    document.body.dataset.programGuideError = String(error?.message || error).slice(0, 120);
  });

  window.addEventListener("pagehide", () => {
    if (renderTimer) window.clearInterval(renderTimer);
    renderTimer = 0;
  }, { once: true });

  window.IAMPublicProgram = {
    version: "public_program_guide_v1",
    ready,
    selectMode,
    getState() {
      return {
        mode: activeMode,
        channelId: activeChannel()?.id || "",
        zone: activeZone,
        timeZone: timeZone(),
        range: activeRange,
        scheduleVersion: schedule?.version || "",
        publicChannelCount: MODES.reduce((total, mode) => total + channelsForMode(mode).length, 0),
        worldCount: worldList?.children.length || 0,
        eventCount: scheduleList?.children.length || 0,
        clockSource: window.IAMBroadcastClock?.diagnostics?.().clockSource || "device_fallback",
        error: initializeError ? String(initializeError?.message || initializeError) : "",
      };
    },
  };
})();
