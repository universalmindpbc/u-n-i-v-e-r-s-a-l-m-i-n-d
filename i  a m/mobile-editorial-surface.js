(() => {
  if (window.IAMMobileEditorial) return;

  const params = new URLSearchParams(window.location.search);
  const forcedFullExperience = params.get("full") === "1";
  const forcedMobileEditorial = params.get("mobile") === "1";
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches === true;
  const screenWidth = Number(window.screen?.width) || window.innerWidth;
  const screenHeight = Number(window.screen?.height) || window.innerHeight;
  const shortSide = Math.min(screenWidth, screenHeight);
  const active = !forcedFullExperience && (forcedMobileEditorial || (coarsePointer && shortSide < 600));
  const allowedFiles = new Set([
    "induction.html",
    "about.html",
    "science.html",
    "research.html",
    "privacy-first.html",
    "business-model.html",
    "traction.html",
    "impact.html",
    "our-team.html",
    "shop.html",
  ]);
  const visibleNavItems = new Set([
    "induction",
    "about",
    "science",
    "research",
    "privacy-first",
    "business-model",
    "traction",
    "impact",
    "our-team",
    "contact",
    "shop",
  ]);
  let linkGuardBound = false;

  if (active) document.documentElement.dataset.mobileEditorial = "true";

  function currentFile() {
    return window.location.pathname.split("/").pop() || "induction.html";
  }

  function transformGlobalNavigation() {
    const nav = document.querySelector("[data-global-nav]");
    const menu = nav?.querySelector(".global-nav-menu");
    if (!nav || !menu) return;

    menu.querySelectorAll("[data-nav-item]").forEach((item) => {
      let itemName = item.dataset.navItem || "";

      if (itemName === "home") {
        itemName = "induction";
        item.dataset.navItem = itemName;
        item.textContent = "induction";
        item.setAttribute("href", "induction.html?mobile=1");
        item.removeAttribute("data-shop-return-music");
      }

      if (visibleNavItems.has(itemName)) {
        item.removeAttribute("data-mobile-editorial-hidden");
      } else {
        item.setAttribute("data-mobile-editorial-hidden", "");
      }
    });

    menu.querySelectorAll("[data-nav-submenu]").forEach((submenu) => {
      submenu.setAttribute("data-mobile-editorial-hidden", "");
    });

    if (!menu.querySelector('[data-nav-item="shop"]')) {
      const shopLink = document.createElement("a");
      shopLink.className = "global-nav-item";
      shopLink.href = "shop.html";
      shopLink.dataset.navItem = "shop";
      shopLink.textContent = "shop";
      menu.append(shopLink);
    }

    nav.querySelectorAll("a.global-nav-brand").forEach((brand) => {
      brand.setAttribute("href", "induction.html?mobile=1");
      brand.removeAttribute("data-shop-return-music");
    });

    const activeItem = currentFile() === "induction.html"
      ? "induction"
      : document.body?.dataset.currentNav || currentFile().replace(/\.html$/, "");

    menu.querySelectorAll("[data-nav-item]").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.navItem === activeItem);
    });
  }

  function addMobileStatus() {
    if (currentFile() === "induction.html" || document.querySelector("[data-mobile-editorial-status]")) return;

    const status = document.createElement("aside");
    status.className = "mobile-editorial-status";
    status.dataset.mobileEditorialStatus = "";
    status.setAttribute("aria-label", "Mobile experience status");

    const link = document.createElement("a");
    link.href = "induction.html?mobile=1#mobile-experience";
    link.textContent = "Full I AM experience on desktop + tablet";

    const detail = document.createElement("span");
    detail.textContent = "iOS SDK in development";

    status.append(link, detail);
    document.body.prepend(status);
  }

  function bindInternalLinkGuard() {
    if (linkGuardBound) return;
    linkGuardBound = true;

    document.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = event.target.closest?.("a[href]");
      if (!link || link.target || link.hasAttribute("download")) return;

      const url = new URL(link.getAttribute("href"), window.location.href);
      if (url.origin !== window.location.origin) return;

      const fileName = url.pathname.split("/").pop() || "";
      if (!fileName.endsWith(".html")) return;

      if (allowedFiles.has(fileName)) {
        if (url.searchParams.get("mobile") === "1") return;

        event.preventDefault();
        event.stopImmediatePropagation();
        url.searchParams.set("mobile", "1");
        window.location.href = url.href;
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.href = "induction.html?mobile=1#mobile-experience";
    }, true);
  }

  function apply() {
    if (!active || !document.body) return;

    document.body.classList.add("mobile-editorial-page");
    transformGlobalNavigation();
    addMobileStatus();
    bindInternalLinkGuard();
  }

  window.IAMMobileEditorial = Object.freeze({ active, apply });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
  } else {
    apply();
  }
})();
