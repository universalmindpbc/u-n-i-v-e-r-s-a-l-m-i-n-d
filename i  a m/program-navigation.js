(() => {
  const nav = document.querySelector("[data-global-nav]");
  if (!nav) return;

  const body = document.body;
  const openButtons = document.querySelectorAll("[data-nav-open]");
  const closeButtons = document.querySelectorAll("[data-nav-close]");
  const items = document.querySelectorAll("[data-nav-item]");
  const submenus = new Map(Array.from(document.querySelectorAll("[data-nav-submenu]"))
    .map((submenu) => [submenu.dataset.navSubmenu, submenu]));
  const currentItem = body.dataset.currentNav || "program";

  function setActive(itemName) {
    items.forEach((item) => {
      const active = item.dataset.navItem === itemName;
      item.classList.toggle("is-active", active);
      if (submenus.has(item.dataset.navItem)) item.setAttribute("aria-expanded", String(active));
    });

    submenus.forEach((submenu, name) => {
      submenu.classList.toggle("is-open", name === itemName && !submenu.hasAttribute("data-mobile-editorial-hidden"));
    });
  }

  function open() {
    setActive(currentItem);
    body.classList.add("nav-open");
    nav.classList.add("is-open");
    nav.setAttribute("aria-hidden", "false");
  }

  function close({ restoreFocus = false } = {}) {
    body.classList.remove("nav-open");
    nav.classList.remove("is-open");
    nav.setAttribute("aria-hidden", "true");
    if (restoreFocus) openButtons[0]?.focus({ preventScroll: true });
  }

  openButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (body.classList.contains("nav-open")) close();
      else open();
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      close();
    });
  });

  items.forEach((item) => {
    const itemName = item.dataset.navItem;
    item.addEventListener("mouseenter", () => setActive(itemName));
    item.addEventListener("focus", () => setActive(itemName));

    if (item.tagName === "A" && submenus.has(itemName)) {
      item.addEventListener("click", (event) => {
        const submenu = submenus.get(itemName);
        if (!submenu || submenu.hasAttribute("data-mobile-editorial-hidden")) return;
        event.preventDefault();
        setActive(itemName);
      });
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && body.classList.contains("nav-open")) close({ restoreFocus: true });
  });
})();
