'use strict';
// Shared calculations for the reader, filters and downloadable records.
(() => {
  const journalKey = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,'and').replace(/^the\s+/,'').replace(/\([^)]*\)|\s*[:=].*$/g,'').replace(/[^a-z0-9]/g,'');
  const citationNumber = value => {
    if (Number.isInteger(value) && value >= 0) return value;
    const match = String(value || '').match(/citations:\s*(\d[\d,]*)/i);
    return match ? Number(match[1].replace(/,/g,'')) : null;
  };
  const maximumCount = values => { const known = values.map(citationNumber).filter(Number.isInteger); return known.length ? Math.max(...known) : null; };
  const identity = record => record.doi ? 'doi:'+record.doi.toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//,'').trim() : record.pmid ? 'pmid:'+record.pmid : record.publicationKey || 'id:'+(record.recordId || record.id);
  const uniqueCount = papers => new Set(papers.map(identity)).size;
  function deduplicate(records) {
    const grouped = new Map();
    for (const record of records) {
      const id = identity(record), existing = grouped.get(id);
      if (!existing) { grouped.set(id,record); continue; }
      existing.aliases = [...new Set([...existing.aliases,record.id,...record.aliases])];
      for (const field of ['collections','categories','targets','quotes','topicScores']) existing[field] = [...new Set([...existing[field],...record[field]])];
      for (const field of ['topics','soundEntries']) existing[field].push(...record[field]);
      for (const [collection,count] of Object.entries(record.citationsByCollection)) existing.citationsByCollection[collection] = maximumCount([existing.citationsByCollection[collection],count]);
      existing.citationCount = maximumCount(Object.values(existing.citationsByCollection));
      existing._search += ' '+record._search;
      if (!existing.journalKey && record.journalKey) { existing.journalKey = record.journalKey; existing.journalLabel = record.journalLabel; }
    }
    return [...grouped.values()];
  }
  function statistics(records, collection) {
    const unique = new Map();
    for (const record of records.filter(r => collection === 'all' || r.collections.includes(collection))) {
      const key = identity(record), previous = unique.get(key);
      const count = maximumCount(Object.entries(record.citationsByCollection || {}).filter(([c]) => collection === 'all' || c === collection).map(([,n])=>n));
      unique.set(key,{journalKey:record.journalKey || previous?.journalKey,citations:maximumCount([previous?.citations,count])});
    }
    const entries = [...unique.values()];
    return {papers:entries.length,journals:new Set(entries.map(r=>r.journalKey).filter(Boolean)).size,citations:entries.reduce((sum,r)=>sum+(r.citations || 0),0),citationCoverage:entries.filter(r=>r.citations!==null).length};
  }
  function matchesStudy(record, kind) {
    const text = [record.title,record.design,record.kind].join(' ').toLowerCase().replace(/[‐‑–—-]/g,' ');
    const trial = /randomi[sz](?:ed|ation)/.test(text);
    return !kind || kind === 'trial' && trial || kind === 'double-blind' && trial && /double\s+(?:blind|mask)/.test(text) || kind === 'single-blind' && trial && /single\s+(?:blind|mask)/.test(text) || kind === 'review' && /review|meta[ -]analysis|synthesis/.test(text) || kind === 'animal' && /mouse|mice|\brats?\b|\bcells?\b|in vitro|animal|fibroblast|rhesus/.test(text);
  }
  globalThis.UniversalResearchModel = {journalKey,citationNumber,maximumCount,identity,uniqueCount,deduplicate,statistics,matchesStudy};
})();
