(() => {
  "use strict";

  const form = document.querySelector("[data-iam-form]");
  const input = document.querySelector("[data-iam-input]");

  if (!form) return;

  form.removeAttribute("inert");
  form.setAttribute("aria-disabled", "false");
  if (input) input.disabled = false;

  document.dispatchEvent(new CustomEvent("iam:guest-checkin-ready", {
    detail: {
      persistence: "session_only",
      durableAccountStorage: false,
    },
  }));
})();
