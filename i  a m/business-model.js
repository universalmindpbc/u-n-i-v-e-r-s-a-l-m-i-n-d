(() => {
  const svgNamespace = "http://www.w3.org/2000/svg";

  const pieConfigs = {
    revenue: [
      { name: "ADVERTS", start: 150, end: 270, color: "#5649e8", description: ["Full page", "feature films"] },
      { name: "AFFILIATE", start: -90, end: 30, color: "#c8cf15", description: ["Luxury sales"] },
      { name: "SUBSCRIPTION", start: 30, end: 150, color: "#91375d", description: ["Government sponsoring", "at-risk communities"] },
    ],
    costs: [
      { name: "TECHNOLOGY", start: 150, end: 270, color: "#5649e8", description: ["Streaming + Hosting + Management"], percentage: "33.3%" },
      { name: "TALENT", start: -90, end: 30, color: "#c8cf15", description: ["DJs + Hosts + Licensing"], percentage: "33.3%" },
      { name: "TERRITORY", start: 30, end: 150, color: "#91375d", description: ["Media Distribution", "Traditional + Influencers"], percentage: "33.3%" },
    ],
  };

  const makeSvgElement = (name, attributes = {}) => {
    const element = document.createElementNS(svgNamespace, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  };

  const point = (angle, radiusX, radiusY, centerY = -18) => {
    const radians = angle * Math.PI / 180;
    return {
      x: Math.cos(radians) * radiusX,
      y: centerY + Math.sin(radians) * radiusY,
    };
  };

  const sectorPath = (startAngle, endAngle, radiusX = 242, radiusY = 176, centerY = -18) => {
    const start = point(startAngle, radiusX, radiusY, centerY);
    const end = point(endAngle, radiusX, radiusY, centerY);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M 0 ${centerY} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radiusX} ${radiusY} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
  };

  const outerWallPath = (startAngle, endAngle, depth = 34, radiusX = 242, radiusY = 176, centerY = -18) => {
    const visibleStart = Math.max(0, startAngle);
    const visibleEnd = Math.min(180, endAngle);
    if (visibleEnd <= visibleStart) return "";
    const start = point(visibleStart, radiusX, radiusY, centerY);
    const end = point(visibleEnd, radiusX, radiusY, centerY);
    const largeArc = visibleEnd - visibleStart > 180 ? 1 : 0;
    return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radiusX} ${radiusY} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} L ${end.x.toFixed(2)} ${(end.y + depth).toFixed(2)} A ${radiusX} ${radiusY} 0 ${largeArc} 0 ${start.x.toFixed(2)} ${(start.y + depth).toFixed(2)} Z`;
  };

  const shade = (hex, amount) => {
    const raw = hex.replace("#", "");
    const value = Number.parseInt(raw, 16);
    const clamp = (number) => Math.max(0, Math.min(255, number));
    const red = clamp((value >> 16) + amount);
    const green = clamp(((value >> 8) & 255) + amount);
    const blue = clamp((value & 255) + amount);
    return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  };

  function addPieDefinitions(svg, pieName, config) {
    const defs = svg.querySelector("defs");
    if (!defs) return;

    const surfaceFilter = makeSvgElement("filter", {
      id: `${pieName}-surface`, x: "-20%", y: "-24%", width: "140%", height: "160%", "color-interpolation-filters": "sRGB",
    });
    surfaceFilter.append(makeSvgElement("feTurbulence", { type: "fractalNoise", baseFrequency: "0.008 0.018", numOctaves: "2", seed: pieName === "revenue" ? "17" : "29", result: "surfaceNoise" }));
    surfaceFilter.append(makeSvgElement("feDisplacementMap", { in: "SourceGraphic", in2: "surfaceNoise", scale: "1.6", xChannelSelector: "R", yChannelSelector: "G", result: "refracted" }));
    const lighting = makeSvgElement("feSpecularLighting", { in: "SourceAlpha", surfaceScale: "8", specularConstant: "0.42", specularExponent: "34", "lighting-color": "#ffffff", result: "specular" });
    lighting.append(makeSvgElement("fePointLight", { x: "-190", y: "-230", z: "310" }));
    surfaceFilter.append(lighting);
    surfaceFilter.append(makeSvgElement("feComposite", { in: "specular", in2: "SourceAlpha", operator: "in", result: "specularCut" }));
    surfaceFilter.append(makeSvgElement("feBlend", { in: "refracted", in2: "specularCut", mode: "screen" }));
    defs.append(surfaceFilter);

    const glowFilter = makeSvgElement("filter", { id: `${pieName}-glow`, x: "-60%", y: "-60%", width: "220%", height: "220%" });
    glowFilter.append(makeSvgElement("feGaussianBlur", { stdDeviation: "9", result: "blur" }));
    const glowMerge = makeSvgElement("feMerge");
    glowMerge.append(makeSvgElement("feMergeNode", { in: "blur" }), makeSvgElement("feMergeNode", { in: "SourceGraphic" }));
    glowFilter.append(glowMerge);
    defs.append(glowFilter);

    const sheen = makeSvgElement("radialGradient", { id: `${pieName}-sheen`, cx: "25%", cy: "8%", r: "92%", fx: "22%", fy: "5%" });
    sheen.append(
      makeSvgElement("stop", { offset: "0%", "stop-color": "#ffffff", "stop-opacity": "0.68" }),
      makeSvgElement("stop", { offset: "24%", "stop-color": "#ffffff", "stop-opacity": "0.2" }),
      makeSvgElement("stop", { offset: "63%", "stop-color": "#ffffff", "stop-opacity": "0.02" }),
      makeSvgElement("stop", { offset: "100%", "stop-color": "#000000", "stop-opacity": "0.38" }),
    );
    defs.append(sheen);

    config.forEach((sector, index) => {
      const topGradient = makeSvgElement("linearGradient", { id: `${pieName}-top-${index}`, x1: "0%", y1: "0%", x2: "0%", y2: "100%" });
      topGradient.append(
        makeSvgElement("stop", { offset: "0%", "stop-color": shade(sector.color, 44) }),
        makeSvgElement("stop", { offset: "48%", "stop-color": sector.color }),
        makeSvgElement("stop", { offset: "100%", "stop-color": shade(sector.color, -34) }),
      );
      defs.append(topGradient);

      const wallGradient = makeSvgElement("linearGradient", { id: `${pieName}-wall-${index}`, x1: "0%", y1: "0%", x2: "0%", y2: "100%" });
      wallGradient.append(
        makeSvgElement("stop", { offset: "0%", "stop-color": shade(sector.color, -26) }),
        makeSvgElement("stop", { offset: "100%", "stop-color": shade(sector.color, -72) }),
      );
      defs.append(wallGradient);
    });
  }

  function buildDimensionalPie(figure) {
    const svg = figure.querySelector("svg");
    const pieName = figure.dataset.dimensionalPie;
    const config = pieConfigs[pieName];
    if (!svg || !config) return;

    addPieDefinitions(svg, pieName, config);
    const shadowLayer = svg.querySelector("[data-pie-shadow]");
    const wallLayer = svg.querySelector("[data-pie-walls]");
    const faceLayer = svg.querySelector("[data-pie-faces]");
    const gridLayer = svg.querySelector("[data-pie-grid]");
    const signalLayer = svg.querySelector("[data-pie-signal]");
    const labelLayer = svg.querySelector("[data-pie-labels]");
    if (!shadowLayer || !wallLayer || !faceLayer || !gridLayer || !signalLayer || !labelLayer) return;

    shadowLayer.append(makeSvgElement("ellipse", { class: "pie-floor-shadow", cx: "0", cy: "180", rx: "255", ry: "64" }));

    config.forEach((sector, index) => {
      const wallPath = outerWallPath(sector.start, sector.end);
      if (wallPath) wallLayer.append(makeSvgElement("path", { class: "pie-wall", d: wallPath, fill: `url(#${pieName}-wall-${index})`, "data-pie-index": index }));

      const group = makeSvgElement("g", {
        class: "pie-sector", tabindex: "0", role: "button", "aria-label": `${sector.name}. ${sector.description.join(" ")}${sector.percentage ? `. ${sector.percentage}` : ""}`, "data-pie-index": index,
      });
      const path = sectorPath(sector.start, sector.end);
      group.append(
        makeSvgElement("path", { class: "pie-sector__face", d: path, fill: `url(#${pieName}-top-${index})`, filter: `url(#${pieName}-surface)` }),
        makeSvgElement("path", { class: "pie-sector__sheen", d: path, fill: `url(#${pieName}-sheen)` }),
      );
      faceLayer.append(group);

      const midpoint = (sector.start + sector.end) / 2;
      const labelPoint = point(midpoint, 146, 111, -18);
      const text = makeSvgElement("text", { class: "pie-label", x: labelPoint.x.toFixed(2), y: (labelPoint.y - 14).toFixed(2), "data-pie-index": index });
      const title = makeSvgElement("tspan", { class: "pie-label__title", x: labelPoint.x.toFixed(2), dy: "0" });
      title.textContent = sector.name;
      text.append(title);
      sector.description.forEach((line, lineIndex) => {
        const copy = makeSvgElement("tspan", { class: "pie-label__copy", x: labelPoint.x.toFixed(2), dy: lineIndex === 0 ? "23" : "16" });
        copy.textContent = line;
        text.append(copy);
      });
      if (sector.percentage) {
        const percentage = makeSvgElement("tspan", { class: "pie-label__percentage", x: labelPoint.x.toFixed(2), dy: "25" });
        percentage.textContent = sector.percentage;
        text.append(percentage);
      }
      labelLayer.append(text);
    });

    [58, 105, 153, 205].forEach((radius) => {
      gridLayer.append(makeSvgElement("ellipse", { class: "pie-grid-ring", cx: "0", cy: "-18", rx: radius, ry: (radius * 0.727).toFixed(2) }));
    });
    for (let angle = 0; angle < 360; angle += 30) {
      const end = point(angle, 234, 170, -18);
      gridLayer.append(makeSvgElement("line", { class: "pie-grid-line", x1: "0", y1: "-18", x2: end.x.toFixed(2), y2: end.y.toFixed(2) }));
    }

    const traceValues = pieName === "revenue" ? [[206, 137], [-25, 184], [91, 145]] : [[211, 176], [-31, 139], [94, 194]];
    const tracePoints = traceValues.map(([angle, radius]) => point(angle, radius, radius * 0.727, -18));
    signalLayer.append(makeSvgElement("polyline", { class: "pie-signal-line", points: tracePoints.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ") }));
    tracePoints.forEach(({ x, y }, index) => signalLayer.append(makeSvgElement("circle", { class: "pie-signal-node", cx: x.toFixed(2), cy: y.toFixed(2), r: index === 1 ? "6" : "4.5", filter: `url(#${pieName}-glow)` })));
    signalLayer.append(makeSvgElement("ellipse", { class: "pie-core", cx: "0", cy: "-18", rx: "31", ry: "23" }));
    signalLayer.append(makeSvgElement("path", { class: "pie-core-mark", d: "M -14 -18 L 0 -30 L 14 -18 L 0 -6 Z M -14 -18 L 0 -6 L 0 9 M 14 -18 L 0 9" }));

    const groups = Array.from(faceLayer.querySelectorAll(".pie-sector"));
    const labels = Array.from(labelLayer.querySelectorAll(".pie-label"));
    let pinned = null;
    const setActive = (active) => {
      figure.classList.toggle("has-active-sector", Boolean(active));
      groups.forEach((group, index) => {
        const selected = group === active;
        group.classList.toggle("is-active", selected);
        labels[index]?.classList.toggle("is-active", selected);
        group.setAttribute("aria-pressed", String(group === pinned));
      });
    };
    groups.forEach((group) => {
      group.addEventListener("pointerenter", () => setActive(group));
      group.addEventListener("pointerleave", () => setActive(pinned));
      group.addEventListener("focus", () => setActive(group));
      group.addEventListener("blur", () => setActive(pinned));
      const toggle = () => {
        pinned = pinned === group ? null : group;
        setActive(pinned);
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

  document.querySelectorAll("[data-dimensional-pie]").forEach(buildDimensionalPie);

  const scales = [
    { viewers: 1_000, label: "1K" },
    { viewers: 10_000, label: "10K" },
    { viewers: 100_000, label: "100K" },
    { viewers: 1_000_000, label: "1M" },
    { viewers: 10_000_000, label: "10M" },
  ];

  const exactUsd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 });
  const compactUsd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", notation: "compact", maximumFractionDigits: 2 });
  const usd = (value) => `US${exactUsd.format(value)}`;
  const compact = (value) => `US${compactUsd.format(value)}`;
  const setText = (selector, value) => document.querySelectorAll(selector).forEach((element) => { element.textContent = value; });
  const viewerSelects = Array.from(document.querySelectorAll("[data-viewer-select]"));

  function renderForecast(index) {
    const scaleIndex = Math.max(0, Math.min(scales.length - 1, Number(index) || 0));
    const { viewers } = scales[scaleIndex];
    const advertisingDaily = viewers * 4 * 0.15;
    const arcDaily = (viewers * 0.1 * 1_000) / 365;
    const premiumDaily = (viewers * 0.05 * 100) / 365;
    const affiliateDaily = viewers * 0.01 * 500 * 0.077;
    const totalDaily = advertisingDaily + arcDaily + premiumDaily + affiliateDaily;
    const totalAnnual = totalDaily * 365;
    const allocationAnnual = totalAnnual * 0.25;

    viewerSelects.forEach((select) => { select.value = String(scaleIndex); });
    setText("[data-allocation-result]", compact(allocationAnnual));
    setText("[data-allocation-line]", `${compact(allocationAnnual)} / annum`);
    setText("[data-ads-daily]", `${usd(advertisingDaily)} / day`);
    setText("[data-arc-daily]", `${usd(arcDaily)} / day`);
    setText("[data-premium-daily]", `${usd(premiumDaily)} / day`);
    setText("[data-affiliate-daily]", `${usd(affiliateDaily)} / day`);
    setText("[data-total-daily]", `${usd(totalDaily)} / day`);
    setText("[data-total-annual]", `${compact(totalAnnual)} / annum`);
    document.body.dataset.viewerScale = String(scaleIndex);
  }

  viewerSelects.forEach((select) => select.addEventListener("change", (event) => renderForecast(event.currentTarget.value)));
  renderForecast(1);

  const reachEntries = [
    { name: "VOGUE", value: 73.1, label: "73.1M", color: "#ffffff" },
    { name: "RIHANNA", value: 211.3, label: "211.3M", color: "#cfdb17" },
    { name: "DUA LIPA", value: 113.8, label: "113.8M", color: "#e48a61" },
    { name: "SKRILLEX", value: 38, label: "38M", color: "#7e72ff" },
    { name: "CHARLI XCX", value: 19.5, label: "19.5M", color: "#d85f95" },
    { name: "FRED AGAIN..", value: 8, label: "8M", color: "#d8ff42" },
    { name: "SOLANGE", value: 7.4, label: "7.4M", color: "#f0b96e" },
    { name: "BJÖRK", value: 4.3, label: "4.3M", color: "#ab98ff" },
    { name: "FLUME", value: 4.2, label: "4.2M", color: "#73d8ff" },
    { name: "CARL COX", value: 3, label: "3M", color: "#ff6b6b" },
    { name: "ALISON WONDERLAND", value: 1.8, label: "1.8M", color: "#d7b4ff" },
    { name: "FLYING LOTUS", value: 1.5, label: "1.5M", color: "#8bf0ca" },
    { name: "BRIAN ENO", value: 1.1, label: "1.1M", color: "#d6d6d6" },
    { name: "SAMPA THE GREAT", value: 0.8, label: "0.8M", color: "#ffb36e" },
    { name: "RICARDO VILLALOBOS", value: 0.6, label: "0.6M", color: "#d8ff42" },
  ];

  function buildReachNetwork(svg) {
    const defs = svg.querySelector("defs");
    const linkLayer = svg.querySelector("[data-reach-links]");
    const nodeLayer = svg.querySelector("[data-reach-nodes]");
    if (!defs || !linkLayer || !nodeLayer) return;

    const glow = makeSvgElement("filter", { id: "reach-node-glow", x: "-70%", y: "-70%", width: "240%", height: "240%" });
    glow.append(makeSvgElement("feGaussianBlur", { stdDeviation: "7", result: "blur" }));
    const merge = makeSvgElement("feMerge");
    merge.append(makeSvgElement("feMergeNode", { in: "blur" }), makeSvgElement("feMergeNode", { in: "SourceGraphic" }));
    glow.append(merge);
    defs.append(glow);

    const center = { x: 450, y: 260 };
    reachEntries.forEach((entry, index) => {
      const ring = index % 2 === 0 ? { x: 330, y: 205 } : { x: 245, y: 155 };
      const ringIndex = Math.floor(index / 2);
      const ringCount = index % 2 === 0 ? Math.ceil(reachEntries.length / 2) : Math.floor(reachEntries.length / 2);
      const angle = (-90 + (360 / ringCount) * ringIndex + (index % 2 ? 23 : 0)) * Math.PI / 180;
      entry.x = center.x + Math.cos(angle) * ring.x;
      entry.y = center.y + Math.sin(angle) * ring.y;
      entry.radius = 13 + Math.sqrt(entry.value / 211.3) * 34;

      linkLayer.append(makeSvgElement("line", { class: "reach-link", x1: center.x, y1: center.y, x2: entry.x.toFixed(2), y2: entry.y.toFixed(2) }));
    });

    nodeLayer.append(makeSvgElement("circle", { class: "reach-core-ring reach-core-ring--outer", cx: center.x, cy: center.y, r: "73" }));
    nodeLayer.append(makeSvgElement("circle", { class: "reach-core-ring", cx: center.x, cy: center.y, r: "51" }));
    const coreText = makeSvgElement("text", { class: "reach-core-label", x: center.x, y: center.y - 4 });
    const coreTitle = makeSvgElement("tspan", { x: center.x, dy: "0" });
    coreTitle.textContent = "UNIVERSAL MIND";
    const coreCopy = makeSvgElement("tspan", { x: center.x, dy: "20" });
    coreCopy.textContent = "MEDIA NETWORK";
    coreText.append(coreTitle, coreCopy);
    nodeLayer.append(coreText);

    reachEntries.forEach((entry, index) => {
      const group = makeSvgElement("g", { class: "reach-node", tabindex: "0", role: "button", "aria-label": `${entry.name}, ${entry.label}`, transform: `translate(${entry.x.toFixed(2)} ${entry.y.toFixed(2)})`, "data-reach-index": index });
      group.style.setProperty("--reach-color", entry.color);
      group.append(makeSvgElement("circle", { class: "reach-node__halo", r: (entry.radius + 8).toFixed(2) }));
      group.append(makeSvgElement("circle", { class: "reach-node__disc", r: entry.radius.toFixed(2), filter: "url(#reach-node-glow)" }));
      const label = makeSvgElement("text", { class: "reach-node__label", x: "0", y: (entry.radius + 15).toFixed(2) });
      const name = makeSvgElement("tspan", { x: "0", dy: "0" });
      name.textContent = entry.name;
      const value = makeSvgElement("tspan", { class: "reach-node__value", x: "0", dy: "14" });
      value.textContent = entry.label;
      label.append(name, value);
      group.append(label);
      nodeLayer.append(group);
    });
  }

  document.querySelectorAll("[data-reach-network]").forEach(buildReachNetwork);

  const panels = Array.from(document.querySelectorAll("[data-story-panel]"));
  const reelVideos = Array.from(document.querySelectorAll("[data-reel-video]"));
  const stripVideos = Array.from(document.querySelectorAll("[data-strip-performance]"));
  const paginationLinks = Array.from(document.querySelectorAll(".story-pagination a"));
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let activeReel = "dua";

  const pauseVideo = (video) => {
    try { video.pause(); } catch (_) { /* no-op */ }
  };
  const playVideo = (video) => {
    video.muted = true;
    if (!reducedMotion && !document.hidden) video.play().catch(() => {});
  };
  const setActivePanel = (panel) => {
    const panelIndex = panels.indexOf(panel);
    activeReel = panel.dataset.reel || "dua";
    panels.forEach((candidate) => candidate.classList.toggle("is-current", candidate === panel));
    paginationLinks.forEach((link, index) => {
      const selected = index === panelIndex;
      link.classList.toggle("is-current", selected);
      if (selected) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
    reelVideos.forEach((video) => {
      const active = video.dataset.reelVideo === activeReel;
      video.classList.toggle("is-active", active);
      if (active) playVideo(video);
      else pauseVideo(video);
    });
    if (panel.classList.contains("market-panel")) stripVideos.forEach(playVideo);
    else stripVideos.forEach(pauseVideo);
  };

  reelVideos.concat(stripVideos).forEach((video) => { video.muted = true; });
  if (panels.length && "IntersectionObserver" in window) {
    const panelObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.intersectionRatio >= 0.34) setActivePanel(visible.target);
    }, { threshold: [0.34, 0.5, 0.66] });
    panels.forEach((panel) => panelObserver.observe(panel));
  } else if (panels[0]) {
    setActivePanel(panels[0]);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      reelVideos.concat(stripVideos).forEach(pauseVideo);
      return;
    }
    const currentPanel = panels.find((panel) => panel.classList.contains("is-current")) || panels[0];
    if (currentPanel) setActivePanel(currentPanel);
  });

  document.querySelectorAll(".calculation-note, .market-methodology").forEach((details) => {
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      document.querySelectorAll(".calculation-note[open], .market-methodology[open]").forEach((candidate) => {
        if (candidate !== details) candidate.open = false;
      });
    });
  });

  if (panels[0]) setActivePanel(panels[0]);
})();
