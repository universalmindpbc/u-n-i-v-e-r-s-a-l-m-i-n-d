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

  const TIME_ZONES = {
    local: Intl.DateTimeFormat().resolvedOptions().timeZone || "Australia/Sydney",
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

  const TRACKS = {
    "max-richter-cercle-odyssey-paris": {
      artist: "Max Richter",
      title: "Cercle Odyssey, Paris",
      file: "a s s e t s/d j  s e t s/Max Richter live at Cercle Odyssey, Paris, France.mp4",
    },
    "olafur-arnalds-hafursey-iceland-cercle": {
      artist: "Ólafur Arnalds",
      title: "Hafursey, Iceland",
      file: "a s s e t s/d j  s e t s/Ólafur Arnalds live from Hafursey, in Iceland for Cercle.mp4",
    },
    "sasha-ibiza-boat-at-sunset-freqways": {
      artist: "Sasha",
      title: "Ibiza Boat at Sunset",
      file: "a s s e t s/d j  s e t s/ Sasha - Ibiza Boat at Sunset - Freqways.mp4",
    },
    "ben-bohmer-cappadocia-cercle": {
      artist: "Ben Böhmer",
      title: "Cappadocia, Turkey",
      file: "a s s e t s/d j  s e t s/Ben Böhmer live - Cappadocia, Turkey - Cercle.mp4",
    },
    "peggy-gou-palais-des-beaux-arts-cercle": {
      artist: "Peggy Gou",
      title: "Palais des Beaux-Arts, Lille",
      file: "a s s e t s/d j  s e t s/Peggy Gou - Cercle - Palais des Beaux - Cercle.mp4",
    },
    "miss-monique-biosphere-montreal-cercle": {
      artist: "Miss Monique",
      title: "Biosphere, Montreal",
      file: "a s s e t s/d j  s e t s/Miss Monique - Biosphere Museum in Montreal, Canada - Cercle.mp4",
    },
    "nina-kraviz-eiffel-tower-cercle": {
      artist: "Nina Kraviz",
      title: "Eiffel Tower, Paris",
      file: "a s s e t s/d j  s e t s/Nina Kraviz - Eiffel Tower, Paris, France - Cercle.mp4",
    },
    "nastia-drum-bass-sunset-the-lab-ibiza": {
      artist: "NASTIA",
      title: "Drum & Bass Sunset · The Lab Ibiza",
      file: "a s s e t s/d j  s e t s/NASTIA - Ibiza at Sunset - The Lab.mp4",
    },
    "carl-cox-chateau-de-chambord-cercle": {
      artist: "Carl Cox",
      title: "Château de Chambord, France",
      file: "a s s e t s/d j  s e t s/Carl Cox - Château de Chambord, France - Cercle.mp4",
    },
    "zip-perlon-air-festival-2007": {
      artist: "Zip",
      title: "Perlon · Air Festival, 2007",
      file: "a s s e t s/d j  s e t s/Zip (Perlon) - Air Festival, 2007.mp4",
    },
    "zip-sammy-d-perlon-betalounge-2000": {
      artist: "Zip & Sammy D",
      title: "Perlon · Betalounge, 2000",
      file: "a s s e t s/d j  s e t s/Zip & Sammy D (Perlon) - Betalounge, 2000.mp4",
    },
  };

  const body = document.body;
  const stageBackground = document.querySelector("[data-stage-background]");
  const programPanel = document.querySelector("[data-program-panel]");
  const programScroll = document.querySelector("[data-program-scroll]");
  const programScrim = document.querySelector(".program-scrim");
  const moreButton = document.querySelector("[data-program-more]");
  const roomButtons = Array.from(document.querySelectorAll("[data-room]"));
  const zoneButtons = Array.from(document.querySelectorAll("[data-zone]"));
  const walletPanels = Array.from(document.querySelectorAll("[data-wallet-panel]"));
  const walletTrigger = document.querySelector("[data-wallet-trigger]");

  let schedule = null;
  let serverOffsetMs = 0;
  let activeRoom = "modul8-infinity";
  let activeZone = "local";
  let horizonHours = 6;
  let lastBackgroundTrack = "";

  function positiveModulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function serverNow() {
    return Date.now() + serverOffsetMs;
  }

  function trackFor(entry) {
    return TRACKS[entry?.track_id] || {
      artist: "Universal Mind",
      title: entry?.track_id || "Scheduled programme",
      file: "",
    };
  }

  function channelForRoom(roomId) {
    const channelId = ROOM_CHANNELS[roomId];
    return schedule?.channels?.find((channel) => channel.id === channelId) || null;
  }

  function eventsFor(channel, nowMs, requestedHours) {
    const entries = Array.isArray(channel?.schedule) ? channel.schedule : [];
    const epochMs = Date.parse(schedule?.epoch_utc || "");
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

    while (eventStart < horizonEnd && events.length < 40) {
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
      hour12: false,
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

  function backgroundFor(track) {
    if (!track?.file || track.file === lastBackgroundTrack) return;
    const asset = window.IAMCloudflareStream?.assetFor?.(track.file);
    if (!asset) return;
    lastBackgroundTrack = track.file;
    const thumbnail = `https://${window.IAMCloudflareStream.customerHost}/${asset.uid}/thumbnails/thumbnail.jpg?time=180s&height=1080`;
    stageBackground.style.opacity = "0";
    const reveal = () => {
      stageBackground.style.opacity = "1";
    };
    stageBackground.addEventListener("load", reveal, { once: true });
    stageBackground.src = thumbnail;
  }

  function renderSchedule() {
    const nowMs = serverNow();
    const channel = channelForRoom(activeRoom);
    const events = eventsFor(channel, nowMs, horizonHours);
    const current = events[0];
    const next = events[1];
    if (!current || !next) return;

    document.querySelector("[data-zone-label]").textContent = ZONE_LABELS[activeZone] || ZONE_LABELS.local;
    document.querySelector("[data-date-label]").textContent = dateLabel(nowMs);
    document.querySelector("[data-footer-zone]").textContent = activeZone === "local"
      ? `your local time · ${timeZone()}`
      : `${ZONE_LABELS[activeZone].toLowerCase()} · ${timeZone()}`;

    document.querySelector("[data-now-time]").textContent = timeLabel(current.startMs);
    document.querySelector("[data-now-remaining]").textContent = remainingLabel(current.endMs - nowMs);
    document.querySelector("[data-now-room]").textContent = ROOM_NAMES[activeRoom];
    document.querySelector("[data-now-artist]").textContent = current.track.artist;
    document.querySelector("[data-now-title]").textContent = current.track.title;

    document.querySelector("[data-next-time]").textContent = timeLabel(next.startMs);
    document.querySelector("[data-next-artist]").textContent = next.track.artist;
    document.querySelector("[data-next-title]").textContent = next.track.title;
    document.querySelector("[data-next-duration]").textContent = durationLabel(next.entry.duration_seconds);

    document.querySelector("[data-horizon-label]").textContent = horizonHours === 6 ? "NEXT 6 HOURS" : "NEXT 24 HOURS";
    document.querySelector("[data-more-label]").textContent = horizonHours === 6 ? "MORE" : "LESS";
    document.querySelector("[data-more-range]").textContent = horizonHours === 6 ? "VIEW 24 HOURS" : "RETURN TO 6 HOURS";
    moreButton.setAttribute("aria-expanded", String(horizonHours === 24));

    const laterEvents = events.slice(2);
    document.querySelector("[data-later-list]").innerHTML = laterEvents.map((event) => `
      <li>
        <time datetime="${new Date(event.startMs).toISOString()}">${timeLabel(event.startMs)}</time>
        <div>
          <strong>${event.track.artist}</strong>
          <small>${event.track.title}</small>
        </div>
        <em>${durationLabel(event.entry.duration_seconds)}</em>
      </li>
    `).join("");

    roomButtons.forEach((button) => {
      button.setAttribute("aria-current", String(button.dataset.room === activeRoom));
    });
    zoneButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.zone === activeZone));
    });

    const activeRoomButton = roomButtons.find((button) => button.dataset.room === activeRoom);
    window.requestAnimationFrame(() => {
      activeRoomButton?.scrollIntoView({ block: "nearest", inline: "center" });
    });

    backgroundFor(current.track);
  }

  async function synchronizeClock() {
    const startedAt = Date.now();
    try {
      const response = await fetch(`api/broadcast-clock.php?program_mockup=${startedAt}`, {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Clock ${response.status}`);
      const payload = await response.json();
      const endedAt = Date.now();
      const serverNowMs = Number(payload?.server_now_ms);
      if (!Number.isFinite(serverNowMs)) throw new Error("Invalid clock");
      serverOffsetMs = serverNowMs - ((startedAt + endedAt) / 2);
      document.querySelector("[data-clock-source]").textContent = "LIVE CLOCK / SYNC";
    } catch (_error) {
      document.querySelector("[data-clock-source]").textContent = "DEVICE CLOCK";
    }
  }

  function setWalletView(view) {
    const validView = ["closed", "categories", "mix", "music"].includes(view) ? view : "closed";
    body.dataset.walletView = validView;
    walletTrigger.setAttribute("aria-expanded", String(validView !== "closed"));
    walletPanels.forEach((panel) => {
      const active = panel.dataset.walletPanel === validView;
      panel.setAttribute("aria-hidden", String(!active));
      panel.toggleAttribute("inert", !active);
    });
  }

  function openProgram() {
    if (!schedule) return;
    setWalletView("music");
    body.classList.add("program-is-open");
    programPanel.setAttribute("aria-hidden", "false");
    programPanel.removeAttribute("inert");
    programScrim.hidden = false;
    renderSchedule();
    window.setTimeout(() => document.querySelector("[data-program-close]")?.focus({ preventScroll: true }), 220);
  }

  function closeProgram() {
    body.classList.remove("program-is-open");
    programPanel.setAttribute("aria-hidden", "true");
    programPanel.setAttribute("inert", "");
    programScrim.hidden = true;
    document.querySelector("[data-program-open]")?.focus({ preventScroll: true });
  }

  roomButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeRoom = button.dataset.room || activeRoom;
      horizonHours = 6;
      programScroll.scrollTop = 0;
      renderSchedule();
    });
  });

  zoneButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeZone = button.dataset.zone || "local";
      renderSchedule();
    });
  });

  moreButton.addEventListener("click", () => {
    horizonHours = horizonHours === 6 ? 24 : 6;
    renderSchedule();
    if (horizonHours === 6) programScroll.scrollTop = 0;
  });

  document.querySelectorAll("[data-program-open]").forEach((button) => button.addEventListener("click", openProgram));
  document.querySelectorAll("[data-program-close]").forEach((button) => button.addEventListener("click", closeProgram));
  document.querySelectorAll("[data-wallet-open]").forEach((button) => {
    button.addEventListener("click", () => setWalletView(button.dataset.walletOpen));
  });

  walletTrigger.addEventListener("click", () => {
    setWalletView(body.dataset.walletView === "closed" ? "categories" : "closed");
  });

  document.querySelector("[data-enter-live]").addEventListener("click", closeProgram);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (body.classList.contains("program-is-open")) closeProgram();
    else setWalletView("closed");
  });

  async function initialize() {
    const scheduleResponse = await fetch("broadcast-schedule-v1.json?v=program-study-1", {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!scheduleResponse.ok) throw new Error(`Schedule ${scheduleResponse.status}`);
    schedule = await scheduleResponse.json();
    await synchronizeClock();
    renderSchedule();

    const requestedView = new URLSearchParams(window.location.search).get("view");
    if (requestedView === "program") openProgram();
    else setWalletView("closed");

    window.setInterval(renderSchedule, 30000);
  }

  initialize().catch((error) => {
    document.querySelector("[data-clock-source]").textContent = "SCHEDULE UNAVAILABLE";
    document.body.dataset.programMockupError = String(error?.message || error).slice(0, 120);
  });
})();
