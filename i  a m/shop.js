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
  const productDialogForm = document.querySelector("[data-shop-product-dialog-form]");
  const productDialogRetailer = document.querySelector("[data-shop-product-dialog-retailer]");
  const themeKey = "iamShopThemeV1";
  let activeCategory = "all";
  let activeCatalogueCategory = "all";
  let catalogueProducts = [];

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
    image.alt = `${product.brand} ${product.name}`;
    image.loading = "lazy";
    figure.append(image);

    const copy = document.createElement("div");
    copy.className = "shop-catalogue-card__copy";
    const brand = document.createElement("p");
    brand.textContent = product.brand;
    const name = document.createElement("h3");
    name.textContent = product.name;
    const form = document.createElement("span");
    form.textContent = labelCategories(product.categories);
    const expand = document.createElement("em");
    expand.textContent = "expand +";
    copy.append(brand, name, form, expand);
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
      productDialogImage.alt = `${product.brand} ${product.name}`;
    }
    if (productDialogBrand) productDialogBrand.textContent = product.brand;
    if (productDialogTitle) productDialogTitle.textContent = product.name;
    if (productDialogForm) productDialogForm.textContent = labelCategories(product.categories);
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
    document.body.dataset.shopView = catalogueRoute ? "catalogue" : "editorial";
    if (catalogueSection) catalogueSection.hidden = !catalogueRoute;
    if (!catalogueRoute) {
      closeProduct();
      return;
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
      const response = await fetch("shop-catalogue-v1.json?v=1", { credentials: "same-origin" });
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
  renderRoute();
  loadCatalogue();
}());
