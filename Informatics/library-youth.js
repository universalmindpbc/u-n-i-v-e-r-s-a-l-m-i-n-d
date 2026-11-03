'use strict';
(() => {
  const destinations = {
    all: {title:'Youth Research for Universal Mind Lab', topic:'universal-mind-mobile-lab', intro:'The full research collection informing Universal Mind Lab: dissolving stigma, improving access—for free—and clear referral pathways.'},
    orygen: {title:'Orygen Research', topic:'orygen-youth', intro:'Youth mental health research associated with Orygen, including participation, digital support and pathways to care.'},
    'black-dog': {title:'Black Dog Institute Research', topic:'black-dog-youth', intro:'Youth mental health research associated with Black Dog Institute, including help-seeking, creative participation and digital interventions.'},
    music: {title:'Music Listening and Therapy for Youth', topic:'music-youth', intro:'Youth research on music listening and facilitated music therapy, with findings and limits for each approach.'},
    'music-making': {title:'Music Making for Youth', topic:'music-making-youth', intro:'Youth research on active music making and mixed music therapy. The studies distinguish facilitated creative participation from listening.'},
    'brain-entrainment': {title:'Sound and Brain Entrainment for Youth', topic:'sound-entrainment-youth', intro:'Youth research on sound, rhythmic stimulation and brain entrainment. Brain activity, engagement and clinical outcomes are considered separately.'},
    emdr: {title:'EMDR for Youth', topic:'emdr-youth', intro:'Youth research on Eye Movement Desensitisation and Reprocessing (EMDR), including clinical protocols and their reported outcomes.'},
    mindfulness: {title:'Mindfulness for Youth', topic:'mindfulness-youth', intro:'Youth research on mindfulness programmes, their settings, reported outcomes and limitations.'},
    mantra: {title:'Mantra for Youth', topic:'mantra-youth', intro:'The current evidence gap for youth mantra research in this collection. Transcendental Meditation is covered separately.'},
    'transcendental-meditation': {title:'Transcendental Meditation for Youth', topic:'transcendental-meditation-youth', intro:'Youth-related research on Transcendental Meditation. Linked reports and mixed-age samples remain identified.'},
    yoga: {title:'Yoga for Youth', topic:'yoga-youth', intro:'Youth research on yoga, including study populations, programme delivery and reported outcomes.'},
    connection: {title:'Access, Digital Support and Connection for Youth', topic:'youth-access-connection', intro:'Youth research on access to support, digital participation, social connection and pathways to care.'}
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let originalIntro;
  function selection() { return destinations[new URLSearchParams(location.search).get('youth')]; }
  function updateIntro() {
    const intro = document.querySelector('.library-intro');
    originalIntro ??= intro.innerHTML;
    const current = selection(), params = new URLSearchParams(location.search);
    const widerYouth = !current && params.getAll('age').includes('youth');
    document.body.classList.toggle('youth-focus', !!current);
    if (current || widerYouth) {
      const title = current?.title || 'Youth Research';
      document.title = title + ' · Universal Informatics';
      intro.innerHTML = `<p class="atlas-page-marker">Youth research · Universal Mind Lab</p><h1>${esc(title)}</h1><p class="intro-copy">${esc(current?.intro || 'Explore the wider library of youth research, with filters for topics, ages and study design.')}</p><p class="youth-scope">Universal Mind Lab focuses on youth aged 16–24. This collection also includes supporting studies with younger or older participants; each publication states its reported ages and relevance to that focus.</p><nav class="youth-return" aria-label="Research navigation"><a href="/lab/research.html" target="_top"><svg class="youth-nav-icon youth-nav-back" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false"><path d="M4 12h16m-6-6 6 6-6 6"/></svg> Lab research overview</a><a href="/informatics/research/?collection=all&amp;view=search">All Informatics research <svg class="youth-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></a></nav>`;
    } else {
      intro.innerHTML = originalIntro;
      document.title = 'Universal Research · Universal Informatics';
    }
    return current;
  }
  function render({data, records, paperMarkup, ageMarkup}) {
    const current = selection();
    if (!current) return false;
    const topics = Object.values(data.chapters).flatMap(chapter => chapter.topics).filter(topic => topic.id === current.topic);
    const selected = [...new Map(topics.flatMap(topic => topic.papers).map(paper => [paper.recordId, paper])).values()];
    const notes = current.topic === 'universal-mind-mobile-lab' ? [] : [...new Set(topics.flatMap(topic => topic.paragraphs || []))];
    const count = selected.length;
    document.querySelector('#search-view').hidden = true;
    const reader = document.querySelector('#reading-content');
    reader.hidden = false;
    reader.dataset.youthTopic = current.topic;
    reader.innerHTML = `<section class="youth-publications" aria-labelledby="youth-publication-heading"><div class="youth-collection-bar"><h2 id="youth-publication-heading">${count ? `${count} ${count === 1 ? 'publication' : 'publications'}` : 'Research context · Evidence gap'}</h2><details class="youth-topic-menu"><summary>Explore another youth topic</summary><nav aria-label="Youth research topics">${Object.entries(destinations).map(([key,item]) => `<a href="/informatics/research/?youth=${key}"${item === current ? ' aria-current="page"' : ''}>${esc(item.title)}</a>`).join('')}</nav></details></div>${count ? '<p class="youth-count-note">Each publication appears once in this view. Publications linked to the same study remain identified.</p>' : '<p class="youth-empty">No qualifying publications are currently included in this youth topic. Adult mantra research is not substituted here.</p>'}${notes.length ? `<details class="youth-context"${count ? '' : ' open'}><summary>Research context and limits</summary>${notes.map(note => `<p>${esc(note)}</p>`).join('')}</details>` : ''}<div class="youth-papers">${selected.map(paper => {
      const record = records.find(record => record.id === paper.recordId || record.aliases.includes(paper.recordId));
      return paperMarkup(paper, 'h3').replace('<article class="paper"', '<article class="paper youth-paper"').replace('</h3>', '</h3>' + ageMarkup(record));
    }).join('')}</div></section>`;
    return true;
  }
  globalThis.UniversalResearchYouth = {selection, updateIntro, render};
  updateIntro();
})();
