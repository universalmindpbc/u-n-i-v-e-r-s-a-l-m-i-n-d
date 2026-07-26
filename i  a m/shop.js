(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const inMusicTelevisionFrame = window.self !== window.top && (
    params.get("musicTelevisionFrame") === "1" ||
    window.__iamMusicTelevisionFrame === true
  );

  // Shop is a room inside Music Television. A top-level visit enters the
  // persistent shell first so existing media can survive page navigation.
  if (window.self === window.top && params.get("standalone") !== "1") {
    const shellUrl = new URL("index.html", window.location.href);
    shellUrl.searchParams.set("shop", "1");
    window.location.replace(shellUrl.href);
    return;
  }

  const products = Array.from(document.querySelectorAll("[data-product]"));
  const categoryButtons = Array.from(document.querySelectorAll("[data-filter-category]"));
  const filterStatus = document.querySelector("[data-filter-status]");
  const themeButton = document.querySelector("[data-shop-theme-toggle]");
  const themeLabel = document.querySelector("[data-shop-theme-label]");
  const heroVideo = document.querySelector("[data-shop-hero-video]");
  const musicButton = document.querySelector("[data-shop-music]");
  const musicLabel = document.querySelector("[data-shop-music-label]");
  const themeKey = "iamShopThemeV1";
  let activeCategory = "all";

  function setPressed(buttons, activeButton) {
    buttons.forEach((button) => {
      const active = button === activeButton;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function applyFilters() {
    let visible = 0;

    products.forEach((product) => {
      const categories = String(product.dataset.categories || "").split(/\s+/).filter(Boolean);
      const show = activeCategory === "all" || categories.includes(activeCategory);
      product.hidden = !show;
      if (show) visible += 1;
    });

    if (filterStatus) {
      const noun = visible === 1 ? "piece" : "pieces";
      filterStatus.textContent = `${visible} ${noun}`;
    }
  }

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.filterCategory || "all";
      setPressed(categoryButtons, button);
      applyFilters();
    });
  });

  function applyTheme(theme, options = {}) {
    const nextTheme = theme === "night" ? "night" : "day";
    document.documentElement.dataset.shopTheme = nextTheme;
    if (themeLabel) themeLabel.textContent = nextTheme;
    if (themeButton) {
      const targetTheme = nextTheme === "night" ? "day" : "night";
      themeButton.setAttribute("aria-pressed", String(nextTheme === "night"));
      themeButton.setAttribute("aria-label", `Switch to ${targetTheme} mode`);
    }
    if (options.persist) {
      try {
        window.localStorage.setItem(themeKey, nextTheme);
      } catch {
        // The visual choice still applies if storage is unavailable.
      }
    }
  }

  themeButton?.addEventListener("click", () => {
    const currentTheme = document.documentElement.dataset.shopTheme;
    applyTheme(currentTheme === "night" ? "day" : "night", { persist: true });
  });

  applyTheme(document.documentElement.dataset.shopTheme || "day");

  if (heroVideo && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const reducedMotionUrl = new URL(heroVideo.src);
    reducedMotionUrl.searchParams.set("autoplay", "0");
    heroVideo.src = reducedMotionUrl.href;
  }

  function updateMusicStatus(detail = {}) {
    if (!musicButton || !musicLabel) return;
    const playing = Boolean(detail.playing);
    musicButton.classList.toggle("is-playing", playing);
    musicButton.setAttribute("aria-pressed", String(playing));

    if (playing) {
      musicLabel.textContent = detail.label ? `playing / ${detail.label}` : "music continues";
      musicButton.setAttribute("aria-label", detail.label ? `${detail.label} is playing` : "Music is playing");
      return;
    }

    musicLabel.textContent = detail.loading ? "connecting / Café del Mar Chill" : "listen / Café del Mar Chill";
    musicButton.setAttribute("aria-label", "Listen to Café del Mar Chill while browsing");
  }

  musicButton?.addEventListener("click", () => {
    if (!inMusicTelevisionFrame) return;
    updateMusicStatus({ loading: true });
    try {
      if (window.parent.IAMTelevisionRoom?.requestShopMusic?.()) return;
    } catch {
      // The message route below remains available if frame access is restricted.
    }
    window.parent.postMessage({ type: "iam:shop-music-request" }, window.location.origin);
  });

  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin || event.data?.type !== "iam:shop-music-status") return;
    updateMusicStatus(event.data);
  });

  if (inMusicTelevisionFrame) {
    window.parent.postMessage({ type: "iam:shop-music-status-request" }, window.location.origin);
  }

  applyFilters();
}());
