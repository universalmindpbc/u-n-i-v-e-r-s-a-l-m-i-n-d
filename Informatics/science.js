'use strict';

// One literature collection, with distinct reading and visual entry points.
(() => {
  const cards = [
    {
      id: 'alpha', label: 'Alpha', theme: 'Circadian regulation', title: 'How cells keep time',
      image: 'alpha-circadian-v1.png', color: '#91b9d4',
      alt: 'Three panels connect a roughly daily rhythm, cellular feedback and changes in cell responses over time.',
      idea: 'Circadian rhythms are biological cycles lasting about a day. Feedback within cellular clocks helps coordinate changes in gene activity and cellular responses. Period describes how long a cycle takes; phase describes a position within that cycle.',
      citation: 'Duong et al. · Molecular Metabolism · 2026 (online 2025)',
      paper: 'Circadian regulation of oxytocin-receptor expression and responsiveness',
      doi: '10.1016/j.molmet.2025.102269',
      methods: 'Mouse experiments, cellular assays and retrospective human records.',
      finding: 'The study connects the clock regulator BMAL1 with oxytocin-receptor expression and oxytocin responsiveness in uterine experimental systems.',
      limit: 'The mouse and cellular experiments offer mechanistic evidence in specific tissues and conditions. The human-record analysis is observational and susceptible to confounding; it does not establish a clinical timing recommendation.',
      question: 'Does Alpha’s recurrence structure offer useful descriptions of timing in OXTR expression and responsiveness when compared with measured rhythms and existing clock models?',
      distinction: 'M9 Alpha has 24 positions. A 24-position mathematical cycle has no time unit until a biological mapping is defined and tested.',
      category: 'Creates cellular life', range: 'High · 8–10',
      rationale: 'Circadian regulation is included among primary cellular functions in the project’s framework.',
      visualNote: 'Conceptual overview. The waveform is illustrative; the clock does not assert an exact period for every organism or cell.',
      panels: ['A roughly daily cycle provides a way to describe biological timing.', 'Feedback in cellular clocks coordinates recurring changes in gene activity.', 'Cellular responses to a signal can vary with biological timing.']
    },
    {
      id: 'beta', label: 'Beta', theme: 'Cellular proliferation', title: 'How one cell becomes two',
      image: 'beta-cell-division-v1.png', color: '#e3b78c',
      alt: 'DNA is copied before mitosis, chromosome copies separate, and cytokinesis produces two daughter cells.',
      idea: 'A dividing cell first copies its DNA. Mitosis separates the chromosome copies, and cytokinesis divides the cell into two daughter cells. Repeated division supports tissue growth and renewal.',
      citation: 'Wasserman et al. · Frontiers in Cell and Developmental Biology · 2022',
      paper: 'Oxytocin signalling and epicardial-cell proliferation',
      doi: '10.3389/fcell.2022.985298',
      methods: 'Human stem-cell-derived epicardial cells, OXTR knockdown and zebrafish experiments.',
      finding: 'Researchers observed oxytocin-related proliferation in human stem-cell-derived epicardial cells. Reducing OXTR expression removed the measured proliferative response.',
      limit: 'These are cultured-cell and animal models. They do not establish regeneration of adult human hearts. Image fields are subsamples, distinct from independent biological experiments.',
      question: 'Do Beta’s recurrence patterns offer useful descriptions of OXTR-associated cellular division and lineage organisation beyond familiar doubling models?',
      distinction: 'M9 Beta repeats 4, 8, 7, 5, 1, 2. These are modular residues; a relationship to cell counts or division timing remains to be established.',
      category: 'Creates cellular life', range: 'High · 8–10',
      rationale: 'Cellular proliferation and division sit within the project’s highest category of potential biological relevance.',
      visualNote: 'Simplified stages of cell division. The illustration does not depict the cited experiments or a universal population-growth rate.',
      panels: ['DNA is copied before mitosis.', 'Mitosis separates the chromosome copies.', 'Cytokinesis divides the cell into two daughter cells.']
    },
    {
      id: 'gamma', label: 'Gamma', theme: 'Molecular recognition', title: 'How oxytocin binds its receptor',
      image: 'gemini-oxt-oxtr-brand-restyle-v2.png', color: '#d1a8bd',
      alt: 'Gemini Science’s complete teaching sequence: lock-and-key overview, docking into a pocket, and an illustrated aromatic stacking interaction.',
      idea: 'Molecular recognition depends on shape and chemistry. Oxytocin contacts a pocket in its receptor through several interactions that help stabilise an active receptor shape. The lock-and-key sequence offers an accessible analogy for that process.',
      citation: 'Waltenspühl et al. · Nature Communications · 2022',
      paper: 'Structural basis of oxytocin-receptor activation',
      doi: '10.1038/s41467-022-31325-0',
      methods: 'Cryo-electron microscopy of an OXT–OXTR complex, with functional assays.',
      finding: 'The structure describes contacts involving oxytocin’s Tyr2 aromatic ring, Q92, F291 and the L316 backbone. Functional assays assess the importance of particular receptor residues.',
      limit: 'The structural complex used engineered components. These structural and functional results establish receptor contacts; they do not test the Atlas’s Gamma construction.',
      question: 'Do Gamma’s spatial relationships capture reproducible features of OXT–OXTR molecular recognition across independently measured structures?',
      distinction: 'The study establishes a molecular binding example. A correspondence with Gamma remains an open research question.',
      category: 'Supports cellular life', range: 'Medium · 5–7',
      rationale: 'Molecular recognition and signalling sit within the project’s category for supporting cellular function.',
      visualNote: 'Teaching sequence by Gemini Science; approved brand restyle. Lock and key is an analogy. The illustrated Tyr–Trp stack remains a proposed contact: the cited OXT–OXTR structure reports the Tyr2 contacts described above. The aromatic ring and the larger peptide loop are distinct structures.',
      panels: ['Overview: oxytocin is the key and the receptor’s binding pocket is the lock.', 'Docking: the illustration places an aromatic ring within the pocket.', 'Stabilisation: the stacked-ring close-up explains the proposed interaction and the importance of the aromatic ring. Read the source note alongside this conceptual illustration.']
    },
    {
      id: 'epsilon', label: 'Epsilon', theme: 'Aromatic interactions', title: 'How aromatic rings stack',
      image: 'epsilon-aromatic-stacking-v1.png', color: '#a6c4a0',
      alt: 'An aromatic ring with conceptual electron density, an offset pair of rings, and a generic protein pocket containing aromatic groups.',
      idea: 'Aromatic rings have delocalised π electrons. Their spacing, orientation and chemical surroundings influence how they interact. Offset stacking is one arrangement; other molecular contacts also contribute.',
      citation: 'Stornaiuolo et al. · Nature Communications · 2013',
      paper: 'Aromatic ligand stacking in a protein binding pocket',
      doi: '10.1038/ncomms2900',
      methods: 'Crystallography, mutation and solution binding measurements in a molluscan acetylcholine-binding protein.',
      finding: 'Researchers observed a three-ligand aromatic stack in a protein pocket, supported by solution measurements of multiple occupancy. Four crystal binding sites contained three ligands; the fifth contained two.',
      limit: 'This is a soluble receptor-domain model, distinct from human OXTR. The structure and binding measurements do not establish every step of the binding pathway.',
      question: 'Does Epsilon offer a useful mathematical description for investigating proposed aromatic arrangements in OXT–OXTR binding?',
      distinction: 'The Epsilon traversal is a proposed mathematical comparison. Its drawn path does not establish electron motion or a molecular trajectory.',
      category: 'Supports cellular life', range: 'Medium · 5–7',
      rationale: 'Aromatic interactions sit within the project’s category for supporting molecular and cellular function.',
      visualNote: 'Generic aromatic stacking, with two rings chosen for clarity. This does not reproduce the three-ligand experiment or assert a specific OXT–OXTR stack. Electron-density shading is conceptual.',
      panels: ['An aromatic ring has delocalised π electrons.', 'Offset stacking is one possible relative arrangement of aromatic rings.', 'Protein pockets can organise aromatic groups; spacing, orientation and surrounding chemistry matter.']
    }
  ];
  const studies = window.InformaticsStudies;
  for (const card of cards) {const study = studies.find(s => s.hero === card.id); card.paper = study.title; card.citation = `${study.author} · ${study.journal} · ${study.year}`;}
  const root = new URL('.', document.currentScript.src);
  const imageURL = card => new URL('science-assets/' + card.image, root).href;
  const $ = selector => document.querySelector(selector);
  const literatureLink = card => `<a href="https://doi.org/${card.doi}" target="_blank" rel="noopener noreferrer">Read the primary paper ↗<span class="science-doi">doi:${card.doi}</span></a>`;
  const framework = `<details class="science-notes"><summary>How scientific significance is framed</summary><p>Weighted scientific significance (WSS) is a project-specific category of potential relevance if an Atlas connection is established. It is separate from evidence strength and from the probability that a connection exists.</p><ul><li><strong>Creates cellular life</strong> · High, 8–10</li><li><strong>Supports cellular life</strong> · Medium, 5–7</li><li><strong>Creates elemental life</strong> · Low, 1–4</li></ul><p>The four themes map to potential categories. Numerical WSS scores remain unassigned. “Elemental life” remains an exploratory project term requiring a defined physical interpretation.</p><p>Evidence appraisal considers methods, study system, controls, relevance, limitations and reproducibility. This first collection is a bounded editorial review of primary literature; independent subject-specialist review remains open.</p></details>`;
  const context = `<details class="science-notes"><summary>Fibonacci, φ and π · definitions and related work</summary><dl><dt>Fibonacci sequence</dt><dd>Each number is the sum of the preceding two; ratios of successive positive terms approach φ.</dd><dt>φ · Phi Ratio</dt><dd>The Phi Ratio, approximately 1.618.</dd><dt>π · pi</dt><dd>The circle constant, approximately 3.142, in geometry.</dd><dt>π-stacking</dt><dd>Interactions involving aromatic π electron systems. This use of π refers to electronic structure.</dd><dt>Pisano period</dt><dd>The repeat length of Fibonacci remainders for a chosen modulus; sometimes written π(m), a separate use of the symbol.</dd></dl><p>Our initial hypothesis concerns relationships between the nested Alpha, Beta, Gamma and Epsilon sequences and biological or molecular functions associated with OXTR. Bioinformatics and in silico modelling provide the planned means of investigation.</p><p>The Atlas examines defined patterns within modular cycles and relationships between them. Biological timing, division and molecular recognition provide contexts for testing those patterns.</p><p><a href="https://doi.org/10.1073/pnas.2016304118" target="_blank" rel="noopener noreferrer">Zhang et al. · PNAS · 2021 ↗</a> pairs microscopy and modelling of Fibonacci-pattern formation in gerbera flower heads. It offers a biological precedent for investigating how patterns arise.</p><p><a href="https://doi.org/10.1080/00150517.2025.2491987" target="_blank" rel="noopener noreferrer">Boman · 2026 (online 2025) ↗</a> explores generalised Fibonacci models of tissue organisation. Publisher abstract reviewed; full-model appraisal remains open.</p><p><a href="https://doi.org/10.1080/00029890.1960.11989541" target="_blank" rel="noopener noreferrer">Wall · 1960 ↗</a> supplies mathematical background on Fibonacci series modulo m. The proposed biological correspondences form the research questions for the Atlas.</p></details>`;

  const reader = document.createElement('dialog');
  reader.className = 'science-reader';
  reader.setAttribute('aria-labelledby', 'science-reader-title');
  reader.innerHTML = `<div class="science-reader-bar"><span>RESEARCH COLLECTION · M9 / P24</span><button class="science-close" aria-label="Close research card">×</button></div><div class="science-reader-body"><div class="science-tabs" role="group" aria-label="Research themes">${cards.map(c => `<button data-reader-card="${c.id}">${c.label}</button>`).join('')}</div><article id="science-article"></article>${framework}${context}</div>`;
  document.body.append(reader);
  const zoom = document.createElement('dialog');
  zoom.className = 'science-zoom';
  zoom.setAttribute('aria-label', 'Enlarged scientific illustration');
  zoom.innerHTML = '<div class="science-reader-bar"><span>VISUAL EXPLANATION · SCROLL TO EXPLORE</span><button class="science-close" aria-label="Close enlarged illustration">×</button></div><div class="science-zoom-scroll"><img alt=""></div>';
  document.body.append(zoom);
  const genomics = document.createElement('dialog');
  genomics.className = 'science-genomics';
  genomics.setAttribute('aria-label', 'First Principles Genomics');
  genomics.innerHTML = '<div class="science-reader-bar"><span>FIRST PRINCIPLES GENOMICS · OXTR</span><button class="science-close" aria-label="Close First Principles Genomics">×</button></div><div class="science-genomics-content"></div>';
  document.body.append(genomics);
  let genomicsOpener, genomicsLoaded = false, genomicsLoading;
  async function loadGenomics() {
    if (genomicsLoaded || genomicsLoading) return genomicsLoading;
    const content = genomics.querySelector('.science-genomics-content');
    content.innerHTML = '<p class="science-genomics-status" role="status">Loading First Principles Genomics…</p>';
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 12000);
    genomicsLoading = (async () => {
      try {
        const response = await fetch(new URL('genomics.html?v=lightbox1', root), {signal: controller.signal});
        if (!response.ok) throw Error('Genomics content unavailable');
        const source = new DOMParser().parseFromString(await response.text(), 'text/html').querySelector('.genomics-main');
        if (!source) throw Error('Genomics content missing');
        const body = document.createElement('div');
        body.className = 'genomics-main';
        body.innerHTML = source.innerHTML;
        renderTeachables(body.querySelector('#science-teachables'));
        content.replaceChildren(body);
        genomicsLoaded = true;
      } catch {
        content.innerHTML = '<p class="science-genomics-status" role="status">The reading has not loaded. <button class="science-register-link" data-genomics-retry>Try again</button></p>';
      } finally {clearTimeout(timeout); genomicsLoading = null;}
    })();
    return genomicsLoading;
  }
  function openGenomics(button) {
    genomicsOpener = button;
    (document.fullscreenElement || document.body).append(genomics);
    genomics.showModal(); genomics.scrollTop = 0;
    loadGenomics();
  }
  genomics.addEventListener('close', () => genomicsOpener?.isConnected && genomicsOpener.focus());
  document.addEventListener('click', e => {
    const entry = e.target.closest('[data-science-genomics]');
    if (entry) {e.preventDefault(); openGenomics(entry);}
    if (e.target.closest('[data-genomics-retry]')) loadGenomics();
    const atlas = e.target.closest('[data-science-atlas]');
    if (atlas && ($('#research-record') || $('#experience'))) {e.preventDefault(); openAtlas(atlas.dataset.scienceAtlas);}
  });
  function openAtlas(view) {
    for (const dialog of [zoom, reader, appraisal, register, genomics, tfbsLearning, tfbs, $('#about')]) if (dialog?.open) dialog.close();
    if ($('#research-record')) {
      document.dispatchEvent(new CustomEvent('science:atlas-view', {detail: view}));
    } else if ($('#experience')) {
      document.dispatchEvent(new CustomEvent('science:open-atlas', {detail: view}));
    } else {
      location.href = new URL('./?atlas=1&record=fibonacci-m9-p24#' + view, root).href;
    }
  }
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const reviewLabels = {1:'Abstract / figures',2:'Selected full-text sections',3:'Main text, methods & results'};
  const scoreKey = `<details class="science-score-key"><summary>How the provisional trust score is calculated</summary><p>This 0–10 editorial score helps prioritise closer reading of the reported findings. The published evidence informs the research themes; the proposed Atlas relationship remains the hypothesis under investigation. WSS will assess potential Atlas relevance separately.</p><dl><dt>Study design · 0–3</dt><dd>3: controlled mechanistic test or quantitative prediction tested by manipulation; 2: structured measurement or comparative design; 1: descriptive observation; 0: insufficient information.</dd><dt>Validation · 0–3</dt><dd>3: independent replication appraised; 2: complementary evidence within the paper; 1: limited or abstract-level corroboration; 0: unassessed. No independent replication appraisal has yet been completed for this collection.</dd><dt>Source review · 0–3</dt><dd>3: main text, relevant methods/results and captions reviewed; 2: selected full-text sections; 1: abstract, metadata or figure descriptions; 0: unreviewed.</dd><dt>Publication provenance · 0–1</dt><dd>1: verified primary peer-reviewed publication. Journal reputation and impact factor do not add points.</dd></dl><p>Scores are provisional editorial judgements, with no claim of calibration or independent peer review. Review depth records the current extent of appraisal and can increase as methods and independent replications are assessed. Citation counts are displayed as context and contribute no points. Jadad evaluates randomised clinical-trial reporting; all 14 entries here are laboratory, animal, structural or related mechanistic studies, so Jadad is not applicable.</p><p>Crossref cited-by counts checked 17 October 2026. Coverage depends on deposited references and can differ from publisher counts. An unavailable count is left unscored.</p></details>`;
  const register = document.createElement('dialog');
  register.className = 'science-register';
  register.setAttribute('aria-labelledby','science-register-title');
  register.innerHTML = `<div class="science-reader-bar"><span>FIRST PRINCIPLES GENOMICS</span><button class="science-close" aria-label="Close research register">×</button></div><div class="science-register-body"><p class="science-label">14 UNIQUE STUDIES · 4 HERO REFERENCES</p><h2 id="science-register-title">Research register</h2><p class="science-register-intro">Shared background literature for the initial OXTR research programme across M1–M1001, including studies of related mechanisms in other systems. Relevance to individual moduli awaits assessment. HERO marks the lead reference for each of the four illustrated themes. Select a trust score to inspect its assessment.</p>${scoreKey}<p class="science-table-hint">Scroll the table horizontally on smaller screens.</p><div class="science-table-scroll" tabindex="0" role="region" aria-label="Fourteen-study research register"><table><caption class="science-sr-only">Fourteen primary studies, with four HERO references, provisional trust scores and citation context.</caption><thead><tr><th scope="col">Study / research theme</th><th scope="col">System &amp; appraisal</th><th scope="col">Trust / 10</th><th scope="col">Source review</th><th scope="col">Citations</th></tr></thead><tbody>${studies.map(study => `<tr data-study-id="${study.id}"><td><div class="science-study-id">${study.id}${study.hero ? '<span class="science-hero">HERO</span>' : ''}</div><a class="science-study-title" href="https://doi.org/${study.doi}" target="_blank" rel="noopener noreferrer">${esc(study.title)} ↗</a><p class="science-citation">${esc(study.author)} · ${esc(study.journal)} · ${esc(study.year)}</p><p class="science-study-theme">${esc(study.theme)}</p>${study.hero ? `<button class="science-study-question" data-science-card="${study.hero}">Open M9 / P24 research question →</button>` : ''}</td><td><p>${esc(study.methods)}</p><details><summary>Finding &amp; appraisal</summary><h3>Principal finding</h3><p>${esc(study.finding)}</p><h3>Scope &amp; limitations</h3><p>${esc(study.limit)}</p><h3>Source material reviewed</h3><p>${esc(study.access)}</p></details></td><td><button class="science-trust-score" data-study-score="${study.id}" aria-label="Inspect provisional trust score for ${study.id}: ${study.score} out of 10">${study.score}<span> / 10</span></button></td><td>${reviewLabels[study.scoreParts.review]}</td><td>${study.citationCount === null ? 'Unavailable' : `<a href="https://api.crossref.org/works/${study.doi}" target="_blank" rel="noopener noreferrer">${study.citationCount.toLocaleString('en-AU')}</a>`}<span class="science-citation-source">Crossref<br>17 Oct 2026</span></td></tr>`).join('')}</tbody></table></div></div>`;
  document.body.append(register);
  const tfbsLink = '<button class="science-register-link" data-science-tfbs aria-haspopup="dialog">OXTR binding-site catalogue ↗</button>';
  register.querySelector('.science-register-intro').insertAdjacentHTML('afterend', `<p>${tfbsLink}<br><span class="science-small">A separate collection of transcriptional-regulation evidence and source data.</span></p>`);
  const tfbs = document.createElement('dialog');
  tfbs.className = 'science-register science-tfbs';
  tfbs.setAttribute('aria-labelledby', 'tfbs-title');
  tfbs.innerHTML = '<div class="science-reader-bar"><span>OXTR · TRANSCRIPTIONAL REGULATION</span><button class="science-close" aria-label="Close binding-site catalogue">×</button></div><div class="science-register-body"><h2 id="tfbs-title">OXTR binding-site catalogue</h2><div class="tfbs-content"></div></div>';
  document.body.append(tfbs);
  const external = (href, label) => `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
  const tfbsLearning = document.createElement('dialog');
  tfbsLearning.className = 'science-register science-tfbs-learning';
  tfbsLearning.setAttribute('aria-labelledby', 'tfbs-learning-title');
  tfbsLearning.innerHTML = `<div class="science-reader-bar"><span>OXTR · A VISUAL INTRODUCTION</span><button class="science-close" aria-label="Close binding-site explanation">×</button></div><div class="science-register-body"><h2 id="tfbs-learning-title">Understanding Binding Sites and our approach</h2><p class="science-register-intro">A transcription factor is a protein that recognises particular DNA sequences and helps regulate gene activity. A binding site is a short stretch of DNA where that recognition takes place.</p><button class="science-register-link tfbs-enlarge" aria-pressed="false" aria-controls="tfbs-learning-figure">Enlarge diagram</button><figure id="tfbs-learning-figure" class="tfbs-learning-figure" tabindex="0" aria-label="Binding-site teaching diagram; scroll to explore when enlarged"><img loading="lazy" src="${new URL('science-assets/oxtr-binding-sites-atlas-beta-v1.png', root).href}" width="1536" height="1024" alt="Three teaching panels: a transcription factor recognises a short DNA sequence; four illustrative sites A to D show order, spacing and motif orientation; the Atlas Beta path follows 4, 8, 7, 5, 1, 2 around M9. The open question asks whether relationships between measured binding sites have a useful correspondence with Atlas geometry."></figure><p class="science-small">The DNA sites are illustrative. The arrows on them indicate motif orientation along DNA. The Beta diagram presents the Atlas pattern beside the biological idea; the mapping is the research step ahead.</p><details class="science-score-key"><summary>The 15 sites, ENCODE clusters and predicted matches</summary><dl><dt>The 15 sites</dt><dd>One OXTR promoter study reported 15 candidate binding locations using sequence analysis and laboratory binding tests. This is one study’s set, not a total for every region and cell type.</dd><dt>An ENCODE cluster</dt><dd>An experimental neighbourhood where a protein was detected associating with DNA. It usually covers a wider region than the exact binding sequence. The underlying experiments and cell types are linked in the catalogue.</dd><dt>A predicted match</dt><dd>A computer finds a DNA sequence resembling a protein’s preferred binding pattern. It is a candidate location to investigate; matching the pattern alone does not demonstrate binding in a cell.</dd></dl><p>Several predictions and experimental regions can overlap the same piece of DNA. These are complementary types of evidence, so their counts remain separate.</p><p>${external('https://pubmed.ncbi.nlm.nih.gov/16569740/','The 15-site study')} · ${external('https://www.encodeproject.org/chip-seq/transcription_factor/','ENCODE methods')} · ${external('https://jaspar.elixir.no/docs/','JASPAR documentation')}</p></details><p class="science-label">THREE VIEWS OF THE SAME DATA</p><p class="tfbs-next-step">Original DNA line → Full-position circle → Modulus 9 circle</p><p class="science-register-intro">The interactive experiment can show how the same positions appear in each view, making the preserved relationships and the effects of compression visible.</p></div>`;
  document.body.append(tfbsLearning);
  let tfbsLearningOpener;
  tfbsLearning.querySelector('.tfbs-enlarge').onclick = e => {
    const expanded = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(expanded));
    e.currentTarget.textContent = expanded ? 'Fit diagram to screen' : 'Enlarge diagram';
    tfbsLearning.querySelector('figure').classList.toggle('is-enlarged', expanded);
  };
  tfbsLearning.addEventListener('close', () => tfbsLearningOpener?.isConnected && tfbsLearningOpener.focus());
  const tfbsRoot = new URL('pilot-v1/oxtr-tfbs-v1/', root);
  let tfbsData, tfbsLoading, tfbsOpener;
  let tfbsFilteredRows = [];
  function renderTfbsRows() {
    const species = tfbs.querySelector('#tfbs-species').value;
    const evidenceType = tfbs.querySelector('#tfbs-kind').value;
    const systemRows = tfbsData.evidence.filter(r => species === 'all' || (species === 'human' ? r.species === 'Homo sapiens' : r.species !== 'Homo sapiens'));
    for (const option of tfbs.querySelector('#tfbs-kind').options) {
      option.textContent = option.value === 'all' ? `All literature types (${systemRows.length} records)` : `${option.value.replaceAll('_', ' ')} (${systemRows.filter(r => r.evidence_kind === option.value).length} records)`;
    }
    const rows = systemRows.filter(r => evidenceType === 'all' || r.evidence_kind === evidenceType);
    tfbsFilteredRows = rows;
    tfbs.querySelector('.tfbs-result-count').textContent = `${rows.length} evidence records · reports may concern overlapping regions`;
    tfbs.querySelector('.tfbs-literature tbody').innerHTML = rows.length ? rows.map(r => {
      const p = tfbsData.publications.find(p => p.pmid === r.pmid);
      return `<tr><td><span class="science-study-id">${esc(r.id)} · ${esc(r.species)}</span><strong>${esc(r.factor)}</strong><p>${esc(r.label)}</p><span class="tfbs-kind">${esc(r.evidence_kind.replaceAll('_', ' '))}</span>${r.reported_count !== null ? `<p>Paper’s reported group: ${r.reported_count}</p>` : ''}</td><td><p>${esc(r.finding)}</p><p class="tfbs-position">${esc(r.reported_position || 'Position not recovered')}</p>${r.reported_sequence ? `<p><code>${esc(r.reported_sequence)}</code></p>` : ''}<details><summary>Methods &amp; interpretation</summary><p>${esc(r.methods)}</p><p>Broader evidence descriptions: ${esc(r.evidence_categories.map(k => tfbsData.harmonisation.categories.find(c => c.id === k).label).join(' · '))}</p><p>${esc(r.limitation)}</p>${r.normalized_location?.start_0based != null ? `<p>GRCh38 · ${esc(r.normalized_location.chromosome)}:${r.normalized_location.start_0based}–${r.normalized_location.end_exclusive} · 0-based, end-exclusive<br>${esc(r.normalized_location.mapping_status)}</p>` : ''}</details></td><td>${external(p.doi_url, p.title)}<p class="science-citation">${esc(p.journal)} · ${p.year}<br>PMID ${p.pmid}</p><p>${esc(p.source_review)}</p>${p.existing_register_id ? `<p>Also in research register: ${esc(p.existing_register_id)}</p>` : ''}</td></tr>`;
    }).join('') : '<tr><td colspan="3">No records match these filters.</td></tr>';
  }
  async function loadTfbs() {
    if (tfbsData || tfbsLoading) return tfbsLoading;
    const content = tfbs.querySelector('.tfbs-content');
    content.innerHTML = '<p role="status">Loading the source-linked catalogue…</p>';
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 12000);
    tfbsLoading = (async () => {
      try {
        const response = await fetch(new URL('catalogue.json?v=compare-v2', tfbsRoot), {signal: controller.signal});
        if (!response.ok) throw Error('Catalogue unavailable');
        const data = await response.json();
        if (data.schema_version !== '1.0' || !Array.isArray(data.evidence) || !Array.isArray(data.publications) || !Array.isArray(data.harmonisation?.categories)) throw Error('Catalogue format unavailable');
        tfbsData = data;
        const s = data.summary;
        const download = (file, label) => `<a href="${new URL(file + '?v=compare-v2', tfbsRoot).href}" download>${label} ↓</a>`;
        content.innerHTML = `<p class="science-register-intro">A foundation for studying OXTR regulation alongside the Atlas. Published findings, experimental occupancy and predicted motifs retain their own evidence labels, coordinates and original sources.</p><p class="science-citation">Collection: 19 October 2026 · Human site harmonisation</p><section class="tfbs-geometry" aria-label="Interactive OXTR coordinate experiment"><p role="status">Loading the interactive experiment…</p></section><section class="tfbs-explorer" aria-labelledby="tfbs-explorer-heading"><p role="status">Loading the data browser…</p></section><nav class="tfbs-downloads" aria-label="Binding-site data downloads">${download('oxtr-tfbs-json.zip','Complete JSON data')}${download('oxtr-tfbs-csv.zip','Complete CSV data')}${download('literature-evidence.csv','Literature table')}${download('README.txt','Methods &amp; scope')}</nav><details class="science-score-key tfbs-harmonisation"><summary>Human sites and overlap checks</summary><p>The human collection includes <strong>${data.harmonisation.summary.human_evidence_categories.laboratory_tested} records with laboratory tests</strong> and <strong>${data.harmonisation.summary.human_evidence_categories.functional_evidence} with functional evidence</strong>. These categories overlap and include regional and grouped findings.</p><p>US-1 and US-2 each match once in our saved OXTR reference window. Their original sequences, computed GRCh38 positions and overlap links are included in the shared data.</p><p>The original 15 sites are from a human study. Their individual sequences and historical positions still need recovery from the full paper and any supplementary tables.</p><p>All imports now share a common observation format. Identical reference intervals are grouped while every source observation remains available. Overlapping regions are linked; overlap alone does not establish the same binding site.</p><nav class="tfbs-downloads" aria-label="Human site project downloads">${download('normalized-literature.json','Normalized literature · JSON')}${download('normalized-literature.csv','Normalized literature · CSV')}${download('mapped-literature.bed','Mapped literature · BED')}${download('human-site-project.json','Project & methods · JSON')}</nav><p class="science-small">The complete packages also contain the unified observations, reference intervals, source relationships and overlap tables. A total of unique confirmed human sites remains open. The interactive coordinate experiment above retains these original observations.</p></details><details class="science-score-key"><summary>Region, database coverage &amp; next steps</summary><p>Human reference window: GRCh38 chr3:8,740,380–8,779,628, using 0-based, end-exclusive coordinates. This covers the annotated OXTR gene and 10 kb on each side. OXTR is on the minus strand.</p><p>All ${s.jaspar_all_predictions.toLocaleString('en-AU')} returned JASPAR predictions are retained in the downloads; ${s.jaspar_default_threshold_predictions.toLocaleString('en-AU')} pass UCSC’s default score ≥400 display filter. These are motif matches, with overlapping models and positions. The filter does not establish biological activity.</p><p>The downloads include reference DNA, ${s.jaspar_available_pfm_templates.toLocaleString('en-AU')} vertebrate motif templates, experimental provenance and ${s.oreganno_regions} regional ORegAnno annotations. ENCODE clusters describe broad occupancy, including coregulators. Neither regional overlap nor motif matching alone establishes OXTR regulation.</p><ul class="tfbs-resources">${data.resources.map(r => `<li>${external(r.url,r.name)} · ${esc(r.status)}<br><span>${esc(r.note)}</span></li>`).join('')}</ul><p>${esc(data.coverage)}</p><p>Next visual stage: the original DNA line, a full-position circle and a separately labelled Modulus 9 view. Coordinates and comparison rules are being assembled first. No Atlas correspondence or numerical WSS has been assessed.</p></details><details class="science-score-key tfbs-literature"><summary>Literature &amp; study evidence · ${s.literature_evidence_records} catalogue records from ${s.publications} publications</summary><p>Browse reports and study findings here. The counts in these dropdowns refer to catalogue records; individual binding positions are in the data browser above.</p><div class="tfbs-filters"><label for="tfbs-species">Study system<select id="tfbs-species"><option value="human">Human OXTR</option><option value="animal">Animal Oxtr</option><option value="all">All systems</option></select></label><label for="tfbs-kind">Literature record type<select id="tfbs-kind"><option value="all">All evidence types</option>${[...new Set(data.evidence.map(r => r.evidence_kind))].sort().map(k => `<option value="${k}">${esc(k.replaceAll('_', ' '))}</option>`).join('')}</select></label></div><p class="science-small">These downloads contain the literature records shown below. One record can describe a group of sites or a broad region.</p><details class="science-score-key tfbs-evidence-guide"><summary>Evidence types &amp; broader descriptions</summary><p>The dropdown uses the original evidence types. Human laboratory findings also appear under functional region, occupancy region and sequence supported; zero tested candidates does not mean no human experiments.</p><p>Broader descriptions sit inside each record’s Methods &amp; interpretation and remain in the exports. They can overlap and describe the evidence; they are not trust scores.</p><dl>${data.harmonisation.categories.map(c => `<dt>${esc(c.label)}</dt><dd>${esc(c.definition)}</dd>`).join('')}</dl></details><p class="tfbs-result-count" role="status"></p><nav class="tfbs-downloads" aria-label="Filtered evidence downloads"><button class="science-register-link" data-tfbs-export="json">These literature records · JSON ↓</button><button class="science-register-link" data-tfbs-export="csv">These literature records · CSV ↓</button></nav><p class="science-table-hint">Scroll the table horizontally to read each source.</p><div class="science-table-scroll" tabindex="0" role="region" aria-label="OXTR literature evidence"><table><caption class="science-sr-only">Evidence records, reported positions and primary sources. Records are not a unique-site count.</caption><thead><tr><th scope="col">Factor &amp; evidence</th><th scope="col">Finding &amp; reported position</th><th scope="col">Primary source &amp; review depth</th></tr></thead><tbody></tbody></table></div><p class="science-small">Unknown positions remain unfilled. Source review depth is stated for each paper; trust scores for this collection are unassigned. The existing 14-study research register remains a separate collection, with shared papers cross-referenced.</p></details>`;
        content.querySelector('.science-register-intro').insertAdjacentHTML('afterend', '<p><button class="science-register-link" data-science-tfbs-learning aria-haspopup="dialog">Understanding Binding Sites and our approach ↗</button></p>');
        renderTfbsRows();
        const explorer = content.querySelector('.tfbs-explorer');
        const startExplorer = () => import(new URL('tfbs-explorer.js?v=2', root).href)
          .then(module => module.mountTfbsExplorer(explorer, data, tfbsRoot))
          .catch(() => { explorer.innerHTML = '<p role="status">The data browser has not loaded. <button type="button" class="science-register-link">Retry data browser</button></p>'; explorer.querySelector('button').onclick = startExplorer; });
        startExplorer();
        const geometry = content.querySelector('.tfbs-geometry');
        const startGeometry = () => import(new URL('tfbs-geometry.js?v=4', root).href)
          .then(module => module.mountTfbsGeometry(geometry, data, tfbsRoot))
          .catch(() => { geometry.innerHTML = '<p role="status">The experiment has not loaded. <button type="button" class="science-register-link">Retry experiment</button></p>'; geometry.querySelector('button').onclick = startGeometry; });
        startGeometry();
      } catch {
        tfbsData = null;
        content.innerHTML = '<p role="status">The catalogue has not loaded. <button class="science-register-link" data-tfbs-retry>Try again</button></p>';
      } finally {clearTimeout(timeout); tfbsLoading = null;}
    })();
    return tfbsLoading;
  }
  document.addEventListener('click', e => {
    const exportButton = e.target.closest('[data-tfbs-export]');
    if (exportButton && tfbsData) {
      const format = exportButton.dataset.tfbsExport;
      const records = tfbsFilteredRows;
      const fields = ['id','species','factor','evidence_categories','evidence_kind','finding','methods','reported_position','reported_sequence','reported_count','limitation','reference_transcript','coordinate_status','related_evidence','pmid','source_url','assembly','chromosome','start_0based','end_exclusive','strand','mapping_status','reference_interval_id'];
      const flat = records.map(r => ({...r,...r.normalized_location,evidence_categories:r.evidence_categories.join('; ')}));
      const cell = v => v == null ? '' : /[",\r\n]/.test(String(v)) ? '"' + String(v).replaceAll('"','""') + '"' : String(v);
      const content = format === 'json' ? JSON.stringify({version:tfbsData.harmonisation.version,scope:'Selected literature records filtered by study system and original evidence type; not a unique-site total',filters:{study_system:tfbs.querySelector('#tfbs-species').value,evidence_kind:tfbs.querySelector('#tfbs-kind').value},evidence:records,publications:tfbsData.publications.filter(p=>records.some(r=>r.pmid===p.pmid)),categories:tfbsData.harmonisation.categories},null,2) : '\uFEFF' + [fields,...flat.map(r=>fields.map(k=>r[k]))].map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
      const url = URL.createObjectURL(new Blob([content],{type:format === 'json' ? 'application/json' : 'text/csv;charset=utf-8'}));
      const a = document.createElement('a'); a.href=url; a.download='oxtr-selected-evidence.'+format; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    const entry = e.target.closest('[data-science-tfbs]');
    if (entry) {e.preventDefault(); tfbsOpener = entry; (document.fullscreenElement || document.body).append(tfbs); tfbs.showModal(); tfbs.scrollTop = 0; loadTfbs();}
    if (e.target.closest('[data-tfbs-retry]')) loadTfbs();
    const learning = e.target.closest('[data-science-tfbs-learning]');
    if (learning) {tfbsLearningOpener = learning; (document.fullscreenElement || document.body).append(tfbsLearning); tfbsLearning.showModal(); tfbsLearning.scrollTop = 0;}
  });
  tfbs.addEventListener('change', e => { if (e.target.matches('#tfbs-species, #tfbs-kind')) renderTfbsRows(); });
  tfbs.addEventListener('close', () => tfbsOpener?.isConnected && tfbsOpener.focus());
  const appraisal = document.createElement('dialog');
  appraisal.className = 'science-appraisal';
  appraisal.setAttribute('aria-labelledby','science-appraisal-title');
  appraisal.innerHTML = `<div class="science-reader-bar"><span>PROVISIONAL EVIDENCE APPRAISAL</span><button class="science-close" aria-label="Close trust assessment">×</button></div><div class="science-appraisal-body"></div>`;
  document.body.append(appraisal);
  let registerOpener, scoreOpener;
  document.addEventListener('click', e => {
    const entry = e.target.closest('[data-science-register]');
    if (entry) {registerOpener = entry; (document.fullscreenElement || document.body).append(register); register.showModal(); register.scrollTop = 0;}
    const score = e.target.closest('[data-study-score]');
    if (score) {
      scoreOpener = score;
      const study = studies.find(s => s.id === score.dataset.studyScore);
      appraisal.querySelector('.science-appraisal-body').innerHTML = `<p class="science-label">${study.id} · ${esc(study.author)} · ${esc(study.year)}</p><h2 id="science-appraisal-title">${study.score} / 10 · provisional trust</h2><p>${esc(study.title)}</p><dl class="science-score-breakdown"><dt>Study design</dt><dd>${study.scoreParts.design} / 3</dd><dt>Validation</dt><dd>${study.scoreParts.validation} / 3</dd><dt>Source review</dt><dd>${study.scoreParts.review} / 3</dd><dt>Publication provenance</dt><dd>${study.scoreParts.provenance} / 1</dd></dl><p>${esc(study.scoreReason)}</p><p class="science-small">Jadad: not applicable to this study design. Citation counts are contextual and add no points.</p><p class="science-small">This score is an editorial assessment of the reviewed evidence, distinct from the future WSS assessment of an Atlas correspondence.</p>`;
      (document.fullscreenElement || document.body).append(appraisal); appraisal.showModal(); appraisal.scrollTop = 0;
    }
  });
  register.addEventListener('close', () => registerOpener?.isConnected && registerOpener.focus());
  appraisal.addEventListener('close', () => scoreOpener?.isConnected && scoreOpener.focus());
  let active = cards[0], mode = 'literature', opener;
  let hasRecord = false;

  function renderCard() {
    const c = active;
    reader.querySelectorAll('[data-reader-card]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.readerCard === c.id)));
    $('#science-article').innerHTML = `<p class="science-kicker" style="--science-color:${c.color}">${c.label} · ${c.theme}</p><h2 id="science-reader-title">${mode === 'visual' ? c.title : c.paper}</h2><p class="science-citation">${c.citation}</p><div class="science-evidence"><div><p class="science-label">ESTABLISHED RESEARCH</p><h3>Methods &amp; study system</h3><p>${c.methods}</p><h3>Principal finding</h3><p>${c.finding}</p><h3>Scope &amp; limitations</h3><p>${c.limit}</p>${literatureLink(c)}</div><div class="science-question"><p class="science-label">OPEN ATLAS QUESTION · M9 / P24</p><p class="science-question-text">${c.question}</p><p>${c.distinction}</p><button class="science-atlas-link" data-atlas-view="${c.id}">Explore ${c.label} in M9 / P24 →</button><div class="science-category"><p class="science-label">POTENTIAL WSS CATEGORY</p><h3>${c.category}</h3><p>${c.range}</p><p>${c.rationale}</p><p class="science-small">Numerical score unassigned · biological correspondence untested.</p></div></div></div><details class="science-visual" ${mode === 'visual' ? 'open' : ''}><summary>Visual explanation · ${c.title}</summary><div class="science-visual-content"><p>${c.idea}</p><button class="science-image-button" aria-label="Enlarge illustration: ${c.title}"><img loading="lazy" src="${imageURL(c)}" alt="${c.alt}" width="${c.id === 'gamma' ? 1697 : 1536}" height="${c.id === 'gamma' ? 927 : 1024}"><span>Enlarge illustration ↗</span></button><p class="science-image-note">${c.visualNote}</p><details class="science-text-equivalent"><summary>Read the illustrated sequence</summary><ol>${c.panels.map(p => `<li>${p}</li>`).join('')}</ol></details></div></details>`;
    // First Principles Genomics introduces the visual story; the Atlas opens with the literature.
    if (mode === 'visual') $('#science-article').insertBefore(reader.querySelector('.science-visual'), reader.querySelector('.science-evidence'));
    reader.querySelector('.science-image-button').onclick = () => {
      const img = zoom.querySelector('img'); img.src = imageURL(c); img.alt = c.alt;
      (document.fullscreenElement || document.body).append(zoom); zoom.showModal();
    };
    reader.querySelector('[data-atlas-view]').onclick = () => openAtlas(c.id);
  }
  function openCard(id, entry, button) {
    active = cards.find(c => c.id === id) || cards[0]; mode = entry; opener = button;
    renderCard();
    (document.fullscreenElement || document.body).append(reader);
    reader.showModal(); reader.scrollTop = 0;
  }
  reader.querySelectorAll('[data-reader-card]').forEach(b => b.onclick = () => {active = cards.find(c => c.id === b.dataset.readerCard); renderCard(); reader.scrollTop = 0;});
  for (const dialog of [reader, zoom, register, appraisal, genomics, tfbs, tfbsLearning]) {
    dialog.querySelector('.science-close').onclick = () => dialog.close();
    dialog.addEventListener('click', e => {if (e.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();});
  }
  reader.addEventListener('close', () => opener?.isConnected && opener.focus());
  zoom.addEventListener('close', () => reader.querySelector('.science-image-button')?.focus());
  document.addEventListener('click', e => {const b = e.target.closest('[data-science-card]'); if (b) openCard(b.dataset.scienceCard, b.dataset.scienceMode || 'literature', b);});

  function renderTeachables(teachables) {
  if (teachables) teachables.innerHTML = cards.map(c => `<button data-science-card="${c.id}" data-science-mode="visual"><img src="${imageURL(c)}" alt="" loading="lazy" width="1536" height="1024"><span class="science-kicker" style="--science-color:${c.color}">${c.label} · ${c.theme}</span><strong>${c.title}</strong><span class="science-teachable-action">View infographic →</span></button>`).join('');

  }
  renderTeachables($('#science-teachables'));

  const module = document.createElement('section');
  module.id = 'atlas-science-summary'; module.className = 'science-module'; module.hidden = true;
  module.setAttribute('aria-labelledby', 'atlas-science-title');
  module.innerHTML = `<p class="science-label">OXTR · SHARED RESEARCH</p><h2 id="atlas-science-title">Research context</h2><p class="science-module-intro">14 peer-reviewed studies, including four HERO references, provide background for our OXTR research programme. Relevance to individual moduli awaits assessment.</p><button class="science-register-link" data-science-register>Research register ↗</button><p class="science-module-page"><a href="${new URL('genomics.html', root).href}" data-science-genomics aria-haspopup="dialog">First Principles Genomics →</a></p><p class="science-assessment">Hypothesis under investigation<br>Numerical WSS: awaiting assessment</p>${framework}`;
  module.querySelector('.science-module-page').insertAdjacentHTML('afterend', `<p class="science-module-page">${tfbsLink}</p>`);
  if ($('#sidebar-science-slot')) $('#sidebar-science-slot').append(module);
  function setRecord(d) {
    hasRecord = Number.isInteger(d.modulus) && d.modulus >= 1 && Boolean(d.research?.background_literature);
    module.hidden = !hasRecord;
    const status = $('#legacy-research-status'); if (status) status.hidden = hasRecord;
    $('#shape-summary')?.classList.toggle('has-science', hasRecord);
    if (!hasRecord && reader.open) reader.close();
  }
  function setView(view) {
    const slot = $(view === 'geometry-summary' ? '#summary-science-slot' : '#sidebar-science-slot');
    if (slot) slot.append(module);
    module.hidden = !hasRecord;
  }
  window.ScienceCards = {setRecord, setView};
})();
