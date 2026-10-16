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
      question: 'Does Alpha’s recurrence structure offer useful descriptions of biological timing when compared with measured rhythms and existing clock models?',
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
      question: 'Do Beta’s recurrence patterns offer useful descriptions of division and lineage organisation beyond familiar doubling models?',
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
      question: 'Do Gamma’s spatial relationships capture reproducible features of molecular recognition across independently measured structures?',
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
      question: 'Does Epsilon offer a useful mathematical description of aromatic arrangements in experimentally measured structures?',
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
  const framework = `<details class="science-notes"><summary>How scientific significance is framed</summary><p>Weighted scientific significance (WSS) is a project-specific category of potential relevance if an Atlas connection is established. It is separate from evidence strength and from the probability that a connection exists.</p><ul><li><strong>Creates cellular life</strong> · High, 8–10</li><li><strong>Supports cellular life</strong> · Medium, 5–7</li><li><strong>Creates elemental life</strong> · Low, 1–4</li></ul><p>The four themes map to potential categories. Numerical study and modulus scores remain unassigned. “Elemental life” remains an exploratory project term requiring a defined physical interpretation.</p><p>Evidence appraisal considers methods, study system, controls, relevance, limitations and reproducibility. This first collection is a bounded editorial review of primary literature; independent subject-specialist review remains open.</p></details>`;
  const context = `<details class="science-notes"><summary>Fibonacci, φ and π · definitions and related work</summary><dl><dt>Fibonacci sequence</dt><dd>Each number is the sum of the preceding two; ratios of successive positive terms approach φ.</dd><dt>φ · Phi Ratio</dt><dd>The Phi Ratio, approximately 1.618.</dd><dt>π · pi</dt><dd>The circle constant, approximately 3.142, in geometry.</dd><dt>π-stacking</dt><dd>Interactions involving aromatic π electron systems. This use of π refers to electronic structure.</dd><dt>Pisano period</dt><dd>The repeat length of Fibonacci remainders for a chosen modulus; sometimes written π(m), a separate use of the symbol.</dd></dl><p>Our hypothesis concerns relationships between the nested Alpha, Beta, Gamma and Epsilon sequences and biological or molecular functions. Bioinformatics and in silico modelling provide the planned means of investigation.</p><p>The Atlas examines defined patterns within modular cycles and relationships between them. Biological timing, division and molecular recognition provide contexts for testing those patterns.</p><p><a href="https://doi.org/10.1073/pnas.2016304118" target="_blank" rel="noopener noreferrer">Zhang et al. · PNAS · 2021 ↗</a> pairs microscopy and modelling of Fibonacci-pattern formation in gerbera flower heads. It offers a biological precedent for investigating how patterns arise.</p><p><a href="https://doi.org/10.1080/00150517.2025.2491987" target="_blank" rel="noopener noreferrer">Boman · 2026 (online 2025) ↗</a> explores generalised Fibonacci models of tissue organisation. Publisher abstract reviewed; full-model appraisal remains open.</p><p><a href="https://doi.org/10.1080/00029890.1960.11989541" target="_blank" rel="noopener noreferrer">Wall · 1960 ↗</a> supplies mathematical background on Fibonacci series modulo m. The proposed biological correspondences form the research questions for the Atlas.</p></details>`;

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
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const reviewLabels = {1:'Abstract / figures',2:'Selected full-text sections',3:'Main text, methods & results'};
  const scoreKey = `<details class="science-score-key"><summary>How the provisional trust score is calculated</summary><p>This 0–10 editorial score helps prioritise closer reading of the reported findings. The published evidence informs the research themes; the proposed Atlas relationship remains the hypothesis under investigation. WSS will assess potential Atlas relevance separately.</p><dl><dt>Study design · 0–3</dt><dd>3: controlled mechanistic test or quantitative prediction tested by manipulation; 2: structured measurement or comparative design; 1: descriptive observation; 0: insufficient information.</dd><dt>Validation · 0–3</dt><dd>3: independent replication appraised; 2: complementary evidence within the paper; 1: limited or abstract-level corroboration; 0: unassessed. No independent replication appraisal has yet been completed for this collection.</dd><dt>Source review · 0–3</dt><dd>3: main text, relevant methods/results and captions reviewed; 2: selected full-text sections; 1: abstract, metadata or figure descriptions; 0: unreviewed.</dd><dt>Publication provenance · 0–1</dt><dd>1: verified primary peer-reviewed publication. Journal reputation and impact factor do not add points.</dd></dl><p>Scores are provisional editorial judgements, with no claim of calibration or independent peer review. Review depth records the current extent of appraisal and can increase as methods and independent replications are assessed. Citation counts are displayed as context and contribute no points. Jadad evaluates randomised clinical-trial reporting; all 14 entries here are laboratory, animal, structural or related mechanistic studies, so Jadad is not applicable.</p><p>Crossref cited-by counts checked 17 October 2026. Coverage depends on deposited references and can differ from publisher counts. An unavailable count is left unscored.</p></details>`;
  const register = document.createElement('dialog');
  register.className = 'science-register';
  register.setAttribute('aria-labelledby','science-register-title');
  register.innerHTML = `<div class="science-reader-bar"><span>FIRST PRINCIPLES GENOMICS</span><button class="science-close" aria-label="Close research register">×</button></div><div class="science-register-body"><p class="science-label">14 UNIQUE STUDIES · 4 HERO REFERENCES</p><h2 id="science-register-title">Research register</h2><p class="science-register-intro">Primary literature for the research hypothesis. HERO marks the lead reference for each of the four illustrated themes. Select a trust score to inspect its assessment.</p>${scoreKey}<p class="science-table-hint">Scroll the table horizontally on smaller screens.</p><div class="science-table-scroll" tabindex="0" role="region" aria-label="Fourteen-study research register"><table><caption class="science-sr-only">Fourteen primary studies, with four HERO references, provisional trust scores and citation context.</caption><thead><tr><th scope="col">Study / research theme</th><th scope="col">System &amp; appraisal</th><th scope="col">Trust / 10</th><th scope="col">Source review</th><th scope="col">Citations</th></tr></thead><tbody>${studies.map(study => `<tr data-study-id="${study.id}"><td><div class="science-study-id">${study.id}${study.hero ? '<span class="science-hero">HERO</span>' : ''}</div><a class="science-study-title" href="https://doi.org/${study.doi}" target="_blank" rel="noopener noreferrer">${esc(study.title)} ↗</a><p class="science-citation">${esc(study.author)} · ${esc(study.journal)} · ${esc(study.year)}</p><p class="science-study-theme">${esc(study.theme)}</p>${study.hero ? `<button class="science-study-question" data-science-card="${study.hero}">Open Atlas question →</button>` : ''}</td><td><p>${esc(study.methods)}</p><details><summary>Finding &amp; appraisal</summary><h3>Principal finding</h3><p>${esc(study.finding)}</p><h3>Scope &amp; limitations</h3><p>${esc(study.limit)}</p><h3>Source material reviewed</h3><p>${esc(study.access)}</p></details></td><td><button class="science-trust-score" data-study-score="${study.id}" aria-label="Inspect provisional trust score for ${study.id}: ${study.score} out of 10">${study.score}<span> / 10</span></button></td><td>${reviewLabels[study.scoreParts.review]}</td><td>${study.citationCount === null ? 'Unavailable' : `<a href="https://api.crossref.org/works/${study.doi}" target="_blank" rel="noopener noreferrer">${study.citationCount.toLocaleString('en-AU')}</a>`}<span class="science-citation-source">Crossref<br>17 Oct 2026</span></td></tr>`).join('')}</tbody></table></div></div>`;
  document.body.append(register);
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
  let hero = false;

  function renderCard() {
    const c = active;
    reader.querySelectorAll('[data-reader-card]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.readerCard === c.id)));
    $('#science-article').innerHTML = `<p class="science-kicker" style="--science-color:${c.color}">${c.label} · ${c.theme}</p><h2 id="science-reader-title">${mode === 'visual' ? c.title : c.paper}</h2><p class="science-citation">${c.citation}</p><div class="science-evidence"><div><p class="science-label">ESTABLISHED RESEARCH</p><h3>Methods &amp; study system</h3><p>${c.methods}</p><h3>Principal finding</h3><p>${c.finding}</p><h3>Scope &amp; limitations</h3><p>${c.limit}</p>${literatureLink(c)}</div><div class="science-question"><p class="science-label">OPEN ATLAS QUESTION · M9 / P24</p><p class="science-question-text">${c.question}</p><p>${c.distinction}</p><button class="science-atlas-link" data-atlas-view="${c.id}">Explore ${c.label} in M9 / P24 →</button><div class="science-category"><p class="science-label">POTENTIAL WSS CATEGORY</p><h3>${c.category}</h3><p>${c.range}</p><p>${c.rationale}</p><p class="science-small">Numerical score unassigned · biological correspondence untested.</p></div></div></div><details class="science-visual" ${mode === 'visual' ? 'open' : ''}><summary>Visual explanation · ${c.title}</summary><div class="science-visual-content"><p>${c.idea}</p><button class="science-image-button" aria-label="Enlarge illustration: ${c.title}"><img loading="lazy" src="${imageURL(c)}" alt="${c.alt}" width="${c.id === 'gamma' ? 1697 : 1536}" height="${c.id === 'gamma' ? 927 : 1024}"><span>Enlarge illustration ↗</span></button><p class="science-image-note">${c.visualNote}</p><details class="science-text-equivalent"><summary>Read the illustrated sequence</summary><ol>${c.panels.map(p => `<li>${p}</li>`).join('')}</ol></details></div></details>`;
    // About introduces the visual story; the Atlas opens with the literature.
    if (mode === 'visual') $('#science-article').insertBefore(reader.querySelector('.science-visual'), reader.querySelector('.science-evidence'));
    reader.querySelector('.science-image-button').onclick = () => {
      const img = zoom.querySelector('img'); img.src = imageURL(c); img.alt = c.alt;
      (document.fullscreenElement || document.body).append(zoom); zoom.showModal();
    };
    reader.querySelector('[data-atlas-view]').onclick = () => {
      reader.close();
      if (register.open) register.close();
      if ($('#research-record')) {
        document.dispatchEvent(new CustomEvent('science:atlas-view', {detail: c.id}));
      } else {
        if ($('#about')?.open) $('#about').close();
        location.href = new URL('./?atlas=1&record=fibonacci-m9-p24#' + c.id, root).href;
      }
    };
  }
  function openCard(id, entry, button) {
    active = cards.find(c => c.id === id) || cards[0]; mode = entry; opener = button;
    renderCard();
    (document.fullscreenElement || document.body).append(reader);
    reader.showModal(); reader.scrollTop = 0;
  }
  reader.querySelectorAll('[data-reader-card]').forEach(b => b.onclick = () => {active = cards.find(c => c.id === b.dataset.readerCard); renderCard(); reader.scrollTop = 0;});
  for (const dialog of [reader, zoom, register, appraisal]) {
    dialog.querySelector('.science-close').onclick = () => dialog.close();
    dialog.addEventListener('click', e => {if (e.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();});
  }
  reader.addEventListener('close', () => opener?.isConnected && opener.focus());
  zoom.addEventListener('close', () => reader.querySelector('.science-image-button')?.focus());
  document.addEventListener('click', e => {const b = e.target.closest('[data-science-card]'); if (b) openCard(b.dataset.scienceCard, b.dataset.scienceMode || 'literature', b);});

  const teachables = $('#science-teachables');
  if (teachables) teachables.innerHTML = cards.map(c => `<button data-science-card="${c.id}" data-science-mode="visual"><img src="${imageURL(c)}" alt="" loading="lazy" width="1536" height="1024"><span class="science-kicker" style="--science-color:${c.color}">${c.label} · ${c.theme}</span><strong>${c.title}</strong><span class="science-teachable-action">View infographic →</span></button>`).join('');

  const module = document.createElement('section');
  module.id = 'm9-science-summary'; module.className = 'science-module'; module.hidden = true;
  module.setAttribute('aria-labelledby', 'm9-science-title');
  module.innerHTML = `<p class="science-label">M9 / P24 · SCIENTIFIC SIGNIFICANCE</p><h2 id="m9-science-title">Research context</h2><p class="science-module-intro">Investigating relationships between M9P24’s nested sequences and biological timing, cellular division and molecular organisation.</p><button class="science-register-link" data-science-register>Research register ↗</button><p class="science-module-page"><a href="${new URL('genomics.html', root).href}" target="_top">First Principles Genomics →</a></p><p class="science-assessment">Hypothesis under investigation<br>Numerical WSS: awaiting assessment</p>${framework}`;
  if ($('#sidebar-science-slot')) $('#sidebar-science-slot').append(module);
  function setRecord(d) {
    hero = d.modulus === 9 && d.pisano_period === 24;
    module.hidden = !hero;
    const status = $('#legacy-research-status'); if (status) status.hidden = hero;
    $('#shape-summary')?.classList.toggle('has-science', hero);
    if (!hero && reader.open) reader.close();
  }
  function setView(view) {
    const slot = $(view === 'geometry-summary' ? '#summary-science-slot' : '#sidebar-science-slot');
    if (slot) slot.append(module);
    module.hidden = !hero;
  }
  window.ScienceCards = {setRecord, setView};
})();
