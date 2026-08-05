(function () {
  "use strict";

  if (window.self === window.top) return;

  const params = new URLSearchParams(window.location.search);
  if (params.get("musicTelevisionFrame") !== "1") return;

  document.documentElement.dataset.adaptiveFrame = "embedded";
  document.documentElement.dataset.musicTelevisionFrame = "embedded";
  window.__iamMusicTelevisionFrame = true;

  window.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest?.("a[href]");
    if (!link || link.target || link.hasAttribute("download")) return;

    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

    let destination;
    try {
      destination = new URL(href, window.location.href);
    } catch {
      return;
    }

    if (destination.origin !== window.location.origin || !destination.pathname.endsWith(".html")) return;

    event.preventDefault();
    if (link.matches('a[data-nav-item="home"], a.global-nav-brand')) {
      window.parent.postMessage({ type: "iam:return-to-television" }, window.location.origin);
      return;
    }

    destination.searchParams.set("adaptiveFrame", "1");
    destination.searchParams.set("musicTelevisionFrame", "1");
    destination.searchParams.set("navigationShell", "1");
    window.location.href = destination.href;
  });
}());
