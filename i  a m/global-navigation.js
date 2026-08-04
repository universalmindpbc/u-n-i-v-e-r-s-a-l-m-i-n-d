(() => {
  const VERSION = "global-navigation-canonical-5";
  const scriptUrl = document.currentScript?.src || window.location.href;
  const stylesheetUrl = new URL(`global-navigation.css?v=${VERSION}`, scriptUrl).href;

  function ensureStylesheet() {
    let stylesheet = document.querySelector("link[data-global-navigation-styles]");
    if (!stylesheet) {
      stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.dataset.globalNavigationStyles = VERSION;
      document.head.append(stylesheet);
    }
    if (stylesheet.href !== stylesheetUrl) stylesheet.href = stylesheetUrl;
  }

  function inferCurrentNav() {
    if (document.body?.dataset.currentNav) return document.body.dataset.currentNav;

    const page = window.location.pathname.split("/").pop() || "index.html";
    const pageMap = {
      "index.html": "home",
      "adaptive-environment-television.html": "home",
      "adaptive-music-video.html": "home",
      "cafe-del-mar-home.html": "home",
      "about.html": "about",
      "technology-citizen-needs.html": "technology",
      "science.html": "science",
      "privacy-first.html": "privacy-first",
      "vogue-self-report.html": "check-in",
      "our-team.html": "our-team",
      "our-team-concept.html": "our-team",
      "shop.html": "shop",
    };
    return pageMap[page] || "";
  }

  function keepExpandedSubmenuVisible(navItem) {
    const itemName = navItem?.dataset.navItem || "";
    const submenu = itemName
      ? document.querySelector(`[data-nav-submenu="${itemName}"]`)
      : null;
    if (!submenu || submenu.hasAttribute("data-mobile-editorial-hidden")) return;

    const menu = navItem.closest(".global-nav-menu");
    const destination = submenu.querySelector("a, button") || submenu;
    if (!menu || !destination) return;

    const reveal = () => {
      if (!submenu.classList.contains("is-open")) return;
      const menuRect = menu.getBoundingClientRect();
      const destinationRect = destination.getBoundingClientRect();
      const safeInset = 18;
      const bottomOverflow = destinationRect.bottom - (menuRect.bottom - safeInset);
      if (bottomOverflow > 0) menu.scrollTop += bottomOverflow;
    };

    window.requestAnimationFrame(reveal);
    window.setTimeout(reveal, 560);
  }

  function bindSubmenuVisibility() {
    if (window.__iamGlobalSubmenuVisibilityBound) return;
    window.__iamGlobalSubmenuVisibilityBound = true;
    document.addEventListener("click", (event) => {
      const navItem = event.target.closest?.("[data-nav-item]");
      if (navItem) keepExpandedSubmenuVisible(navItem);
    }, true);
  }

  function render(host = document.querySelector("[data-global-nav-host]")) {
    if (!host) return null;

    document.querySelectorAll("[data-global-nav]").forEach((nav) => nav.remove());

    const currentNav = inferCurrentNav();
    const shopReturn = currentNav === "shop" ? " data-shop-return-music" : "";
    const template = document.createElement("template");
    template.innerHTML = `
      <aside class="global-nav" data-global-nav data-global-navigation-version="${VERSION}" aria-hidden="true" aria-label="Global navigation">
        <div class="global-nav-scrim" data-nav-close></div>
        <div class="global-nav-content">
          <a class="global-nav-brand" href="index.html"${shopReturn} aria-label="Universal Mind i am homepage">
            <img class="global-nav-mark" src="a s s e t s/Universal Mind [ I o H ] Logo 512.png" alt="" decoding="async">
            <span class="global-nav-lockup">
              <span class="global-nav-name">universalmind</span>
              <span class="global-nav-slash">/</span>
              <strong>i am</strong>
            </span>
          </a>
          <nav class="global-nav-menu" aria-label="Primary">
            <a class="global-nav-item" href="index.html" data-nav-item="home"${shopReturn}>home</a>
            <a class="global-nav-item" href="about.html?aboutTopLevel=1" data-nav-item="about">about</a>
            <a class="global-nav-item" href="technology-citizen-needs.html" data-nav-item="technology" aria-expanded="false">technology</a>
            <div class="global-nav-submenu" data-nav-submenu="technology">
              <a href="technology-citizen-needs.html" data-nav-subitem="technology-ai">learn how we understand your needs with large language models (ai)</a>
            </div>
            <a class="global-nav-item" href="science.html" data-nav-item="science">science</a>
            <a class="global-nav-item" href="privacy-first.html" data-nav-item="privacy-first">privacy first</a>
            <a class="global-nav-item" href="#" data-nav-item="go-to-market" aria-disabled="true">go to market</a>
            <a class="global-nav-item" href="vogue-self-report.html" data-nav-item="check-in">check in</a>
            <a class="global-nav-item" href="our-team.html" data-nav-item="our-team">our team</a>
            <a class="global-nav-item" href="mailto:bk@universalmind.tv?subject=I%20Am%20Vogue%20%7C%20Referral" data-nav-item="contact">contact</a>
            <a class="global-nav-item" href="shop.html" data-nav-item="shop" aria-expanded="false">shop</a>
            <div class="global-nav-submenu" data-nav-submenu="shop">
              <a href="shop.html" data-nav-subitem="shop-james-bondage-health">james bondage health - now open</a>
            </div>
          </nav>
          <p class="global-nav-citation">
            A Direct Response To Orygen + Phoenix Australia’s
            <a href="https://www.orygen.org.au/Policy-Centre/Policy-Areas/Population-groups/The-next-post/Orygen_Young_veterans-Policy-paper_Mar2018edition_?ext=.pdf" target="_blank" rel="noreferrer">“The Next Post: Young people transitioning from military service and their mental health”</a>
          </p>
        </div>
      </aside>`;

    const nav = template.content.firstElementChild;
    const activeItem = nav.querySelector(`[data-nav-item="${currentNav}"]`);
    activeItem?.classList.add("is-active");
    activeItem?.setAttribute("aria-current", "page");
    host.replaceWith(nav);
    return nav;
  }

  ensureStylesheet();
  bindSubmenuVisibility();
  const api = { version: VERSION, render };
  window.IAMGlobalNavigation = api;
  render();
})();
