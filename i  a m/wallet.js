(function () {
  const categoryCopy = {
    music: "Exclusive releases, artist experiences and music made to be shared.",
    fashion: "Fashion, merchandise and limited pieces from participating partners.",
    events: "Live rooms, performances, gatherings and moments worth showing up for.",
    health: "Wellbeing experiences and supportive choices that help us care for one another.",
  };

  const buttons = Array.from(document.querySelectorAll("[data-happiness-category]"));
  const label = document.querySelector("[data-happiness-category-label]");
  const title = document.querySelector("[data-happiness-category-title]");
  const copy = document.querySelector("[data-happiness-category-copy]");
  const qrImage = document.querySelector("[data-happiness-qr-image]");
  const shell = document.querySelector("[data-happiness-state]");
  const balanceNodes = Array.from(document.querySelectorAll("[data-happiness-balance]"));
  const memberNode = document.querySelector("[data-happiness-member]");
  const pilotStatus = document.querySelector("[data-happiness-pilot-status]");
  const collectiveStatus = document.querySelector("[data-happiness-collective-status]");
  const activity = document.querySelector("[data-happiness-activity]");
  const appleStatus = document.querySelector("[data-apple-wallet-status]");

  function selectCategory(category) {
    const nextCopy = categoryCopy[category];
    if (!nextCopy) return;
    buttons.forEach((button) => button.classList.toggle("is-active", button.dataset.happinessCategory === category));
    if (label) label.textContent = category;
    if (title) title.textContent = "Every visit unlocks something new.";
    if (copy) copy.textContent = nextCopy;
    if (window.location.hash !== `#${category}`) window.history.replaceState(null, "", `#${category}`);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => selectCategory(button.dataset.happinessCategory));
  });

  const requestedCategory = window.location.hash.slice(1).toLowerCase();
  if (categoryCopy[requestedCategory]) selectCategory(requestedCategory);

  if (qrImage && /^(www\.)?universalmind\.tv$/i.test(window.location.hostname)) {
    qrImage.src = "/vogue/iam/a s s e t s/happiness-wallet-qr-production.png";
  }

  async function loadWalletState() {
    if (!shell?.dataset.happinessState) return;
    try {
      const response = await fetch(shell.dataset.happinessState, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error("wallet_state_unavailable");
      const state = await response.json();
      balanceNodes.forEach((node) => { node.textContent = state.balance?.available_display ?? "0"; });
      if (memberNode && state.member?.display_id) memberNode.textContent = state.member.display_id;
      if (pilotStatus && state.pilot?.status) pilotStatus.textContent = state.pilot.status;
      if (collectiveStatus && state.collective?.status) {
        collectiveStatus.textContent = `${state.collective.status} · no citizen is ranked against another.`;
      }
      if (activity && state.activity?.empty_message) activity.textContent = state.activity.empty_message;
      if (appleStatus && state.apple_wallet?.status) appleStatus.textContent = state.apple_wallet.status;
      document.documentElement.dataset.happinessState = "ready";
    } catch {
      document.documentElement.dataset.happinessState = "fallback";
    }
  }

  loadWalletState();
})();
