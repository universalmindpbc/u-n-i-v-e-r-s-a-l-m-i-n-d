(function loadAdaptiveStreaming() {
  if (window.IAMStreamReady) return;
  function load(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
  }
  window.IAMStreamReady = load("cloudflare-stream-catalogue.js?v=stream-catalogue-325aa1e085b3")
    .then(() => load("cloudflare-stream-controller.js?v=stream-controller-4819c6737cd4"))
    .catch(() => null);
}());

(function () {
  const languages = [
    { text: "universalmind", lang: "en", dir: "ltr" },
    { text: "宇宙之心", lang: "zh", dir: "ltr" },
    { text: "العقل الكلي", lang: "ar", dir: "rtl" },
  ];

  const brandTiming = {
    nameIn: 1000,
    suffixIn: 3330,
    fadeOut: 7600,
    nextLanguage: 9000,
  };

  let languageIndex = 0;
  let brandCycleTimers = [];

  function clearBrandCycleTimers() {
    brandCycleTimers.forEach((timer) => window.clearTimeout(timer));
    brandCycleTimers = [];
  }

  function scheduleBrandCycleTimer(callback, delay) {
    brandCycleTimers.push(window.setTimeout(callback, delay));
  }

  function initBrandCycle() {
    const languageNode = document.querySelector("[data-language]");
    const brandLockup = document.querySelector(".brand-lockup");
    const brandSuffix = document.querySelector("[data-brand-suffix]");

    if (!languageNode || !brandLockup || !brandSuffix) return;

    function setLanguage(language) {
      languageNode.textContent = language.text;
      languageNode.lang = language.lang;
      languageNode.dir = language.dir;
      brandLockup.dataset.currentLang = language.lang;
    }

    function runBrandCycle() {
      clearBrandCycleTimers();
      languageNode.classList.remove("is-visible");
      brandSuffix.classList.remove("is-visible");

      const language = languages[languageIndex];
      setLanguage(language);
      languageIndex = (languageIndex + 1) % languages.length;

      scheduleBrandCycleTimer(() => {
        languageNode.classList.add("is-visible");
      }, brandTiming.nameIn);

      scheduleBrandCycleTimer(() => {
        brandSuffix.classList.add("is-visible");
      }, brandTiming.suffixIn);

      scheduleBrandCycleTimer(() => {
        languageNode.classList.remove("is-visible");
        brandSuffix.classList.remove("is-visible");
      }, brandTiming.fadeOut);

      scheduleBrandCycleTimer(runBrandCycle, brandTiming.nextLanguage);
    }

    runBrandCycle();
  }

  function setActiveNavItem(navItems, technologySubmenu, itemName) {
    navItems.forEach((item) => {
      const isActive = item.dataset.navItem === itemName;
      item.classList.toggle("is-active", isActive);

      if (item.dataset.navItem === "technology") {
        item.setAttribute("aria-expanded", String(isActive));
      }
    });

    if (technologySubmenu) {
      technologySubmenu.classList.toggle("is-open", itemName === "technology");
    }
  }

  function initGlobalNav() {
    const globalNav = document.querySelector("[data-global-nav]");
    const navOpenButtons = document.querySelectorAll("[data-nav-open]");
    const navCloseButtons = document.querySelectorAll("[data-nav-close]");
    const navItems = document.querySelectorAll("[data-nav-item]");
    const technologySubmenu = document.querySelector('[data-nav-submenu="technology"]');
    const technologyItem = document.querySelector('[data-nav-item="technology"]');
    const pathName = window.location.pathname.split("/").pop() || "index.html";
    const inferredCurrentNav = pathName === "index.html"
      ? "home"
      : pathName === "vogue-self-report.html"
        ? "check-in"
        : pathName === "technology-citizen-needs.html"
          ? "technology"
          : "home";
    const currentNavItem = document.body.dataset.currentNav || inferredCurrentNav;

    navItems.forEach((item) => {
      if (item.tagName === "A" && item.dataset.navItem === "globe") {
        item.setAttribute("href", "globe.html");
      }
    });

    function openGlobalNav(itemName = currentNavItem) {
      if (!globalNav) return;

      setActiveNavItem(navItems, technologySubmenu, itemName);
      document.body.classList.add("nav-open");
      globalNav.classList.add("is-open");
      globalNav.setAttribute("aria-hidden", "false");
    }

    function closeGlobalNav() {
      if (!globalNav) return;

      document.body.classList.remove("nav-open");
      globalNav.classList.remove("is-open");
      globalNav.setAttribute("aria-hidden", "true");
    }

    navOpenButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (document.body.classList.contains("nav-open")) {
          closeGlobalNav();
        } else {
          openGlobalNav(currentNavItem);
        }
      });
    });

    navCloseButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeGlobalNav();
      });
    });

    navItems.forEach((item) => {
      item.addEventListener("mouseenter", () => setActiveNavItem(navItems, technologySubmenu, item.dataset.navItem));
      item.addEventListener("focus", () => setActiveNavItem(navItems, technologySubmenu, item.dataset.navItem));

      if (item.tagName === "BUTTON") {
        item.addEventListener("click", () => setActiveNavItem(navItems, technologySubmenu, item.dataset.navItem));
      }

      if (item.tagName === "A" && item.dataset.navItem === "technology") {
        item.addEventListener("click", (event) => {
          if (technologySubmenu) {
            event.preventDefault();
            setActiveNavItem(navItems, technologySubmenu, "technology");
          }
        });
      }

      if (item.tagName === "A" && item.dataset.navItem === "go-to-market") {
        item.addEventListener("click", (event) => {
          event.preventDefault();
          setActiveNavItem(navItems, technologySubmenu, "go-to-market");
        });
      }
    });

    document.querySelectorAll("[data-nav-subitem]").forEach((item) => {
      const href = item.getAttribute("href") || "";
      const itemUrl = new URL(href, window.location.href);
      item.classList.toggle("is-active", itemUrl.pathname.split("/").pop() === pathName);
    });

    const initialNavState = new URLSearchParams(window.location.search).get("nav");

    if (initialNavState) {
      window.requestAnimationFrame(() => {
        openGlobalNav(initialNavState);

        if (initialNavState === "technology" && technologyItem) {
          technologyItem.focus({ preventScroll: true });
        }
      });
    }
  }

  function bindEscapeKey() {
    if (window.__iamGlobalEscapeBound) return;
    window.__iamGlobalEscapeBound = true;

    window.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;

      document.body.classList.remove("nav-open");
      document.querySelectorAll("[data-global-nav]").forEach((nav) => {
        nav.classList.remove("is-open");
        nav.setAttribute("aria-hidden", "true");
      });
    });
  }

  function bindCanonicalCitizenRadarNavigation() {
    if (window.__iamCanonicalCitizenRadarNavigationBound) return;
    window.__iamCanonicalCitizenRadarNavigationBound = true;

    document.addEventListener("click", (event) => {
      const link = event.target.closest?.('[data-nav-subitem="technology-ai"], .film-chapter-dropdown a[href="technology-citizen-needs.html"]');
      if (!link) return;

      // Once music television is open, its persistent page layer owns all
      // internal navigation so the active audio is not destroyed.
      if (document.body.classList.contains("television-room-open")) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.href = "technology-citizen-needs.html";
    }, true);
  }

  function bindStandaloneAboutNavigation() {
    if (window.__iamStandaloneAboutNavigationBound) return;
    window.__iamStandaloneAboutNavigationBound = true;

    document.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = event.target.closest?.('a[data-nav-item="about"]');
      if (!link || link.target || link.hasAttribute("download")) return;

      const url = new URL(link.getAttribute("href"), window.location.href);
      if (url.origin !== window.location.origin) return;

      // The television room owns its page layer so the active music/video
      // element survives navigation. Let its controller intercept About just
      // as it already does Science and the other internal destinations.
      if (document.body.classList.contains("television-room-open")) return;

      const currentParams = new URLSearchParams(window.location.search);
      const musicTelevisionFrame = window.self !== window.top && (
        currentParams.get("musicTelevisionFrame") === "1" ||
        window.__iamMusicTelevisionFrame === true
      );

      event.preventDefault();
      event.stopImmediatePropagation();

      if (musicTelevisionFrame) {
        url.searchParams.delete("aboutTopLevel");
        url.searchParams.set("adaptiveFrame", "1");
        url.searchParams.set("musicTelevisionFrame", "1");
        window.location.href = url.href;
        return;
      }

      if (window.self !== window.top) {
        window.top.location.href = url.href;
        return;
      }

      window.location.href = url.href;
    }, true);
  }

  function init() {
    bindStandaloneAboutNavigation();
    bindCanonicalCitizenRadarNavigation();

    const shell = document.querySelector(".site-shell");
    if (shell?.dataset.iamSiteInitialized === "true") return;
    if (shell) shell.dataset.iamSiteInitialized = "true";

    initBrandCycle();
    initGlobalNav();
    bindEscapeKey();
  }

  window.IAMSite = { init };
  init();
}());
