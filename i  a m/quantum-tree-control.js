(function () {
  const DEFAULT_PEAK = 0.585;
  const PEAK_STORAGE_KEY = "iamQuantumTreePeakVolume";
  const audio = document.querySelector("[data-quantum-preview]");
  const slider = document.querySelector("#quantum-peak-slider");
  const playToggle = document.querySelector("[data-preview-toggle]");
  const stopButton = document.querySelector("[data-preview-stop]");
  const saveButton = document.querySelector("[data-save-peak]");
  const resetButton = document.querySelector("[data-reset-peak]");
  const overallStatus = document.querySelector("[data-overall-status]");
  let lastPlaybackTime = 0;
  let lastAdvanceAt = 0;
  let playbackError = "";

  if (!audio || !slider || !playToggle) return;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function readSavedPeak() {
    const stored = localStorage.getItem(PEAK_STORAGE_KEY);
    if (stored === null || stored === "") return DEFAULT_PEAK;
    const value = Number(stored);
    return Number.isFinite(value) ? clamp(value, 0, 1) : DEFAULT_PEAK;
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

  function renderPeak() {
    const peak = selectedPeak();
    audio.volume = peak;
    setText("[data-peak-percent]", `${(peak * 100).toFixed(1)}%`);
    setText("[data-peak-db]", peak > 0 ? `${decibels(peak).toFixed(1)} dB` : "−∞ dB");
    setText("[data-test-output]", `${(peak * 100).toFixed(1)}%`);
  }

  function renderSavedPeak() {
    setText("[data-saved-peak]", `${(readSavedPeak() * 100).toFixed(1)}%`);
  }

  function renderDiagnostics(now) {
    const currentTime = Number(audio.currentTime || 0);
    if (!audio.paused && Math.abs(currentTime - lastPlaybackTime) > 0.001) lastAdvanceAt = now;
    lastPlaybackTime = currentTime;
    const advancing = !audio.paused && now - lastAdvanceAt < 1000;
    const fileReady = audio.readyState >= 2 && Number.isFinite(audio.duration) && audio.duration > 0;
    const playing = !audio.paused && !audio.ended;
    const verified = fileReady && playing && advancing && audio.volume > 0;

    setText("[data-file-status]", fileReady ? `loaded · ${audio.duration.toFixed(1)}s` : (audio.error ? "error" : "loading"));
    setText("[data-playback-status]", playbackError || (audio.error ? "error" : (playing ? "playing" : "stopped")));
    setText("[data-signal-clock]", `${currentTime.toFixed(1)} seconds`);
    setText("[data-signal-advancing]", advancing ? "yes" : "no");
    playToggle.textContent = playing ? "Pause isolated test" : "Play isolated test";
    overallStatus.textContent = verified ? "verified playing" : (playbackError ? "playback blocked" : (playing ? "starting" : "waiting"));
    overallStatus.classList.toggle("is-verified", verified);
    window.requestAnimationFrame(renderDiagnostics);
  }

  const savedPeak = readSavedPeak();
  slider.value = String(savedPeak * 100);
  renderPeak();
  renderSavedPeak();

  slider.addEventListener("input", renderPeak);
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

  saveButton?.addEventListener("click", () => {
    const peak = selectedPeak();
    localStorage.setItem(PEAK_STORAGE_KEY, peak.toFixed(4));
    renderSavedPeak();
    saveButton.textContent = "Saved for this browser";
    window.setTimeout(() => {
      saveButton.textContent = "Save peak for this browser";
    }, 1800);
  });

  resetButton?.addEventListener("click", () => {
    slider.value = String(DEFAULT_PEAK * 100);
    localStorage.setItem(PEAK_STORAGE_KEY, DEFAULT_PEAK.toFixed(4));
    renderPeak();
    renderSavedPeak();
  });

  audio.addEventListener("error", () => {
    playbackError = "file error";
    setText("[data-file-status]", "file error");
  });
  audio.addEventListener("play", () => {
    playbackError = "";
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== PEAK_STORAGE_KEY) return;
    renderSavedPeak();
  });
  window.requestAnimationFrame(renderDiagnostics);
}());
