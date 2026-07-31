(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const inMusicTelevisionFrame = window.self !== window.top && (
    params.get("musicTelevisionFrame") === "1" ||
    window.__iamMusicTelevisionFrame === true
  );

  // Shop is a room inside Music Television. A top-level visit enters the
  // persistent shell first so existing media can survive page navigation.
  if (
    window.self === window.top
    && params.get("standalone") !== "1"
    && window.IAMMobileEditorial?.active !== true
  ) {
    const shellUrl = new URL("index.html", window.location.href);
    shellUrl.searchParams.set("shop", "1");
    window.location.replace(shellUrl.href);
    return;
  }

  const products = Array.from(document.querySelectorAll("[data-product]"));
  const silentEditorialVideos = Array.from(document.querySelectorAll("[data-shop-silent-video]"));
  const categoryButtons = Array.from(document.querySelectorAll("[data-filter-category]"));
  const shopMenu = document.querySelector("[data-shop-menu]");
  const returnMusicLinks = Array.from(document.querySelectorAll("[data-shop-return-music]"));
  const filterStatus = document.querySelector("[data-filter-status]");
  const themeButton = document.querySelector("[data-shop-theme-toggle]");
  const themeLabel = document.querySelector("[data-shop-theme-label]");
  const heroVideos = Array.from(document.querySelectorAll("[data-shop-hero-video]"));
  const heroFullscreen = document.querySelector("[data-shop-hero-fullscreen]");
  const musicButton = document.querySelector("[data-shop-music]");
  const musicLabel = document.querySelector("[data-shop-music-label]");
  const catalogueSection = document.querySelector("[data-shop-catalogue]");
  const catalogueHeader = document.querySelector("[data-catalogue-editorial-header]");
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
  const catalogueLeadImage = document.querySelector("[data-catalogue-lead-image]");
  const catalogueAsideImage = document.querySelector("[data-catalogue-aside-image]");
  const catalogueMoreWrap = document.querySelector("[data-catalogue-more-wrap]");
  const catalogueLoadMore = document.querySelector("[data-catalogue-load-more]");
  const catalogueProgress = document.querySelector("[data-catalogue-progress]");
  const productDialog = document.querySelector("[data-shop-product-dialog]");
  const productDialogClose = document.querySelector("[data-shop-product-dialog-close]");
  const productDialogMedia = document.querySelector("[data-shop-product-dialog-media]");
  const productDialogBrand = document.querySelector("[data-shop-product-dialog-brand]");
  const productDialogTitle = document.querySelector("[data-shop-product-dialog-title]");
  const productDialogDescription = document.querySelector("[data-shop-product-dialog-description]");
  const productDialogForm = document.querySelector("[data-shop-product-dialog-form]");
  const productDialogPrice = document.querySelector("[data-shop-product-dialog-price]");
  const productDialogRetailer = document.querySelector("[data-shop-product-dialog-retailer]");
  const productDialogRetailerLabel = document.querySelector("[data-shop-product-dialog-retailer-label]");
  const sexEdViewport = document.querySelector("[data-shop-sex-ed-viewport]");
  const sexEdPrevious = document.querySelector("[data-shop-sex-ed-previous]");
  const sexEdNext = document.querySelector("[data-shop-sex-ed-next]");
  const openingEditorialVideo = document.querySelector(".shop-looks [data-shop-silent-video]");
  const openingEditorialImages = Array.from(document.querySelectorAll(".shop-looks img")).slice(0, 2);
  const themeKey = "iamShopThemeV1";
  const emilioCurrencyRecoveryHost = "www.emiliocavallini.com";
  const emilioCurrencyRecoveryDelay = 1800;
  const emilioRetailerTabName = "iam-emilio-cavallini";
  let emilioCurrencyRecoveryReady = false;
  let activeCategory = "all";
  let activeCatalogueBrand = "all";
  let activeCatalogueType = "all";
  let activeCatalogueSort = "editorial";
  let activeCatalogueLead = "";
  let activeCatalogueLimit = 24;
  let catalogueProducts = [];
  let catalogueKernel = null;
  let catalogueReturnHash = "";
  let catalogueReturnScrollY = 0;
  let lastCatalogueResultCount = 0;
  const catalogueChunkSize = 24;
  let activeHeroVideoIndex = 0;
  let openingPreloadPromise = null;

  function prepareSilentEditorialVideos() {
    if (!silentEditorialVideos.length) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    silentEditorialVideos.forEach((video) => {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.removeAttribute("autoplay");
      if (reducedMotion) video.pause();
    });

    if (reducedMotion) return;

    const playIfVisible = (video) => {
      if (document.hidden) return;
      video.muted = true;
      video.play().catch(() => null);
    };

    if (!("IntersectionObserver" in window)) {
      silentEditorialVideos.forEach(playIfVisible);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio >= .18) playIfVisible(video);
        else video.pause();
      });
    }, {
      rootMargin: "180px 0px",
      threshold: [0, .18, .6],
    });

    silentEditorialVideos.forEach((video) => observer.observe(video));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) silentEditorialVideos.forEach((video) => video.pause());
    });
  }

  function openingAssetReady(element, readyEvent, timeout = 8000) {
    if (!element) return Promise.resolve();
    if (element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0) return Promise.resolve();
    if (element instanceof HTMLVideoElement && element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();

    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        element.removeEventListener(readyEvent, finish);
        element.removeEventListener("error", finish);
        resolve();
      };
      const timer = window.setTimeout(finish, timeout);
      element.addEventListener(readyEvent, finish, { once: true });
      element.addEventListener("error", finish, { once: true });
    });
  }

  function preloadOpeningAssets() {
    if (openingPreloadPromise) return openingPreloadPromise;
    document.body.dataset.shopOpeningPreload = "loading";

    if (openingEditorialVideo) {
      openingEditorialVideo.preload = "auto";
      openingEditorialVideo.muted = true;
      openingEditorialVideo.defaultMuted = true;
      if (openingEditorialVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) openingEditorialVideo.load();
    }

    openingEditorialImages.forEach((image) => {
      image.loading = "eager";
      image.fetchPriority = "high";
    });

    const openingHeroVideo = heroVideos[0];
    if (openingHeroVideo) {
      openingHeroVideo.preload = "auto";
      openingHeroVideo.muted = true;
      openingHeroVideo.defaultMuted = true;
      if (openingHeroVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) openingHeroVideo.load();
    }

    openingPreloadPromise = openingAssetReady(openingHeroVideo, "loadeddata", 2500).then(() => {
      document.body.dataset.shopOpeningPreload = "ready";
      window.parent.postMessage({ type: "iam:shop-opening-media-ready" }, window.location.origin);
    });

    return openingPreloadPromise;
  }

  function startHeroPlaylist() {
    if (!heroVideos.length) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const primeNextVideo = () => {
      const nextVideo = heroVideos[(activeHeroVideoIndex + 1) % heroVideos.length];
      if (!nextVideo) return;
      nextVideo.preload = "auto";
      nextVideo.muted = true;
      nextVideo.defaultMuted = true;
      if (nextVideo.readyState === HTMLMediaElement.HAVE_NOTHING) nextVideo.load();
    };

    const showVideo = (index) => {
      activeHeroVideoIndex = (index + heroVideos.length) % heroVideos.length;
      heroVideos.forEach((video, videoIndex) => {
        const active = videoIndex === activeHeroVideoIndex;
        video.classList.toggle("is-active", active);
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        if (!active) video.pause();
      });

      const activeVideo = heroVideos[activeHeroVideoIndex];
      document.body.dataset.shopHeroState = "playing";
      document.body.dataset.shopHeroFilm = activeVideo.dataset.shopHeroFilm || "";
      if (activeVideo.ended || activeVideo.currentTime >= activeVideo.duration - .2) activeVideo.currentTime = 0;
      if (!reducedMotion && !document.hidden) activeVideo.play().catch(() => null);
      primeNextVideo();
    };

    heroVideos.forEach((video, index) => {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.addEventListener("playing", () => {
        if (index === activeHeroVideoIndex) primeNextVideo();
      });
      video.addEventListener("ended", () => {
        if (index === activeHeroVideoIndex) showVideo(index + 1);
      });
      video.addEventListener("error", () => {
        if (index === activeHeroVideoIndex && heroVideos.length > 1) showVideo(index + 1);
      });
    });

    if (reducedMotion) {
      document.body.dataset.shopHeroState = "poster";
      heroVideos.forEach((video) => video.pause());
      return;
    }

    showVideo(0);
    document.addEventListener("visibilitychange", () => {
      const activeVideo = heroVideos[activeHeroVideoIndex];
      if (!activeVideo) return;
      if (document.hidden) activeVideo.pause();
      else activeVideo.play().catch(() => null);
    });
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

  function catalogueBrandName(product) {
    return product.catalogueBrand || product.brand;
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
        option("all", `all ${catalogueKernel.brandOrder.length} brands`),
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

  function productHasFullDetail(product) {
    return Boolean(product.image || product.video || product.gallery?.length);
  }

  function productHasImage(product) {
    return Boolean(product.image);
  }

  function customerProductName(product) {
    let name = String(product?.name || "").trim();
    const brand = String(product?.brand || "").trim();
    if (!name) return "";

    if (/^nike$/i.test(brand)) name = name.replace(/^Nike(?:SKIMS)?\s+/i, "");
    else if (/^adidas$/i.test(brand)) name = name.replace(/^adidas\s+/i, "");
    else if (/^skims$/i.test(brand)) name = name.replace(/^SKIMS\s+/i, "");
    else if (/^nagnata$/i.test(brand)) name = name.replace(/^NAGNATA\s+/i, "");
    else {
      const escapedBrand = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (escapedBrand) name = name.replace(new RegExp(`^${escapedBrand}\\s+`, "i"), "");
    }

    return name
      .replace(/\s+Release Date$/i, "")
      .replace(/\s+-\s+[^-]+\s+-\s+Size\s+[^-]+$/i, "")
      .trim();
  }

  function customerProductColour(product) {
    if (product?.color) return String(product.color).trim();
    const match = String(product?.name || "").match(/\s+-\s+([^-]+)\s+-\s+Size\s+[^-]+$/i);
    return match?.[1]?.trim() || "";
  }

  function updateCatalogueHeader(visibleProducts) {
    const brand = currentBrandRecord();
    const displayName = brand?.brand || "SHOP";
    if (catalogueHeader) catalogueHeader.dataset.catalogueBrand = activeCatalogueBrand;
    if (catalogueBrandTitle) catalogueBrandTitle.textContent = displayName;
    if (catalogueBrandKicker) catalogueBrandKicker.textContent = brand?.brand || `all ${catalogueKernel?.brandOrder?.length || 27} brands`;
    if (catalogueAsideBrand) catalogueAsideBrand.textContent = brand?.brand || "James Bondage";
    if (catalogueAsideForm) {
      catalogueAsideForm.textContent = activeCatalogueType === "all"
        ? (brand?.formLabel || "lingerie / swim / movement")
        : activeCatalogueType.replace(/-/g, " ");
    }
    if (catalogueCount) catalogueCount.textContent = String(brand?.count ?? visibleProducts.length).padStart(2, "0");
    if (catalogueBrandSelect) catalogueBrandSelect.value = activeCatalogueBrand;
    if (catalogueTypeSelect) catalogueTypeSelect.value = activeCatalogueType;
    if (catalogueSortSelect) catalogueSortSelect.value = activeCatalogueSort;

    const brandImages = activeCatalogueBrand === "all"
      ? []
      : visibleProducts.flatMap((product) => {
        const sources = product.gallery?.length ? product.gallery : [product.image];
        return sources.filter(Boolean).map((image) => ({
          image,
          imageAlt: product.imageAlt,
          brand: product.brand,
          name: product.name,
        }));
      }).slice(0, 2);
    const hasBrandImages = brandImages.length >= 2;
    catalogueHeader?.classList.toggle("is-text-only", !hasBrandImages);
    if (hasBrandImages && catalogueLeadImage && catalogueAsideImage) {
      catalogueLeadImage.src = brandImages[0].image;
      catalogueLeadImage.alt = brandImages[0].imageAlt || `${brandImages[0].brand} ${brandImages[0].name}`;
      catalogueAsideImage.src = brandImages[1].image;
      catalogueAsideImage.alt = brandImages[1].imageAlt || `${brandImages[1].brand} ${brandImages[1].name}`;
    }
  }

  function buildCatalogueCard(product, index) {
    const article = document.createElement("article");
    article.className = "shop-catalogue-card";
    article.dataset.catalogueProduct = product.slug || product.id;
    article.dataset.categories = (product.categories || []).join(" ");
    const hasImage = productHasImage(product);
    const fullDetail = productHasFullDetail(product);
    article.dataset.metadataState = fullDetail ? "ready" : "inventory";

    const control = document.createElement("button");
    control.type = "button";
    control.dataset.catalogueProductOpen = product.slug;
    const galleryViewLabel = product.galleryViewCount
      ? `, image ${product.galleryViewIndex + 1} of ${product.galleryViewCount}`
      : "";
    control.setAttribute("aria-label", `View details for ${product.brand} ${customerProductName(product)}${galleryViewLabel}`);

    const figure = document.createElement("figure");
    if (hasImage) {
      if (product.video) {
        const video = document.createElement("video");
        video.src = product.video;
        video.poster = product.image;
        video.muted = true;
        video.defaultMuted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        video.preload = index < 6 ? "auto" : "metadata";
        video.setAttribute("aria-hidden", "true");
        figure.append(video);
        video.play().catch(() => null);
      } else {
        const image = document.createElement("img");
        image.src = product.image;
        image.alt = product.imageAlt || `${product.brand} ${customerProductName(product)}`;
        image.loading = index < 6 ? "eager" : "lazy";
        figure.append(image);
      }
    } else {
      figure.className = "shop-catalogue-card__placeholder";
      const inventoryBrand = document.createElement("span");
      inventoryBrand.textContent = product.brand;
      figure.append(inventoryBrand);
    }

    const copy = document.createElement("div");
    copy.className = "shop-catalogue-card__copy";
    const brand = document.createElement("p");
    brand.textContent = product.brand;
    const name = document.createElement("h3");
    name.textContent = customerProductName(product);
    const form = document.createElement("span");
    form.textContent = customerProductColour(product);
    form.hidden = !form.textContent;
    const price = document.createElement("strong");
    price.textContent = product.price || "";
    price.hidden = !price.textContent;
    const expand = document.createElement("em");
    expand.textContent = "+";
    copy.append(brand, name, form, price, expand);
    control.append(figure, copy);
    article.append(control);
    return article;
  }

  function roundRobinByBrand(productsToOrder) {
    const buckets = new Map(catalogueKernel.brandOrder.map((brand) => [brand, []]));
    productsToOrder.forEach((product) => {
      const catalogueBrand = catalogueBrandName(product);
      if (!buckets.has(catalogueBrand)) buckets.set(catalogueBrand, []);
      buckets.get(catalogueBrand).push(product);
    });
    const ordered = [];
    let added = true;
    while (added) {
      added = false;
      for (const bucket of buckets.values()) {
        if (!bucket.length) continue;
        ordered.push(bucket.shift());
        added = true;
      }
    }
    return ordered;
  }

  function galleryDisplayProducts(product) {
    if (!product?.gallery?.length) return [product];
    return product.gallery.map((source, index) => ({
      ...product,
      slug: `${product.slug}--image-${index + 1}`,
      sourceSlug: product.slug,
      image: source,
      imageAlt: `${product.imageAlt || `${product.brand} ${customerProductName(product)}`} / view ${index + 1} of ${product.gallery.length}`,
      gallery: [],
      video: "",
      galleryViewIndex: index,
      galleryViewCount: product.gallery.length,
    }));
  }

  function renderCatalogue() {
    if (!catalogueGrid || !catalogueKernel) return;
    const brand = currentBrandRecord();
    let visibleProducts = catalogueProducts
      .filter((product) => activeCatalogueBrand === "all" || brandSlug(catalogueBrandName(product)) === activeCatalogueBrand)
      .filter(productMatchesType)
      .sort((a, b) => {
        if (activeCatalogueSort === "price-asc") return (a.priceValue ?? Number.MAX_SAFE_INTEGER) - (b.priceValue ?? Number.MAX_SAFE_INTEGER);
        if (activeCatalogueSort === "price-desc") return (b.priceValue ?? -1) - (a.priceValue ?? -1);
        const editorialRank = (a.editorialRank ?? Number.MAX_SAFE_INTEGER) - (b.editorialRank ?? Number.MAX_SAFE_INTEGER);
        if (editorialRank) return editorialRank;
        return String(a.id).localeCompare(String(b.id));
      });

    if (activeCatalogueBrand === "all" && activeCatalogueSort === "editorial") {
      visibleProducts = roundRobinByBrand(visibleProducts);
    }

    if (activeCatalogueLead) {
      const leadIndex = visibleProducts.findIndex((product) => product.slug === activeCatalogueLead);
      if (leadIndex > 0) {
        const [leadProduct] = visibleProducts.splice(leadIndex, 1);
        visibleProducts.unshift(leadProduct);
      }
    }

    if (activeCatalogueBrand === "iris-van-herpen") {
      visibleProducts = visibleProducts.flatMap(galleryDisplayProducts);
    }

    lastCatalogueResultCount = visibleProducts.length;
    const displayedProducts = visibleProducts.slice(0, activeCatalogueLimit);

    if (displayedProducts.length) {
      catalogueGrid.replaceChildren(...displayedProducts.map(buildCatalogueCard));
    } else {
      const empty = document.createElement("p");
      empty.className = "shop-catalogue__empty";
      empty.textContent = brand ? brand.brand + " / the edit is being prepared." : "The edit is being prepared.";
      catalogueGrid.replaceChildren(empty);
    }
    updateCatalogueHeader(visibleProducts);
    if (catalogueStatus) {
      catalogueStatus.textContent = `showing ${displayedProducts.length} of ${visibleProducts.length}`;
    }
    const hasMore = displayedProducts.length < visibleProducts.length;
    if (catalogueMoreWrap) catalogueMoreWrap.hidden = !hasMore;
    if (catalogueLoadMore) {
      const remaining = Math.min(catalogueChunkSize, visibleProducts.length - displayedProducts.length);
      catalogueLoadMore.textContent = `load ${remaining} more`;
    }
    if (catalogueProgress) catalogueProgress.textContent = `showing ${displayedProducts.length} of ${visibleProducts.length}`;
  }

  function productFromRoute(route) {
    if (!route?.product) return null;
    const slug = route.product;
    const exactProduct = catalogueProducts.find((product) => product.slug === slug);
    if (exactProduct) return galleryDisplayProducts(exactProduct)[0];

    const galleryRoute = slug.match(/^(.*)--image-(\d+)$/);
    if (!galleryRoute) return null;
    const sourceProduct = catalogueProducts.find((product) => product.slug === galleryRoute[1]);
    const galleryProduct = sourceProduct ? galleryDisplayProducts(sourceProduct)[Number(galleryRoute[2]) - 1] : null;
    return galleryProduct || null;
  }

  function renderProductDialogMedia(product) {
    if (!productDialogMedia) return;
    productDialogMedia.classList.toggle("has-gallery", Boolean(product.gallery?.length));
    productDialogMedia.classList.toggle("has-video", Boolean(product.video));

    if (product.gallery?.length) {
      const gallery = document.createElement("div");
      gallery.className = "shop-product-dialog__gallery";
      product.gallery.forEach((source, index) => {
        const image = document.createElement("img");
        image.src = source;
        image.alt = `${product.imageAlt || `${product.brand} ${customerProductName(product)}`} / view ${index + 1} of ${product.gallery.length}`;
        image.loading = index < 2 ? "eager" : "lazy";
        gallery.append(image);
      });
      productDialogMedia.replaceChildren(gallery);
      return;
    }

    if (product.video) {
      const video = document.createElement("video");
      video.src = product.video;
      video.poster = product.image;
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = "auto";
      video.setAttribute("aria-label", product.imageAlt || `${product.brand} ${customerProductName(product)} product film`);
      productDialogMedia.replaceChildren(video);
      video.play().catch(() => null);
      return;
    }

    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.imageAlt || `${product.brand} ${customerProductName(product)}`;
    productDialogMedia.replaceChildren(image);
  }

  function showProduct(product) {
    if (!productDialog || !product) return;
    renderProductDialogMedia(product);
    if (productDialogBrand) productDialogBrand.textContent = product.brand;
    if (productDialogTitle) productDialogTitle.textContent = customerProductName(product);
    if (productDialogDescription) {
      const description = String(product.description || "").trim();
      const paragraphs = description
        ? description.split(/\n\s*\n/).map((copy) => {
          const paragraph = document.createElement("p");
          paragraph.textContent = copy.trim();
          return paragraph;
        })
        : [];
      productDialogDescription.replaceChildren(...paragraphs);
      productDialogDescription.hidden = !paragraphs.length;
    }
    if (productDialogForm) {
      productDialogForm.textContent = customerProductColour(product);
      productDialogForm.hidden = !productDialogForm.textContent;
    }
    if (productDialogPrice) {
      productDialogPrice.textContent = product.price || "";
      productDialogPrice.hidden = !productDialogPrice.textContent;
    }
    if (productDialogRetailer) productDialogRetailer.href = product.retailerUrl;
    if (productDialogRetailerLabel) {
      productDialogRetailerLabel.textContent = product.brand === "Iris van Herpen"
        ? "order haute couture"
        : "view at " + (product.retailer || product.brand);
    }
    if (!productDialog.open) productDialog.showModal();
  }

  function needsEmilioCurrencyRecovery(retailerUrl) {
    try {
      const destination = new URL(retailerUrl, window.location.href);
      if (destination.hostname !== emilioCurrencyRecoveryHost) return false;
      return !emilioCurrencyRecoveryReady;
    } catch {
      return false;
    }
  }

  function markEmilioCurrencyRecoveryReady() {
    emilioCurrencyRecoveryReady = true;
  }

  function openRetailerWithCurrencyRecovery(event) {
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) return;

    const retailerUrl = productDialogRetailer?.href || "";
    if (!needsEmilioCurrencyRecovery(retailerUrl)) return;

    const retailerWindow = window.open("", emilioRetailerTabName);
    if (!retailerWindow) return;

    event.preventDefault();
    try {
      retailerWindow.opener = null;
      retailerWindow.location.href = retailerUrl;
    } catch {
      window.open(retailerUrl, emilioRetailerTabName);
    }

    window.setTimeout(() => {
      try {
        retailerWindow.location.href = retailerUrl;
      } catch {
        window.open(retailerUrl, emilioRetailerTabName);
      }
      markEmilioCurrencyRecoveryReady();
    }, emilioCurrencyRecoveryDelay);
  }

  function closeProduct(options = {}) {
    if (productDialog?.open) productDialog.close();
    if (options.updateRoute && window.location.hash.includes("/product/")) {
      window.history.replaceState(null, "", catalogueReturnHash || catalogueBrowseHash());
      renderRoute();
      const restoreCatalogueScroll = () => {
        window.scrollTo({ top: catalogueReturnScrollY, left: 0, behavior: "auto" });
      };
      window.requestAnimationFrame(() => {
        restoreCatalogueScroll();
        window.setTimeout(restoreCatalogueScroll, 50);
      });
    }
  }

  function catalogueRoute() {
    const [path, query = ""] = window.location.hash.slice(1).split("?");
    const parts = path.split("/").filter(Boolean);
    if (parts[0] !== "catalogue" || !parts[1]) return null;
    const search = new URLSearchParams(query);
    const typeIndex = parts.indexOf("type");
    const productIndex = parts.indexOf("product");
    return {
      brand: decodeURIComponent(parts[1] || "all"),
      type: typeIndex >= 0 ? decodeURIComponent(parts[typeIndex + 1] || "all") : decodeURIComponent(search.get("type") || "all"),
      product: productIndex >= 0 ? decodeURIComponent(parts[productIndex + 1] || "") : "",
      sort: search.get("sort") || "editorial",
      lead: search.get("lead") || "",
      count: Number(search.get("count") || catalogueChunkSize),
    };
  }

  function catalogueBrowseHash() {
    const path = activeCatalogueType === "all"
      ? `#catalogue/${activeCatalogueBrand}`
      : `#catalogue/${activeCatalogueBrand}/type/${activeCatalogueType}`;
    const search = new URLSearchParams();
    if (activeCatalogueSort !== "editorial") search.set("sort", activeCatalogueSort);
    if (activeCatalogueLead) search.set("lead", activeCatalogueLead);
    if (activeCatalogueLimit > catalogueChunkSize) search.set("count", String(activeCatalogueLimit));
    const query = search.toString();
    return path + (query ? `?${query}` : "");
  }

  function catalogueProductHash(slug) {
    const search = new URLSearchParams();
    if (activeCatalogueType !== "all") search.set("type", activeCatalogueType);
    if (activeCatalogueSort !== "editorial") search.set("sort", activeCatalogueSort);
    if (activeCatalogueLead) search.set("lead", activeCatalogueLead);
    if (activeCatalogueLimit > catalogueChunkSize) search.set("count", String(activeCatalogueLimit));
    const query = search.toString();
    return `#catalogue/${activeCatalogueBrand}/product/${encodeURIComponent(slug)}` + (query ? `?${query}` : "");
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
    activeCatalogueSort = ["editorial", "price-asc", "price-desc"].includes(route.sort) ? route.sort : "editorial";
    activeCatalogueLead = route.lead || "";
    activeCatalogueLimit = Number.isFinite(route.count)
      ? Math.max(catalogueChunkSize, Math.floor(route.count))
      : catalogueChunkSize;
    renderCatalogue();
    if (enteringCatalogue) {
      const root = document.documentElement;
      root.style.scrollBehavior = "auto";
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      window.requestAnimationFrame(() => root.style.removeProperty("scroll-behavior"));
    }
    const selectedProduct = productFromRoute(route);
    if (selectedProduct) showProduct(selectedProduct);
    else closeProduct();
  }

  catalogueGrid?.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-catalogue-product-open]");
    if (!trigger) return;
    const slug = trigger.dataset.catalogueProductOpen;
    catalogueReturnHash = catalogueBrowseHash();
    catalogueReturnScrollY = window.scrollY;
    window.location.hash = catalogueProductHash(slug);
  });

  catalogueBrandSelect?.addEventListener("change", () => {
    activeCatalogueBrand = catalogueBrandSelect.value || "all";
    activeCatalogueType = "all";
    activeCatalogueLead = "";
    activeCatalogueLimit = catalogueChunkSize;
    window.location.hash = catalogueBrowseHash();
  });

  catalogueTypeSelect?.addEventListener("change", () => {
    activeCatalogueType = catalogueTypeSelect.value || "all";
    activeCatalogueLead = "";
    activeCatalogueLimit = catalogueChunkSize;
    window.location.hash = catalogueBrowseHash();
  });

  catalogueSortSelect?.addEventListener("change", () => {
    activeCatalogueSort = catalogueSortSelect.value || "editorial";
    activeCatalogueLead = "";
    activeCatalogueLimit = catalogueChunkSize;
    window.history.replaceState(null, "", catalogueBrowseHash());
    renderCatalogue();
  });

  catalogueLoadMore?.addEventListener("click", () => {
    activeCatalogueLimit = Math.min(activeCatalogueLimit + catalogueChunkSize, lastCatalogueResultCount);
    window.history.replaceState(null, "", catalogueBrowseHash());
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
  productDialogRetailer?.addEventListener("click", openRetailerWithCurrencyRecovery);
  window.addEventListener("hashchange", renderRoute);

  async function loadCatalogue() {
    try {
      const [kernelResponse, champagneResponse] = await Promise.all([
        fetch("shop-product-kernel-v1.json?v=shop-champagne-bohemia-2", { credentials: "same-origin" }),
        fetch("shop-champagne-bohemia-products-v1.json?v=shop-champagne-bohemia-2", { credentials: "same-origin" }),
      ]);
      if (!kernelResponse.ok) throw new Error(`Catalogue request failed: ${kernelResponse.status}`);
      if (!champagneResponse.ok) throw new Error(`Champagne Bohemia request failed: ${champagneResponse.status}`);

      catalogueKernel = await kernelResponse.json();
      const champagneCatalogue = await champagneResponse.json();
      const champagneProducts = Array.isArray(champagneCatalogue.products)
        ? champagneCatalogue.products.filter((product) => (
          product.metadataStatus === "Metadata ready"
          && product.listedOnShop === true
          && product.retailerUrl?.startsWith("https://")
        ))
        : [];
      const existingIds = new Set((catalogueKernel.products || []).map((product) => product.id));
      const existingUrls = new Set((catalogueKernel.products || []).map((product) => product.canonicalUrl));
      const uniqueChampagneProducts = champagneProducts.filter((product) => (
        !existingIds.has(product.id) && !existingUrls.has(product.canonicalUrl)
      ));
      const champagneBrand = champagneCatalogue.catalogue?.brand || "Champagne Bohemia";
      const reorderedBrands = (catalogueKernel.brandOrder || [])
        .filter((brand) => brand !== champagneBrand && brand !== "WARDROBE.NYC");
      reorderedBrands.push("WARDROBE.NYC", champagneBrand);
      catalogueKernel.brandOrder = reorderedBrands;
      catalogueKernel.brandCounts = [
        ...(catalogueKernel.brandCounts || []).filter((entry) => entry.brand !== champagneBrand),
        {
          brand: champagneBrand,
          count: uniqueChampagneProducts.length,
          ready: uniqueChampagneProducts.length,
          route: champagneCatalogue.catalogue?.route || "#catalogue/champagne-bohemia",
          formLabel: champagneCatalogue.catalogue?.formLabel || "swim / cover-ups",
        },
      ].sort((a, b) => catalogueKernel.brandOrder.indexOf(a.brand) - catalogueKernel.brandOrder.indexOf(b.brand));
      catalogueKernel.products = [...(catalogueKernel.products || []), ...uniqueChampagneProducts];
      catalogueKernel.counts = {
        ...(catalogueKernel.counts || {}),
        sourceReferences: Number(catalogueKernel.counts?.sourceReferences || 0) + uniqueChampagneProducts.length,
        canonicalRecords: Number(catalogueKernel.counts?.canonicalRecords || 0) + uniqueChampagneProducts.length,
        products: catalogueKernel.products.length,
        brands: catalogueKernel.brandOrder.length,
        metadataReady: Number(catalogueKernel.counts?.metadataReady || 0) + uniqueChampagneProducts.length,
        imageReady: Number(catalogueKernel.counts?.imageReady || 0) + uniqueChampagneProducts.length,
        listedOnShop: Number(catalogueKernel.counts?.listedOnShop || 0) + uniqueChampagneProducts.length,
      };
      catalogueProducts = Array.isArray(catalogueKernel.products)
        ? catalogueKernel.products.filter((product) => product.retailerUrl?.startsWith("https://"))
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

  function updateFullscreenStatus(active) {
    document.documentElement.classList.toggle("shop-shell-is-fullscreen", Boolean(active));
    if (!heroFullscreen) return;
    heroFullscreen.hidden = Boolean(active);
    heroFullscreen.setAttribute("aria-label", "Enter full screen");
  }

  heroFullscreen?.addEventListener("click", () => {
    if (!inMusicTelevisionFrame) {
      const target = document.documentElement;
      try {
        if (target.requestFullscreen) target.requestFullscreen({ navigationUI: "hide" }).catch(() => null);
        else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
      } catch {
        // Fullscreen remains optional on browsers that restrict it.
      }
      return;
    }
    try {
      if (window.parent.IAMTelevisionRoom?.requestShopFullscreen?.()) return;
    } catch {
      // The message route below remains available if frame access is restricted.
    }
    window.parent.postMessage({ type: "iam:shop-fullscreen-request" }, window.location.origin);
  });

  document.addEventListener("fullscreenchange", () => updateFullscreenStatus(Boolean(document.fullscreenElement)));
  document.addEventListener("webkitfullscreenchange", () => updateFullscreenStatus(Boolean(document.webkitFullscreenElement)));

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
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === "iam:shop-music-status") updateMusicStatus(event.data);
    if (event.data?.type === "iam:shop-fullscreen-status") updateFullscreenStatus(Boolean(event.data.active));
    if (event.data?.type === "iam:shop-preload-opening") preloadOpeningAssets();
  });

  if (inMusicTelevisionFrame) {
    window.parent.postMessage({ type: "iam:shop-music-status-request" }, window.location.origin);
    window.parent.postMessage({ type: "iam:shop-fullscreen-status-request" }, window.location.origin);
  }

  function moveSexEdShelf(direction) {
    if (!sexEdViewport) return;
    sexEdViewport.scrollBy({
      left: direction * Math.max(280, sexEdViewport.clientWidth * .82),
      behavior: "smooth",
    });
  }

  sexEdPrevious?.addEventListener("click", () => moveSexEdShelf(-1));
  sexEdNext?.addEventListener("click", () => moveSexEdShelf(1));

  applyFilters();
  prepareSilentEditorialVideos();
  renderRoute();
  loadCatalogue();
  startHeroPlaylist();
  preloadOpeningAssets();
}());
