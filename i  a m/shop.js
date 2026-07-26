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
  const shopMenu = document.querySelector("[data-shop-menu]");
  const returnMusicLink = document.querySelector("[data-shop-return-music]");
  const shopTypeLinks = Array.from(document.querySelectorAll("[data-shop-type]"));
  const filterStatus = document.querySelector("[data-filter-status]");
  const themeButton = document.querySelector("[data-shop-theme-toggle]");
  const themeLabel = document.querySelector("[data-shop-theme-label]");
  const liveBand = document.querySelector("[data-shop-live-band]");
  const liveTitle = document.querySelector("[data-shop-live-title]");
  const bordelleFilm = document.querySelector("[data-shop-bordelle-film]");
  const musicButton = document.querySelector("[data-shop-music]");
  const musicLabel = document.querySelector("[data-shop-music-label]");
  const catalogueSection = document.querySelector("[data-shop-catalogue]");
  const catalogueGrid = document.querySelector("[data-catalogue-grid]");
  const catalogueCount = document.querySelector("[data-catalogue-count]");
  const catalogueStatus = document.querySelector("[data-catalogue-status]");
  const catalogueFilterButtons = Array.from(document.querySelectorAll("[data-catalogue-filter]"));
  const productDialog = document.querySelector("[data-shop-product-dialog]");
  const productDialogClose = document.querySelector("[data-shop-product-dialog-close]");
  const productDialogImage = document.querySelector("[data-shop-product-dialog-image]");
  const productDialogBrand = document.querySelector("[data-shop-product-dialog-brand]");
  const productDialogTitle = document.querySelector("[data-shop-product-dialog-title]");
  const productDialogDescription = document.querySelector("[data-shop-product-dialog-description]");
  const productDialogForm = document.querySelector("[data-shop-product-dialog-form]");
  const productDialogPrice = document.querySelector("[data-shop-product-dialog-price]");
  const productDialogRetailer = document.querySelector("[data-shop-product-dialog-retailer]");
  const themeKey = "iamShopThemeV1";
  let activeCategory = "all";
  let activeCatalogueCategory = "all";
  let catalogueProducts = [];
  let liveBandSyncTimer = 0;
  let liveBandRunwayId = "";

  const liveRunways = Object.freeze({
    "wolford-sergio-rossi-capsule": {
      file: "a s s e t s/f a s h i o n [ r u n w a y ]/Wolford x Sergio Rossi.mp4",
      title: "Wolford × Sergio Rossi",
    },
    "mugler-fall-winter-2021": {
      file: "a s s e t s/f a s h i o n [ r u n w a y ]/Mugler - Fall Winter 2021.mp4",
      title: "Mugler FW21",
    },
  });

  function seekLiveBand(blockOffsetSeconds) {
    if (!liveBand || !Number.isFinite(Number(blockOffsetSeconds))) return;
    const seek = () => {
      const duration = Number(liveBand.duration || 0);
      if (!Number.isFinite(duration) || duration <= 0) return;
      const target = ((Number(blockOffsetSeconds) % duration) + duration) % duration;
      try {
        if (typeof liveBand.fastSeek === "function") liveBand.fastSeek(target);
        else liveBand.currentTime = target;
      } catch {
        // The next clock pass will retry once the stream is seekable.
      }
    };
    if (liveBand.readyState >= 1) seek();
    else liveBand.addEventListener("loadedmetadata", seek, { once: true });
  }

  async function synchronizeLiveBand(forceSeek = false) {
    if (!liveBand || !window.IAMBroadcastClock || !window.IAMStreamController) return null;
    await window.IAMBroadcastClock.ready;
    const state = window.IAMBroadcastClock.stateAt("fashion-underground-intensity");
    const runway = liveRunways[state?.runwayId];
    if (!state || !runway) throw new Error("James Bondage live fashion programme unavailable.");

    const programmeChanged = liveBandRunwayId !== state.runwayId;
    if (programmeChanged) {
      liveBandRunwayId = state.runwayId;
      window.IAMStreamController.detach(liveBand);
      liveBand.pause();
      liveBand.dataset.streamFile = runway.file;
      liveBand.dataset.shopLiveRunway = state.runwayId;
      if (liveTitle) liveTitle.textContent = runway.title;
      await window.IAMStreamController.attach(liveBand, {
        fileName: runway.file,
        role: "fashion",
        autoplay: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
      forceSeek = true;
    } else if (!liveBand.dataset.streamUid) {
      await window.IAMStreamController.attach(liveBand, {
        fileName: runway.file,
        role: "fashion",
        autoplay: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    }

    document.body.dataset.shopLiveState = "ready";
    document.body.dataset.shopLiveChannel = state.channelId;
    document.body.dataset.shopLiveRunway = state.runwayId;
    document.body.dataset.shopLiveRemainingSeconds = state.remainingSeconds.toFixed(3);

    const duration = Number(liveBand.duration || 0);
    if (!Number.isFinite(duration) || duration <= 0) {
      if (forceSeek) seekLiveBand(state.offsetSeconds);
      return state;
    }
    const target = ((state.offsetSeconds % duration) + duration) % duration;
    let drift = Number(liveBand.currentTime || 0) - target;
    if (Math.abs(drift) > duration / 2) drift += drift > 0 ? -duration : duration;
    document.body.dataset.shopLiveTargetSeconds = target.toFixed(3);
    document.body.dataset.shopLiveDriftSeconds = drift.toFixed(3);
    if (forceSeek || Math.abs(drift) > 1.25) {
      seekLiveBand(state.offsetSeconds);
      liveBand.playbackRate = 1;
      document.body.dataset.shopLiveCorrection = forceSeek ? "entry_seek" : "hard_seek";
    } else if (Math.abs(drift) > .35) {
      liveBand.playbackRate = drift > 0 ? .98 : 1.02;
      document.body.dataset.shopLiveCorrection = drift > 0 ? "soft_slow" : "soft_catchup";
    } else {
      liveBand.playbackRate = 1;
      document.body.dataset.shopLiveCorrection = "locked";
    }
    return state;
  }

  async function startLiveBand() {
    if (!liveBand) return;
    try {
      await synchronizeLiveBand(true);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        await window.IAMStreamController.play(liveBand).catch(() => null);
      }
      liveBandSyncTimer = window.setInterval(() => {
        synchronizeLiveBand(false).catch((error) => {
          document.body.dataset.shopLiveState = "error";
          document.body.dataset.shopLiveError = String(error?.message || error).slice(0, 140);
        });
      }, 3000);
    } catch (error) {
      document.body.dataset.shopLiveState = "error";
      document.body.dataset.shopLiveError = String(error?.message || error).slice(0, 140);
    }
  }

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

  shopTypeLinks.forEach((link) => {
    link.addEventListener("click", () => {
      activeCategory = link.dataset.shopType || "all";
      const filterButton = categoryButtons.find((button) => button.dataset.filterCategory === activeCategory);
      if (filterButton) setPressed(categoryButtons, filterButton);
      applyFilters();
    });
  });

  shopMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => shopMenu.removeAttribute("open"));
  });

  shopMenu?.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    shopMenu.removeAttribute("open");
    shopMenu.querySelector("summary")?.focus();
  });

  document.addEventListener("click", (event) => {
    if (shopMenu?.open && !shopMenu.contains(event.target)) shopMenu.removeAttribute("open");
  });

  returnMusicLink?.addEventListener("click", (event) => {
    if (!inMusicTelevisionFrame) return;
    event.preventDefault();
    window.parent.postMessage({ type: "iam:return-to-television" }, window.location.origin);
  });

  function labelCategories(categories = []) {
    return categories.filter((category) => category !== "lingerie").join(" / ") || "lingerie";
  }

  function buildCatalogueCard(product) {
    const article = document.createElement("article");
    article.className = "shop-catalogue-card";
    article.dataset.catalogueProduct = product.slug;
    article.dataset.categories = product.categories.join(" ");

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.catalogueProductOpen = product.slug;
    button.setAttribute("aria-label", `Expand ${product.brand} ${product.name}`);

    const figure = document.createElement("figure");
    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.imageAlt || `${product.brand} ${product.name}`;
    image.loading = "lazy";
    figure.append(image);

    const copy = document.createElement("div");
    copy.className = "shop-catalogue-card__copy";
    const name = document.createElement("h3");
    name.textContent = product.name;
    const form = document.createElement("span");
    form.textContent = product.color || labelCategories(product.categories);
    const price = document.createElement("strong");
    price.textContent = product.price;
    const expand = document.createElement("em");
    expand.textContent = "+";
    copy.append(name, form, price, expand);
    button.append(figure, copy);
    article.append(button);
    return article;
  }

  function renderCatalogue() {
    if (!catalogueGrid) return;
    const visibleProducts = catalogueProducts.filter((product) => (
      activeCatalogueCategory === "all" || product.categories.includes(activeCatalogueCategory)
    ));
    catalogueGrid.replaceChildren(...visibleProducts.map(buildCatalogueCard));
    if (catalogueCount) catalogueCount.textContent = String(visibleProducts.length).padStart(2, "0");
    if (catalogueStatus) {
      catalogueStatus.textContent = `${visibleProducts.length} ${visibleProducts.length === 1 ? "piece" : "pieces"}`;
    }
  }

  catalogueFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCatalogueCategory = button.dataset.catalogueFilter || "all";
      setPressed(catalogueFilterButtons, button);
      renderCatalogue();
    });
  });

  function productFromHash() {
    const match = window.location.hash.match(/^#catalogue\/eres\/product\/([^/?#]+)/);
    if (!match) return null;
    const slug = decodeURIComponent(match[1]);
    return catalogueProducts.find((product) => product.slug === slug) || null;
  }

  function showProduct(product) {
    if (!productDialog || !product) return;
    if (productDialogImage) {
      productDialogImage.src = product.image;
      productDialogImage.alt = product.imageAlt || `${product.brand} ${product.name}`;
    }
    if (productDialogBrand) productDialogBrand.textContent = product.brand;
    if (productDialogTitle) productDialogTitle.textContent = product.name;
    if (productDialogDescription) productDialogDescription.textContent = product.description || "";
    if (productDialogForm) {
      productDialogForm.textContent = [product.color, labelCategories(product.categories)].filter(Boolean).join(" / ");
    }
    if (productDialogPrice) productDialogPrice.textContent = product.price;
    if (productDialogRetailer) productDialogRetailer.href = product.retailerUrl;
    if (!productDialog.open) productDialog.showModal();
  }

  function closeProduct(options = {}) {
    if (productDialog?.open) productDialog.close();
    if (options.updateRoute && window.location.hash.includes("/product/")) {
      window.history.replaceState(null, "", "#catalogue/eres");
      renderRoute();
    }
  }

  function renderRoute() {
    const catalogueRoute = window.location.hash.startsWith("#catalogue/eres");
    const enteringCatalogue = catalogueRoute && document.body.dataset.shopView !== "catalogue";
    document.body.dataset.shopView = catalogueRoute ? "catalogue" : "editorial";
    if (catalogueSection) catalogueSection.hidden = !catalogueRoute;
    if (!catalogueRoute) {
      closeProduct();
      return;
    }
    if (enteringCatalogue) {
      window.requestAnimationFrame(() => window.scrollTo(0, 0));
    }
    const selectedProduct = productFromHash();
    if (selectedProduct) showProduct(selectedProduct);
    else closeProduct();
  }

  catalogueGrid?.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-catalogue-product-open]");
    if (!trigger) return;
    const slug = trigger.dataset.catalogueProductOpen;
    window.location.hash = `catalogue/eres/product/${encodeURIComponent(slug)}`;
  });

  productDialogClose?.addEventListener("click", () => closeProduct({ updateRoute: true }));
  productDialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeProduct({ updateRoute: true });
  });
  productDialog?.addEventListener("click", (event) => {
    if (event.target === productDialog) closeProduct({ updateRoute: true });
  });
  window.addEventListener("hashchange", renderRoute);

  async function loadCatalogue() {
    try {
      const response = await fetch("shop-catalogue-v1.json?v=4", { credentials: "same-origin" });
      if (!response.ok) throw new Error(`Catalogue request failed: ${response.status}`);
      const catalogue = await response.json();
      catalogueProducts = Array.isArray(catalogue.products) ? catalogue.products : [];
      renderCatalogue();
      renderRoute();
    } catch {
      if (catalogueStatus) catalogueStatus.textContent = "catalogue unavailable";
    }
  }

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

  applyTheme(document.documentElement.dataset.shopTheme || "night");

  if (liveBand && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    liveBand.autoplay = false;
    liveBand.pause();
  }

  if (bordelleFilm && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const reducedMotionUrl = new URL(bordelleFilm.src);
    reducedMotionUrl.searchParams.set("autoplay", "0");
    bordelleFilm.src = reducedMotionUrl.href;
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
  renderRoute();
  loadCatalogue();
  startLiveBand();

  window.addEventListener("pagehide", () => {
    if (liveBandSyncTimer) window.clearInterval(liveBandSyncTimer);
  }, { once: true });
}());
