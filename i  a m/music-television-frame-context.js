(function () {
  "use strict";

  if (window.self === window.top) return;

  const params = new URLSearchParams(window.location.search);
  if (params.get("musicTelevisionFrame") !== "1") return;

  document.documentElement.dataset.adaptiveFrame = "embedded";
  document.documentElement.dataset.musicTelevisionFrame = "embedded";
  window.__iamMusicTelevisionFrame = true;
}());
