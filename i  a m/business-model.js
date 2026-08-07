(() => {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const modelRadarConfigs = {
    business: [
      { name: "ADVERTISING", start: 240, end: 360, color: "#2b93ff", description: "Full-page feature films at US$0.15 per qualified play", lines: [] },
      { name: "AFFILIATE", start: 0, end: 120, color: "#ff8a00", description: "Primarily luxury affiliate sales", lines: [] },
      { name: "SUBSCRIPTION", start: 120, end: 240, color: "#c02cff", description: "Government-funded memberships for at-risk communities and optional member subscriptions", lines: [] },
    ],
    costs: [
      { name: "TERRITORY", start: 240, end: 360, color: "#ff005e", description: "Media distribution", lines: ["33.3%"] },
      { name: "TECHNOLOGY", start: 0, end: 120, color: "#00f0d8", description: "Streaming and hosting", lines: ["33.3%"] },
      { name: "TALENT", start: 120, end: 240, color: "#ffd92e", description: "DJs, licensing and teachers", lines: ["33.3%"] },
    ],
  };

  const makeSvgElement = (name, attributes = {}) => {
    const element = document.createElementNS(svgNamespace, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  };

  const polar = (angle, radius) => {
    const radians = (angle - 90) * Math.PI / 180;
    return { x: Math.cos(radians) * radius, y: Math.sin(radians) * radius };
  };

  const pieSectorPath = (startAngle, endAngle, radius) => {
    const start = polar(startAngle, radius);
    const end = polar(endAngle, radius);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return [
      "M 0 0",
      `L ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
      "Z",
    ].join(" ");
  };

  const pointString = (points) => points
    .map(([angle, radius]) => {
      const point = polar(angle, radius);
      return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    })
    .join(" ");

  function buildModelRadar(radar) {
    const config = modelRadarConfigs[radar.dataset.modelRadar];
    const radarName = radar.dataset.modelRadar;
    const defs = radar.querySelector("defs");
    const sectorsLayer = radar.querySelector("[data-model-sectors]");
    const gridLayer = radar.querySelector("[data-model-grid]");
    const networkLayer = radar.querySelector("[data-model-network]");
    const traceLayer = radar.querySelector("[data-model-trace]");
    const labelsLayer = radar.querySelector("[data-model-labels]");
    if (!config || !defs || !sectorsLayer || !gridLayer || !networkLayer || !traceLayer || !labelsLayer) return;

    const depthFilterId = `${radarName}-sector-depth`;
    const bloomFilterId = `${radarName}-sector-bloom`;
    const sheenGradientId = `${radarName}-sector-sheen`;

    const bloomFilter = makeSvgElement("filter", { id: bloomFilterId, x: "-45%", y: "-45%", width: "190%", height: "190%", "color-interpolation-filters": "sRGB" });
    bloomFilter.append(makeSvgElement("feGaussianBlur", { stdDeviation: "18" }));

    const depthFilter = makeSvgElement("filter", { id: depthFilterId, x: "-25%", y: "-25%", width: "150%", height: "150%", "color-interpolation-filters": "sRGB" });
    depthFilter.append(makeSvgElement("feTurbulence", { type: "fractalNoise", baseFrequency: "0.009 0.014", numOctaves: "2", seed: radarName === "business" ? "17" : "29", result: "refractNoise" }));
    depthFilter.append(makeSvgElement("feDisplacementMap", { in: "SourceGraphic", in2: "refractNoise", scale: "2.8", xChannelSelector: "R", yChannelSelector: "G", result: "refracted" }));
    const lighting = makeSvgElement("feSpecularLighting", { in: "SourceAlpha", surfaceScale: "9", specularConstant: "0.5", specularExponent: "32", "lighting-color": "#ffffff", result: "specular" });
    lighting.append(makeSvgElement("fePointLight", { x: "-190", y: "-230", z: "310" }));
    depthFilter.append(lighting);
    depthFilter.append(makeSvgElement("feComposite", { in: "specular", in2: "SourceAlpha", operator: "in", result: "specularCut" }));
    depthFilter.append(makeSvgElement("feBlend", { in: "refracted", in2: "specularCut", mode: "screen" }));

    const sheen = makeSvgElement("radialGradient", { id: sheenGradientId, cx: "27%", cy: "16%", r: "92%", fx: "24%", fy: "12%" });
    sheen.append(
      makeSvgElement("stop", { offset: "0%", "stop-color": "#ffffff", "stop-opacity": "0.58" }),
      makeSvgElement("stop", { offset: "28%", "stop-color": "#ffffff", "stop-opacity": "0.17" }),
      makeSvgElement("stop", { offset: "68%", "stop-color": "#ffffff", "stop-opacity": "0.015" }),
      makeSvgElement("stop", { offset: "100%", "stop-color": "#ffffff", "stop-opacity": "0" }),
    );
    defs.append(bloomFilter, depthFilter, sheen);

    [46, 92, 138, 184, 230].forEach((radius) => {
      gridLayer.append(makeSvgElement("circle", { class: "model-grid-ring", r: radius }));
    });

    for (let angle = 0; angle < 360; angle += 15) {
      const start = polar(angle, 35);
      const end = polar(angle, 230);
      gridLayer.append(makeSvgElement("line", {
        class: `model-grid-line ${angle % 120 === 0 ? "model-grid-line--major" : ""}`,
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
      }));
    }

    const labels = [];
    config.forEach((sector, index) => {
      const group = makeSvgElement("g", {
        class: "model-sector",
        tabindex: "0",
        role: "button",
        "aria-label": `${sector.name}: ${sector.description}`,
        "aria-pressed": "false",
        "data-model-sector": sector.name,
      });
      const pathData = pieSectorPath(sector.start, sector.end, 230);
      group.append(
        makeSvgElement("path", { class: "model-sector__bloom", d: pathData, fill: sector.color, filter: `url(#${bloomFilterId})` }),
        makeSvgElement("path", { class: "model-sector__fill", d: pathData, fill: sector.color, filter: `url(#${depthFilterId})` }),
        makeSvgElement("path", { class: "model-sector__sheen", d: pathData, fill: `url(#${sheenGradientId})` }),
        makeSvgElement("path", { class: "model-sector__scan", d: pathData, stroke: sector.color, pathLength: "1" }),
        makeSvgElement("path", { class: "model-sector__hit", d: pathData }),
      );
      sectorsLayer.append(group);

      const midpoint = (sector.start + sector.end) / 2;
      const labelPoint = polar(midpoint, 145);
      const label = makeSvgElement("text", {
        class: "model-radar__label",
        "data-model-label": sector.name,
        x: labelPoint.x,
        y: labelPoint.y - 17,
        fill: sector.color,
        "text-anchor": "middle",
      });
      const title = makeSvgElement("tspan", { class: "model-radar__label-title", x: labelPoint.x, dy: "0" });
      title.textContent = sector.name;
      label.append(title);
      sector.lines.forEach((line, lineIndex) => {
        const copy = makeSvgElement("tspan", { class: "model-radar__label-copy", x: labelPoint.x, dy: lineIndex === 0 ? "24" : "17" });
        copy.textContent = line;
        label.append(copy);
      });
      labelsLayer.append(label);
      labels.push(label);

      const tracePoint = polar(midpoint, index === 1 ? 202 : 210);
      traceLayer.append(makeSvgElement("circle", {
        class: "model-trace-node",
        cx: tracePoint.x,
        cy: tracePoint.y,
        r: "5.5",
        fill: sector.color,
      }));
    });

    const tracePoints = [
      [-54, 205], [-27, 214], [3, 198], [35, 216], [68, 204], [101, 218],
      [136, 201], [169, 214], [205, 202], [239, 218], [272, 204], [305, 215], [338, 202],
    ];
    traceLayer.prepend(makeSvgElement("polyline", { class: "model-trace-line", points: pointString(tracePoints) }));

    const networkPoints = [0, 60, 120, 180, 240, 300].map((angle) => polar(angle, 21));
    networkPoints.forEach((point, index) => {
      const next = networkPoints[(index + 1) % networkPoints.length];
      networkLayer.append(
        makeSvgElement("line", { class: "model-engine-line", x1: point.x, y1: point.y, x2: next.x, y2: next.y }),
        makeSvgElement("line", { class: "model-engine-line", x1: point.x, y1: point.y, x2: "0", y2: "0" }),
        makeSvgElement("circle", { class: "model-engine-node", cx: point.x, cy: point.y, r: "3.8" }),
      );
    });

    const groups = Array.from(sectorsLayer.querySelectorAll(".model-sector"));
    let pinnedSector = null;
    const setActive = (active) => {
      radar.classList.toggle("has-domain", Boolean(active));
      groups.forEach((group, index) => {
        const selected = group === active;
        group.classList.toggle("is-active", selected);
        group.setAttribute("aria-pressed", String(pinnedSector === group));
        labels[index]?.classList.toggle("is-active", selected);
      });
    };
    groups.forEach((group) => {
      group.addEventListener("pointerenter", () => setActive(group));
      group.addEventListener("pointerleave", () => setActive(pinnedSector));
      group.addEventListener("focus", () => setActive(group));
      group.addEventListener("blur", () => setActive(pinnedSector));
      const toggle = () => {
        pinnedSector = pinnedSector === group ? null : group;
        setActive(pinnedSector);
      };
      group.addEventListener("click", toggle);
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle();
        }
      });
    });
  }

  document.querySelectorAll("[data-model-radar]").forEach(buildModelRadar);

  const scales = [
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

  const usd = (value) => `US${exactUsd.format(value)}`;
  const compact = (value) => `US${compactUsd.format(value)}`;
  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  };

  const viewerSelect = document.querySelector("[data-viewer-select]");
  const viewerSlider = document.querySelector("[data-viewer-scale]");
  const scaleButtons = Array.from(document.querySelectorAll("[data-scale-point]"));

  function renderForecast(index) {
    const scaleIndex = Math.max(0, Math.min(scales.length - 1, Number(index) || 0));
    const { viewers, label } = scales[scaleIndex];
    const adsDaily = viewers * 4 * 0.15;
    const arcCount = viewers * 0.1;
    const arcDaily = (arcCount * 1_000) / 365;
    const subscriberCount = viewers * 0.05;
    const subscriptionsDaily = (subscriberCount * 100) / 365;
    const affiliateDaily = viewers * 0.385;
    const dailyTotal = adsDaily + arcDaily + subscriptionsDaily + affiliateDaily;
    const annualTotal = dailyTotal * 365;
    const annualAllocation = annualTotal / 4;

    if (viewerSelect) viewerSelect.value = String(scaleIndex);
    if (viewerSlider) {
      viewerSlider.value = String(scaleIndex);
      viewerSlider.setAttribute("aria-valuetext", `${label} unique viewers per day`);
    }
    scaleButtons.forEach((button) => {
      button.classList.toggle("is-selected", Number(button.dataset.scalePoint) === scaleIndex);
    });

    setText("[data-viewer-label]", label);
    setText("[data-viewer-count]", integer.format(viewers));
    setText("[data-arc-count]", integer.format(arcCount));
    setText("[data-subs-count]", integer.format(subscriberCount));
    setText("[data-ads-total]", usd(adsDaily));
    setText("[data-ads-annual]", compact(adsDaily * 365));
    setText("[data-arc-total]", usd(arcDaily));
    setText("[data-arc-annual]", compact(arcDaily * 365));
    setText("[data-subs-total]", usd(subscriptionsDaily));
    setText("[data-subs-annual]", compact(subscriptionsDaily * 365));
    setText("[data-affiliate-total]", usd(affiliateDaily));
    setText("[data-affiliate-annual]", compact(affiliateDaily * 365));
    setText("[data-daily-total]", usd(dailyTotal));
    setText("[data-annual-total]", compact(annualTotal));
    setText("[data-allocation-technology]", `${compact(annualAllocation)} / annum`);
    setText("[data-allocation-talent]", `${compact(annualAllocation)} / annum`);
    setText("[data-allocation-territory]", `${compact(annualAllocation)} / annum`);
    setText("[data-allocation-profit]", `${compact(annualAllocation)} / annum`);
    setText("[data-mental-daily]", usd(dailyTotal / 4));
    setText("[data-mental-annual]", `${compact(annualAllocation)} per annum`);
  }

  viewerSelect?.addEventListener("change", (event) => renderForecast(event.currentTarget.value));
  viewerSlider?.addEventListener("input", (event) => renderForecast(event.currentTarget.value));
  scaleButtons.forEach((button) => button.addEventListener("click", () => renderForecast(button.dataset.scalePoint)));

  const setupReachChart = ({ chartSelector, entrySelector, nameSelector, numberSelector }) => {
    const chart = document.querySelector(chartSelector);
    if (!chart) return;
    const reachName = document.querySelector(nameSelector);
    const reachNumber = document.querySelector(numberSelector);
    const entries = Array.from(chart.querySelectorAll(entrySelector));
    const selectEntry = (entry) => {
      entries.forEach((candidate) => {
        const selected = candidate === entry;
        candidate.classList.toggle("is-selected", selected);
        candidate.setAttribute("aria-pressed", String(selected));
      });
      if (reachName) reachName.textContent = entry.dataset.reachNameValue || "";
      if (reachNumber) reachNumber.textContent = entry.dataset.reachNumberValue || "";
    };
    entries.forEach((entry) => {
      entry.addEventListener("click", () => selectEntry(entry));
      entry.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectEntry(entry);
        }
      });
    });
  };

  setupReachChart({
    chartSelector: "[data-reach-chart]",
    entrySelector: "[data-reach-entry]",
    nameSelector: "[data-reach-name]",
    numberSelector: "[data-reach-number]",
  });

  setupReachChart({
    chartSelector: "[data-talent-reach-chart]",
    entrySelector: "[data-talent-reach-entry]",
    nameSelector: "[data-talent-reach-name]",
    numberSelector: "[data-talent-reach-number]",
  });

  const loops = Array.from(document.querySelectorAll("[data-market-performance]"));
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (loops.length && !reducedMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        video.muted = true;
        if (entry.isIntersecting && !document.hidden) video.play().catch(() => {});
        else video.pause();
      });
    }, { threshold: 0.18 });
    loops.forEach((video) => observer.observe(video));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) loops.forEach((video) => video.pause());
    });
  }

  renderForecast(1);
})();
