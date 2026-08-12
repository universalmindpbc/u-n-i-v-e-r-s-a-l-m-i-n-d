(function () {
  "use strict";

  const data = window.IAMShopScienceData;
  const root = document.querySelector("[data-shop-science]");
  if (!data || !root) return;

  const studiesHost = root.querySelector("[data-science-studies]");
  const brandRows = root.querySelector("[data-science-brand-rows]");
  const brandCards = root.querySelector("[data-science-brand-cards]");
  const research = root.querySelector("[data-science-research]");
  const researchIcon = root.querySelector("[data-science-summary-icon]");
  const silentVideos = Array.from(root.querySelectorAll("[data-science-silent-video]"));
  const researchLink = document.querySelector("[data-science-research-link]");
  const audioStatus = document.querySelector(".science-navigation__audio");
  const audioLabel = document.querySelector("[data-science-audio-label]");

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function sourceLink(url, index, label = "source") {
    const link = element("a", "", `${label} ${index + 1} ↗`);
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }

  function starRating(score, label) {
    const wrap = element("span", "shop-material__stars");
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", `${label}: ${score} out of 5 stars`);
    wrap.textContent = `${"★".repeat(score)}${"☆".repeat(5 - score)}`;
    return wrap;
  }

  function renderStudies() {
    if (!studiesHost) return;
    const groups = new Map();
    data.studies.forEach((study) => {
      if (!groups.has(study.strand)) groups.set(study.strand, []);
      groups.get(study.strand).push(study);
    });

    groups.forEach((studies, strand) => {
      const section = element("section", "shop-science__study-group");
      section.append(element("h3", "", strand));
      const grid = element("div", "shop-science__study-grid");

      studies.forEach((study) => {
        const article = element("article", "shop-science__study");
        article.append(element("p", "shop-science__study-number", String(study.order).padStart(2, "0")));
        article.append(element("h4", "", study.title));
        article.append(element("p", "shop-science__study-meta", `${study.authors} · ${study.journal} · ${study.year} · ${study.studyType}`));
        article.append(element("p", "shop-science__study-finding", study.finding));
        article.append(element("p", "shop-science__study-supports", `Supports: ${study.supports}`));
        const link = sourceLink(study.url, 0, "open paper");
        link.textContent = `open paper · ${study.doi} ↗`;
        article.append(link);
        grid.append(article);
      });

      section.append(grid);
      studiesHost.append(section);
    });
  }

  function detailContent(brand) {
    const wrap = element("div", "shop-material__detail-inner");
    const copy = element("div");
    copy.append(element("p", "", brand.summary));
    copy.append(element("p", "", brand.notes));
    copy.append(element("p", "shop-material__pfas", `Evidence state: ${brand.evidence}.`));

    const links = element("div", "shop-material__source-links");
    brand.sources.forEach((url, index) => links.append(sourceLink(url, index)));
    wrap.append(copy, links);
    return wrap;
  }

  function renderDesktopBrand(brand, index) {
    const id = `shop-material-evidence-${index + 1}`;
    const row = element("tr");
    row.dataset.tone = String((index % 6) + 1);
    const name = element("th", "shop-material__brand-name", brand.brand);
    name.scope = "row";

    const material = element("td");
    material.append(starRating(brand.material, `${brand.brand} Material Intelligence`));
    material.append(element("span", "shop-material__score", `${brand.material}/5`));

    const making = element("td");
    making.append(starRating(brand.making, `${brand.brand} Responsible Making`));
    making.append(element("span", "shop-material__score", `${brand.making}/5`));

    const pfas = element("td", "shop-material__pfas", brand.pfas);
    const evidence = element("td");
    const toggle = element("button", "shop-material__evidence-toggle", "evidence +");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", id);
    toggle.setAttribute("aria-label", `Show evidence for ${brand.brand}`);
    evidence.append(toggle);
    row.append(name, material, making, pfas, evidence);

    const detail = element("tr", "shop-material__detail");
    detail.id = id;
    detail.hidden = true;
    const detailCell = element("td");
    detailCell.colSpan = 5;
    detailCell.append(detailContent(brand));
    detail.append(detailCell);

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      toggle.textContent = isOpen ? "evidence +" : "close −";
      toggle.setAttribute("aria-label", `${isOpen ? "Show" : "Hide"} evidence for ${brand.brand}`);
      detail.hidden = isOpen;
    });

    brandRows.append(row, detail);
  }

  function renderMobileBrand(brand, index) {
    const card = element("details", "shop-material__card");
    card.dataset.tone = String((index % 6) + 1);
    const summary = element("summary");
    const heading = element("div");
    heading.append(element("h4", "", brand.brand));
    heading.append(element("p", "", brand.pfas));
    summary.append(heading, element("span", "shop-material__card-icon", "＋"));

    const body = element("div", "shop-material__card-body");
    const ratings = element("div", "shop-material__card-ratings");
    const material = element("p", "", "Material Intelligence");
    material.append(starRating(brand.material, `${brand.brand} Material Intelligence`));
    const making = element("p", "", "Responsible Making");
    making.append(starRating(brand.making, `${brand.brand} Responsible Making`));
    ratings.append(material, making);
    body.append(ratings);
    body.append(element("p", "", brand.summary));
    body.append(element("p", "", brand.notes));
    body.append(element("p", "shop-material__pfas", `Evidence state: ${brand.evidence}.`));
    const links = element("div", "shop-material__source-links");
    brand.sources.forEach((url, index) => links.append(sourceLink(url, index)));
    body.append(links);

    card.append(summary, body);
    brandCards.append(card);
  }

  function renderBrands() {
    if (!brandRows || !brandCards) return;
    data.brands.forEach((brand, index) => {
      renderDesktopBrand(brand, index);
      renderMobileBrand(brand, index);
    });
  }

  function renderMetadata() {
    root.querySelectorAll("[data-science-evidence-version]").forEach((node) => {
      node.textContent = data.evidenceVersion;
    });
    root.querySelectorAll("[data-science-reviewed]").forEach((node) => {
      node.textContent = data.reviewed;
    });
  }

  function cameFromShop() {
    if (!document.referrer) return false;
    try {
      const referrer = new URL(document.referrer);
      return referrer.origin === window.location.origin && referrer.pathname.endsWith("/shop.html");
    } catch {
      return false;
    }
  }

  function describeShopAudio() {
    const hasShopTab = cameFromShop();
    audioStatus?.classList.toggle("is-shop-context", hasShopTab);
    if (audioLabel) {
      audioLabel.textContent = hasShopTab
        ? "shop audio continues in the shop tab"
        : "shop audio remains separate";
    }
    audioStatus?.setAttribute("aria-label", hasShopTab
      ? "Shop audio, if playing, continues only in the original Shop tab. This Science page does not start another player."
      : "This Science page does not start a music player.");
  }

  function returnToShop(event) {
    const destination = event.currentTarget.href;
    event.preventDefault();
    window.close();
    window.setTimeout(() => {
      if (!window.closed) window.location.assign(destination);
    }, 120);
  }

  function setActiveGlobalNavItem(itemName = "shop") {
    const navItems = Array.from(document.querySelectorAll("[data-nav-item]"));
    const navSubmenus = new Map(Array.from(document.querySelectorAll("[data-nav-submenu]"))
      .map((submenu) => [submenu.dataset.navSubmenu, submenu]));
    navItems.forEach((item) => {
      const active = item.dataset.navItem === itemName;
      item.classList.toggle("is-active", active);
      if (navSubmenus.has(item.dataset.navItem)) item.setAttribute("aria-expanded", String(active));
    });
    navSubmenus.forEach((submenu, name) => {
      submenu.classList.toggle("is-open", itemName === name && !submenu.hasAttribute("data-mobile-editorial-hidden"));
    });
  }

  function closeGlobalNav(options = {}) {
    document.body.classList.remove("nav-open");
    const nav = document.querySelector("[data-global-nav]");
    nav?.classList.remove("is-open");
    nav?.setAttribute("aria-hidden", "true");
    if (options.restoreFocus) document.querySelector("[data-nav-open]")?.focus({ preventScroll: true });
  }

  function bindScienceNavigation() {
    document.querySelectorAll("[data-science-return-shop], [data-shop-return-music]").forEach((link) => {
      link.addEventListener("click", returnToShop);
    });

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
      button.addEventListener("click", () => closeGlobalNav({ restoreFocus: true }));
    });

    document.querySelectorAll("[data-nav-item]").forEach((item) => {
      item.addEventListener("mouseenter", () => setActiveGlobalNavItem(item.dataset.navItem));
      item.addEventListener("focus", () => setActiveGlobalNavItem(item.dataset.navItem));
      item.addEventListener("click", (event) => {
        const submenu = document.querySelector(`[data-nav-submenu="${item.dataset.navItem}"]`);
        if (!submenu || submenu.hasAttribute("data-mobile-editorial-hidden")) return;
        event.preventDefault();
        setActiveGlobalNavItem(item.dataset.navItem);
      });
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && document.body.classList.contains("nav-open")) {
        closeGlobalNav({ restoreFocus: true });
      }
    });

    researchLink?.addEventListener("click", (event) => {
      event.preventDefault();
      research.open = true;
      window.history.pushState(null, "", "#research");
      window.requestAnimationFrame(() => {
        research.scrollIntoView({ behavior: "smooth", block: "start" });
        research.querySelector("summary")?.focus({ preventScroll: true });
      });
    });
  }

  if (research && researchIcon) {
    research.addEventListener("toggle", () => {
      researchIcon.textContent = research.open ? "−" : "＋";
    });
  }

  function prepareSilentFilm() {
    if (!silentVideos.length) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    silentVideos.forEach((video) => {
      video.muted = true;
      video.defaultMuted = true;
    });

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      silentVideos.forEach((video) => video.pause());
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      });
    }, { threshold: .25 });

    silentVideos.forEach((video) => observer.observe(video));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) silentVideos.forEach((video) => video.pause());
    });
  }

  renderStudies();
  renderBrands();
  renderMetadata();
  describeShopAudio();
  bindScienceNavigation();
  prepareSilentFilm();
})();
