(function () {
  const record = window.IAMScienceResearch;
  const tracker = document.querySelector("[data-research-tracker]");
  const liveStatus = document.querySelector("[data-live-status]");
  const liveCount = document.querySelector("[data-live-count]");
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

  function formatBytes(bytes) {
    const size = Number(bytes);
    if (!Number.isFinite(size) || size <= 0) return "";
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(size / 1024)} KB`;
  }

  function heroStudyMarkup(study) {
    const citationSlot = study.doi
      ? `<p class="hero-live-citations" data-doi="${escapeHtml(study.doi)}">Live citation count available on open</p>`
      : "";

    return `
      <article class="hero-study">
        <div class="hero-study-meta">
          <span>${escapeHtml(study.type)}</span>
          <span>${escapeHtml(study.year)}</span>
          <span>${escapeHtml(study.journal)}</span>
        </div>
        <h4>${escapeHtml(study.title)}</h4>
        <p>${escapeHtml(study.finding)}</p>
        <p class="hero-study-limit"><strong>Limit:</strong> ${escapeHtml(study.limitation)}</p>
        ${citationSlot}
        <a href="${escapeHtml(study.url)}" target="_blank" rel="noopener noreferrer">Open peer-reviewed source ↗</a>
      </article>
    `;
  }

  function layerMarkup(layer) {
    const panelId = `research-detail-${layer.id}`;
    const dossier = layer.dossier;

    return `
      <article class="research-layer" data-research-layer="${escapeHtml(layer.id)}">
        <button class="research-row-button" type="button" aria-expanded="false" aria-controls="${panelId}" data-layer-toggle="${escapeHtml(layer.id)}">
          <span class="research-layer-name"><small>${escapeHtml(layer.sequence)}</small>${escapeHtml(layer.name)}</span>
          <span class="research-position">${escapeHtml(layer.position)}</span>
          <span class="research-grade" aria-label="Grade ${escapeHtml(layer.grade)}">${escapeHtml(layer.grade)}</span>
          <span class="research-role">${escapeHtml(layer.role)}</span>
          <span class="research-evidence"><b>${numberFormat.format(dossier.publications)} publications</b><small>${numberFormat.format(dossier.citations)} citations catalogued in 2022 dossier</small></span>
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
                <span class="research-dossier-label">Original 2022 source collection</span>
                <div class="research-dossier-stats">
                  <span><b>${numberFormat.format(dossier.articles)}</b><small>articles catalogued</small></span>
                  <span><b>${numberFormat.format(dossier.publications)}</b><small>publications catalogued</small></span>
                  <span><b>${numberFormat.format(dossier.citations)}</b><small>citations stated</small></span>
                  <span><b>${numberFormat.format(dossier.pages)}</b><small>PDF pages</small></span>
                </div>
              </div>
              <p class="research-source-state" data-source-state="${escapeHtml(layer.id)}">Checking PDF source…</p>
              <div class="research-links">
                <a class="research-link" href="${escapeHtml(dossier.file)}" target="_blank" rel="noopener">Open dossier ↗</a>
                <a class="research-link" href="${escapeHtml(dossier.file)}" download>Download PDF ↓</a>
              </div>
            </div>

            <div class="hero-studies">
              <span class="hero-studies-label">Curated hero evidence / independently refreshable</span>
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

  function toggleLayer(layerId) {
    tracker?.querySelectorAll("[data-research-layer]").forEach((article) => {
      const button = article.querySelector("[data-layer-toggle]");
      const detail = article.querySelector(".research-detail");
      const shouldOpen = article.dataset.researchLayer === layerId && button.getAttribute("aria-expanded") !== "true";

      article.classList.toggle("is-open", shouldOpen);
      button.setAttribute("aria-expanded", String(shouldOpen));
      detail.hidden = !shouldOpen;
    });

    const selectedLayer = record.layers.find((layer) => layer.id === layerId);
    if (selectedLayer) loadCrossrefMetadata(selectedLayer);
  }

  async function headSource(layer) {
    const sourceState = document.querySelector(`[data-source-state="${layer.id}"]`);

    try {
      const response = await fetch(layer.dossier.file, { method: "HEAD", cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const size = formatBytes(response.headers.get("content-length"));
      const modifiedHeader = response.headers.get("last-modified");
      const modified = modifiedHeader
        ? new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(modifiedHeader))
        : "source verified";
      if (sourceState) sourceState.textContent = `PDF online${size ? ` · ${size}` : ""} · ${modified}`;
      return true;
    } catch {
      if (sourceState) sourceState.textContent = "PDF source check pending · download link retained";
      return false;
    }
  }

  async function verifySources() {
    if (!record?.layers?.length) return;
    const results = await Promise.all(record.layers.map(headSource));
    const online = results.filter(Boolean).length;
    if (liveCount) liveCount.textContent = `${online} / ${record.layers.length} online`;
    if (liveStatus) liveStatus.textContent = online === record.layers.length ? "All source dossiers verified" : "Source verification incomplete";
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

  function bindEmbeddedHome() {
    if (window.self === window.top) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("adaptiveFrame") !== "1" && params.get("musicTelevisionFrame") !== "1") return;

    document.addEventListener("click", (event) => {
      const homeLink = event.target.closest('a[data-nav-item="home"], a.global-nav-brand, a.science-brand');
      if (!homeLink) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      window.top.postMessage({ type: "iam:return-to-television" }, window.location.origin);
    }, true);
  }

  renderTracker();
  bindMethod();
  bindEmbeddedHome();
  verifySources();
}());
