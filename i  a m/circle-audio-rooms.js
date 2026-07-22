(() => {
  const selector = document.querySelector("[data-circle-room-selector]");
  if (!selector) return;

  const CIRCLES = Object.freeze([
    { id: "img", name: "IMG", joinName: "IMG", description: "Models" },
    { id: "wme", name: "WME", joinName: "WME", description: "Talent" },
    { id: "north-bondi-rsl", name: "North Bondi RSL", joinName: "North Bondi RSL", description: "Veterans" },
    { id: "nagnata", name: "NAGNATA", joinName: "NAGNATA", description: "Customers" },
    { id: "aime", name: "AIME", joinName: "AIME", description: "First Nations imagination" },
    { id: "black-rainbow", name: "Black Rainbow", joinName: "Black Rainbow", description: "First Nations mental health" },
    { id: "headspace", name: "Headspace", joinName: "Headspace", description: "Youth mental health" },
    { id: "phoenix", name: "Phoenix", joinName: "Phoenix", description: "Veterans mental health" },
  ]);

  const CAPACITY = 9;
  const selectorButtons = Array.from(selector.querySelectorAll("[data-circle-id]"));
  const energySignals = Array.from(selector.querySelectorAll("[data-circle-energy]"));
  const selectorCloseButtons = Array.from(selector.querySelectorAll("[data-circle-selector-close]"));
  const selectedName = selector.querySelector("[data-circle-selected-name]");
  const selectedDescription = selector.querySelector("[data-circle-selected-description]");
  const selectedStatus = selector.querySelector("[data-circle-selected-status]");
  const statusLine = selector.querySelector("[data-circle-selector-status]");
  const endpointMeta = document.querySelector('meta[name="iam-circle-room-endpoint"]');
  const endpoint = String(window.IAM_CIRCLE_ROOM_ENDPOINT || endpointMeta?.content || "").replace(/\/+$/, "");
  const catalogue = new Map();

  let previousFocus = null;
  let selectedCircleId = "";
  let previewCircleId = "";
  let client = null;
  let localTrack = null;
  let presenceSocket = null;
  let reservation = null;
  let operationPending = false;
  let intentionalDisconnect = false;
  let state = {
    selectorOpen: false,
    joined: false,
    muted: true,
    occupancy: 0,
    capacity: CAPACITY,
    circleId: "",
    circleName: "",
    roomNumber: 0,
    error: "",
  };

  function makeId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    const bytes = new Uint32Array(4);
    window.crypto?.getRandomValues?.(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(8, "0")).join("-");
  }

  function getSessionId() {
    const key = "iamCircleRoomSessionV1";
    try {
      const existing = window.sessionStorage.getItem(key);
      if (existing) return existing;
      const created = makeId();
      window.sessionStorage.setItem(key, created);
      return created;
    } catch {
      return makeId();
    }
  }

  const sessionId = getSessionId();

  function circleForId(circleId) {
    return CIRCLES.find((circle) => circle.id === circleId) || null;
  }

  function endpointUrl(path) {
    if (!endpoint) throw new Error("Circle rooms are not configured yet.");
    return new URL(path.replace(/^\//, ""), `${endpoint}/`).toString();
  }

  async function readJson(response) {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "The Circle room could not be reached.");
    return payload;
  }

  function setStatus(message = "", isError = false) {
    if (!statusLine) return;
    statusLine.textContent = message;
    statusLine.classList.toggle("is-error", Boolean(isError));
    state.error = isError ? message : "";
  }

  function updateAvailability(summary) {
    if (!summary?.id) return;
    catalogue.set(summary.id, summary);
  }

  function updateSelectionPanel() {
    const circle = circleForId(selectedCircleId);
    selectorButtons.forEach((button) => {
      const active = operationPending && button.dataset.circleId === circle?.id;
      button.classList.toggle("is-selected", active);
      button.classList.toggle("is-joining", active);
      button.disabled = operationPending;
      button.setAttribute("aria-busy", String(active));
      const action = button.querySelector("[data-circle-action]");
      if (action) action.textContent = active ? "Joining…" : "";
    });
    energySignals.forEach((signal) => {
      const signalId = signal.dataset.circleEnergy || "";
      signal.classList.toggle("is-selected", operationPending && signalId === circle?.id);
      signal.classList.toggle("is-preview", !operationPending && signalId === previewCircleId);
    });
    selector.dataset.selectedCircle = operationPending ? circle?.id || "" : "";

    if (state.joined) {
      selectedName.textContent = state.circleName;
      selectedDescription.textContent = "You are already in this Circle";
      selectedStatus.textContent = `room ${state.roomNumber} · ${state.occupancy}/${CAPACITY} live`;
    } else {
      selectedName.textContent = "Join A Tribe";
      selectedDescription.textContent = "9 people per room · you join muted";
      selectedStatus.textContent = operationPending && circle ? `Joining ${circle.joinName}…` : "";
    }
  }

  function emitState() {
    document.body.dataset.circleRoomJoined = String(state.joined);
    document.body.dataset.circleRoomId = state.joined ? state.circleId : "";
    window.dispatchEvent(new CustomEvent("iam:circle-room-state", {
      detail: { ...state },
    }));
    updateSelectionPanel();
  }

  async function joinCircle(circleId) {
    if (state.joined || operationPending || !circleForId(circleId)) return;
    selectedCircleId = circleId;
    previewCircleId = "";
    setStatus();
    updateSelectionPanel();
    await joinSelected();
  }

  function previewCircle(circleId = "") {
    if (operationPending) return;
    previewCircleId = circleForId(circleId) ? circleId : "";
    updateSelectionPanel();
  }

  async function refreshCatalogue() {
    if (!endpoint) return;

    try {
      const response = await fetch(endpointUrl("/audio-rooms"), {
        headers: { Accept: "application/json" },
        cache: "no-store",
        mode: "cors",
      });
      const payload = await readJson(response);
      (payload.circles || []).forEach(updateAvailability);
      updateSelectionPanel();
    } catch {
      // Catalogue counts are supplementary; joining remains available from every node.
    }
  }

  function open(source = null) {
    if (state.selectorOpen) return;
    previousFocus = source || document.activeElement;
    selectedCircleId = "";
    previewCircleId = "";
    state.selectorOpen = true;
    selector.inert = false;
    selector.setAttribute("aria-hidden", "false");
    document.body.classList.add("circle-room-selector-open");
    emitState();
    refreshCatalogue();
    window.setTimeout(() => {
      selectorButtons[0]?.focus();
    }, 80);
  }

  function close({ restoreFocus = true } = {}) {
    if (!state.selectorOpen) return;
    state.selectorOpen = false;
    selector.inert = true;
    selector.setAttribute("aria-hidden", "true");
    document.body.classList.remove("circle-room-selector-open");
    previewCircleId = "";
    emitState();
    if (restoreFocus && previousFocus?.focus) previousFocus.focus();
  }

  function updateFromCircleSummary(summary) {
    updateAvailability(summary);
    if (!state.joined || summary.id !== state.circleId) return;
    const room = (summary.rooms || []).find((candidate) => Number(candidate.number) === state.roomNumber);
    state.occupancy = Math.max(1, Number(room?.count) || state.occupancy || 1);
    emitState();
  }

  async function waitForAgoraSdk(timeoutMs = 8000) {
    const startedAt = Date.now();
    while (!window.AgoraRTC?.createClient && Date.now() - startedAt < timeoutMs) {
      await new Promise((resolve) => window.setTimeout(resolve, 100));
    }
    if (!window.AgoraRTC?.createClient) throw new Error("Live audio could not load. Please try again.");
  }

  function connectPresence(joinPayload) {
    const presenceUrl = new URL(joinPayload.presence_url || endpointUrl("/audio-rooms/presence"));
    presenceUrl.protocol = presenceUrl.protocol === "https:" ? "wss:" : "ws:";
    presenceUrl.searchParams.set("circle_id", joinPayload.circle_id);
    presenceUrl.searchParams.set("session_id", sessionId);
    presenceUrl.searchParams.set("reservation_id", joinPayload.reservation_id);

    return new Promise((resolve, reject) => {
      const socket = new WebSocket(presenceUrl.toString());
      const timer = window.setTimeout(() => {
        socket.close();
        reject(new Error("The Circle presence service did not respond."));
      }, 6000);

      socket.addEventListener("open", () => {
        window.clearTimeout(timer);
        presenceSocket = socket;
        resolve(socket);
      }, { once: true });

      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "circle_status") updateFromCircleSummary(message.circle);
        } catch {
          // Presence messages are intentionally limited to structured room counts.
        }
      });

      socket.addEventListener("error", () => {
        window.clearTimeout(timer);
        if (socket !== presenceSocket) reject(new Error("The Circle presence connection failed."));
      }, { once: true });

      socket.addEventListener("close", () => {
        window.clearTimeout(timer);
        if (presenceSocket === socket) presenceSocket = null;
        if (!intentionalDisconnect && state.joined) handleUnexpectedDisconnect();
      });
    });
  }

  async function connectAgora(joinPayload) {
    await waitForAgoraSdk();

    const rtcClient = window.AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    rtcClient.on("user-published", async (user, mediaType) => {
      try {
        await rtcClient.subscribe(user, mediaType);
        if (mediaType === "audio") user.audioTrack?.play();
      } catch {
        setStatus("A Circle voice could not be played. Tap Join Circle to reconnect.", true);
      }
    });
    rtcClient.on("user-unpublished", (user, mediaType) => {
      if (mediaType === "audio") user.audioTrack?.stop?.();
    });
    await rtcClient.join(joinPayload.app_id, joinPayload.channel, joinPayload.token, Number(joinPayload.uid));
    client = rtcClient;
  }

  async function releaseReservation(joinPayload = reservation) {
    if (!joinPayload?.reservation_id || !endpoint) return;
    try {
      await fetch(endpointUrl("/audio-rooms/leave"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          circle_id: joinPayload.circle_id,
          session_id: sessionId,
          reservation_id: joinPayload.reservation_id,
        }),
        cache: "no-store",
        keepalive: true,
        mode: "cors",
      });
    } catch {
      // WebSocket close remains the primary presence release path.
    }
  }

  async function joinSelected() {
    const circle = circleForId(selectedCircleId);
    if (!circle || operationPending) return;

    operationPending = true;
    intentionalDisconnect = false;
    setStatus();
    updateSelectionPanel();

    let joinPayload = null;
    try {
      const response = await fetch(endpointUrl("/audio-rooms/join"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ circle_id: circle.id, session_id: sessionId }),
        cache: "no-store",
        mode: "cors",
      });
      joinPayload = await readJson(response);
      reservation = joinPayload;
      await connectAgora(joinPayload);
      await connectPresence(joinPayload);

      state = {
        ...state,
        joined: true,
        muted: true,
        occupancy: Math.max(1, Number(joinPayload.occupancy) || 1),
        capacity: CAPACITY,
        circleId: circle.id,
        circleName: circle.name,
        roomNumber: Math.max(1, Number(joinPayload.room_number) || 1),
        error: "",
      };
      window.IAMTelevisionAudio?.setVoiceConversationActive?.(true);
      setStatus();
      emitState();
      close({ restoreFocus: false });
      window.setTimeout(() => document.querySelector("[data-audio-wallet-mic]")?.focus(), 60);
    } catch (error) {
      intentionalDisconnect = true;
      presenceSocket?.close();
      presenceSocket = null;
      if (client) await client.leave().catch(() => null);
      client = null;
      await releaseReservation(joinPayload);
      reservation = null;
      const message = error?.message === "Failed to fetch" ? "The Circle could not be reached." : error?.message;
      setStatus(message || "The Circle could not be joined.", true);
      selectedCircleId = "";
    } finally {
      operationPending = false;
      updateSelectionPanel();
    }
  }

  async function toggleMute() {
    if (!state.joined || !client || operationPending) return;
    operationPending = true;
    try {
      if (state.muted) {
        if (!localTrack) {
          localTrack = await window.AgoraRTC.createMicrophoneAudioTrack({
            AEC: true,
            AGC: true,
            ANS: true,
            encoderConfig: "speech_standard",
          });
          await client.publish([localTrack]);
        } else {
          await localTrack.setMuted(false);
        }
        state.muted = false;
      } else {
        await localTrack?.setMuted(true);
        state.muted = true;
      }
      state.error = "";
      emitState();
    } catch (error) {
      setStatus(error.message || "Microphone access was not available.", true);
      open(document.querySelector("[data-audio-wallet-mic]"));
    } finally {
      operationPending = false;
    }
  }

  async function leave() {
    if ((!state.joined && !reservation) || operationPending) return;
    operationPending = true;
    intentionalDisconnect = true;
    const leavingReservation = reservation;
    reservation = null;

    try {
      presenceSocket?.close(1000, "left-circle");
      presenceSocket = null;
      if (localTrack) {
        await client?.unpublish?.([localTrack]).catch(() => null);
        localTrack.close();
        localTrack = null;
      }
      if (client) await client.leave().catch(() => null);
      client = null;
      await releaseReservation(leavingReservation);
    } finally {
      window.IAMTelevisionAudio?.setVoiceConversationActive?.(false);
      state = {
        ...state,
        joined: false,
        muted: true,
        occupancy: 0,
        circleId: "",
        circleName: "",
        roomNumber: 0,
        error: "",
      };
      selectedCircleId = "";
      operationPending = false;
      intentionalDisconnect = false;
      emitState();
      refreshCatalogue();
    }
  }

  async function handleUnexpectedDisconnect() {
    if (!state.joined) return;
    intentionalDisconnect = true;
    if (localTrack) {
      localTrack.close();
      localTrack = null;
    }
    if (client) await client.leave().catch(() => null);
    client = null;
    reservation = null;
    window.IAMTelevisionAudio?.setVoiceConversationActive?.(false);
    state = {
      ...state,
      joined: false,
      muted: true,
      occupancy: 0,
      circleId: "",
      circleName: "",
      roomNumber: 0,
    };
    emitState();
    open();
    setStatus("The Circle connection ended. Join again when you are ready.", true);
    intentionalDisconnect = false;
  }

  function trapDialogFocus(event) {
    if (!state.selectorOpen || event.key !== "Tab") return;
    const focusable = Array.from(selector.querySelectorAll("button:not([disabled]):not([hidden])"))
      .filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  selectorButtons.forEach((button) => {
    const circleId = button.dataset.circleId || "";
    button.addEventListener("click", () => void joinCircle(circleId));
    button.addEventListener("pointerenter", () => previewCircle(circleId));
    button.addEventListener("pointerleave", () => previewCircle());
    button.addEventListener("focus", () => previewCircle(circleId));
    button.addEventListener("blur", () => previewCircle());
  });
  selectorCloseButtons.forEach((button) => button.addEventListener("click", () => close()));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.selectorOpen) {
      event.preventDefault();
      close();
      return;
    }
    trapDialogFocus(event);
  });
  window.addEventListener("pagehide", () => {
    if (!reservation) return;
    intentionalDisconnect = true;
    presenceSocket?.close();
    releaseReservation(reservation);
  });

  window.IAMCircleRooms = {
    version: "circle_rooms_v2",
    circles: CIRCLES.map((circle) => ({ ...circle })),
    open,
    close,
    leave,
    toggleMute,
    refresh: refreshCatalogue,
    getState: () => ({ ...state }),
  };
  document.body.dataset.circleRoomsReady = "true";
})();
