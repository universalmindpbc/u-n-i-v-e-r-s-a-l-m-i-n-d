(() => {
  "use strict";

  const sampler = document.querySelector("[data-mantra-sampler]");
  if (!sampler) return;

  const bankButtons = Array.from(sampler.querySelectorAll("[data-mantra-bank]"));
  const closeButtons = Array.from(sampler.querySelectorAll("[data-mantra-close]"));
  const nodes = sampler.querySelector("[data-mantra-nodes]");
  const bankTitle = sampler.querySelector("[data-mantra-bank-title]");
  const status = sampler.querySelector("[data-mantra-status]");
  const bufferById = new Map();
  const sourceById = new Map();
  const itemById = new Map();
  const activeIds = new Set();
  let library = null;
  let currentBank = "tibet";
  let previousFocus = null;
  let audioContext = null;

  const fallbackUrl = "api/mantra-library.json";
  const endpointUrl = "api/mantra-library.php";

  function announce(message) {
    if (status) status.textContent = message;
  }

  function dispatchPlaybackState() {
    const active = activeIds.size > 0;
    document.body.classList.toggle("television-mantra-sample-active", active);
    document.body.dataset.mantraSampleCount = String(activeIds.size);
    window.dispatchEvent(new CustomEvent("iam:mantra-playback-change", {
      detail: { active, count: activeIds.size, ids: Array.from(activeIds) },
    }));
  }

  function nodeForId(id) {
    return nodes?.querySelector(`[data-mantra-sample="${CSS.escape(id)}"]`) || null;
  }

  function setPlaying(id, playing) {
    if (playing) activeIds.add(id);
    else activeIds.delete(id);
    const node = nodeForId(id);
    node?.classList.toggle("is-playing", playing);
    node?.setAttribute("aria-pressed", String(playing));
    dispatchPlaybackState();
  }

  function deactivate(id) {
    sourceById.delete(id);
    setPlaying(id, false);
  }

  function context() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return audioContext;
  }

  async function bufferFor(item) {
    if (bufferById.has(item.id)) return bufferById.get(item.id);
    if (!item.asset) return null;
    const promise = fetch(item.asset, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("unavailable");
        return response.arrayBuffer();
      })
      .then((data) => context().decodeAudioData(data))
      .catch(() => {
        bufferById.delete(item.id);
        announce(`${item.label || "sample"} is unavailable`);
        return null;
      });
    bufferById.set(item.id, promise);
    return promise;
  }

  function stopItem(id) {
    const source = sourceById.get(id);
    if (source) {
      source.onended = null;
      try { source.stop(); } catch {}
      sourceById.delete(id);
    }
    setPlaying(id, false);
  }

  function stopAll({ announceStop = false } = {}) {
    Array.from(sourceById.keys()).forEach((id) => stopItem(id));
    if (announceStop) announce("all samples stopped");
    dispatchPlaybackState();
  }

  async function trigger(item) {
    if (!item || item.reserved || !item.asset) return;
    const ctx = context();
    await ctx.resume();
    const buffer = await bufferFor(item);
    if (!buffer) return;
    stopItem(item.id);
    const trimStart = Math.max(0, Number(item.trim_start) || 0);
    const trimEnd = Math.min(buffer.duration, Math.max(trimStart + 0.01, Number(item.trim_end) || buffer.duration));
    const sampleDuration = trimEnd - trimStart;
    const speed = Math.max(0.35, Math.min(2, Number(item.speed) || 1));
    const outputDuration = sampleDuration / speed;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = speed;
    const basePitch = Number(item.pitch) || 0;
    source.detune.setValueAtTime(basePitch * 100, ctx.currentTime);
    const pitchCurve = Array.isArray(item.pitch_curve) && item.pitch_curve.length > 1
      ? item.pitch_curve
      : [{ x: 0, y: 0 }, { x: 1, y: 0 }];
    const motion = Number(item.pitch_motion) || 0;
    pitchCurve.forEach((point) => {
      const x = Math.max(0, Math.min(1, Number(point.x) || 0));
      const drawnPitch = Math.max(-12, Math.min(12, Number(point.y) || 0));
      const movingPitch = Math.sin(x * Math.PI * 2) * motion;
      source.detune.linearRampToValueAtTime((basePitch + drawnPitch + movingPitch) * 100, ctx.currentTime + x * outputDuration);
    });
    const gain = ctx.createGain();
    const envelope = item.amp_envelope || {};
    const itemGain = Number.isFinite(Number(item.gain)) ? Number(item.gain) : 1;
    const envelopeLevel = Number.isFinite(Number(envelope.level)) ? Number(envelope.level) : 1;
    const peak = Math.max(0.0001, Math.min(15.849, itemGain) * Math.max(0, Math.min(1, envelopeLevel)));
    const attack = Math.min(outputDuration * 0.9, Math.max(0.005, Number(envelope.attack) * outputDuration || 0.02));
    const release = Math.min(outputDuration * 0.9, Math.max(0.005, Number(envelope.release) * outputDuration || 0.08));
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + attack);
    gain.gain.setValueAtTime(peak, ctx.currentTime + Math.max(attack, outputDuration - release));
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + outputDuration);
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.08;
    if (ctx.createStereoPanner) {
      const pan = ctx.createStereoPanner();
      pan.pan.value = Math.max(-1, Math.min(1, Number(item.pan) || 0));
      source.connect(gain).connect(pan).connect(limiter).connect(ctx.destination);
    } else {
      source.connect(gain).connect(limiter).connect(ctx.destination);
    }
    source.onended = () => deactivate(item.id);
    sourceById.set(item.id, source);
    setPlaying(item.id, true);
    announce(item.phrase || item.label || "mantra");
    try {
      source.start(0, trimStart, sampleDuration);
    } catch {
      deactivate(item.id);
      announce("tap the sample again to play");
    }
  }

  function createNode(item, index) {
    const button = document.createElement("button");
    const reserved = Boolean(item.reserved || !item.asset);
    button.type = "button";
    button.className = `mantra-orbit__node${reserved ? " is-reserved" : ""}`;
    button.style.setProperty("--mantra-index", String(index));
    button.style.setProperty("--mantra-rgb", item.color || "164, 230, 234");
    button.dataset.mantraSample = item.id;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", reserved
      ? `${item.label || "Future mantra"} — reserved`
      : `${item.label} — ${item.phrase || "play sample"}`);
    if (reserved) button.disabled = true;

    const flower = document.createElement("span");
    flower.className = "mantra-orbit__node-flower adaptive-television-reaction__glyph adaptive-television-reaction__glyph--ioh-logo adaptive-television-reaction__glyph--flora-trigger";
    flower.setAttribute("aria-hidden", "true");
    const name = document.createElement("span");
    name.className = "mantra-orbit__node-name";
    name.textContent = item.label || "Future Mantra";
    const kind = document.createElement("span");
    kind.className = "mantra-orbit__node-kind";
    kind.textContent = reserved ? "reserved" : item.source_type === "vocoder" ? "vocoder" : "sample";
    button.append(flower, name, kind);
    button.addEventListener("click", () => trigger(item));
    return button;
  }

  function renderBank() {
    if (!library?.banks?.[currentBank] || !nodes) return;
    stopAll();
    itemById.clear();
    nodes.replaceChildren();
    const items = library.banks[currentBank].slice(0, 6);
    items.forEach((item, index) => {
      itemById.set(item.id, item);
      nodes.append(createNode(item, index));
    });
    sampler.dataset.mantraActiveBank = currentBank;
    if (bankTitle) bankTitle.textContent = currentBank === "tibet" ? "Tibet" : "Ibiza";
    bankButtons.forEach((button) => {
      const selected = button.dataset.mantraBank === currentBank;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    announce("choose a mantra");
  }

  async function fetchLibrary() {
    for (const url of [endpointUrl, fallbackUrl]) {
      try {
        const response = await fetch(`${url}?v=${Date.now()}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) continue;
        const payload = await response.json();
        const candidate = payload.library || payload;
        if (candidate?.banks?.tibet && candidate?.banks?.ibiza) return candidate;
      } catch {
        // Fall through to the read-only library snapshot.
      }
    }
    throw new Error("The mantra library could not be loaded.");
  }

  async function refresh() {
    try {
      library = await fetchLibrary();
      bufferById.clear();
      renderBank();
      return library;
    } catch (error) {
      announce(error.message);
      return null;
    }
  }

  async function open() {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.classList.add("mantra-sampler-open");
    sampler.removeAttribute("inert");
    sampler.setAttribute("aria-hidden", "false");
    document.querySelector("[data-emdr-mantra-open]")?.setAttribute("aria-expanded", "true");
    if (!library) await refresh();
    window.requestAnimationFrame(() => {
      sampler.querySelector("[data-mantra-close]")?.focus({ preventScroll: true });
    });
  }

  function close({ restoreFocus = true } = {}) {
    stopAll();
    document.body.classList.remove("mantra-sampler-open");
    sampler.setAttribute("aria-hidden", "true");
    sampler.setAttribute("inert", "");
    document.querySelector("[data-emdr-mantra-open]")?.setAttribute("aria-expanded", "false");
    window.dispatchEvent(new CustomEvent("iam:mantra-close"));
    if (restoreFocus && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }

  bankButtons.forEach((button) => button.addEventListener("click", () => {
    const requestedBank = button.dataset.mantraBank;
    if (!requestedBank || requestedBank === currentBank) return;
    currentBank = requestedBank;
    renderBank();
  }));
  closeButtons.forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    close();
  }));
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !document.body.classList.contains("mantra-sampler-open")) return;
    event.preventDefault();
    close();
  });
  window.addEventListener("pagehide", () => stopAll());

  window.IAMMantraSampler = {
    version: "mantra_sampler_v2.0",
    open,
    close,
    refresh,
    stopAll,
    getState() {
      return {
        bank: currentBank,
        active: Array.from(activeIds),
        open: document.body.classList.contains("mantra-sampler-open"),
        sixNodeBanks: Object.fromEntries(Object.entries(library?.banks || {}).map(([name, items]) => [name, items.length])),
      };
    },
  };

  refresh();
})();
