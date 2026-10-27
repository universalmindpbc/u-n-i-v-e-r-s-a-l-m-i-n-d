(function () {
  const record = window.IAMScienceResearch;
  const tracker = document.querySelector("[data-research-tracker]");
  const methodToggle = document.querySelector("[data-method-toggle]");
  const methodPanel = document.querySelector("[data-method-panel]");
  const numberFormat = new Intl.NumberFormat("en-AU");
  const crossrefLoaded = new Set();

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function heroStudyMarkup(study) {
    const citationSlot = study.doi
      ? `<p class="hero-live-citations" data-doi="${escapeHtml(study.doi)}">Live citation count available on open</p>`
      : "";
    const subtitle = study.subtitle
      ? `<p class="hero-study-subtitle">${escapeHtml(study.subtitle)}</p>`
      : "";
    const result = study.result
      ? `<p class="hero-study-result">${escapeHtml(study.result)}</p>`
      : "";
    const sourceLabel = study.sourceLabel || "Open peer-reviewed source ↗";
    const articleClass = study.internal ? "hero-study hero-study--internal" : "hero-study";

    return `
      <article class="${articleClass}">
        <div class="hero-study-meta">
          <span>${escapeHtml(study.type)}</span>
          <span>${escapeHtml(study.year)}</span>
          <span>${escapeHtml(study.journal)}</span>
        </div>
        <h4>${escapeHtml(study.title)}</h4>
        ${subtitle}
        ${result}
        <p>${escapeHtml(study.finding)}</p>
        <p class="hero-study-limit"><strong>Limit:</strong> ${escapeHtml(study.limitation)}</p>
        ${citationSlot}
        <a href="${escapeHtml(study.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceLabel)}</a>
      </article>
    `;
  }

  function layerMarkup(layer) {
    const panelId = `research-detail-${layer.id}`;
    const statistics = layer.statistics;

    return `
      <article class="research-layer" id="research-${escapeHtml(layer.id)}" data-research-layer="${escapeHtml(layer.id)}">
        <button class="research-row-button" type="button" aria-expanded="false" aria-controls="${panelId}" data-layer-toggle="${escapeHtml(layer.id)}">
          <span class="research-layer-name"><small>${escapeHtml(layer.sequence)}</small>${escapeHtml(layer.name)}</span>
          <span class="research-position">${escapeHtml(layer.position)}</span>
          <span class="research-grade" aria-label="Grade ${escapeHtml(layer.grade)}">${escapeHtml(layer.grade)}</span>
          <span class="research-role">${escapeHtml(layer.role)}</span>
          <span class="research-evidence"><b>${numberFormat.format(statistics.publications)} publications</b><small>${numberFormat.format(statistics.journals)} journals · ${numberFormat.format(statistics.citations)} recorded citations</small></span>
          <span class="research-expand" aria-hidden="true">+</span>
        </button>

        <div class="research-detail" id="${panelId}" hidden>
          <div class="research-detail-grid">
            <div class="research-detail-summary">
              <div>
                <span class="research-dossier-label">${escapeHtml(layer.gradeLabel)} / Grade ${escapeHtml(layer.grade)}</span>
                <h3>${escapeHtml(layer.name)}</h3>
              </div>
              <p>${escapeHtml(layer.summary)}</p>
              <div class="research-boundary">
                <b>Evidence boundary</b>
                <p>${escapeHtml(layer.boundary)}</p>
              </div>
              <div>
                <span class="research-dossier-label">Universal Informatics collection</span>
                <div class="research-dossier-stats">
                  <span><b>${numberFormat.format(statistics.publications)}</b><small>publications</small></span>
                  <span><b>${numberFormat.format(statistics.journals)}</b><small>journals</small></span>
                  <span title="Historical citation counts available for ${numberFormat.format(statistics.citationCoverage)} of ${numberFormat.format(statistics.publications)} publications"><b>${numberFormat.format(statistics.citations)}</b><small>recorded citations</small></span>
                </div>
              </div>
              <p class="research-source-state">Universal Informatics · ${escapeHtml(layer.repository.collection)} research · Opens in a new tab</p>
              <div class="research-links">
                <a class="research-link" href="${escapeHtml(layer.repository.url)}" target="_blank" rel="noopener noreferrer" aria-label="Explore ${escapeHtml(layer.repository.collection)} research in Universal Informatics (opens in a new tab)">Explore research ↗</a>
              </div>
            </div>

            <div class="hero-studies">
              <span class="hero-studies-label">${escapeHtml(layer.heroStudiesLabel || "Curated hero evidence / independently refreshable")}</span>
              <div class="hero-study-list">
                ${layer.heroStudies.map(heroStudyMarkup).join("")}
              </div>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function renderTracker() {
    if (!tracker || !record?.layers?.length) return;

    tracker.innerHTML = `
      <div class="research-tracker-header" aria-hidden="true">
        <span>Research layer</span>
        <span>Current position</span>
        <span>Grade</span>
        <span>Intended role</span>
        <span>Evidence collection</span>
        <span></span>
      </div>
      ${record.layers.map(layerMarkup).join("")}
    `;

    tracker.querySelectorAll("[data-layer-toggle]").forEach((button) => {
      button.addEventListener("click", () => toggleLayer(button.dataset.layerToggle));
    });
  }

  function toggleLayer(layerId, forceOpen = false) {
    tracker?.querySelectorAll("[data-research-layer]").forEach((article) => {
      const button = article.querySelector("[data-layer-toggle]");
      const detail = article.querySelector(".research-detail");
      const shouldOpen = article.dataset.researchLayer === layerId && (forceOpen || button.getAttribute("aria-expanded") !== "true");

      article.classList.toggle("is-open", shouldOpen);
      button.setAttribute("aria-expanded", String(shouldOpen));
      detail.hidden = !shouldOpen;
    });

    const selectedLayer = record.layers.find((layer) => layer.id === layerId);
    if (selectedLayer) loadCrossrefMetadata(selectedLayer);
  }

  function openLayerFromHash() {
    const hashPrefix = "#research-";
    if (!window.location.hash.startsWith(hashPrefix)) return;
    const layerId = window.location.hash.slice(hashPrefix.length);
    if (!record?.layers?.some((layer) => layer.id === layerId)) return;

    toggleLayer(layerId, true);
    const layer = tracker?.querySelector(`[data-research-layer="${CSS.escape(layerId)}"]`);
    const button = layer?.querySelector("[data-layer-toggle]");
    window.requestAnimationFrame(() => {
      layer?.scrollIntoView({ block: "start" });
      button?.focus({ preventScroll: true });
    });
  }

  async function crossrefCitationCount(doi) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 6500);

    try {
      const endpoint = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
      const response = await fetch(endpoint, { signal: controller.signal });
      if (!response.ok) return null;
      const payload = await response.json();
      const count = Number(payload?.message?.["is-referenced-by-count"]);
      return Number.isFinite(count) ? count : null;
    } catch {
      return null;
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function loadCrossrefMetadata(layer) {
    if (crossrefLoaded.has(layer.id)) return;
    crossrefLoaded.add(layer.id);

    await Promise.all(layer.heroStudies.map(async (study) => {
      if (!study.doi) return;
      const target = document.querySelector(`[data-research-layer="${layer.id}"] [data-doi="${CSS.escape(study.doi)}"]`);
      const count = await crossrefCitationCount(study.doi);
      if (!target) return;
      target.textContent = count === null
        ? "Live Crossref citation count unavailable"
        : `${numberFormat.format(count)} current Crossref citations`;
    }));
  }

  function bindMethod() {
    if (!methodToggle || !methodPanel) return;
    methodToggle.addEventListener("click", () => {
      const open = methodToggle.getAttribute("aria-expanded") !== "true";
      methodToggle.setAttribute("aria-expanded", String(open));
      methodPanel.hidden = !open;
    });
  }

  renderTracker();
  bindMethod();
  openLayerFromHash();
  window.addEventListener("hashchange", openLayerFromHash);
}());
