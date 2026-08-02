(() => {
  "use strict";

  const ROOM_CHANNELS = {
    "inner-planes": "party-inner-planes",
    "champagne-bohemia": "party-champagne-bohemia",
    "modul8-infinity": "party-modul8-infinity",
    "james-bondage": "party-james-bondage",
  };

  const ROOM_NAMES = {
    "inner-planes": "Inner Planes",
    "champagne-bohemia": "Champagne Bohemia",
    "modul8-infinity": "modul8 infinity",
    "james-bondage": "james bondage",
  };

  const ROOM_FOR_CHANNEL = Object.fromEntries(
    Object.entries(ROOM_CHANNELS).map(([roomId, channelId]) => [channelId, roomId])
  );

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
  const moreButton = document.querySelector("[data-program-more]");
  const roomSwitcher = document.querySelector(".program-room-switcher");
  const roomButtons = Array.from(document.querySelectorAll("[data-program-panel] [data-room]"));
  const zoneButtons = Array.from(document.querySelectorAll("[data-program-panel] [data-zone]"));
  const openButtons = Array.from(document.querySelectorAll("[data-program-open]"));
  const enterLiveButton = document.querySelector("[data-enter-live]");

  if (!programPanel || !programScroll || !programScrim || !moreButton || !enterLiveButton) return;

  let schedule = null;
  let catalogueTracks = new Map();
  let activeRoom = "modul8-infinity";
  let activeZone = "local";
  let horizonHours = 6;
  let renderTimer = 0;
  let initializeError = null;
  let previouslyFocusedElement = null;

  function positiveModulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function serverNow() {
    return window.IAMBroadcastClock?.nowMs?.() || Date.now();
  }

  function humanizeTrackId(trackId) {
    return String(trackId || "Scheduled programme")
      .split("-")
      .filter(Boolean)
      .map((word) => word.length > 3 ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word)
      .join(" ");
  }

  function trackFor(entry) {
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
    return { artist: "Universal Mind", title: humanizeTrackId(trackId) };
  }

  function channelForRoom(roomId) {
    const channelId = ROOM_CHANNELS[roomId];
    return schedule?.channels?.find((channel) => channel.id === channelId) || null;
  }

  function eventsFor(channel, nowMs, requestedHours) {
    const entries = Array.isArray(channel?.schedule) ? channel.schedule : [];
    const epochMs = Date.parse(channel?.epoch_utc || schedule?.epoch_utc || "");
    const cycleSeconds = entries.reduce((sum, entry) => sum + Number(entry.duration_seconds || 0), 0);
    if (!entries.length || !Number.isFinite(epochMs) || cycleSeconds <= 0) return [];

    const elapsedSeconds = (nowMs - epochMs) / 1000;
    const cycleIndex = Math.floor(elapsedSeconds / cycleSeconds);
    const cyclePosition = positiveModulo(elapsedSeconds, cycleSeconds);
    let cursor = 0;
    let currentIndex = 0;

    for (let index = 0; index < entries.length; index += 1) {
      const nextCursor = cursor + Number(entries[index].duration_seconds);
      if (cyclePosition < nextCursor || index === entries.length - 1) {
        currentIndex = index;
        break;
      }
      cursor = nextCursor;
    }

    const currentStart = epochMs + ((cycleIndex * cycleSeconds + cursor) * 1000);
    const horizonEnd = nowMs + (requestedHours * 60 * 60 * 1000);
    const events = [];
    let eventIndex = currentIndex;
    let eventStart = currentStart;

    while (eventStart < horizonEnd && events.length < 64) {
      const entry = entries[eventIndex];
      const durationMs = Number(entry.duration_seconds) * 1000;
      events.push({
        entry,
        startMs: eventStart,
        endMs: eventStart + durationMs,
        track: trackFor(entry),
      });
      eventStart += durationMs;
      eventIndex = (eventIndex + 1) % entries.length;
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

  function renderLaterEvents(events) {
    const list = programPanel.querySelector("[data-later-list]");
    if (!list) return;
    list.replaceChildren(...events.map((event) => {
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
    }));
  }

  function renderSchedule() {
    const nowMs = serverNow();
    const events = eventsFor(channelForRoom(activeRoom), nowMs, horizonHours);
    const current = events[0];
    const next = events[1];
    if (!current || !next) return false;

    const clockSource = window.IAMBroadcastClock?.diagnostics?.().clockSource || "device_fallback";
    setText("[data-zone-label]", ZONE_LABELS[activeZone] || ZONE_LABELS.local);
    setText("[data-date-label]", dateLabel(nowMs));
    setText("[data-clock-source]", clockSource === "server_midpoint_monotonic" ? "LIVE CLOCK / SYNC" : "DEVICE CLOCK");
    setText("[data-footer-zone]", activeZone === "local"
      ? `your local time · ${timeZone()}`
      : `${(ZONE_LABELS[activeZone] || "TIME").toLowerCase()} · ${timeZone()}`);

    setText("[data-now-time]", timeLabel(current.startMs));
    setText("[data-now-remaining]", remainingLabel(current.endMs - nowMs));
    setText("[data-now-room]", ROOM_NAMES[activeRoom]);
    setText("[data-now-artist]", current.track.artist);
    setText("[data-now-title]", current.track.title);

    setText("[data-next-time]", timeLabel(next.startMs));
    setText("[data-next-artist]", next.track.artist);
    setText("[data-next-title]", next.track.title);
    setText("[data-next-duration]", durationLabel(next.entry.duration_seconds));

    setText("[data-horizon-label]", horizonHours === 6 ? "NEXT 6 HOURS" : "NEXT 24 HOURS");
    setText("[data-more-label]", horizonHours === 6 ? "MORE" : "LESS");
    setText("[data-more-range]", horizonHours === 6 ? "VIEW 24 HOURS" : "RETURN TO 6 HOURS");
    moreButton.setAttribute("aria-expanded", String(horizonHours === 24));
    renderLaterEvents(events.slice(2));

    roomButtons.forEach((button) => {
      button.setAttribute("aria-current", String(button.dataset.room === activeRoom));
    });
    zoneButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.zone === activeZone));
    });

    const activeRoomButton = roomButtons.find((button) => button.dataset.room === activeRoom);
    window.requestAnimationFrame(() => {
      if (!activeRoomButton || !roomSwitcher) return;
      const centredLeft = activeRoomButton.offsetLeft - ((roomSwitcher.clientWidth - activeRoomButton.offsetWidth) / 2);
      roomSwitcher.scrollLeft = Math.max(0, centredLeft);
    });
    return true;
  }

  function syncRoomFromLiveBroadcast() {
    const channelId = window.IAMMusicChannels?.getState?.().broadcast?.channelId || "";
    if (ROOM_FOR_CHANNEL[channelId]) activeRoom = ROOM_FOR_CHANNEL[channelId];
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

    syncRoomFromLiveBroadcast();
    horizonHours = 6;
    enterLiveButton.disabled = false;
    enterLiveButton.textContent = "ENTER LIVE";
    programScroll.scrollTop = 0;
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
    const channelId = ROOM_CHANNELS[activeRoom];
    if (!channelId || !window.IAMMusicChannels?.joinBroadcast) return;
    enterLiveButton.disabled = true;
    enterLiveButton.textContent = "TUNING…";
    document.body.dataset.programLiveState = "tuning";
    document.body.dataset.programLiveChannel = channelId;
    try {
      window.IAMMusicChannels.setMode?.("parties");
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

  roomButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      activeRoom = button.dataset.room || activeRoom;
      horizonHours = 6;
      programScroll.scrollTop = 0;
      renderSchedule();
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
    horizonHours = horizonHours === 6 ? 24 : 6;
    renderSchedule();
    if (horizonHours === 6) programScroll.scrollTop = 0;
  });

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

  async function initialize() {
    document.body.dataset.programGuideState = "loading";
    const [scheduleResponse, catalogueResponse] = await Promise.all([
      fetch("broadcast-schedule-v1.json?v=programme-guide-app-1", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      }),
      fetch("adaptive-music-video-catalogue-v1.11.json?v=programme-guide-app-1", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      }),
    ]);
    if (!scheduleResponse.ok) throw new Error(`Schedule ${scheduleResponse.status}`);
    if (!catalogueResponse.ok) throw new Error(`Catalogue ${catalogueResponse.status}`);
    schedule = await scheduleResponse.json();
    const catalogue = await catalogueResponse.json();
    catalogueTracks = new Map((Array.isArray(catalogue?.tracks) ? catalogue.tracks : [])
      .filter((track) => track?.id)
      .map((track) => [String(track.id), track]));
    await window.IAMBroadcastClock?.ready;
    renderSchedule();
    document.body.dataset.programGuideState = "ready";
    renderTimer = window.setInterval(() => {
      if (document.body.classList.contains("television-program-open")) renderSchedule();
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
  }, { once: true });

  window.IAMProgrammeGuide = {
    version: "programme_guide_app_v1",
    ready,
    open: openProgram,
    close: closeProgram,
    getState() {
      return {
        open: document.body.classList.contains("television-program-open"),
        activeRoom,
        activeChannelId: ROOM_CHANNELS[activeRoom],
        activeZone,
        timeZone: timeZone(),
        horizonHours,
        scheduleVersion: schedule?.version || "",
        catalogueTrackCount: catalogueTracks.size,
        clockSource: window.IAMBroadcastClock?.diagnostics?.().clockSource || "device_fallback",
        error: initializeError ? String(initializeError?.message || initializeError) : "",
      };
    },
  };
})();
