// Use the same publication records as Language, chapter 2.5.
import edition from '../Informatics/library-data/language-edition.json' with { type: 'json' };
import {youthMatches} from './informatics-youth-knowledge.js';

const topic = edition.chapters.flatMap(chapter => chapter.topics).find(item => item.id === 'mindfulness-biofeedback');
export const biofeedbackRecords = topic.papers.map(paper => ({
  ...paper, id: paper.recordId, aliases: [paper.id], collections: ['language'], conditions: []
}));
const normal = value => String(value || '').toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//, '').trim();
const byId = new Map(biofeedbackRecords.flatMap(record =>
  [record.id, record.doi, record.pmid, ...record.aliases].filter(Boolean).map(id => [normal(id), record])
));
export const biofeedbackRecord = id => byId.get(normal(id));
export const biofeedbackRelevant = query => /biofeedback|neurofeedback|healium|\bhrv\b|heart[- ]rate variability|live eeg|mixed reality mindfulness/i.test(query);
const aliasGroups = {'11':'Healium AR EEG','44':'Healium nature VR EEG','A03':'Nevermind youth','A06':'National Guard defence military','A08':'military veterans','A13':'presence live replay','A15':'shared empathy connection','A17':'multimedia group','A18':'Indigenous Aboriginal NSW','A19':'refugee youth Kampala','27':'HeartMath proprietary','18':'blinded psychiatrist'};
const stop = new Set('the and for from with that this was are all does publications evidence research tell about what study papers using'.split(' '));
export function biofeedbackSearch(query, filters={}, limit=5) {
  const text = normal(query);
  const words = [...new Set(text.match(/[\p{L}\d]+/gu) || [])].filter(word => word.length > 2 && !stop.has(word));
  const candidates = biofeedbackRecords.filter(record => youthMatches(record,filters));
  if (!text) return candidates.slice(0,limit);
  return candidates.map(record => {
    const key = record.aliases[0].replace('language-biofeedback-','').toUpperCase();
    const fields = normal([record.title, record.summary, record.evidence.measurement, record.limitation, aliasGroups[key]].join(' '));
    const exact = [record.id, record.doi, record.pmid].some(id => id && text.includes(normal(id)));
    return {record, score:(exact ? 1000 : 0) + words.filter(word => fields.includes(word)).length};
  }).filter(item => item.score).sort((a,b) => b.score - a.score).slice(0,limit).map(item => item.record);
}
const measures = ['Heart-rate variability','Heart rate / heartbeat','EEG','Derived score','Proprietary score'];
export const biofeedbackVersion = {version:'lab-biofeedback-20261105-ratings',publications:biofeedbackRecords.length};
export function biofeedbackGuide(origin) {
  const signals = Object.fromEntries(measures.map(name => [name,biofeedbackRecords.filter(r => r.evidence.measurement.split(' · ').includes(name)).length]));
  return {title:topic.title, url:origin+'/lab/research.html#mindfulness-biofeedback', chapter:origin+'/informatics/research/?collection=language&chapter=2#topic-mindfulness-biofeedback',
    ...biofeedbackVersion, signals, basis:'Counts overlap. A live input changed what a participant saw, heard or felt. Nine derived indicators include two explicitly documented proprietary HeartMath coherence scores. Recording a signal only as an outcome does not count. The 63 works include 28 participant reports and three design reports with identifiable live signals, 18 reviews or frameworks, ten contextual or measurement reports, and four with unresolved implementation.',
    assessment:'The evidence supports further research. A 35-person multimodal VR comparison favoured real over replayed signals for presence and relaxation. A 60-person trial found no additional benefit from a live pulse display in VR self-compassion. Paired meditation participants reported empathy and social presence. The proposed collective Lab experience and inferred neurochemical proxies remain unvalidated by these studies.',
    trustFactor:{score:topic.trustScore,scope:'Subchapter',counts:topic.trustAssessment.counts,basis:topic.paragraphs.at(-1)},
    methods:'At least 17 randomised primary reports include contextual interventions. A psychiatrist masked to allocation assessed anxiety in the 188-person inpatient trial. The corpus-wide double-blind count remains undetermined.',
    healium:'Five distinct journal reports were checked. Three describe live EEG: AR mindfulness, a four-firefighter pilot, and a 100-person hospital staff study with alternating allocation. Two other reports compare outcomes before and after VR. Two of the five are in the 63. A live Apple Watch intervention is unverified in these five.',
    supplementarySources:['https://doi.org/10.15540/nr.5.2.57','https://doi.org/10.3389/frvir.2022.764745','https://doi.org/10.32474/SJPBS.2019.02.000150','https://www.jmir.org/2025/1/e68204/','https://pubmed.ncbi.nlm.nih.gov/28478782/','https://pubmed.ncbi.nlm.nih.gov/41310318/']};
}
