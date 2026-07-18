(function () {
  const DEFAULT_PEAK = 0.055;
  const SETTINGS_ENDPOINT = "api/quantum-tree-settings.php";
  const SOURCE_LABEL = "Quantum Tree AAC · 192 kbps";
  const accessPanel = document.querySelector("[data-owner-access]");
  const dashboard = document.querySelector("[data-owner-dashboard]");
  const loginForm = document.querySelector("[data-owner-login]");
  const ownerKey = document.querySelector("[data-owner-key]");
  const ownerStatus = document.querySelector("[data-owner-status]");
  const logoutButton = document.querySelector("[data-owner-logout]");
  const audio = document.querySelector("[data-quantum-preview]");
  const slider = document.querySelector("#quantum-peak-slider");
  const playToggle = document.querySelector("[data-preview-toggle]");
  const stopButton = document.querySelector("[data-preview-stop]");
  const saveButton = document.querySelector("[data-save-peak]");
  const resetButton = document.querySelector("[data-reset-peak]");
  const overallStatus = document.querySelector("[data-overall-status]");
  const saveStatus = document.querySelector("[data-save-status]");
  let csrfToken = "";
  let platformPeak = DEFAULT_PEAK;
  let lastPlaybackTime = 0;
  let lastAdvanceAt = 0;
  let playbackError = "";

  if (!audio || !slider || !playToggle || !accessPanel || !dashboard) return;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function selectedPeak() {
    return clamp(Number(slider.value) / 100, 0, 1);
  }

  function decibels(value) {
    return value > 0 ? 20 * Math.log10(value) : -Infinity;
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  function setSaveStatus(message, isError = false) {
    if (!saveStatus) return;
    saveStatus.textContent = message;
    saveStatus.classList.toggle("is-error", isError);
  }

  function renderPeak() {
    const peak = selectedPeak();
    audio.volume = peak;
    setText("[data-peak-percent]", `${(peak * 100).toFixed(1)}%`);
    setText("[data-peak-db]", peak > 0 ? `${decibels(peak).toFixed(1)} dB` : "−∞ dB");
    setText("[data-test-output]", `${(peak * 100).toFixed(1)}%`);
  }

  function renderPlatformPeak() {
    setText("[data-saved-peak]", `${(platformPeak * 100).toFixed(1)}%`);
  }

  function applySettings(settings, { updateSlider = true } = {}) {
    const peak = Number(settings?.peak_volume);
    if (Number.isFinite(peak) && peak >= 0 && peak <= 1) platformPeak = peak;
    csrfToken = typeof settings?.csrf_token === "string" ? settings.csrf_token : csrfToken;
    if (updateSlider) slider.value = String(platformPeak * 100);
    renderPeak();
    renderPlatformPeak();
  }

  async function requestSettings(payload) {
    const options = {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    };
    if (payload) {
      options.method = "POST";
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(payload);
    }

    const response = await fetch(SETTINGS_ENDPOINT, options);
    let result = {};
    try {
      result = await response.json();
    } catch {
      result = {};
    }
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
    return result;
  }

  function showDashboard(settings) {
    applySettings(settings);
    accessPanel.hidden = true;
    dashboard.hidden = false;
    ownerKey.value = "";
    ownerStatus.textContent = "";
  }

  function showLogin(message = "") {
    csrfToken = "";
    dashboard.hidden = true;
    accessPanel.hidden = false;
    ownerStatus.textContent = message;
    window.setTimeout(() => ownerKey.focus(), 0);
  }

  function renderDiagnostics(now) {
    const currentTime = Number(audio.currentTime || 0);
    if (!audio.paused && Math.abs(currentTime - lastPlaybackTime) > 0.001) lastAdvanceAt = now;
    lastPlaybackTime = currentTime;
    const advancing = !audio.paused && now - lastAdvanceAt < 1000;
    const fileReady = audio.readyState >= 2 && Number.isFinite(audio.duration) && audio.duration > 0;
    const playing = !audio.paused && !audio.ended;
    const verified = fileReady && playing && advancing && audio.volume > 0;

    setText("[data-file-status]", fileReady ? `${SOURCE_LABEL} · loaded · ${audio.duration.toFixed(1)}s` : (audio.error ? `${SOURCE_LABEL} · error` : `${SOURCE_LABEL} · loading`));
    setText("[data-playback-status]", playbackError || (audio.error ? "error" : (playing ? "playing" : "stopped")));
    setText("[data-signal-clock]", `${currentTime.toFixed(1)} seconds`);
    setText("[data-signal-advancing]", advancing ? "yes" : "no");
    playToggle.textContent = playing ? "Pause isolated test" : "Play isolated test";
    overallStatus.textContent = verified ? "verified playing" : (playbackError ? "playback blocked" : (playing ? "starting" : "waiting"));
    overallStatus.classList.toggle("is-verified", verified);
    window.requestAnimationFrame(renderDiagnostics);
  }

  slider.addEventListener("input", () => {
    renderPeak();
    setSaveStatus(selectedPeak() === platformPeak ? "" : "Unsaved staging change");
  });

  playToggle.addEventListener("click", async () => {
    if (!audio.paused) {
      audio.pause();
      return;
    }
    playbackError = "";
    renderPeak();
    try {
      await audio.play();
    } catch {
      playbackError = "browser blocked playback — press play again";
    }
  });

  stopButton?.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
  });

  saveButton?.addEventListener("click", async () => {
    saveButton.disabled = true;
    setSaveStatus("Publishing the staging-wide peak…");
    try {
      const settings = await requestSettings({
        action: "save",
        csrf_token: csrfToken,
        peak_volume: selectedPeak(),
      });
      applySettings(settings);
      setSaveStatus(`Published ${(platformPeak * 100).toFixed(1)}% to every staging player.`);
      saveButton.textContent = "Platform peak saved";
      window.setTimeout(() => {
        saveButton.textContent = "Save platform peak";
      }, 1800);
    } catch (error) {
      setSaveStatus(error.message || "The platform setting could not be saved.", true);
      if (/authentication|session/i.test(error.message || "")) showLogin("Your administrator session ended. Please sign in again.");
    } finally {
      saveButton.disabled = false;
    }
  });

  resetButton?.addEventListener("click", () => {
    slider.value = String(DEFAULT_PEAK * 100);
    renderPeak();
    setSaveStatus(platformPeak === DEFAULT_PEAK ? "" : "Approved 5.5% loaded — press Save platform peak to publish it.");
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    ownerStatus.textContent = "Verifying…";
    const submitButton = loginForm.querySelector("button[type=submit]");
    if (submitButton) submitButton.disabled = true;
    try {
      const settings = await requestSettings({ action: "login", owner_key: ownerKey.value });
      showDashboard(settings);
    } catch (error) {
      ownerStatus.textContent = error.message || "Owner key not recognised.";
      ownerKey.select();
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  logoutButton?.addEventListener("click", async () => {
    try {
      await requestSettings({ action: "logout" });
    } catch {
      // The local view still closes if the server session already ended.
    }
    audio.pause();
    showLogin();
  });

  audio.addEventListener("error", () => {
    playbackError = "file error";
    setText("[data-file-status]", `${SOURCE_LABEL} · file error`);
  });
  audio.addEventListener("play", () => {
    playbackError = "";
  });

  slider.value = String(DEFAULT_PEAK * 100);
  renderPeak();
  renderPlatformPeak();
  requestSettings()
    .then((settings) => {
      if (settings.authenticated) showDashboard(settings);
      else showLogin();
    })
    .catch(() => showLogin("The administrator service is temporarily unavailable."));
  window.requestAnimationFrame(renderDiagnostics);
}());
