(() => {
  const scale = [
    { viewers: 1_000, label: "1K" },
    { viewers: 10_000, label: "10K" },
    { viewers: 100_000, label: "100K" },
    { viewers: 1_000_000, label: "1M" },
    { viewers: 10_000_000, label: "10M" },
  ];

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

  const formatUsd = (value) => `US${exactUsd.format(value)}`;
  const formatCompactUsd = (value) => `US${compactUsd.format(value)}`;
  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  };

  const viewerSelect = document.querySelector("[data-viewer-select]");
  const viewerSlider = document.querySelector("[data-viewer-scale]");
  const scaleButtons = Array.from(document.querySelectorAll("[data-scale-point]"));

  function renderForecast(index) {
    const safeIndex = Math.max(0, Math.min(scale.length - 1, Number(index) || 0));
    const { viewers, label } = scale[safeIndex];
    const adsDaily = viewers * 4 * 0.15;
    const arcPeople = viewers * 0.1;
    const arcDaily = (arcPeople * 1_000) / 365;
    const subscriberPeople = viewers * 0.05;
    const subscriptionsDaily = (subscriberPeople * 100) / 365;
    const affiliateDaily = viewers * 0.385;
    const dailyTotal = adsDaily + arcDaily + subscriptionsDaily + affiliateDaily;
    const annualTotal = dailyTotal * 365;
    const annualAllocation = annualTotal / 4;
    const mentalHealthDaily = dailyTotal / 4;

    if (viewerSelect) viewerSelect.value = String(safeIndex);
    if (viewerSlider) {
      viewerSlider.value = String(safeIndex);
      viewerSlider.setAttribute("aria-valuetext", `${label} unique viewers per day`);
    }
    scaleButtons.forEach((button) => {
      button.classList.toggle("is-selected", Number(button.dataset.scalePoint) === safeIndex);
    });

    setText("[data-viewer-label]", label);
    setText("[data-viewer-count]", integer.format(viewers));
    setText("[data-arc-count]", integer.format(arcPeople));
    setText("[data-subs-count]", integer.format(subscriberPeople));
    setText("[data-ads-total]", `${formatUsd(adsDaily)} / day`);
    setText("[data-arc-total]", `${formatUsd(arcDaily)} / day`);
    setText("[data-subs-total]", `${formatUsd(subscriptionsDaily)} / day`);
    setText("[data-affiliate-total]", `${formatUsd(affiliateDaily)} / day`);
    setText("[data-daily-total]", `${formatUsd(dailyTotal)} / day`);
    setText("[data-annual-total]", `${formatCompactUsd(annualTotal)} / annum`);
    setText("[data-allocation-profit]", formatCompactUsd(annualAllocation));
    setText("[data-allocation-territory]", formatCompactUsd(annualAllocation));
    setText("[data-allocation-talent]", formatCompactUsd(annualAllocation));
    setText("[data-allocation-technology]", formatCompactUsd(annualAllocation));
    setText("[data-mental-daily]", formatUsd(mentalHealthDaily));
    setText("[data-mental-annual]", `${formatCompactUsd(annualAllocation)} per annum`);
  }

  viewerSelect?.addEventListener("change", (event) => renderForecast(event.currentTarget.value));
  viewerSlider?.addEventListener("input", (event) => renderForecast(event.currentTarget.value));
  scaleButtons.forEach((button) => {
    button.addEventListener("click", () => renderForecast(button.dataset.scalePoint));
  });

  const reachChart = document.querySelector("[data-reach-chart]");
  if (reachChart) {
    const reachName = reachChart.querySelector("[data-reach-name]");
    const reachNumber = reachChart.querySelector("[data-reach-number]");
    const reachButtons = Array.from(reachChart.querySelectorAll("[data-reach-name-value]"));

    reachButtons.forEach((button) => {
      button.addEventListener("click", () => {
        reachButtons.forEach((candidate) => {
          const selected = candidate === button;
          candidate.classList.toggle("is-selected", selected);
          candidate.setAttribute("aria-pressed", String(selected));
        });
        if (reachName) reachName.textContent = button.dataset.reachNameValue || "";
        if (reachNumber) reachNumber.textContent = button.dataset.reachNumberValue || "";
      });
    });
  }

  const performanceLoops = Array.from(document.querySelectorAll("[data-market-performance]"));
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (performanceLoops.length && !reducedMotion && "IntersectionObserver" in window) {
    const mediaObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        video.muted = true;
        if (entry.isIntersecting && !document.hidden) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.18 });

    performanceLoops.forEach((video) => mediaObserver.observe(video));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) performanceLoops.forEach((video) => video.pause());
    });
  }

  renderForecast(1);
})();
