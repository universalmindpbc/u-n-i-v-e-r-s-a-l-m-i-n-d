(() => {
  "use strict";

  const sampler = document.querySelector("[data-mantra-sampler]");
  if (!sampler) return;

  const bankButtons = Array.from(sampler.querySelectorAll("[data-mantra-bank]"));
  const modeButtons = Array.from(sampler.querySelectorAll("[data-mantra-mode]"));
  const pads = Array.from(sampler.querySelectorAll("[data-mantra-pad]"));
  const stopButton = sampler.querySelector("[data-mantra-stop]");
  const status = sampler.querySelector("[data-mantra-status]");
  const audioByPad = new Map();
  const activePads = new Set();
  let currentBank = "tibet";
  let currentMode = "one-shot";

  function announce(message) {
    if (status) status.textContent = message;
  }

  function dispatchPlaybackState() {
    const active = activePads.size > 0;
    document.body.classList.toggle("television-mantra-sample-active", active);
    document.body.dataset.mantraSampleCount = String(activePads.size);
    window.dispatchEvent(new CustomEvent("iam:mantra-playback-change", {
      detail: { active, count: activePads.size },
    }));
  }

  function syncPad(pad, active) {
    pad.classList.toggle("is-playing", active);
    pad.setAttribute("aria-pressed", String(active));
  }

  function deactivatePad(pad) {
    if (!activePads.delete(pad)) return;
    syncPad(pad, false);
    dispatchPlaybackState();
  }

  function audioForPad(pad) {
    if (audioByPad.has(pad)) return audioByPad.get(pad);
    const source = pad.dataset.mantraSrc;
    if (!source) return null;
    const audio = new Audio(source);
    audio.preload = "auto";
    audio.volume = 0.94;
    audio.addEventListener("ended", () => deactivatePad(pad));
    audio.addEventListener("error", () => {
      deactivatePad(pad);
      announce(`${pad.dataset.mantraLabel || "sample"} is unavailable`);
    });
    audioByPad.set(pad, audio);
    return audio;
  }

  function stopPad(pad, { rewind = true } = {}) {
    const audio = audioByPad.get(pad);
    if (audio) {
      audio.pause();
      audio.loop = false;
      if (rewind) {
        try {
          audio.currentTime = 0;
        } catch {
          // The browser can reject a seek while an asset is still attaching.
        }
      }
    }
    deactivatePad(pad);
  }

  function stopAll({ announceStop = true } = {}) {
    pads.forEach((pad) => stopPad(pad));
    if (announceStop) announce("all samples stopped");
    dispatchPlaybackState();
  }

  function syncBank() {
    bankButtons.forEach((button) => {
      const selected = button.dataset.mantraBank === currentBank;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    pads.forEach((pad) => {
      pad.hidden = pad.dataset.mantraPadBank !== currentBank;
    });
    sampler.dataset.mantraActiveBank = currentBank;
    announce(currentBank === "tibet" ? "Tibet — choose a mantra" : "Ibiza — choose a mantra");
  }

  function syncMode() {
    modeButtons.forEach((button) => {
      const selected = button.dataset.mantraMode === currentMode;
      button.setAttribute("aria-pressed", String(selected));
    });
    sampler.dataset.mantraActiveMode = currentMode;
    announce(currentMode === "loop" ? "loop mode" : "one shot mode");
  }

  async function triggerPad(pad) {
    if (pad.disabled || pad.dataset.mantraReserved === "true") return;
    const audio = audioForPad(pad);
    if (!audio) return;

    if (currentMode === "loop" && activePads.has(pad) && audio.loop) {
      stopPad(pad);
      announce(`${pad.dataset.mantraLabel || "sample"} loop stopped`);
      return;
    }

    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {
      // A first gesture can arrive before metadata is ready; play still works.
    }
    audio.loop = currentMode === "loop";
    activePads.add(pad);
    syncPad(pad, true);
    dispatchPlaybackState();
    announce(pad.dataset.mantraPhrase || pad.dataset.mantraLabel || "mantra");

    try {
      await audio.play();
    } catch {
      stopPad(pad);
      announce("tap the sample again to play");
    }
  }

  bankButtons.forEach((button) => button.addEventListener("click", () => {
    const requestedBank = button.dataset.mantraBank;
    if (!requestedBank || requestedBank === currentBank) return;
    stopAll({ announceStop: false });
    currentBank = requestedBank;
    syncBank();
  }));

  modeButtons.forEach((button) => button.addEventListener("click", () => {
    const requestedMode = button.dataset.mantraMode;
    if (!requestedMode || requestedMode === currentMode) return;
    currentMode = requestedMode;
    syncMode();
  }));

  pads.forEach((pad) => pad.addEventListener("click", () => triggerPad(pad)));
  stopButton?.addEventListener("click", () => stopAll());
  window.addEventListener("pagehide", () => stopAll({ announceStop: false }));

  window.IAMMantraSampler = {
    version: "mantra_sampler_mockup_v1.0",
    stopAll,
    getState() {
      return {
        bank: currentBank,
        mode: currentMode,
        active: Array.from(activePads).map((pad) => pad.dataset.mantraSample),
      };
    },
  };

  syncBank();
  syncMode();
})();
