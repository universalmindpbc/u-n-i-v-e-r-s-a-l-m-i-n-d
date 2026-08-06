(() => {
  const calculator = document.querySelector("[data-revenue-calculator]");
  const exactUsd = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  });
  const compactUsd = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 2,
  });
  const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

  function formatUsd(value, compact = false) {
    return `US${(compact ? compactUsd : exactUsd).format(value)}`;
  }

  function setSelected(buttons, selected) {
    buttons.forEach((button) => button.classList.toggle("is-selected", button === selected));
  }

  function wireButtons(selector, render) {
    const buttons = Array.from(calculator?.querySelectorAll(selector) || []);
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        setSelected(buttons, button);
        render(Number(button.getAttribute(selector.slice(1, -1).split("=")[0])));
      });
    });
    return buttons;
  }

  if (calculator) {
    const advertisingGross = calculator.querySelector("[data-advertising-gross]");
    const advertisingCosts = calculator.querySelector("[data-advertising-costs]");
    const advertisingNet = calculator.querySelector("[data-advertising-net]");
    const advertisingShare = calculator.querySelector("[data-advertising-share]");
    const advertisingShareMonth = calculator.querySelector("[data-advertising-share-month]");
    const advertisingShareYear = calculator.querySelector("[data-advertising-share-year]");

    function renderAdvertising(viewers) {
      const grossDaily = viewers * 0.6;
      const costsDaily = viewers * 0.15;
      const netDaily = grossDaily - costsDaily;
      const shareDaily = netDaily / 3;
      advertisingGross.textContent = `${formatUsd(grossDaily)} per day`;
      advertisingCosts.textContent = `${formatUsd(costsDaily)} per day`;
      advertisingNet.textContent = `${formatUsd(netDaily)} per day`;
      advertisingShare.textContent = `${formatUsd(shareDaily)} per day`;
      advertisingShareMonth.textContent = `${formatUsd(shareDaily * 30, true)} per month`;
      advertisingShareYear.textContent = `${formatUsd(shareDaily * 365, true)} per annum`;
    }

    function renderGovernment(seats) {
      const gross = seats * 1000;
      const costs = seats * 77.7;
      calculator.querySelector("[data-government-gross]").textContent = `${formatUsd(gross, true)} gross annual revenue`;
      calculator.querySelector("[data-government-costs]").textContent = `${formatUsd(costs)} running costs`;
      calculator.querySelector("[data-government-net]").textContent = `${formatUsd(gross - costs)} net revenue`;
    }

    function renderFreemium(users) {
      calculator.querySelector("[data-freemium-revenue]").textContent = `${formatUsd(users * 100, true)} gross annual revenue`;
    }

    function renderAffiliate(viewers) {
      const sales = viewers * 0.01;
      const revenue = sales * 500 * 0.077;
      calculator.querySelector("[data-affiliate-revenue]").textContent = `${formatUsd(revenue)} gross annual revenue`;
      calculator.querySelector("[data-affiliate-sales]").textContent = `${integer.format(sales)} sales`;
    }

    wireButtons("[data-advertising-viewers]", renderAdvertising);
    wireButtons("[data-government-seats]", renderGovernment);
    wireButtons("[data-freemium-users]", renderFreemium);
    wireButtons("[data-affiliate-viewers]", renderAffiliate);

    renderAdvertising(1000000);
    renderGovernment(1000);
    renderFreemium(1000);
    renderAffiliate(10000);
  }

})();
