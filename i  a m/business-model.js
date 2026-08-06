(() => {
  const calculator = document.querySelector("[data-stakeholder-calculator]");
  if (!calculator) return;

  const buttons = Array.from(calculator.querySelectorAll("[data-calculator-audience]"));
  const dayOutput = calculator.querySelector("[data-calculator-day]");
  const monthOutput = calculator.querySelector("[data-calculator-month]");
  const yearOutput = calculator.querySelector("[data-calculator-year]");
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

  function render(audience) {
    const daily = audience * 0.15;
    dayOutput.textContent = `${formatUsd(daily)} per day`;
    monthOutput.textContent = `${formatUsd(daily * 30)} per month`;
    yearOutput.textContent = `${formatUsd(daily * 365)} per annum`;
    buttons.forEach((button) => {
      button.classList.toggle("is-selected", Number(button.dataset.calculatorAudience) === audience);
    });
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => render(Number(button.dataset.calculatorAudience)));
  });

  render(1000000);
})();
