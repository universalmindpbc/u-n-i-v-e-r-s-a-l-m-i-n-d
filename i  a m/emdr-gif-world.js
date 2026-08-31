(() => {
  const BLANK_PIXEL = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  const DEFAULT_PRESET = "cb";
  const state = {
    active: false,
    preset: DEFAULT_PRESET,
    root: null,
    presets: new Map(),
    preloadPromises: new Map(),
    objectUrls: [],
    generation: 0,
    resetTimer: 0,
  };

  function init() {
    if (state.root) return true;
    state.root = document.querySelector("[data-emdr-gif-world]");
    if (!state.root) return false;

    Array.from(state.root.querySelectorAll("[data-emdr-gif-preset]")).forEach((panel) => {
      paginateProgressivePreset(panel);
      const key = String(panel.dataset.emdrGifPreset || "").trim().toLowerCase();
      if (!key) return;
      const tiles = Array.from(panel.querySelectorAll("[data-emdr-gif-tile]"));
      state.presets.set(key, {
        key,
        panel,
        tiles,
        sources: tiles.map((tile) => new URL(tile.dataset.src, document.baseURI).href),
        progressive: panel.hasAttribute("data-emdr-gif-progressive"),
      });
    });

    if (!state.presets.has(state.preset)) {
      state.preset = state.presets.keys().next().value || DEFAULT_PRESET;
    }
    state.root.dataset.emdrGifPreset = state.preset;
    syncPresetPanels();
    preloadPreset(state.preset);
    return true;
  }

  function paginateProgressivePreset(panel) {
    const firstPageSize = Number(panel.dataset.emdrGifFirstPageSize);
    const pageSize = Number(panel.dataset.emdrGifPageSize);
    if (!Number.isInteger(firstPageSize) || firstPageSize < 1 || !Number.isInteger(pageSize) || pageSize < 1) return;

    const tiles = Array.from(panel.querySelectorAll("[data-emdr-gif-tile]"));
    if (!tiles.length) return;
    const pages = [];
    for (let offset = 0; offset < tiles.length;) {
      const currentPageSize = offset === 0 ? firstPageSize : pageSize;
      pages.push(tiles.slice(offset, offset + currentPageSize));
      offset += currentPageSize;
    }

    const fragment = document.createDocumentFragment();
    pages.forEach((pageTiles) => {
      const page = document.createElement("div");
      page.className = "adaptive-television-emdr-gif-page";
      page.dataset.emdrGifPage = "";
      page.dataset.emdrGifPageSize = String(pageTiles.length);
      page.append(...pageTiles);
      fragment.append(page);
    });
    panel.replaceChildren(fragment);
    panel.dataset.emdrGifPageCount = String(pages.length);
  }

  function presetState(key = state.preset) {
    return state.presets.get(String(key || "").toLowerCase()) || null;
  }

  function preloadPreset(key) {
    const preset = presetState(key);
    if (!preset) return Promise.resolve([]);
    if (state.preloadPromises.has(preset.key)) return state.preloadPromises.get(preset.key);

    if (preset.progressive) {
      preset.panel.dataset.emdrGifReady = "progressive";
      const progressivePromise = Promise.resolve(preset.tiles.map(() => null));
      state.preloadPromises.set(preset.key, progressivePromise);
      return progressivePromise;
    }

    const preloadPromise = Promise.all(preset.tiles.map(async (tile, index) => {
      if (tile.tagName !== "IMG") return null;
      try {
        const response = await fetch(preset.sources[index], { cache: "force-cache" });
        if (!response.ok) throw new Error(`GIF preload failed: ${response.status}`);
        return await response.blob();
      } catch {
        return null;
      }
    })).then((blobs) => {
      const imageIndexes = preset.tiles
        .map((tile, index) => tile.tagName === "IMG" ? index : -1)
        .filter((index) => index >= 0);
      preset.panel.dataset.emdrGifReady = imageIndexes.every((index) => Boolean(blobs[index]))
        ? "true"
        : "partial";
      return blobs;
    });

    state.preloadPromises.set(preset.key, preloadPromise);
    return preloadPromise;
  }

  function releaseObjectUrls() {
    state.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    state.objectUrls = [];
  }

  function resetTile(tile, { releaseSource = false } = {}) {
    if (tile.tagName === "VIDEO") {
      tile.pause();
      try { tile.currentTime = 0; } catch {}
      if (releaseSource) {
        tile.removeAttribute("src");
        tile.load();
      }
      return;
    }
    tile.src = BLANK_PIXEL;
  }

  function resetAllTiles(options = {}) {
    state.presets.forEach((preset) => {
      preset.tiles.forEach((tile) => resetTile(tile, options));
      preset.panel.classList.remove("is-active");
      preset.panel.setAttribute("aria-hidden", "true");
    });
    releaseObjectUrls();
  }

  function syncPresetPanels() {
    state.presets.forEach((preset) => {
      const selected = preset.key === state.preset;
      preset.panel.classList.toggle("is-selected", selected);
      if (!state.active) preset.panel.setAttribute("aria-hidden", "true");
    });
  }

  async function startVideoTile(tile, source) {
    tile.muted = true;
    tile.loop = true;
    tile.playsInline = true;
    if (tile.src !== source) {
      tile.src = source;
      tile.load();
    }
    try { tile.currentTime = 0; } catch {}
    try {
      await tile.play();
      tile.dataset.emdrGifPlaying = "true";
    } catch {
      tile.dataset.emdrGifPlaying = "blocked";
    }
  }

  async function restartTiles(generation) {
    const preset = presetState();
    if (!preset) return;
    const blobs = await preloadPreset(preset.key);
    if (!state.active || generation !== state.generation || preset.key !== state.preset) return;

    resetAllTiles();
    window.requestAnimationFrame(() => {
      if (!state.active || generation !== state.generation || preset.key !== state.preset) return;
      preset.tiles.forEach((tile, index) => {
        const source = preset.sources[index];
        if (tile.tagName === "VIDEO") {
          startVideoTile(tile, source);
          return;
        }
        const blob = blobs[index];
        if (blob) {
          const objectUrl = URL.createObjectURL(blob);
          state.objectUrls.push(objectUrl);
          tile.src = objectUrl;
        } else {
          tile.src = source;
        }
      });
      preset.panel.classList.add("is-active");
      preset.panel.setAttribute("aria-hidden", "false");
      state.root.classList.add("is-active");
      state.root.dataset.emdrGifGeneration = String(generation);
      state.root.dataset.emdrGifPreset = state.preset;
    });
  }

  function dispatchPresentationState() {
    window.dispatchEvent(new CustomEvent("iam:emdr-gif-presentation", {
      detail: { active: state.active, preset: state.preset },
    }));
  }

  function setPreset(value) {
    if (!init()) return false;
    const preset = String(value || "").trim().toLowerCase();
    if (!state.presets.has(preset)) return false;
    if (preset === state.preset) return state.preset;

    state.preset = preset;
    state.generation += 1;
    state.root.dataset.emdrGifPreset = preset;
    syncPresetPanels();
    preloadPreset(preset);
    if (state.active) restartTiles(state.generation);
    dispatchPresentationState();
    return state.preset;
  }

  function setActive(value) {
    if (!init()) return false;
    const active = Boolean(value);
    if (active === state.active) return state.active;

    state.active = active;
    state.generation += 1;
    window.clearTimeout(state.resetTimer);
    document.body.classList.toggle("television-emdr-gif-active", active);
    if (active) document.body.dataset.emdrGifPreset = state.preset;
    else delete document.body.dataset.emdrGifPreset;
    dispatchPresentationState();

    if (active) {
      state.root.setAttribute("aria-hidden", "false");
      restartTiles(state.generation);
    } else {
      state.root.classList.remove("is-active");
      state.root.setAttribute("aria-hidden", "true");
      state.resetTimer = window.setTimeout(() => {
        if (state.active) return;
        resetAllTiles({ releaseSource: true });
      }, 950);
    }
    return state.active;
  }

  init();

  window.IAMEMDRGif = {
    get active() { return state.active; },
    get preset() { return state.preset; },
    setActive,
    setPreset,
    diagnostics() {
      const preset = presetState();
      return {
        active: state.active,
        preset: state.preset,
        presets: [...state.presets.keys()],
        tiles: preset?.tiles.length || 0,
        ready: preset?.panel.dataset.emdrGifReady || "loading",
        generation: state.generation,
      };
    },
  };
})();
