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
  const worldButtons = Array.from(document.querySelectorAll("[data-filter-world]"));
  const categoryButtons = Array.from(document.querySelectorAll("[data-filter-category]"));
  const worldEntryButtons = Array.from(document.querySelectorAll("[data-world-select]"));
  const filterStatus = document.querySelector("[data-filter-status]");
  const musicButton = document.querySelector("[data-shop-music]");
  const musicLabel = document.querySelector("[data-shop-music-label]");
  let activeWorld = "all";
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
      const worlds = String(product.dataset.worlds || "").split(/\s+/).filter(Boolean);
      const worldMatch = activeWorld === "all" || worlds.includes(activeWorld);
      const categoryMatch = activeCategory === "all" || product.dataset.category === activeCategory;
      const show = worldMatch && categoryMatch;
      product.hidden = !show;
      if (show) visible += 1;
    });

    if (filterStatus) {
      const noun = visible === 1 ? "piece" : "pieces";
      const scope = activeWorld === "all" && activeCategory === "all" ? "all " : "";
      filterStatus.textContent = `Showing ${scope}${visible} hero ${noun}.`;
    }
  }

  worldButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeWorld = button.dataset.filterWorld || "all";
      setPressed(worldButtons, button);
      applyFilters();
    });
  });

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.filterCategory || "all";
      setPressed(categoryButtons, button);
      applyFilters();
    });
  });

  worldEntryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const requestedWorld = button.dataset.worldSelect || "all";
      const filterButton = worldButtons.find((candidate) => candidate.dataset.filterWorld === requestedWorld);
      if (filterButton) {
        activeWorld = requestedWorld;
        activeCategory = "all";
        setPressed(worldButtons, filterButton);
        setPressed(categoryButtons, categoryButtons.find((candidate) => candidate.dataset.filterCategory === "all"));
        applyFilters();
      }
      document.querySelector("#edit")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

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
