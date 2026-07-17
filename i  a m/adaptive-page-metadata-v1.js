(function () {
  const pageFrame = document.querySelector("[data-television-page-frame]");
  const televisionTitle = document.title;
  const faviconVersion = "iam-favicon-4";

  function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent || "");
  }

  function iconHref(path, forceRefresh = false) {
    const url = new URL(path, window.location.origin);
    url.searchParams.set("v", faviconVersion);

    if (forceRefresh && isSafari()) {
      url.searchParams.set("refresh", Date.now().toString(36));
    }

    return url.href;
  }

  function appendIcon(rel, href, attributes = {}) {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;

    Object.entries(attributes).forEach(([name, value]) => {
      link.setAttribute(name, value);
    });

    document.head.append(link);
  }

  function refreshFavicon({ force = false } = {}) {
    document
      .querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')
      .forEach((link) => link.remove());

    const faviconHref = iconHref("/vogue/iam/favicon.png", force);
    const appleTouchHref = iconHref("/vogue/iam/apple-touch-icon.png", force);

    appendIcon("icon", faviconHref, {
      type: "image/png",
      sizes: "32x32",
    });
    appendIcon("shortcut icon", faviconHref, {
      type: "image/png",
    });
    appendIcon("apple-touch-icon", appleTouchHref, {
      sizes: "180x180",
    });
  }

  function restoreTelevisionMetadata() {
    document.title = televisionTitle;
    refreshFavicon({ force: true });
  }

  function syncVisiblePageMetadata() {
    if (!document.body.classList.contains("television-page-view-open")) return;

    try {
      const nextTitle = pageFrame?.contentDocument?.title?.trim();
      if (nextTitle) document.title = nextTitle;
    } catch {
      // The visible frame remains usable if browser security blocks title access.
    }

    refreshFavicon({ force: true });
  }

  pageFrame?.addEventListener("load", syncVisiblePageMetadata);

  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type !== "iam:return-to-television") return;
    restoreTelevisionMetadata();
  });

  window.IAMPageMetadata = {
    refreshFavicon,
    restoreTelevisionMetadata,
    syncVisiblePageMetadata,
  };

  refreshFavicon({ force: true });
}());
