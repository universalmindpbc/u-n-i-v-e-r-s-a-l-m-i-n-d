(() => {
  const calculator = document.querySelector("[data-business-calculator]");
  const audienceOptions = [10000, 100000, 500000, 1000000];
  const number = new Intl.NumberFormat("en-US");
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 2,
  });

  function formatUsd(value) {
    return `US${money.format(value)}`;
  }

  if (calculator) {
    const seatInput = calculator.querySelector("[data-seat-input]");
    const audienceInput = calculator.querySelector("[data-audience-input]");
    const cpmButtons = Array.from(calculator.querySelectorAll("[data-cpm]"));
    const adButtons = Array.from(calculator.querySelectorAll("[data-ad-count]"));
    let cpm = 150;
    let adsPerHour = 1;

    const outputs = {
      seatDisplay: calculator.querySelector("[data-seat-display]"),
      audienceDisplay: calculator.querySelector("[data-audience-display]"),
      governmentRevenue: calculator.querySelector("[data-government-revenue]"),
      publicRevenue: calculator.querySelector("[data-public-revenue]"),
      publicRevenueNote: calculator.querySelector("[data-public-revenue-note]"),
      citizenCost: calculator.querySelector("[data-citizen-cost]"),
      additionalRevenue: calculator.querySelector("[data-additional-revenue]"),
      workingBalance: calculator.querySelector("[data-working-balance]"),
    };

    function renderCalculator() {
      const seats = Number(seatInput.value);
      const audience = audienceOptions[Number(audienceInput.value)] || audienceOptions[0];
      const governmentRevenue = seats * 1000;
      const citizenCost = seats * 77.7;
      const oneAdValue = audience * 365 * (cpm / 1000);
      const publicRevenue = oneAdValue * adsPerHour;
      const additionalRevenue = Math.max(0, publicRevenue - oneAdValue);
      const workingBalance = governmentRevenue - citizenCost + additionalRevenue;

      outputs.seatDisplay.value = number.format(seats);
      outputs.audienceDisplay.value = number.format(audience);
      outputs.governmentRevenue.textContent = formatUsd(governmentRevenue);
      outputs.publicRevenue.textContent = formatUsd(publicRevenue);
      outputs.publicRevenueNote.textContent = `${number.format(audience)} people · ${adsPerHour} advertising ${adsPerHour === 1 ? "minute" : "minutes"} per hour`;
      outputs.citizenCost.textContent = formatUsd(citizenCost);
      outputs.additionalRevenue.textContent = formatUsd(additionalRevenue);
      outputs.workingBalance.textContent = formatUsd(workingBalance);
    }

    seatInput.addEventListener("input", renderCalculator);
    audienceInput.addEventListener("input", renderCalculator);

    cpmButtons.forEach((button) => {
      button.addEventListener("click", () => {
        cpm = Number(button.dataset.cpm);
        cpmButtons.forEach((candidate) => candidate.classList.toggle("is-selected", candidate === button));
        renderCalculator();
      });
    });

    adButtons.forEach((button) => {
      button.addEventListener("click", () => {
        adsPerHour = Number(button.dataset.adCount);
        adButtons.forEach((candidate) => candidate.classList.toggle("is-selected", candidate === button));
        renderCalculator();
      });
    });

    renderCalculator();
  }

  const chart = document.querySelector("[data-attention-chart]");
  const periodButtons = Array.from(document.querySelectorAll("[data-attention-period]"));
  const caveat = document.querySelector("[data-attention-caveat]");

  if (chart && periodButtons.length) {
    const rows = Array.from(chart.querySelectorAll("[data-attention-row]"));
    const maxMonthly = Math.max(...rows.map((row) => Number(row.dataset.monthly)));

    function formatAttention(value) {
      if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace(/\.0$/, "")}B`;
      if (value >= 10) return `${value.toFixed(1).replace(/\.0$/, "")}M`;
      return `${value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}M`;
    }

    function renderAttention(period) {
      const multiplier = period === "day" ? 1 / 30 : period === "year" ? 12 : 1;
      rows.forEach((row) => {
        const monthly = Number(row.dataset.monthly);
        const value = monthly * multiplier;
        const width = 12 + (monthly / maxMonthly) * 88;
        row.style.setProperty("--attention-width", `${width}%`);
        row.querySelector("[data-attention-value]").textContent = formatAttention(value);
      });

      periodButtons.forEach((button) => button.classList.toggle("is-selected", button.dataset.attentionPeriod === period));
      if (period === "day") {
        caveat.textContent = "Daily figures are simple monthly equivalents divided by 30, not audited daily unique people. Source definitions differ and audiences overlap.";
      } else if (period === "year") {
        caveat.textContent = "Annual figures are simple monthly equivalents multiplied by 12, not de-duplicated annual unique people. Source definitions differ and audiences overlap.";
      } else {
        caveat.textContent = "Monthly figures use each source’s available definition and are not additive. Audiences overlap. Partner-owned, audited figures would replace these public signals before forecasting.";
      }
    }

    periodButtons.forEach((button) => button.addEventListener("click", () => renderAttention(button.dataset.attentionPeriod)));
    renderAttention("month");
  }

  const partnerEarnings = document.querySelector("[data-partner-earnings]");
  if (partnerEarnings) {
    const buttons = Array.from(partnerEarnings.querySelectorAll("[data-earnings-audience]"));
    const dayOutputs = Array.from(partnerEarnings.querySelectorAll("[data-earnings-day], [data-earnings-day-secondary]"));
    const monthOutput = partnerEarnings.querySelector("[data-earnings-month]");
    const yearOutput = partnerEarnings.querySelector("[data-earnings-year]");

    function renderEarnings(audience) {
      const daily = audience * 0.15;
      dayOutputs.forEach((output) => { output.textContent = formatUsd(daily); });
      monthOutput.textContent = formatUsd(daily * 30);
      yearOutput.textContent = formatUsd(daily * 365);
      buttons.forEach((button) => button.classList.toggle("is-selected", Number(button.dataset.earningsAudience) === audience));
    }

    buttons.forEach((button) => button.addEventListener("click", () => renderEarnings(Number(button.dataset.earningsAudience))));
    renderEarnings(1000000);
  }
})();
