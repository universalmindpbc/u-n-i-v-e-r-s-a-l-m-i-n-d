(() => {
  "use strict";

  const citizenData = window.IAMCitizenData;
  const dialog = document.querySelector("[data-arrival-consent]");
  const panel = dialog?.querySelector("[data-arrival-consent-panel]");
  const acceptButton = dialog?.querySelector("[data-consent-accept]");
  const continueButton = dialog?.querySelector("[data-consent-continue-without]");
  const status = dialog?.querySelector("[data-consent-status]");
  const form = document.querySelector("[data-iam-form]");
  const input = document.querySelector("[data-iam-input]");

  if (!citizenData?.enabled || !dialog || !panel || !acceptButton || !status || !form) return;

  function setCheckinEnabled(enabled) {
    form.toggleAttribute("inert", !enabled);
    form.setAttribute("aria-disabled", String(!enabled));
    if (input) input.disabled = !enabled;
  }

  function announce(message, state = "idle") {
    status.textContent = message;
    status.dataset.state = state;
  }

  function showDialog() {
    dialog.hidden = false;
    dialog.setAttribute("aria-hidden", "false");
    document.body.classList.add("has-arrival-consent");
    setCheckinEnabled(false);
    window.setTimeout(() => panel.focus({ preventScroll: true }), 0);
  }

  function completeConsent() {
    citizenData.clearLegacySensitiveLocalStorage();
    dialog.setAttribute("aria-hidden", "true");
    dialog.hidden = true;
    document.body.classList.remove("has-arrival-consent");
    document.body.classList.add("has-arrival-consent-granted");
    setCheckinEnabled(true);
    document.dispatchEvent(new CustomEvent("iam:arrival-consent-granted"));
  }

  function allowRetry(message) {
    acceptButton.disabled = false;
    acceptButton.removeAttribute("aria-busy");
    announce(message, "error");
  }

  async function accept() {
    acceptButton.disabled = true;
    acceptButton.setAttribute("aria-busy", "true");
    announce("Preparing your private space…", "pending");
    try {
      await citizenData.acceptConsent();
      announce("Thank you. Your private space is ready.", "complete");
      window.setTimeout(completeConsent, 520);
    } catch {
      allowRetry("We could not open your private space just now. Nothing has been collected. Please try again.");
    }
  }

  acceptButton.addEventListener("click", accept);
  continueButton?.addEventListener("click", () => {
    window.location.assign("index.html?arrival=without-checkin");
  });

  showDialog();
  announce("Checking your privacy choice…", "pending");
  citizenData.consentStatus().then((current) => {
    if (current?.granted) {
      completeConsent();
      return;
    }
    acceptButton.disabled = false;
    announce("Your choice is yours.");
  }).catch(() => {
    allowRetry("We could not check your privacy choice. Nothing has been collected. Please try again.");
  });
})();
