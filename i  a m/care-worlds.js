(() => {
  const experience = document.querySelector("[data-care-experience]");
  if (!experience) return;

  const views = new Set(["connect", "comfort", "talk"]);
  const openButtons = Array.from(document.querySelectorAll("[data-care-open]"));
  const tabs = Array.from(experience.querySelectorAll("[data-care-tab]"));
  const panels = Array.from(experience.querySelectorAll("[data-care-panel]"));
  const closeButton = experience.querySelector("[data-care-close]");
  const roleButtons = Array.from(experience.querySelectorAll("[data-care-connect-role]"));
  const remoteRole = experience.querySelector("[data-care-remote-role]");
  const checkout = experience.querySelector("[data-care-checkout]");
  const address = experience.querySelector("[data-care-address]");
  const checkoutStatus = experience.querySelector("[data-care-checkout-status]");

  const rooms = {
    connect: {
      shell: experience.querySelector(".care-call"),
      action: experience.querySelector("[data-care-connect-action]"),
      camera: experience.querySelector('[data-care-device="camera"]'),
      microphone: experience.querySelector('[data-care-device="microphone"]'),
      preview: experience.querySelector('[data-care-camera-preview="connect"]'),
      status: experience.querySelector('[data-care-status="connect"]'),
      time: experience.querySelector("[data-care-call-time]"),
      startLabel: "Connect",
      recovery: null,
      recoveryActivation: null,
    },
    talk: {
      shell: experience.querySelector(".care-clinical-room"),
      action: experience.querySelector("[data-care-talk-action]"),
      camera: experience.querySelector('[data-care-talk-device="camera"]'),
      microphone: experience.querySelector('[data-care-talk-device="microphone"]'),
      preview: experience.querySelector('[data-care-camera-preview="talk"]'),
      status: experience.querySelector('[data-care-status="talk"]'),
      time: null,
      startLabel: "Talk",
      recovery: null,
      recoveryActivation: null,
    },
  };

  let currentView = "connect";
  let closeTimer = 0;
  let cameraTrack = null;
  let cameraOwner = "";
  let microphoneTrack = null;
  let microphoneOwner = "";
  let callStartedAt = 0;
  let callTimer = 0;

  function createRecoveryPresenter(scope) {
    const room = rooms[scope];
    const toolbar = room?.shell?.querySelector(scope === "connect" ? ".care-call__toolbar" : ".care-clinical-room__toolbar");
    if (!room?.shell || !toolbar) return null;
    const card = document.createElement("div");
    card.className = `care-permission-recovery care-permission-recovery--${scope}`;
    card.setAttribute("role", "status");
    card.setAttribute("aria-live", "polite");
    card.hidden = true;
    card.innerHTML = `
      <strong data-care-recovery-title>VOICE READY</strong>
      <span data-care-recovery-copy>Return to the experience.</span>
      <button type="button" data-care-recovery-return><span aria-hidden="true">⛶</span> RETURN TO FULL SCREEN</button>
      <small data-care-recovery-reward hidden></small>
    `;
    toolbar.before(card);
    const title = card.querySelector("[data-care-recovery-title]");
    const copy = card.querySelector("[data-care-recovery-copy]");
    const button = card.querySelector("[data-care-recovery-return]");
    const reward = card.querySelector("[data-care-recovery-reward]");

    function setReturnLabel(rewardEligible) {
      button.replaceChildren();
      const icon = document.createElement("span");
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "⛶";
      button.append(icon, document.createTextNode(
        rewardEligible ? " RETURN TO FULL SCREEN · +100 HAPPINESS" : " RETURN TO FULL SCREEN",
      ));
    }

    button.addEventListener("click", () => {
      const activationId = card.dataset.activationId || "";
      if (activationId) void window.IAMPermissionRecovery?.returnToFullscreen?.(activationId);
    });

    return {
      showReady(detail) {
        room.recoveryActivation = detail.activation;
        card.hidden = false;
        card.dataset.state = "ready";
        card.dataset.activationId = detail.activationId;
        title.textContent = detail.title;
        copy.textContent = "Return to the experience.";
        copy.hidden = false;
        button.hidden = false;
        reward.hidden = true;
        reward.textContent = "";
        setReturnLabel(Boolean(detail.rewardEligible));
      },
      updateRewardEligibility(detail) {
        if (card.dataset.activationId === detail.activationId) setReturnLabel(Boolean(detail.rewardEligible));
      },
      showReturning() {
        copy.textContent = "Returning to the experience…";
      },
      showRetry() {
        copy.textContent = "Tap again to return to the experience.";
      },
      showRestored() {
        card.dataset.state = "restored";
        title.textContent = "WELCOME BACK";
        copy.hidden = true;
        button.hidden = true;
      },
      showReward(detail) {
        reward.textContent = detail.text || "";
        reward.hidden = !detail.text;
      },
      focusReturn() {
        button.focus({ preventScroll: true });
      },
      hide(detail) {
        if (detail?.activationId && card.dataset.activationId !== detail.activationId) return;
        card.hidden = true;
        card.dataset.state = "idle";
        delete card.dataset.activationId;
        copy.hidden = false;
        button.hidden = false;
        reward.hidden = true;
        if (!detail?.activationId || room.recoveryActivation?.activationId === detail.activationId) {
          room.recoveryActivation = null;
        }
      },
    };
  }

  rooms.connect.recovery = createRecoveryPresenter("connect");
  rooms.talk.recovery = createRecoveryPresenter("talk");

  async function beginDeviceRecovery(scope, device) {
    const coordinator = window.IAMPermissionRecovery;
    if (typeof coordinator?.beginActivation !== "function") return null;
    return coordinator.beginActivation({
      surface: `care-${scope}`,
      devices: [device],
      presenter: rooms[scope]?.recovery,
      fullscreenTarget: document.querySelector(".site-shell") || document.documentElement,
    });
  }

  async function completeDeviceRecovery(activation) {
    if (!activation) return { eligible: false };
    return window.IAMPermissionRecovery?.completeActivation?.(activation) || { eligible: false };
  }

  function cancelDeviceRecovery(activation) {
    if (activation) window.IAMPermissionRecovery?.cancelActivation?.(activation);
  }

  function writeStatus(scope, message, isError = false) {
    const status = rooms[scope]?.status;
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  }

  async function waitForAgora(method, timeoutMs = 8000) {
    const startedAt = Date.now();
    while (!window.AgoraRTC?.[method] && Date.now() - startedAt < timeoutMs) {
      await new Promise((resolve) => window.setTimeout(resolve, 80));
    }
    if (!window.AgoraRTC?.[method]) throw new Error("Controls unavailable");
    return window.AgoraRTC;
  }

  function setDeviceState(scope, device, enabled) {
    const button = rooms[scope]?.[device];
    if (!button) return;
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", `Turn ${device} ${enabled ? "off" : "on"}`);
  }

  function stopCamera(scope = "") {
    if (scope && cameraOwner !== scope) return;
    const owner = cameraOwner;
    if (cameraTrack) {
      try { cameraTrack.stop(); } catch {}
      try { cameraTrack.close(); } catch {}
    }
    cameraTrack = null;
    cameraOwner = "";
    if (owner) {
      rooms[owner]?.preview?.classList.remove("is-camera-on");
      setDeviceState(owner, "camera", false);
    }
  }

  function stopMicrophone(scope = "") {
    if (scope && microphoneOwner !== scope) return;
    const owner = microphoneOwner;
    if (microphoneTrack) {
      try { microphoneTrack.stop(); } catch {}
      try { microphoneTrack.close(); } catch {}
    }
    microphoneTrack = null;
    microphoneOwner = "";
    if (owner) setDeviceState(owner, "microphone", false);
  }

  async function toggleCamera(scope) {
    const room = rooms[scope];
    if (!room?.camera || !room.preview) return;
    if (cameraTrack && cameraOwner === scope) {
      stopCamera(scope);
      writeStatus(scope, "Camera off");
      return;
    }

    stopCamera();
    room.camera.disabled = true;
    room.camera.setAttribute("aria-busy", "true");
    writeStatus(scope, "Starting camera…");
    let recovery = null;
    try {
      const AgoraRTC = await waitForAgora("createCameraVideoTrack");
      recovery = await beginDeviceRecovery(scope, "camera");
      cameraTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: "480p_1",
        facingMode: "user",
        optimizationMode: "motion",
      });
      cameraOwner = scope;
      room.preview.classList.add("is-camera-on");
      cameraTrack.play(room.preview, { fit: "cover", mirror: true });
      setDeviceState(scope, "camera", true);
      writeStatus(scope, "Camera on");
      await completeDeviceRecovery(recovery);
    } catch (error) {
      cancelDeviceRecovery(recovery);
      stopCamera();
      writeStatus(scope, error?.name === "NotAllowedError" ? "Camera access was not granted" : "Camera unavailable", true);
    } finally {
      room.camera.disabled = false;
      room.camera.removeAttribute("aria-busy");
    }
  }

  async function toggleMicrophone(scope) {
    const room = rooms[scope];
    if (!room?.microphone) return;
    if (microphoneTrack && microphoneOwner === scope) {
      stopMicrophone(scope);
      writeStatus(scope, "Microphone off");
      return;
    }

    stopMicrophone();
    room.microphone.disabled = true;
    room.microphone.setAttribute("aria-busy", "true");
    writeStatus(scope, "Starting microphone…");
    let recovery = null;
    try {
      const AgoraRTC = await waitForAgora("createMicrophoneAudioTrack");
      recovery = await beginDeviceRecovery(scope, "microphone");
      microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack({
        AEC: true,
        AGC: true,
        ANS: true,
      });
      microphoneOwner = scope;
      setDeviceState(scope, "microphone", true);
      writeStatus(scope, "Microphone on");
      await completeDeviceRecovery(recovery);
    } catch (error) {
      cancelDeviceRecovery(recovery);
      stopMicrophone();
      writeStatus(scope, error?.name === "NotAllowedError" ? "Microphone access was not granted" : "Microphone unavailable", true);
    } finally {
      room.microphone.disabled = false;
      room.microphone.removeAttribute("aria-busy");
    }
  }

  function updateCallTime() {
    const time = rooms.connect.time;
    if (!callStartedAt || !time) return;
    const elapsed = Math.max(0, Math.floor((Date.now() - callStartedAt) / 1000));
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const seconds = String(elapsed % 60).padStart(2, "0");
    time.textContent = `${minutes}:${seconds}`;
  }

  function endRoom(scope) {
    const room = rooms[scope];
    if (!room) return;
    cancelDeviceRecovery(room.recoveryActivation);
    room.recoveryActivation = null;
    room.shell?.classList.remove("is-connected");
    room.action?.setAttribute("aria-pressed", "false");
    if (room.action) room.action.textContent = room.startLabel;
    stopCamera(scope);
    stopMicrophone(scope);
    writeStatus(scope, "Ready");

    if (scope === "connect") {
      window.clearInterval(callTimer);
      callTimer = 0;
      callStartedAt = 0;
      if (room.time) room.time.textContent = "00:00";
    }
  }

  function toggleRoom(scope) {
    const room = rooms[scope];
    if (!room?.shell || !room.action) return;
    if (room.shell.classList.contains("is-connected")) {
      endRoom(scope);
      return;
    }
    room.shell.classList.add("is-connected");
    room.action.setAttribute("aria-pressed", "true");
    room.action.textContent = "End";
    writeStatus(scope, "Connected");
    if (scope === "connect") {
      callStartedAt = Date.now();
      updateCallTime();
      callTimer = window.setInterval(updateCallTime, 1000);
    }
  }

  function setRole(role) {
    const selected = roleButtons.find((button) => button.dataset.careConnectRole === role);
    if (!selected) return;
    roleButtons.forEach((button) => button.setAttribute("aria-pressed", String(button === selected)));
    if (remoteRole) remoteRole.textContent = selected.textContent.trim();
  }

  function setView(view, { focusTab = false } = {}) {
    if (!views.has(view)) return;
    if (currentView !== view && rooms[currentView]) endRoom(currentView);
    currentView = view;
    experience.dataset.careView = view;
    tabs.forEach((tab) => {
      const active = tab.dataset.careTab === view;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focusTab) tab.focus({ preventScroll: true });
    });
    panels.forEach((panel) => {
      const active = panel.dataset.carePanel === view;
      panel.hidden = !active;
      panel.setAttribute("aria-hidden", String(!active));
    });
    experience.querySelector(".care-experience__worlds")?.scrollTo({ top: 0, behavior: "auto" });
  }

  function openCare(view) {
    window.clearTimeout(closeTimer);
    window.dispatchEvent(new CustomEvent("iam:care-open"));
    experience.hidden = false;
    experience.setAttribute("aria-hidden", "false");
    document.body.classList.add("care-experience-open");
    setView(views.has(view) ? view : "connect");
    window.requestAnimationFrame(() => {
      experience.classList.add("is-open");
      closeButton?.focus({ preventScroll: true });
    });
  }

  function closeCare() {
    endRoom("connect");
    endRoom("talk");
    if (document.activeElement instanceof HTMLElement && experience.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    experience.classList.remove("is-open");
    experience.setAttribute("aria-hidden", "true");
    document.body.classList.remove("care-experience-open");
    closeTimer = window.setTimeout(() => {
      experience.hidden = true;
    }, 360);
  }

  function focusableElements() {
    return Array.from(experience.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.closest("[hidden]") && element.getAttribute("aria-hidden") !== "true");
  }

  openButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openCare(button.dataset.careOpen || "connect");
    });
  });

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => setView(tab.dataset.careTab || "connect"));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + direction + tabs.length) % tabs.length;
      setView(tabs[nextIndex].dataset.careTab || "connect", { focusTab: true });
    });
  });

  roleButtons.forEach((button) => button.addEventListener("click", () => setRole(button.dataset.careConnectRole)));
  rooms.connect.camera?.addEventListener("click", () => toggleCamera("connect"));
  rooms.connect.microphone?.addEventListener("click", () => toggleMicrophone("connect"));
  rooms.connect.action?.addEventListener("click", () => toggleRoom("connect"));
  rooms.talk.camera?.addEventListener("click", () => toggleCamera("talk"));
  rooms.talk.microphone?.addEventListener("click", () => toggleMicrophone("talk"));
  rooms.talk.action?.addEventListener("click", () => toggleRoom("talk"));
  closeButton?.addEventListener("click", () => closeCare());
  experience.querySelector(".care-experience__backdrop")?.addEventListener("click", () => closeCare());

  checkout?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!address?.value.trim()) {
      address?.focus();
      return;
    }
    checkout.classList.add("is-ready");
    const submit = checkout.querySelector('button[type="submit"]');
    if (submit) submit.innerHTML = "Ready <span>&mdash; $0</span>";
    if (checkoutStatus) checkoutStatus.textContent = "Delivery details ready. No order was placed in this preview.";
  });

  address?.addEventListener("input", () => {
    if (!checkout?.classList.contains("is-ready")) return;
    checkout.classList.remove("is-ready");
    const submit = checkout.querySelector('button[type="submit"]');
    if (submit) submit.innerHTML = "Continue <span>&mdash; $0</span>";
    if (checkoutStatus) checkoutStatus.textContent = "Target delivery: within one hour in eligible areas.";
  });

  document.addEventListener("keydown", (event) => {
    if (experience.hidden || experience.getAttribute("aria-hidden") === "true") return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeCare();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = focusableElements();
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
  });

  window.addEventListener("pagehide", () => {
    endRoom("connect");
    endRoom("talk");
  });
  setRole("mentor");
})();
