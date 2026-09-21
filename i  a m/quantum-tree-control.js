import { createOwnerSynthTest } from "./adaptive-sound/owner-synth-v1.js?v=7285f3f3de9e";

(function () {
  const DEFAULT_PEAK = 0.055;
  const synthTest = createOwnerSynthTest();
  const SETTINGS_ENDPOINT = "api/quantum-tree-settings.php";
  const SOURCE_LABEL = "Quantum Tree AAC · 192 kbps";
  const accessPanel = document.querySelector("[data-owner-access]");
  const dashboard = document.querySelector("[data-owner-dashboard]");
  const resetPanel = document.querySelector("[data-owner-reset]");
  const resetForm = document.querySelector("[data-owner-reset-form]");
  const resetStatus = document.querySelector("[data-owner-reset-status]");
  let resetToken = new URLSearchParams(location.hash.slice(1)).get("reset") || "";
  // Fragments never go to the server. Clear this one from browser history
  // immediately; retain it only in memory until the form is submitted.
  if (resetToken) history.replaceState(null, "", location.pathname + location.search);
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
  const mantraEnabled = document.querySelector("[data-owner-mantra-enabled]");
  const mantraSave = document.querySelector("[data-owner-mantra-save]");
  const mantraStatus = document.querySelector("[data-owner-mantra-status]");
  const mantraAudio = document.querySelector("[data-mantra-preview]");
  const mantraSlider = document.querySelector("#mantra-preview-slider");
  const mantraPlay = document.querySelector("[data-mantra-preview-toggle]");
  const mantraCanvas = document.querySelector("[data-mantra-preview-wave]");
  const mantraPen = mantraCanvas?.getContext("2d");
  let mantraContext, mantraGain, mantraAnalyser, mantraSamples;
  let mantraError = "", mantraTime = -1, mantraAdvancedAt = 0, mantraRms = 0;
  let mantraTestUsesTarget = true;
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
    if (element && element.textContent !== value) element.textContent = value;
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
    if (mantraTestUsesTarget) useMantraTarget();
    if (mantraEnabled) mantraEnabled.checked = settings?.mantra_enabled === true;
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
    resetPanel.hidden = true;
    applySettings(settings);
    accessPanel.hidden = true;
    dashboard.hidden = false;
    ownerKey.value = "";
    ownerStatus.textContent = "";
  }

  function showLogin(message = "") {
    resetPanel.hidden = true;
    csrfToken = "";
    document.querySelector("[data-owner-password-form]")?.reset();
    dashboard.hidden = true;
    accessPanel.hidden = false;
    ownerStatus.textContent = message;
    window.setTimeout(() => ownerKey.focus(), 0);
  }

  function mantraTestLevel() { return mantraTestUsesTarget ? platformPeak / 3 : clamp(Number(mantraSlider?.value || 0) / 100, 0, 1); }
  function renderMantraLevel() {
    const level = mantraTestLevel();
    setText("[data-mantra-preview-percent]", `${(level * 100).toFixed(2)}%`);
    setText("[data-mantra-preview-db]", level ? `${decibels(level).toFixed(1)} dB` : "−∞ dB");
    setText("[data-mantra-preview-target-level]", `${(platformPeak * 100 / 3).toFixed(2)}% · one-third of Quantum Tree`);
    if (mantraGain) mantraGain.gain.setValueAtTime(mantraAudio.paused ? 0 : level, mantraContext.currentTime);
  }
  function useMantraTarget() {
    mantraTestUsesTarget = true;
    if (mantraSlider) mantraSlider.value = String(platformPeak * 100 / 3);
    renderMantraLevel();
  }
  function pauseMantraTest(reset = false) {
    mantraAudio?.pause();
    if (mantraGain) mantraGain.gain.setValueAtTime(0, mantraContext.currentTime);
    if (reset && mantraAudio) mantraAudio.currentTime = 0;
  }
  function mantraTestDiagnostics() {
    const advancing = Boolean(mantraAudio && !mantraAudio.paused && performance.now() - mantraAdvancedAt < 250);
    const gain = mantraContext?.state === "running" ? mantraGain?.gain.value || 0 : 0;
    return { currentTime: mantraAudio?.currentTime || 0, playing: Boolean(mantraAudio && !mantraAudio.paused),
      gain, targetGain: platformPeak / 3, outputRms: mantraRms, advancing,
      outputVerified: advancing && gain > 0 && mantraRms > 1e-9, error: mantraError };
  }
  function renderMantraPreview(now) {
    if (!mantraAudio) return;
    if (mantraAudio.currentTime !== mantraTime) { mantraTime = mantraAudio.currentTime; mantraAdvancedAt = now; }
    mantraRms = 0;
    if (mantraContext?.state === "running") {
      mantraAnalyser.getFloatTimeDomainData(mantraSamples);
      mantraRms = Math.sqrt(mantraSamples.reduce((sum, value) => sum + value * value, 0) / mantraSamples.length);
    }
    const d = mantraTestDiagnostics();
    const state = document.querySelector("[data-mantra-preview-state]");
    state.textContent = mantraError || (d.outputVerified ? "Measured output" : d.playing ? (d.gain && !d.advancing ? "Loading" : "Silent") : "Stopped");
    state.classList.toggle("is-verified", d.outputVerified);
    setText("[data-mantra-preview-toggle]", d.playing ? "Pause isolated test" : "Play isolated test");
    const clock = value => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
    setText("[data-mantra-preview-clock]", `${clock(d.currentTime)} / ${clock(Number.isFinite(mantraAudio.duration) ? mantraAudio.duration : 334.782)}`);
    setText("[data-mantra-preview-output]", d.outputVerified ? `${decibels(d.outputRms).toFixed(1)} dBFS RMS` : "Silent");
    if (mantraPen) {
      mantraPen.clearRect(0, 0, mantraCanvas.width, mantraCanvas.height);
      mantraPen.strokeStyle = d.outputVerified ? "#8ff2b1" : "rgba(255,255,255,.3)";
      mantraPen.lineWidth = 1.5; mantraPen.beginPath();
      const peak = d.outputVerified ? mantraSamples.reduce((max, value) => Math.max(max, Math.abs(value)), 0) : 0;
      for (let x = 0; x < mantraCanvas.width; x++) {
        const y = 16 - (peak ? mantraSamples[Math.floor(x * mantraSamples.length / mantraCanvas.width)] / peak * 13 : 0);
        if (x) mantraPen.lineTo(x, y); else mantraPen.moveTo(x, y);
      }
      mantraPen.stroke();
    }
  }
  mantraSlider?.addEventListener("input", () => { mantraTestUsesTarget = false; renderMantraLevel(); });
  document.querySelector("[data-mantra-preview-target]")?.addEventListener("click", useMantraTarget);
  document.querySelector("[data-mantra-preview-stop]")?.addEventListener("click", () => pauseMantraTest(true));
  async function playMantraTest() {
    mantraError = "";
    try {
      if (!mantraContext) {
        const Context = window.AudioContext || window.webkitAudioContext;
        mantraAudio.muted = true;
        mantraContext = new Context();
        mantraGain = mantraContext.createGain(); mantraGain.gain.value = 0;
        mantraAnalyser = mantraContext.createAnalyser(); mantraAnalyser.fftSize = 1024;
        mantraSamples = new Float32Array(mantraAnalyser.fftSize);
        mantraContext.createMediaElementSource(mantraAudio).connect(mantraGain).connect(mantraAnalyser).connect(mantraContext.destination);
        mantraAudio.volume = 1; mantraAudio.muted = false;
      }
      // Both calls occur inside the user's click, preserving Safari permission.
      const resume = mantraContext.resume();
      const play = mantraAudio.play(); renderMantraLevel();
      await Promise.all([resume, play]);
    } catch (error) { mantraError = error?.name === "NotAllowedError" ? "Click Play to resume" : "Audio error"; pauseMantraTest(); }
  }
  mantraPlay?.addEventListener("click", () => {
    if (!mantraAudio.paused) pauseMantraTest(); else playMantraTest();
  });
  document.querySelector("[data-preview-together]")?.addEventListener("click", async () => {
    if (!audio.paused && !mantraAudio.paused && synthTest.diagnostics().enabled) { audio.pause(); pauseMantraTest(); synthTest.pause(); return; }
    playbackError = "";
    renderPeak();
    // Start all three within the same trusted click. Their individual controls stay independent.
    await Promise.all([audio.play().catch(() => { playbackError = "Press Play to resume"; }), playMantraTest(), synthTest.play()]);
  });
  document.querySelector("[data-preview-stop-both]")?.addEventListener("click", () => {
    audio.pause(); audio.currentTime = 0; pauseMantraTest(true); synthTest.stop();
  });
  mantraAudio?.addEventListener("error", () => { mantraError = "File error"; pauseMantraTest(); });
  window.IAMMantraAudition = Object.freeze({ diagnostics: mantraTestDiagnostics });
  window.addEventListener("pagehide", () => { pauseMantraTest(); audio.pause(); synthTest.stop(); });

  document.querySelector("[data-synth-preview-toggle]")?.addEventListener("click", () => {
    if(synthTest.diagnostics().enabled) synthTest.pause(); else synthTest.play();
  });
  document.querySelector("[data-synth-preview-stop]")?.addEventListener("click", () => synthTest.stop());
  window.IAMOwnerSynthAudition = synthTest;

  function renderDiagnostics(now) {
    renderMantraPreview(now);
    const synth = synthTest.diagnostics();
    setText("[data-preview-together]", synth.pending ? "Starting mix…" : !audio.paused && !mantraAudio.paused && synth.enabled ? "Pause together" : "Play together");
    document.querySelector("[data-preview-together]").disabled = synth.pending;
    setText("[data-synth-preview-toggle]", synth.pending ? "Starting synth…" : synth.enabled ? "Pause synth test" : "Play synth test");
    document.querySelector("[data-synth-preview-toggle]").disabled = synth.pending;
    setText("[data-synth-preview-state]", synth.error || (synth.running ? "Running" : synth.pending ? "Loading" : "Stopped"));
    setText("[data-synth-preview-volume]", `${(synth.volume * 100).toFixed(2)}%`);
    setText("[data-synth-preview-clock]", `${Math.floor(synth.runSeconds / 60)}:${String(Math.floor(synth.runSeconds % 60)).padStart(2,"0")}`);
    setText("[data-synth-preview-output]", synth.outputRms > 1e-9 ? `${decibels(synth.outputRms).toFixed(1)} dBFS RMS` : "Silent");
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
    setText("[data-preview-toggle]", playing ? "Pause isolated test" : "Play isolated test");
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

  mantraSave?.addEventListener("click", async () => {
    mantraSave.disabled = true;
    mantraStatus.textContent = "Saving mantra setting…";
    try {
      const settings = await requestSettings({ action: "save_mantra", csrf_token: csrfToken, mantra_enabled: mantraEnabled.checked });
      applySettings(settings, { updateSlider: false });
      mantraStatus.textContent = `Mantra ${settings.mantra_enabled ? "enabled" : "disabled"}. Players refresh this setting within 10 seconds.`;
    } catch (error) {
      mantraStatus.textContent = error.message || "The mantra setting could not be saved.";
    } finally { mantraSave.disabled = false; }
  });

  const passwordForm = document.querySelector("[data-owner-password-form]");
  const newPassword = document.querySelector("[data-owner-new-password]");
  const confirmPassword = document.querySelector("[data-owner-confirm-password]");
  const passwordStatus = document.querySelector("[data-owner-password-status]");
  passwordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    passwordStatus.classList.remove("is-error");
    if (newPassword.value !== confirmPassword.value) {
      passwordStatus.textContent = "The passwords do not match.";
      passwordStatus.classList.add("is-error");
      return;
    }
    if (new TextEncoder().encode(newPassword.value).length > 72) {
      passwordStatus.textContent = "This password is too long. Please shorten it; some characters use more than one byte.";
      passwordStatus.classList.add("is-error");
      return;
    }
    const button = passwordForm.querySelector("button[type=submit]");
    button.disabled = true;
    passwordStatus.textContent = "Saving your password…";
    try {
      const settings = await requestSettings({ action: "change_password", csrf_token: csrfToken,
        new_password: newPassword.value, confirm_password: confirmPassword.value });
      applySettings(settings, { updateSlider: false });
      passwordStatus.textContent = "Your password is saved. Use it the next time you sign in.";
    } catch (error) {
      passwordStatus.textContent = error.message || "Your password could not be saved.";
      passwordStatus.classList.add("is-error");
      if (/authentication|session/i.test(error.message || "")) showLogin("Your administrator session ended. Please sign in again.");
    } finally {
      newPassword.value = confirmPassword.value = "";
      button.disabled = false;
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
      const settings = await requestSettings({ action: "login", password: ownerKey.value });
      showDashboard(settings);
    } catch (error) {
      ownerStatus.textContent = error.message || "Password not recognised.";
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
    pauseMantraTest();
    synthTest.stop();
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
  async function showPasswordReset() {
    accessPanel.hidden = dashboard.hidden = true;
    resetPanel.hidden = false;
    resetForm.reset();
    resetForm.querySelector("button").disabled = true;
    resetStatus.textContent = "Checking your reset link…";
    try {
      await requestSettings({ action: "verify_reset", reset_token: resetToken });
      resetForm.querySelector("button").disabled = false;
      resetStatus.textContent = "";
      resetForm.querySelector("input").focus();
    } catch (error) { resetStatus.textContent = error.message; }
  }
  resetForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const password = resetForm.querySelector("#owner-reset-password");
    const confirmation = resetForm.querySelector("#owner-reset-confirm");
    if (password.value !== confirmation.value) { resetStatus.textContent = "The passwords do not match."; return; }
    const button = resetForm.querySelector("button");
    button.disabled = true;
    resetStatus.textContent = "Saving your password…";
    try {
      const settings = await requestSettings({ action: "reset_password", reset_token: resetToken,
        new_password: password.value, confirm_password: confirmation.value });
      resetToken = "";
      showDashboard(settings);
      passwordStatus.textContent = "Your password is saved. Use it the next time you sign in.";
    } catch (error) { resetStatus.textContent = error.message; }
    finally { password.value = confirmation.value = ""; button.disabled = false; }
  });
  window.addEventListener("hashchange", () => {
    const incoming = new URLSearchParams(location.hash.slice(1)).get("reset");
    if (!incoming) return;
    resetToken = incoming;
    history.replaceState(null, "", location.pathname + location.search);
    showPasswordReset();
  });
  if (resetToken) showPasswordReset();
  else requestSettings()
    .then((settings) => {
      if (settings.authenticated) showDashboard(settings);
      else showLogin();
    })
    .catch(() => showLogin("The administrator service is temporarily unavailable."));
  window.requestAnimationFrame(renderDiagnostics);
}());
