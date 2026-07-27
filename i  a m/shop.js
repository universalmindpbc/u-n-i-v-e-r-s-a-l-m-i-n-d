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
  const returnMusicLinks = Array.from(document.querySelectorAll("[data-shop-return-music]"));
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
  const catalogueBrandSelect = document.querySelector("[data-catalogue-brand]");
  const catalogueTypeSelect = document.querySelector("[data-catalogue-type]");
  const catalogueSortSelect = document.querySelector("[data-catalogue-sort]");
  const catalogueBrandTitle = document.querySelector("[data-catalogue-brand-title]");
  const catalogueBrandKicker = document.querySelector("[data-catalogue-brand-kicker]");
  const catalogueAsideBrand = document.querySelector("[data-catalogue-aside-brand]");
  const catalogueAsideForm = document.querySelector("[data-catalogue-aside-form]");
  const productDialog = document.querySelector("[data-shop-product-dialog]");
  const productDialogClose = document.querySelector("[data-shop-product-dialog-close]");
  const productDialogImage = document.querySelector("[data-shop-product-dialog-image]");
  const productDialogBrand = document.querySelector("[data-shop-product-dialog-brand]");
  const productDialogTitle = document.querySelector("[data-shop-product-dialog-title]");
  const productDialogDescription = document.querySelector("[data-shop-product-dialog-description]");
  const productDialogForm = document.querySelector("[data-shop-product-dialog-form]");
  const productDialogPrice = document.querySelector("[data-shop-product-dialog-price]");
  const productDialogRetailer = document.querySelector("[data-shop-product-dialog-retailer]");
  const productDialogRetailerLabel = document.querySelector("[data-shop-product-dialog-retailer-label]");
  const themeKey = "iamShopThemeV1";
  let activeCategory = "all";
  let activeCatalogueBrand = "all";
  let activeCatalogueType = "all";
  let activeCatalogueSort = "editorial";
  let catalogueProducts = [];
  let catalogueKernel = null;
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

  returnMusicLinks.forEach((link) => link.addEventListener("click", (event) => {
    if (!inMusicTelevisionFrame) return;
    event.preventDefault();
    window.parent.postMessage({ type: "iam:return-to-television" }, window.location.origin);
  }));

  function setActiveGlobalNavItem(itemName = "shop") {
    const navItems = Array.from(document.querySelectorAll("[data-nav-item]"));
    const technologySubmenu = document.querySelector('[data-nav-submenu="technology"]');
    navItems.forEach((item) => {
      const active = item.dataset.navItem === itemName;
      item.classList.toggle("is-active", active);
      if (item.dataset.navItem === "technology") item.setAttribute("aria-expanded", String(active));
    });
    technologySubmenu?.classList.toggle("is-open", itemName === "technology");
  }

  function closeGlobalNav() {
    document.body.classList.remove("nav-open");
    document.querySelector("[data-global-nav]")?.classList.remove("is-open");
    document.querySelector("[data-global-nav]")?.setAttribute("aria-hidden", "true");
  }

  document.querySelectorAll("[data-nav-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const nav = document.querySelector("[data-global-nav]");
      if (!nav) return;
      if (nav.classList.contains("is-open")) {
        closeGlobalNav();
        return;
      }
      setActiveGlobalNavItem("shop");
      document.body.classList.add("nav-open");
      nav.classList.add("is-open");
      nav.setAttribute("aria-hidden", "false");
    });
  });

  document.querySelectorAll("[data-nav-close]").forEach((button) => {
    button.addEventListener("click", closeGlobalNav);
  });

  document.querySelectorAll("[data-nav-item]").forEach((item) => {
    item.addEventListener("mouseenter", () => setActiveGlobalNavItem(item.dataset.navItem));
    item.addEventListener("focus", () => setActiveGlobalNavItem(item.dataset.navItem));
    item.addEventListener("click", (event) => {
      if (item.getAttribute("aria-disabled") === "true") {
        event.preventDefault();
        setActiveGlobalNavItem(item.dataset.navItem);
        return;
      }
      if (item.dataset.navItem === "technology") {
        event.preventDefault();
        setActiveGlobalNavItem("technology");
        return;
      }
      if (!inMusicTelevisionFrame || item.dataset.navItem === "home") return;
      const href = item.getAttribute("href") || "";
      if (!href || href.startsWith("mailto:")) return;
      event.preventDefault();
      const url = new URL(href, window.location.href);
      url.searchParams.set("adaptiveFrame", "1");
      url.searchParams.set("musicTelevisionFrame", "1");
      url.searchParams.set("navigationShell", "1");
      window.location.href = url.href;
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeGlobalNav();
  });

  function labelCategories(categories = []) {
    return categories.filter((category) => category !== "lingerie").join(" / ") || "lingerie";
  }

  function brandSlug(brand = "") {
    return String(brand)
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function currentBrandRecord() {
    if (!catalogueKernel || activeCatalogueBrand === "all") return null;
    return catalogueKernel.brandCounts.find((entry) => brandSlug(entry.brand) === activeCatalogueBrand) || null;
  }

  function normalisedProductType(product) {
    if (product.productType && product.productType !== "Pending") return product.productType;
    if (product.categories?.includes("bras")) return "Bra";
    if (product.categories?.includes("briefs")) return "Briefs";
    if (product.categories?.includes("bodysuits")) return "Bodysuit";
    return "Other";
  }

  function productMatchesType(product) {
    if (activeCatalogueType === "all") return true;
    if (brandSlug(normalisedProductType(product)) === activeCatalogueType) return true;
    return Array.isArray(product.forms) && product.forms.some((form) => brandSlug(form) === activeCatalogueType);
  }

  function option(value, label) {
    const item = document.createElement("option");
    item.value = value;
    item.textContent = label;
    return item;
  }

  function populateCatalogueControls() {
    if (!catalogueKernel) return;
    if (catalogueBrandSelect) {
      catalogueBrandSelect.replaceChildren(
        option("all", "all 23 brands"),
        ...catalogueKernel.brandOrder.map((brand) => option(brandSlug(brand), brand)),
      );
    }
    if (catalogueTypeSelect) {
      const productTypes = Array.from(new Set(
        [
          ...catalogueKernel.products.map(normalisedProductType),
          ...catalogueKernel.products.flatMap((product) => product.forms || []),
        ].filter((type) => type && type !== "Pending" && type !== "Other"),
      )).sort((a, b) => a.localeCompare(b));
      catalogueTypeSelect.replaceChildren(
        option("all", "all types"),
        ...productTypes.map((type) => option(brandSlug(type), type)),
      );
    }
  }

  function updateCatalogueHeader(visibleProducts) {
    const brand = currentBrandRecord();
    const displayName = brand?.brand || "SHOP";
    if (catalogueBrandTitle) catalogueBrandTitle.textContent = displayName;
    if (catalogueBrandKicker) catalogueBrandKicker.textContent = brand?.brand || "all 23 brands";
    if (catalogueAsideBrand) catalogueAsideBrand.textContent = brand?.brand || "James Bondage";
    if (catalogueAsideForm) {
      catalogueAsideForm.textContent = activeCatalogueType === "all"
        ? "lingerie / swim / movement"
        : activeCatalogueType.replace(/-/g, " ");
    }
    if (catalogueCount) catalogueCount.textContent = String(visibleProducts.length).padStart(2, "0");
    if (catalogueBrandSelect) catalogueBrandSelect.value = activeCatalogueBrand;
    if (catalogueTypeSelect) catalogueTypeSelect.value = activeCatalogueType;
    if (catalogueSortSelect) catalogueSortSelect.value = activeCatalogueSort;
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
    const brand = document.createElement("p");
    brand.textContent = product.brand;
    const name = document.createElement("h3");
    name.textContent = product.name;
    const form = document.createElement("span");
    form.textContent = product.color || labelCategories(product.categories);
    const price = document.createElement("strong");
    price.textContent = product.price;
    const expand = document.createElement("em");
    expand.textContent = "+";
    copy.append(brand, name, form, price, expand);
    button.append(figure, copy);
    article.append(button);
    return article;
  }

  function renderCatalogue() {
    if (!catalogueGrid || !catalogueKernel) return;
    const brand = currentBrandRecord();
    const visibleProducts = catalogueProducts
      .filter((product) => activeCatalogueBrand === "all" || brandSlug(product.brand) === activeCatalogueBrand)
      .filter(productMatchesType)
      .sort((a, b) => {
        if (activeCatalogueSort === "price-asc") return (a.priceValue ?? Number.MAX_SAFE_INTEGER) - (b.priceValue ?? Number.MAX_SAFE_INTEGER);
        if (activeCatalogueSort === "price-desc") return (b.priceValue ?? -1) - (a.priceValue ?? -1);
        return String(a.id).localeCompare(String(b.id));
      });

    if (visibleProducts.length) {
      catalogueGrid.replaceChildren(...visibleProducts.map(buildCatalogueCard));
    } else {
      const empty = document.createElement("p");
      empty.className = "shop-catalogue__empty";
      empty.textContent = brand ? brand.brand + " / the edit is being prepared." : "The edit is being prepared.";
      catalogueGrid.replaceChildren(empty);
    }
    updateCatalogueHeader(visibleProducts);
    if (catalogueStatus) {
      const sourceTotal = brand?.count || catalogueKernel.counts.products;
      catalogueStatus.textContent = visibleProducts.length + " verified / " + sourceTotal + " approved";
    }
  }

  function productFromHash() {
    const match = window.location.hash.match(/^#catalogue\/[^/]+\/product\/([^/?#]+)/);
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
    if (productDialogRetailerLabel) productDialogRetailerLabel.textContent = "view at " + product.brand;
    if (!productDialog.open) productDialog.showModal();
  }

  function closeProduct(options = {}) {
    if (productDialog?.open) productDialog.close();
    if (options.updateRoute && window.location.hash.includes("/product/")) {
      window.history.replaceState(null, "", "#catalogue/" + activeCatalogueBrand);
      renderRoute();
    }
  }

  function catalogueRoute() {
    const match = window.location.hash.match(/^#catalogue\/([^/]+)(?:\/type\/([^/]+))?/);
    if (!match) return null;
    return {
      brand: decodeURIComponent(match[1] || "all"),
      type: decodeURIComponent(match[2] || "all"),
    };
  }

  function renderRoute() {
    const route = catalogueRoute();
    const enteringCatalogue = Boolean(route) && document.body.dataset.shopView !== "catalogue";
    document.body.dataset.shopView = route ? "catalogue" : "editorial";
    if (catalogueSection) catalogueSection.hidden = !route;
    if (!route) {
      closeProduct();
      return;
    }
    const validBrand = route.brand === "all" || catalogueKernel?.brandCounts.some((entry) => brandSlug(entry.brand) === route.brand);
    activeCatalogueBrand = validBrand ? route.brand : "all";
    activeCatalogueType = route.type || "all";
    renderCatalogue();
    if (enteringCatalogue) {
      const root = document.documentElement;
      root.style.scrollBehavior = "auto";
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      window.requestAnimationFrame(() => root.style.removeProperty("scroll-behavior"));
    }
    const selectedProduct = productFromHash();
    if (selectedProduct) showProduct(selectedProduct);
    else closeProduct();
  }

  catalogueGrid?.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-catalogue-product-open]");
    if (!trigger) return;
    const slug = trigger.dataset.catalogueProductOpen;
    window.location.hash = "catalogue/" + activeCatalogueBrand + "/product/" + encodeURIComponent(slug);
  });

  catalogueBrandSelect?.addEventListener("change", () => {
    activeCatalogueBrand = catalogueBrandSelect.value || "all";
    window.location.hash = "catalogue/" + activeCatalogueBrand;
  });

  catalogueTypeSelect?.addEventListener("change", () => {
    activeCatalogueType = catalogueTypeSelect.value || "all";
    window.location.hash = activeCatalogueType === "all"
      ? "catalogue/" + activeCatalogueBrand
      : "catalogue/" + activeCatalogueBrand + "/type/" + activeCatalogueType;
  });

  catalogueSortSelect?.addEventListener("change", () => {
    activeCatalogueSort = catalogueSortSelect.value || "editorial";
    renderCatalogue();
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
      const response = await fetch("shop-product-kernel-v1.json?v=1", { credentials: "same-origin" });
      if (!response.ok) throw new Error(`Catalogue request failed: ${response.status}`);
      catalogueKernel = await response.json();
      catalogueProducts = Array.isArray(catalogueKernel.products)
        ? catalogueKernel.products.filter((product) => product.metadataStatus === "Metadata ready" && product.image)
        : [];
      populateCatalogueControls();
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

    musicLabel.textContent = detail.loading ? "connecting / James Bondage Parties" : "listen / James Bondage Parties";
    musicButton.setAttribute("aria-label", "Listen to James Bondage Parties while browsing");
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
