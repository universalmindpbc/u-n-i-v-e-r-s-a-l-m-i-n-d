(function () {
  const categoryCopy = {
    music: "Exclusive releases, artist experiences and music made to be shared.",
    fashion: "Fashion, merchandise and limited pieces from participating partners.",
    events: "Live rooms, performances, gatherings and moments worth showing up for.",
    health: "Wellbeing experiences and supportive choices that help us care for one another.",
  };

  const buttons = Array.from(document.querySelectorAll("[data-happiness-category]"));
  const label = document.querySelector("[data-happiness-category-label]");
  const title = document.querySelector("[data-happiness-category-title]");
  const copy = document.querySelector("[data-happiness-category-copy]");
  const qrImage = document.querySelector("[data-happiness-qr-image]");
  const shell = document.querySelector("[data-happiness-state]");
  const balanceNodes = Array.from(document.querySelectorAll("[data-happiness-balance]"));
  const memberNode = document.querySelector("[data-happiness-member]");
  const pilotStatus = document.querySelector("[data-happiness-pilot-status]");
  const collectiveStatus = document.querySelector("[data-happiness-collective-status]");
  const activity = document.querySelector("[data-happiness-activity]");
  const appleStatus = document.querySelector("[data-apple-wallet-status]");
  const globalNav = document.querySelector("[data-global-nav]");
  const navItems = Array.from(document.querySelectorAll("[data-nav-item]"));
  const technologySubmenu = document.querySelector('[data-nav-submenu="technology"]');
  const embeddedParams = new URLSearchParams(window.location.search);
  const inMusicTelevisionFrame = window.self !== window.top && embeddedParams.get("musicTelevisionFrame") === "1";

  function setActiveNavItem(itemName) {
    navItems.forEach((item) => {
      const active = item.dataset.navItem === itemName;
      item.classList.toggle("is-active", active);
      if (item.dataset.navItem === "technology") item.setAttribute("aria-expanded", String(active));
    });
    technologySubmenu?.classList.toggle("is-open", itemName === "technology");
  }

  function closeGlobalNav() {
    document.body.classList.remove("nav-open");
    globalNav?.classList.remove("is-open");
    globalNav?.setAttribute("aria-hidden", "true");
  }

  document.querySelectorAll("[data-nav-open]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!globalNav) return;
      if (globalNav.classList.contains("is-open")) {
        closeGlobalNav();
        return;
      }
      setActiveNavItem("");
      document.body.classList.add("nav-open");
      globalNav.classList.add("is-open");
      globalNav.setAttribute("aria-hidden", "false");
    });
  });

  document.querySelectorAll("[data-nav-close]").forEach((button) => button.addEventListener("click", closeGlobalNav));

  navItems.forEach((item) => {
    item.addEventListener("mouseenter", () => setActiveNavItem(item.dataset.navItem));
    item.addEventListener("focus", () => setActiveNavItem(item.dataset.navItem));
    item.addEventListener("click", (event) => {
      if (item.getAttribute("aria-disabled") === "true") {
        event.preventDefault();
        setActiveNavItem(item.dataset.navItem);
        return;
      }
      if (item.dataset.navItem === "technology") {
        event.preventDefault();
        setActiveNavItem("technology");
        return;
      }
      if (!inMusicTelevisionFrame || item.getAttribute("href")?.startsWith("mailto:")) return;
      event.preventDefault();
      if (item.dataset.navItem === "home") {
        window.parent.postMessage({ type: "iam:return-to-television" }, window.location.origin);
        return;
      }
      const url = new URL(item.href, window.location.href);
      url.searchParams.set("adaptiveFrame", "1");
      url.searchParams.set("musicTelevisionFrame", "1");
      url.searchParams.set("navigationShell", "1");
      window.location.href = url.href;
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeGlobalNav();
  });

  function selectCategory(category) {
    const nextCopy = categoryCopy[category];
    if (!nextCopy) return;
    buttons.forEach((button) => button.classList.toggle("is-active", button.dataset.happinessCategory === category));
    if (label) label.textContent = category;
    if (title) title.textContent = "Every visit unlocks something new.";
    if (copy) copy.textContent = nextCopy;
    if (window.location.hash !== `#${category}`) window.history.replaceState(null, "", `#${category}`);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => selectCategory(button.dataset.happinessCategory));
  });

  const requestedCategory = window.location.hash.slice(1).toLowerCase();
  if (categoryCopy[requestedCategory]) selectCategory(requestedCategory);

  if (qrImage && /^(www\.)?universalmind\.tv$/i.test(window.location.hostname)) {
    qrImage.src = "/vogue/iam/a s s e t s/happiness-wallet-qr-production.png";
  }

  async function loadWalletState() {
    if (!shell?.dataset.happinessState) return;
    try {
      const response = await fetch(shell.dataset.happinessState, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error("wallet_state_unavailable");
      const state = await response.json();
      balanceNodes.forEach((node) => { node.textContent = state.balance?.available_display ?? "0"; });
      if (memberNode && state.member?.display_id) memberNode.textContent = state.member.display_id;
      if (pilotStatus && state.pilot?.status) pilotStatus.textContent = state.pilot.status;
      if (collectiveStatus && state.collective?.status) {
        collectiveStatus.textContent = `${state.collective.status} · no citizen is ranked against another.`;
      }
      if (activity && state.activity?.empty_message) activity.textContent = state.activity.empty_message;
      if (appleStatus && state.apple_wallet?.status) appleStatus.textContent = state.apple_wallet.status;
      document.documentElement.dataset.happinessState = "ready";
    } catch {
      document.documentElement.dataset.happinessState = "fallback";
    }
  }

  loadWalletState();
})();
