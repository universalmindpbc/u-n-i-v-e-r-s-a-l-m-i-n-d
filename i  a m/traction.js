(() => {
  "use strict";

  document.querySelectorAll("[data-atomic-logo]").forEach((logo) => {
    const reveal = async () => {
      try { if (logo.decode) await logo.decode(); } catch (_) { /* no-op */ }
      if (logo.naturalWidth > 0) logo.dataset.logoReady = "true";
    };
    if (logo.complete) reveal();
    else logo.addEventListener("load", reveal, { once: true });
  });

  const tablist = document.querySelector("[data-journey-tabs]");
  const tabs = Array.from(tablist?.querySelectorAll("[data-journey-tab]") || []);
  const panels = Array.from(tablist?.querySelectorAll("[data-journey-panel]") || []);

  const activateTab = (tab, focus = false) => {
    if (!tab) return;
    const key = tab.dataset.journeyTab;
    tabs.forEach((candidate) => {
      const active = candidate === tab;
      candidate.classList.toggle("is-active", active);
      candidate.setAttribute("aria-selected", String(active));
      candidate.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      const active = panel.dataset.journeyPanel === key;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    });
    tab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    if (focus) tab.focus({ preventScroll: true });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (event) => {
      let nextIndex = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      activateTab(tabs[nextIndex], true);
    });
  });

  const sections = Array.from(document.querySelectorAll(".traction-section"));
  const pagination = Array.from(document.querySelectorAll(".traction-pagination a"));
  if (sections.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!current) return;
      const index = sections.indexOf(current.target);
      pagination.forEach((link, linkIndex) => {
        const active = linkIndex === index;
        link.classList.toggle("is-current", active);
        if (active) link.setAttribute("aria-current", "step");
        else link.removeAttribute("aria-current");
      });
    }, { threshold: [.35, .55, .7] });
    sections.forEach((section) => observer.observe(section));
  }

  document.documentElement.classList.add("traction-ready");
})();
