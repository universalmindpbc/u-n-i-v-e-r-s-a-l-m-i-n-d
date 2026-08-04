(() => {
  const experience = document.querySelector("[data-care-experience]");
  if (!experience) return;

  const openButtons = Array.from(document.querySelectorAll("[data-care-open]"));
  const tabs = Array.from(experience.querySelectorAll("[data-care-tab]"));
  const panels = Array.from(experience.querySelectorAll("[data-care-panel]"));
  const closeButton = experience.querySelector("[data-care-close]");
  const connectRoles = Array.from(experience.querySelectorAll("[data-care-connect-role]"));
  const modeGroups = Array.from(experience.querySelectorAll("[data-care-mode-group]"));
  const prepareButtons = Array.from(experience.querySelectorAll("[data-care-prepare]"));
  const productButtons = Array.from(experience.querySelectorAll("[data-care-product]"));
  const productCount = experience.querySelector("[data-care-product-count]");
  const productSummary = experience.querySelector("[data-care-product-summary]");
  const remoteRole = experience.querySelector("[data-care-remote-role]");

  const MODES = new Set(["face", "see", "voice"]);
  const VIEWS = new Set(["connect", "comfort", "talk"]);
  const ROLE_LABELS = {
    mentor: "VERIFIED MENTOR",
    peer: "VERIFIED PEER",
    community: "AUDIO COMMUNITY",
  };
  const PRODUCT_LABELS = {
    tea: "Pukka Three Ginger tea",
    incense: "Organic Goodness White Sage incense",
    hoodie: "Acne Studios pink hoodie",
    "ugg boots": "Ugg boots",
    music: "Listening ritual",
  };

  let currentView = "connect";
  let currentRole = "mentor";
  let previousFocus = null;
  let closeTimer = 0;
  let agoraVideoTrack = null;
  let previewOwner = "";
  const selectedModes = { connect: "see", talk: "see" };

  function statusFor(scope) {
    return experience.querySelector(`[data-care-status="${scope}"]`);
  }

  function prepareFor(scope) {
    return experience.querySelector(`[data-care-prepare="${scope}"]`);
  }

  function previewFor(scope) {
    return experience.querySelector(`[data-care-camera-preview="${scope}"]`);
  }

  function modeButtons(scope) {
    const group = experience.querySelector(`[data-care-mode-group="${scope}"]`);
    return group ? Array.from(group.querySelectorAll("[data-care-call-mode]")) : [];
  }

  function writeStatus(scope, message) {
    const status = statusFor(scope);
    if (status) status.textContent = message;
  }

  function updatePrepareLabel(scope) {
    const button = prepareFor(scope);
    if (!button) return;
    if (scope === "connect" && currentRole === "community") {
      button.textContent = "Open audio communities";
      return;
    }
    const mode = selectedModes[scope];
    if (mode === "face") button.textContent = "Preview my camera";
    else if (mode === "see") button.textContent = scope === "talk" ? "Prepare future video room" : "Prepare private room";
    else button.textContent = scope === "talk" ? "Prepare future voice room" : "Prepare voice room";
  }

  function setMode(scope, mode) {
    if (!MODES.has(mode)) return;
    selectedModes[scope] = mode;
    modeButtons(scope).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.careCallMode === mode));
    });
    updatePrepareLabel(scope);

    if (scope === "connect" && currentRole === "community") {
      writeStatus("connect", "Community stays audio-first so shared music and conversation remain at the centre.");
    } else if (mode === "face") {
      writeStatus(scope, "Face to face selected. Your camera will start only after you choose to preview it.");
    } else if (mode === "see") {
      writeStatus(scope, "You can see the human supporting you while keeping your own camera off.");
    } else {
      writeStatus(scope, "Voice only selected. No camera will be requested.");
    }
  }

  function setRole(role) {
    if (!Object.prototype.hasOwnProperty.call(ROLE_LABELS, role)) return;
    currentRole = role;
    connectRoles.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.careConnectRole === role));
    });
    if (remoteRole) remoteRole.textContent = ROLE_LABELS[role];

    const connectModes = modeButtons("connect");
    const community = role === "community";
    connectModes.forEach((button) => {
      const voice = button.dataset.careCallMode === "voice";
      button.disabled = community && !voice;
    });
    if (community) setMode("connect", "voice");
    else {
      if (selectedModes.connect === "voice") setMode("connect", "see");
      else setMode("connect", selectedModes.connect);
      writeStatus("connect", `Private ${role} room selected. Human availability is not yet live.`);
    }
    updatePrepareLabel("connect");
  }

  async function waitForAgora(timeoutMs = 8000) {
    const startedAt = Date.now();
    while (!window.AgoraRTC?.createCameraVideoTrack && Date.now() - startedAt < timeoutMs) {
      await new Promise((resolve) => window.setTimeout(resolve, 80));
    }
    if (!window.AgoraRTC?.createCameraVideoTrack) {
      throw new Error("Agora video could not load. Please try again.");
    }
    return window.AgoraRTC;
  }

  function resetPreviewElement(scope) {
    const preview = previewFor(scope);
    if (!preview) return;
    preview.classList.remove("is-live");
    preview.replaceChildren();
    const label = document.createElement("span");
    label.textContent = "YOUR CAMERA";
    const state = document.createElement("small");
    state.textContent = "off";
    preview.append(label, state);
  }

  function stopCameraPreview() {
    if (agoraVideoTrack) {
      try { agoraVideoTrack.stop(); } catch {}
      try { agoraVideoTrack.close(); } catch {}
    }
    agoraVideoTrack = null;
    if (previewOwner) resetPreviewElement(previewOwner);
    previewOwner = "";
  }

  async function startCameraPreview(scope) {
    const button = prepareFor(scope);
    const preview = previewFor(scope);
    if (!button || !preview) return;
    button.setAttribute("aria-busy", "true");
    button.disabled = true;
    writeStatus(scope, "Preparing a private Agora camera preview on this device...");
    stopCameraPreview();

    try {
      const AgoraRTC = await waitForAgora();
      agoraVideoTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: "480p_1",
        facingMode: "user",
        optimizationMode: "motion",
      });
      previewOwner = scope;
      preview.replaceChildren();
      preview.classList.add("is-live");
      agoraVideoTrack.play(preview, { fit: "cover", mirror: true });
      writeStatus(scope, "Camera preview ready. It has not joined a room and is not being recorded or transmitted to another person.");
      button.textContent = "Camera ready";
    } catch (error) {
      const message = error?.name === "NotAllowedError"
        ? "Camera access was not granted. You can continue with your camera off or choose voice only."
        : String(error?.message || "Camera preview is unavailable. You can continue with your camera off.");
      writeStatus(scope, message);
      resetPreviewElement(scope);
    } finally {
      button.removeAttribute("aria-busy");
      button.disabled = false;
    }
  }

  async function prepareRoom(scope) {
    if (scope === "connect" && currentRole === "community") {
      stopCameraPreview();
      closeCare({ restoreFocus: false });
      window.setTimeout(() => {
        document.querySelector("[data-audio-mode-open]")?.click();
      }, 360);
      return;
    }

    const mode = selectedModes[scope];
    if (mode === "face") {
      await startCameraPreview(scope);
      return;
    }
    stopCameraPreview();
    if (mode === "see") {
      writeStatus(scope, scope === "talk"
        ? "Your camera will remain off. A verified clinician could appear here when a formal video service is active."
        : `Your camera will remain off. A verified ${currentRole} could appear here when the pilot network is staffed.`);
    } else {
      writeStatus(scope, scope === "talk"
        ? "Voice only is selected. The future clinician integration is not yet active."
        : `Voice only is selected. The private ${currentRole} network is not yet staffed.`);
    }
  }

  function updatePackage() {
    const selected = productButtons
      .filter((button) => button.getAttribute("aria-pressed") === "true")
      .map((button) => PRODUCT_LABELS[button.dataset.careProduct] || button.dataset.careProduct);
    if (productCount) productCount.textContent = String(selected.length);
    if (productSummary) productSummary.textContent = selected.length ? selected.join(" · ") : "Choose something that feels right";
  }

  function setView(view, { focusTab = false } = {}) {
    if (!VIEWS.has(view)) return;
    if (currentView !== view) stopCameraPreview();
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
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    experience.hidden = false;
    experience.setAttribute("aria-hidden", "false");
    document.body.classList.add("care-experience-open");
    setView(VIEWS.has(view) ? view : "connect");
    window.requestAnimationFrame(() => {
      experience.classList.add("is-open");
      closeButton?.focus({ preventScroll: true });
    });
  }

  function closeCare({ restoreFocus = true } = {}) {
    stopCameraPreview();
    experience.classList.remove("is-open");
    experience.setAttribute("aria-hidden", "true");
    document.body.classList.remove("care-experience-open");
    closeTimer = window.setTimeout(() => {
      experience.hidden = true;
      if (restoreFocus && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    }, 540);
  }

  function focusableElements() {
    return Array.from(experience.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'))
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

  closeButton?.addEventListener("click", () => closeCare());
  experience.querySelector(".care-experience__backdrop")?.addEventListener("click", () => closeCare());

  connectRoles.forEach((button) => {
    button.addEventListener("click", () => setRole(button.dataset.careConnectRole || "mentor"));
  });

  modeGroups.forEach((group) => {
    const scope = group.dataset.careModeGroup;
    group.querySelectorAll("[data-care-call-mode]").forEach((button) => {
      button.addEventListener("click", () => setMode(scope, button.dataset.careCallMode || "see"));
    });
  });

  prepareButtons.forEach((button) => {
    button.addEventListener("click", () => prepareRoom(button.dataset.carePrepare));
  });

  productButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.getAttribute("aria-pressed") === "true";
      button.setAttribute("aria-pressed", String(!selected));
      updatePackage();
    });
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

  window.addEventListener("pagehide", stopCameraPreview);
  setRole("mentor");
  setMode("talk", "see");
  updatePackage();
})();
