(() => {
  "use strict";

  const citizenData = window.IAMCitizenData;
  const dialog = document.querySelector("[data-arrival-consent]");
  const panel = dialog?.querySelector("[data-arrival-consent-panel]");
  const acceptButton = dialog?.querySelector("[data-consent-accept]");
  const status = dialog?.querySelector("[data-consent-status]");
  const entryLink = document.querySelector("[data-induction-enter]");
  const form = document.querySelector("[data-iam-form]");
  const input = document.querySelector("[data-iam-input]");
  const checkinStatus = document.querySelector("[data-citizen-data-status]");
  const params = new URLSearchParams(window.location.search);
  const forcePermissionProof = window.location.hostname === "staging.universalmind.tv"
    && params.get("permission") === "show";
  let existingConsent = false;

  function setCheckinEnabled(enabled) {
    if (!form) return;
    form.toggleAttribute("inert", !enabled);
    form.setAttribute("aria-disabled", String(!enabled));
    if (input) input.disabled = !enabled;
  }

  if (!citizenData?.enabled) {
    setCheckinEnabled(true);
    return;
  }

  function announce(message, state = "idle") {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  }

  function showDialog() {
    if (!dialog || !panel) return;
    dialog.hidden = false;
    dialog.setAttribute("aria-hidden", "false");
    window.setTimeout(() => panel.focus({ preventScroll: true }), 0);
  }

  function hideDialog() {
    if (!dialog) return;
    dialog.setAttribute("aria-hidden", "true");
    dialog.hidden = true;
  }

  function enterCheckin() {
    window.location.assign("vogue-self-report.html");
  }

  function completeConsent() {
    citizenData.clearLegacySensitiveLocalStorage();
    hideDialog();

    if (entryLink) {
      enterCheckin();
      return;
    }

    document.body.classList.add("has-arrival-consent-granted");
    setCheckinEnabled(true);
    document.dispatchEvent(new CustomEvent("iam:arrival-consent-granted"));
  }

  function allowRetry(message) {
    if (acceptButton) {
      acceptButton.disabled = false;
      acceptButton.removeAttribute("aria-busy");
    }
    announce(message, "error");
  }

  async function accept() {
    if (!acceptButton) return;
    acceptButton.disabled = true;
    acceptButton.setAttribute("aria-busy", "true");
    announce("Preparing your private space…", "pending");

    try {
      if (!existingConsent) await citizenData.acceptConsent();
      announce("Thank you. Your private space is ready.", "complete");
      window.setTimeout(completeConsent, 240);
    } catch {
      allowRetry("We could not open your private space just now. Nothing has been collected. Please try again.");
    }
  }

  if (entryLink && dialog && panel && acceptButton && status) {
    acceptButton.addEventListener("click", accept);
    entryLink.addEventListener("click", async (event) => {
      event.preventDefault();
      showDialog();
      acceptButton.disabled = true;
      announce("Checking your privacy choice…", "pending");

      try {
        const current = await citizenData.consentStatus();
        existingConsent = Boolean(current?.granted);
        if (existingConsent && !forcePermissionProof) {
          completeConsent();
          return;
        }
        acceptButton.disabled = false;
        announce("");
      } catch {
        allowRetry("We could not check your privacy choice. Nothing has been collected. Please try again.");
      }
    });
    return;
  }

  if (!form) return;

  setCheckinEnabled(false);
  citizenData.consentStatus().then((current) => {
    if (current?.granted) {
      completeConsent();
      return;
    }
    window.location.replace("induction.html?induction=show&permission=required");
  }).catch(() => {
    if (checkinStatus) {
      checkinStatus.textContent = "We could not check your privacy choice. Nothing has been collected. Please return to the induction page and try again.";
    }
  });
})();
