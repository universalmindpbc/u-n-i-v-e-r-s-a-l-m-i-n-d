(() => {
  "use strict";

  const svgNamespace = "http://www.w3.org/2000/svg";
  const pieConfigs = {
    revenue: [
      { name: "AFFILIATE", start: -90, end: 30, color: "#cad11c", description: ["Luxury sales"] },
      { name: "SUBSCRIPTION", start: 30, end: 150, color: "#a93670", description: ["Government sponsoring", "at-risk communities"] },
      { name: "ADVERTS", start: 150, end: 270, color: "#6359ef", description: ["Full-page feature films"] },
    ],
    costs: [
      { name: "TALENT", start: -90, end: 30, color: "#cad11c", description: ["DJs + hosts + licensing"], percentage: "33.3%" },
      { name: "TERRITORY", start: 30, end: 150, color: "#a93670", description: ["Media distribution", "traditional + influencers"], percentage: "33.3%" },
      { name: "TECHNOLOGY", start: 150, end: 270, color: "#6359ef", description: ["Streaming + hosting", "+ management"], percentage: "33.3%" },
    ],
  };

  const makeSvgElement = (name, attributes = {}) => {
    const element = document.createElementNS(svgNamespace, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  };

  const point = (angle, radiusX, radiusY, centerY = -10) => {
    const radians = angle * Math.PI / 180;
    return { x: Math.cos(radians) * radiusX, y: centerY + Math.sin(radians) * radiusY };
  };

  const sectorPath = (startAngle, endAngle, radiusX = 252, radiusY = 184, centerY = -10) => {
    const start = point(startAngle, radiusX, radiusY, centerY);
    const end = point(endAngle, radiusX, radiusY, centerY);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M 0 ${centerY} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radiusX} ${radiusY} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
  };

  const outerWallPath = (startAngle, endAngle, depth = 25, radiusX = 252, radiusY = 184, centerY = -10) => {
    const visibleStart = Math.max(0, startAngle);
    const visibleEnd = Math.min(180, endAngle);
    if (visibleEnd <= visibleStart) return "";
    const start = point(visibleStart, radiusX, radiusY, centerY);
    const end = point(visibleEnd, radiusX, radiusY, centerY);
    const largeArc = visibleEnd - visibleStart > 180 ? 1 : 0;
    return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radiusX} ${radiusY} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} L ${end.x.toFixed(2)} ${(end.y + depth).toFixed(2)} A ${radiusX} ${radiusY} 0 ${largeArc} 0 ${start.x.toFixed(2)} ${(start.y + depth).toFixed(2)} Z`;
  };

  const shade = (hex, amount) => {
    const value = Number.parseInt(hex.replace("#", ""), 16);
    const clamp = (number) => Math.max(0, Math.min(255, number));
    const channels = [clamp((value >> 16) + amount), clamp(((value >> 8) & 255) + amount), clamp((value & 255) + amount)];
    return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  };

  function addPieDefinitions(svg, pieName, config) {
    const defs = svg.querySelector("defs");
    if (!defs) return;

    const sheen = makeSvgElement("radialGradient", { id: `${pieName}-sheen`, cx: "25%", cy: "10%", r: "92%", fx: "22%", fy: "8%" });
    sheen.append(
      makeSvgElement("stop", { offset: "0%", "stop-color": "#ffffff", "stop-opacity": ".58" }),
      makeSvgElement("stop", { offset: "26%", "stop-color": "#ffffff", "stop-opacity": ".17" }),
      makeSvgElement("stop", { offset: "68%", "stop-color": "#ffffff", "stop-opacity": ".015" }),
      makeSvgElement("stop", { offset: "100%", "stop-color": "#000000", "stop-opacity": ".24" }),
    );
    defs.append(sheen);

    config.forEach((sector, index) => {
      const topGradient = makeSvgElement("linearGradient", { id: `${pieName}-top-${index}`, x1: "0%", y1: "0%", x2: "0%", y2: "100%" });
      topGradient.append(
        makeSvgElement("stop", { offset: "0%", "stop-color": shade(sector.color, 28), "stop-opacity": ".94" }),
        makeSvgElement("stop", { offset: "55%", "stop-color": sector.color, "stop-opacity": ".88" }),
        makeSvgElement("stop", { offset: "100%", "stop-color": shade(sector.color, -26), "stop-opacity": ".9" }),
      );
      defs.append(topGradient);
      const wallGradient = makeSvgElement("linearGradient", { id: `${pieName}-wall-${index}`, x1: "0%", y1: "0%", x2: "0%", y2: "100%" });
      wallGradient.append(makeSvgElement("stop", { offset: "0%", "stop-color": shade(sector.color, -18) }), makeSvgElement("stop", { offset: "100%", "stop-color": shade(sector.color, -58) }));
      defs.append(wallGradient);
    });
  }

  function buildDimensionalPie(figure) {
    const svg = figure.querySelector("svg");
    const pieName = figure.dataset.dimensionalPie;
    const config = pieConfigs[pieName];
    if (!svg || !config) return;

    addPieDefinitions(svg, pieName, config);
    const wallLayer = svg.querySelector("[data-pie-walls]");
    const faceLayer = svg.querySelector("[data-pie-faces]");
    const gridLayer = svg.querySelector("[data-pie-grid]");
    const labelLayer = svg.querySelector("[data-pie-labels]");
    if (!wallLayer || !faceLayer || !gridLayer || !labelLayer) return;

    config.forEach((sector, index) => {
      const wallPath = outerWallPath(sector.start, sector.end);
      if (wallPath) wallLayer.append(makeSvgElement("path", { class: "pie-wall", d: wallPath, fill: `url(#${pieName}-wall-${index})` }));

      const group = makeSvgElement("g", { class: "pie-sector", tabindex: "0", role: "img", "aria-label": `${sector.name}. ${sector.description.join(" ")}${sector.percentage ? `. ${sector.percentage}` : ""}` });
      const path = sectorPath(sector.start, sector.end);
      group.append(makeSvgElement("path", { class: "pie-sector__face", d: path, fill: `url(#${pieName}-top-${index})` }), makeSvgElement("path", { class: "pie-sector__sheen", d: path, fill: `url(#${pieName}-sheen)` }));
      faceLayer.append(group);

      const midpoint = (sector.start + sector.end) / 2;
      const labelPoint = point(midpoint, 147, 106, -10);
      const titleOffset = sector.description.length > 1 ? -26 : -15;
      const text = makeSvgElement("text", { class: "pie-label", x: labelPoint.x.toFixed(2), y: (labelPoint.y + titleOffset).toFixed(2) });
      const title = makeSvgElement("tspan", { class: "pie-label__title", x: labelPoint.x.toFixed(2), dy: "0" });
      title.textContent = sector.name;
      text.append(title);
      sector.description.forEach((line, lineIndex) => {
        const copy = makeSvgElement("tspan", { class: "pie-label__copy", x: labelPoint.x.toFixed(2), dy: lineIndex === 0 ? "25" : "18" });
        copy.textContent = line;
        text.append(copy);
      });
      if (sector.percentage) {
        const percentage = makeSvgElement("tspan", { class: "pie-label__percentage", x: labelPoint.x.toFixed(2), dy: "28" });
        percentage.textContent = sector.percentage;
        text.append(percentage);
      }
      labelLayer.append(text);
    });

    [62, 112, 162, 214].forEach((radius) => gridLayer.append(makeSvgElement("ellipse", { class: "pie-grid-ring", cx: "0", cy: "-10", rx: radius, ry: (radius * .73).toFixed(2) })));
    for (let angle = 0; angle < 360; angle += 30) {
      const start = point(angle, 42, 30.7, -10);
      const end = point(angle, 244, 178, -10);
      gridLayer.append(makeSvgElement("line", { class: "pie-grid-line", x1: start.x.toFixed(2), y1: start.y.toFixed(2), x2: end.x.toFixed(2), y2: end.y.toFixed(2) }));
    }
  }

  document.querySelectorAll("[data-dimensional-pie]").forEach(buildDimensionalPie);

  const scales = [1_000, 10_000, 100_000, 1_000_000, 10_000_000];
  const exactUsd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 });
  const compactUsd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", notation: "compact", maximumFractionDigits: 2 });
  const usd = (value) => `US${exactUsd.format(value)}`;
  const compact = (value) => `US${compactUsd.format(value)}`;
  const setText = (selector, value) => document.querySelectorAll(selector).forEach((element) => { element.textContent = value; });
  const viewerSelects = Array.from(document.querySelectorAll("[data-viewer-select]"));

  function renderForecast(index) {
    const scaleIndex = Math.max(0, Math.min(scales.length - 1, Number(index) || 0));
    const viewers = scales[scaleIndex];
    const advertisingDaily = viewers * 4 * .15;
    const arcDaily = (viewers * .1 * 1_000) / 365;
    const premiumDaily = (viewers * .05 * 100) / 365;
    const affiliateDaily = viewers * .01 * 500 * .077;
    const totalDaily = advertisingDaily + arcDaily + premiumDaily + affiliateDaily;
    const totalAnnual = totalDaily * 365;
    const allocationAnnual = totalAnnual * .25;

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

  const panels = Array.from(document.querySelectorAll("[data-story-panel]"));
  const stripVideos = Array.from(document.querySelectorAll("[data-strip-performance]"));
  const stripVideosByKey = new Map(stripVideos.map((video) => [video.dataset.stripKey, video]));
  const paginationLinks = Array.from(document.querySelectorAll(".story-pagination a"));
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const pauseVideo = (video) => { try { video.pause(); } catch (_) { /* no-op */ } };
  const playVideo = (video) => {
    video.muted = true;
    if (!reducedMotion && !document.hidden) video.play().catch(() => {});
  };

  const mountStripVideos = (panel) => {
    panel.querySelectorAll("[data-strip-video]").forEach((slot) => {
      const video = stripVideosByKey.get(slot.dataset.stripVideo);
      if (video && video.parentElement !== slot) slot.prepend(video);
    });
  };

  const setActivePanel = (panel) => {
    const panelIndex = panels.indexOf(panel);
    mountStripVideos(panel);
    document.querySelectorAll(".information-drawer[open]").forEach((details) => {
      if (!panel.contains(details)) details.open = false;
    });
    panels.forEach((candidate) => candidate.classList.toggle("is-current", candidate === panel));
    paginationLinks.forEach((link, index) => {
      const selected = index === panelIndex;
      link.classList.toggle("is-current", selected);
      if (selected) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
    stripVideos.forEach((video) => {
      if (panel.contains(video)) playVideo(video); else pauseVideo(video);
    });
  };

  stripVideos.forEach((video) => { video.muted = true; });
  if (panels.length && "IntersectionObserver" in window) {
    const panelObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.intersectionRatio >= .34) setActivePanel(visible.target);
    }, { threshold: [.34, .5, .66] });
    panels.forEach((panel) => panelObserver.observe(panel));
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stripVideos.forEach(pauseVideo);
      return;
    }
    const currentPanel = panels.find((panel) => panel.classList.contains("is-current")) || panels[0];
    if (currentPanel) setActivePanel(currentPanel);
  });

  const informationDrawers = Array.from(document.querySelectorAll(".information-drawer"));
  const closeInformationDrawer = (details, restoreFocus = true) => {
    if (!details?.open) return;
    details.open = false;
    if (restoreFocus) window.requestAnimationFrame(() => details.querySelector("summary")?.focus({ preventScroll: true }));
  };

  informationDrawers.forEach((details, index) => {
    const summary = details.querySelector("summary");
    const panel = details.querySelector(".information-drawer__panel");
    const heading = panel?.querySelector("h3");
    if (!summary || !panel || !heading) return;

    heading.id ||= `information-drawer-title-${index + 1}`;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-labelledby", heading.id);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "information-drawer__close";
    closeButton.textContent = "Close";
    closeButton.setAttribute("aria-label", `Close ${heading.textContent.trim()}`);
    panel.prepend(closeButton);

    closeButton.addEventListener("click", () => closeInformationDrawer(details));
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      informationDrawers.forEach((candidate) => { if (candidate !== details) candidate.open = false; });
      window.requestAnimationFrame(() => closeButton.focus({ preventScroll: true }));
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const openDrawer = informationDrawers.find((details) => details.open);
    if (!openDrawer) return;
    event.preventDefault();
    closeInformationDrawer(openDrawer);
  });

  document.addEventListener("pointerdown", (event) => {
    informationDrawers.forEach((details) => {
      if (details.open && !details.contains(event.target)) closeInformationDrawer(details, false);
    });
  });

  if (panels[0]) setActivePanel(panels[0]);
})();
