(() => {
  const BLANK_PIXEL = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  const state = {
    active: false,
    root: null,
    tiles: [],
    sources: [],
    blobs: [],
    objectUrls: [],
    preloadPromise: null,
    generation: 0,
    resetTimer: 0,
  };

  function init() {
    if (state.root) return true;
    state.root = document.querySelector("[data-emdr-gif-world]");
    if (!state.root) return false;
    state.tiles = Array.from(state.root.querySelectorAll("[data-emdr-gif-tile]"));
    state.sources = state.tiles.map((tile) => new URL(tile.dataset.src, document.baseURI).href);
    state.preloadPromise = Promise.all(state.sources.map(async (source) => {
      try {
        const response = await fetch(source, { cache: "force-cache" });
        if (!response.ok) throw new Error(`GIF preload failed: ${response.status}`);
        return await response.blob();
      } catch {
        return null;
      }
    })).then((blobs) => {
      state.blobs = blobs;
      state.root.dataset.emdrGifReady = blobs.every(Boolean) ? "true" : "partial";
      return blobs;
    });
    return true;
  }

  function releaseObjectUrls() {
    state.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    state.objectUrls = [];
  }

  async function restartTiles(generation) {
    const blobs = await state.preloadPromise;
    if (!state.active || generation !== state.generation) return;

    releaseObjectUrls();
    state.tiles.forEach((tile) => {
      tile.src = BLANK_PIXEL;
    });

    window.requestAnimationFrame(() => {
      if (!state.active || generation !== state.generation) return;
      state.tiles.forEach((tile, index) => {
        const blob = blobs[index];
        if (blob) {
          const objectUrl = URL.createObjectURL(blob);
          state.objectUrls.push(objectUrl);
          tile.src = objectUrl;
        } else {
          tile.src = state.sources[index];
        }
      });
      state.root.classList.add("is-active");
      state.root.dataset.emdrGifGeneration = String(generation);
    });
  }

  function setActive(value) {
    if (!init()) return false;
    const active = Boolean(value);
    if (active === state.active) return state.active;

    state.active = active;
    state.generation += 1;
    window.clearTimeout(state.resetTimer);
    document.body.classList.toggle("television-emdr-gif-active", active);
    window.dispatchEvent(new CustomEvent("iam:emdr-gif-presentation", {
      detail: { active },
    }));

    if (active) {
      state.root.setAttribute("aria-hidden", "false");
      restartTiles(state.generation);
    } else {
      state.root.classList.remove("is-active");
      state.root.setAttribute("aria-hidden", "true");
      state.resetTimer = window.setTimeout(() => {
        if (state.active) return;
        state.tiles.forEach((tile) => {
          tile.src = BLANK_PIXEL;
        });
        releaseObjectUrls();
      }, 950);
    }
    return state.active;
  }

  init();

  window.IAMEMDRGif = {
    get active() { return state.active; },
    setActive,
    diagnostics() {
      return {
        active: state.active,
        tiles: state.tiles.length,
        ready: state.root?.dataset.emdrGifReady || "loading",
        generation: state.generation,
      };
    },
  };
})();
