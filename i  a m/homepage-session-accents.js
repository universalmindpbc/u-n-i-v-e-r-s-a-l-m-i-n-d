(function () {
  const frequency = document.querySelector("[data-adaptive-session-frequency]");
  const planet = document.querySelector("[data-homepage-universal-one-planet]");

  if (planet) {
    planet.style.setProperty("--iam-mini-planet-texture", `url("${makeMiniPlanetTexture(0)}")`);
  }

  if (!frequency) return;

  let hasSelectedFrequency = false;
  const bodyClassObserver = new MutationObserver(syncFrequencyVisibility);
  bodyClassObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  window.addEventListener("iam:adaptive-sound-profile", (event) => {
    applySoundSnapshot(event.detail);
  });

  if (window.IAMAdaptiveSoundSnapshot) {
    applySoundSnapshot(window.IAMAdaptiveSoundSnapshot);
  }

  function applySoundSnapshot(snapshot) {
    const lane = String(snapshot?.dominant_lane || "").trim().toLowerCase();
    const rate = Number(snapshot?.dominant_isochronic_hz);
    const carrier = Number(snapshot?.carrier_hz);
    const frequenciesEnabled = snapshot?.safety?.adaptive_frequencies_enabled === true;
    const selected = snapshot?.selected === true
      && frequenciesEnabled
      && lane
      && Number.isFinite(rate)
      && Number.isFinite(carrier);

    frequency.dataset.adaptiveSoundSelected = String(Boolean(selected));
    frequency.dataset.adaptiveSoundSelectionBasis = String(snapshot?.selection_basis || "insufficient_context");
    frequency.dataset.adaptiveSoundProfile = String(snapshot?.profile_id || "");

    if (!selected) {
      hasSelectedFrequency = false;
      syncFrequencyVisibility();
      frequency.removeAttribute("aria-label");
      return;
    }

    setText("[data-adaptive-session-lane]", lane);
    setText("[data-adaptive-session-rate]", `${formatFrequency(rate)}hz`);
    setText("[data-adaptive-session-carrier]", `${formatFrequency(carrier)}hz`);
    frequency.setAttribute(
      "aria-label",
      `${lane} ${formatFrequency(rate)} hertz, carrier ${formatFrequency(carrier)} hertz`,
    );
    hasSelectedFrequency = true;
    syncFrequencyVisibility();
  }

  function syncFrequencyVisibility() {
    frequency.hidden = !(hasSelectedFrequency && document.body.classList.contains("adaptive-typewriter-complete"));
  }

  function setText(selector, value) {
    const node = frequency.querySelector(selector);
    if (node) node.textContent = value;
  }

  function formatFrequency(value) {
    if (Number.isInteger(value)) return String(value);
    return String(Math.round(value * 100) / 100);
  }

  function makeMiniPlanetTexture(seed) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    const ocean = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    ocean.addColorStop(0, seed % 2 ? "#0b4d72" : "#0d6380");
    ocean.addColorStop(1, "#071f42");
    context.fillStyle = ocean;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const islands = [
      [.08, .32, .2, .19],
      [.32, .56, .26, .24],
      [.59, .24, .22, .22],
      [.76, .62, .28, .2],
    ];
    context.fillStyle = seed % 2 ? "#4a8a55" : "#3d9a70";
    islands.forEach(([x, y, width, height], index) => {
      context.beginPath();
      context.ellipse(
        ((x + seed * .07) % 1) * canvas.width,
        y * canvas.height,
        width * canvas.width,
        height * canvas.height,
        index * .42,
        0,
        Math.PI * 2,
      );
      context.fill();
    });
    context.strokeStyle = "rgba(228, 190, 123, 0.62)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, canvas.height * .48);
    context.bezierCurveTo(
      canvas.width * .27,
      canvas.height * .32,
      canvas.width * .63,
      canvas.height * .66,
      canvas.width,
      canvas.height * .44,
    );
    context.stroke();
    return canvas.toDataURL("image/png");
  }
}());
