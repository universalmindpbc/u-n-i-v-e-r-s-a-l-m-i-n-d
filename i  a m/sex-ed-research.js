(function () {
  "use strict";

  if (!window.__iamMusicTelevisionFrame) return;

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!event.target.closest?.("[data-sex-ed-return]")) return;
    event.preventDefault();
    window.parent.postMessage({ type: "iam:return-to-sex-ed" }, window.location.origin);
  });
}());
