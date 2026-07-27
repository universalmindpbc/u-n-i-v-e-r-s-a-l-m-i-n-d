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
})();
