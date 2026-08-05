(() => {
  const body = document.body;
  const moduleOrder = ["music", "fashion", "brain", "mantra"];
  const knownModules = [...moduleOrder, "core"];
  const matrixExperience = document.querySelector("[data-matrix-experience]");
  const matrixStage = document.querySelector("[data-matrix-stage]");
  const moduleButtons = Array.from(document.querySelectorAll(".matrix-module[data-module]"));
  const moduleCards = Array.from(document.querySelectorAll("[data-module-card]"));
  const matrixCore = document.querySelector("[data-matrix-core]");
  const moduleTriggers = [...moduleButtons, matrixCore].filter(Boolean);
  const moduleCardLayer = document.querySelector("[data-module-card-layer]");
  const cardCloseButtons = document.querySelectorAll("[data-card-close]");
  const revealItems = document.querySelectorAll("[data-reveal]");
  const scrollProgress = document.querySelector("[data-scroll-progress]");
  const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeModule = "";
  let previewIndex = 0;
  let previewTimer = null;
  let closeTimer = null;
  let lastModuleTrigger = null;

  function globalNav() {
    return document.querySelector("[data-global-nav]");
  }

  function setTechnologySubmenu(open) {
    const nav = globalNav();
    const technologyItem = nav?.querySelector('[data-nav-item="technology"]');
    const technologySubmenu = nav?.querySelector('[data-nav-submenu="technology"]');
    technologyItem?.setAttribute("aria-expanded", String(open));
    technologySubmenu?.classList.toggle("is-open", open);
  }

  function openGlobalNav() {
    const nav = globalNav();
    if (!nav) return;
    if (activeModule) closeModule({ restoreFocus: false });
    body.classList.add("nav-open");
    nav.classList.add("is-open");
    nav.setAttribute("aria-hidden", "false");
    setTechnologySubmenu(true);
    nav.querySelector('[data-nav-item="technology"]')?.focus({ preventScroll: true });
  }

  function closeGlobalNav({ restoreFocus = true } = {}) {
    const nav = globalNav();
    if (!nav) return;
    body.classList.remove("nav-open");
    nav.classList.remove("is-open");
    nav.setAttribute("aria-hidden", "true");
    if (restoreFocus) document.querySelector("[data-nav-open]")?.focus({ preventScroll: true });
  }

  function stopPreviewCycle() {
    window.clearInterval(previewTimer);
    previewTimer = null;
  }

  function startPreviewCycle() {
    stopPreviewCycle();
    if (reducedMotionQuery.matches || activeModule) return;
    previewTimer = window.setInterval(() => {
      previewIndex = (previewIndex + 1) % moduleOrder.length;
      if (matrixStage) matrixStage.dataset.previewModule = moduleOrder[previewIndex];
    }, 3600);
  }

  function previewModule(moduleName) {
    if (!moduleOrder.includes(moduleName) || activeModule || !matrixStage) return;
    matrixStage.dataset.previewModule = moduleName;
  }

  function cancelScheduledClose() {
    window.clearTimeout(closeTimer);
    closeTimer = null;
  }

  function scheduleModuleClose() {
    if (!hoverQuery.matches || !activeModule) return;
    cancelScheduledClose();
    closeTimer = window.setTimeout(() => closeModule({ restoreFocus: false }), 520);
  }

  function showModule(moduleName, { focusCard = false } = {}) {
    if (!knownModules.includes(moduleName)) return;
    cancelScheduledClose();
    activeModule = moduleName;
    body.classList.add("module-card-open");
    stopPreviewCycle();

    if (matrixStage) {
      matrixStage.dataset.previewModule = moduleName;
      matrixStage.dataset.activeModule = activeModule;
    }

    moduleTriggers.forEach((button) => {
      const isActive = button.dataset.module === moduleName && Boolean(activeModule);
      button.setAttribute("aria-expanded", String(isActive));
    });

    moduleCards.forEach((card) => {
      card.hidden = card.dataset.moduleCard !== moduleName;
    });

    if (focusCard) {
      document.querySelector(`[data-module-card="${moduleName}"] [data-card-close]`)?.focus({ preventScroll: true });
    }
  }

  function closeModule({ restoreFocus = true } = {}) {
    const trigger = lastModuleTrigger;
    activeModule = "";
    body.classList.remove("module-card-open");
    cancelScheduledClose();
    moduleTriggers.forEach((button) => button.setAttribute("aria-expanded", "false"));
    moduleCards.forEach((card) => { card.hidden = true; });
    if (matrixStage) {
      delete matrixStage.dataset.activeModule;
      matrixStage.dataset.previewModule = moduleOrder[previewIndex];
    }
    if (restoreFocus) trigger?.focus({ preventScroll: true });
    startPreviewCycle();
  }

  function updateScrollProgress() {
    if (!scrollProgress) return;
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
    scrollProgress.style.transform = `scaleY(${progress})`;
  }

  function initialiseReveals() {
    if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8%" });

    revealItems.forEach((item) => observer.observe(item));
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-nav-open]")) {
      openGlobalNav();
      return;
    }

    if (event.target.closest("[data-nav-close]")) {
      closeGlobalNav();
      return;
    }

    const navItem = event.target.closest("[data-nav-item]");
    if (navItem?.dataset.navItem === "technology") {
      event.preventDefault();
      setTechnologySubmenu(navItem.getAttribute("aria-expanded") !== "true");
    }
  });

  moduleTriggers.forEach((button) => {
    button.addEventListener("click", (event) => {
      lastModuleTrigger = button;
      if (!hoverQuery.matches && activeModule === button.dataset.module) {
        closeModule({ restoreFocus: false });
        return;
      }
      showModule(button.dataset.module, { focusCard: event.detail === 0 });
    });

    button.addEventListener("focus", () => {
      if (!hoverQuery.matches && !button.matches(":focus-visible")) return;
      lastModuleTrigger = button;
      showModule(button.dataset.module);
    });

    if (hoverQuery.matches) {
      button.addEventListener("pointerenter", () => {
        lastModuleTrigger = button;
        showModule(button.dataset.module);
      });
    }
  });

  matrixStage?.addEventListener("pointerleave", scheduleModuleClose);
  moduleCardLayer?.addEventListener("pointerenter", cancelScheduledClose);
  moduleCardLayer?.addEventListener("pointerleave", scheduleModuleClose);
  moduleCardLayer?.addEventListener("focusin", cancelScheduledClose);
  matrixExperience?.addEventListener("focusout", (event) => {
    if (event.relatedTarget && !matrixExperience.contains(event.relatedTarget)) scheduleModuleClose();
  });

  cardCloseButtons.forEach((button) => {
    button.addEventListener("click", () => closeModule());
  });

  document.addEventListener("pointerdown", (event) => {
    if (!activeModule) return;
    if (event.target.closest("[data-matrix-experience]")) return;
    if (hoverQuery.matches && event.pointerType !== "touch") return;
    closeModule({ restoreFocus: false });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (body.classList.contains("nav-open")) {
      closeGlobalNav();
      return;
    }
    if (activeModule) closeModule();
  });

  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("resize", updateScrollProgress, { passive: true });
  reducedMotionQuery.addEventListener?.("change", startPreviewCycle);

  initialiseReveals();
  updateScrollProgress();
  startPreviewCycle();
})();
