(() => {
  "use strict";

  const globalNav = document.querySelector("[data-global-nav]");
  const openButtons = Array.from(document.querySelectorAll("[data-nav-open]"));
  const closeButtons = Array.from(document.querySelectorAll("[data-nav-close]"));
  const navItems = Array.from(document.querySelectorAll("[data-nav-item]"));
  const submenus = new Map(Array.from(document.querySelectorAll("[data-nav-submenu]"))
    .map((submenu) => [submenu.dataset.navSubmenu, submenu]));

  function setActive(itemName) {
    navItems.forEach((item) => {
      const active = item.dataset.navItem === itemName;
      item.classList.toggle("is-active", active);
      if (submenus.has(item.dataset.navItem)) item.setAttribute("aria-expanded", String(active));
    });
    submenus.forEach((submenu, name) => {
      submenu.classList.toggle("is-open", name === itemName && !submenu.hasAttribute("data-mobile-editorial-hidden"));
    });
  }

  function openNavigation() {
    if (!globalNav) return;
    setActive("program");
    document.body.classList.add("nav-open");
    globalNav.classList.add("is-open");
    globalNav.setAttribute("aria-hidden", "false");
  }

  function closeNavigation() {
    if (!globalNav) return;
    document.body.classList.remove("nav-open");
    globalNav.classList.remove("is-open");
    globalNav.setAttribute("aria-hidden", "true");
  }

  openButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (document.body.classList.contains("nav-open")) closeNavigation();
      else openNavigation();
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeNavigation();
    });
  });

  navItems.forEach((item) => {
    item.addEventListener("mouseenter", () => setActive(item.dataset.navItem || ""));
    item.addEventListener("focus", () => setActive(item.dataset.navItem || ""));
    if (item.tagName === "A" && submenus.has(item.dataset.navItem)) {
      item.addEventListener("click", (event) => {
        const submenu = submenus.get(item.dataset.navItem);
        if (!submenu || submenu.hasAttribute("data-mobile-editorial-hidden")) return;
        event.preventDefault();
        setActive(item.dataset.navItem || "");
      });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !document.body.classList.contains("nav-open")) return;
    event.preventDefault();
    closeNavigation();
    openButtons[0]?.focus({ preventScroll: true });
  });
})();
