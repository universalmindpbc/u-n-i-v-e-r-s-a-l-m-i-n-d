import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = process.cwd();
const IAM_DIR = path.join(ROOT, 'i  a m');
const SOURCE_NAME = 'dj-set-tensor-approved-notion-export-v1.0.json';
const CATALOGUE_NAME = 'adaptive-music-video-catalogue-v1.11.json';
const POLICY_NAME = 'adaptive-music-trajectory-policy-v2.json';
const DJ_DIR = path.join(IAM_DIR, 'a s s e t s', 'd j  s e t s');

const configs = [
  {
    artistKey: 'Sasha',
    id: 'sasha-ibiza-boat-at-sunset-freqways',
    filePrefix: 'Sasha',
    musicRoom: 'champagne-bohemia',
    policy: { mode: 'uplift', activation_level: 2, counts_as_uplift: true },
  },
  {
    artistKey: 'Ben B',
    id: 'ben-bohmer-cappadocia-cercle',
    filePrefix: 'Ben B',
    musicRoom: 'champagne-bohemia',
    policy: { mode: 'uplift', activation_level: 1, counts_as_uplift: true },
  },
  {
    artistKey: 'Peggy Gou',
    id: 'peggy-gou-palais-des-beaux-arts-cercle',
    filePrefix: 'Peggy Gou',
    musicRoom: 'modul8-infinity',
    policy: { mode: 'uplift', activation_level: 3, counts_as_uplift: true },
  },
  {
    artistKey: 'Miss Monique',
    id: 'miss-monique-biosphere-montreal-cercle',
    filePrefix: 'Miss Monique',
    musicRoom: 'modul8-infinity',
    policy: { mode: 'uplift', activation_level: 3, counts_as_uplift: true },
  },
  {
    artistKey: 'Nina Kraviz',
    id: 'nina-kraviz-eiffel-tower-cercle',
    filePrefix: 'Nina Kraviz',
    musicRoom: 'modul8-infinity',
    policy: { mode: 'restricted', activation_level: 3, counts_as_uplift: false },
  },
  {
    artistKey: 'NASTIA',
    id: 'nastia-drum-bass-sunset-the-lab-ibiza',
    filePrefix: 'NASTIA',
    musicRoom: 'modul8-infinity',
    policy: { mode: 'uplift', activation_level: 3, counts_as_uplift: true },
  },
  {
    artistKey: 'Carl Cox',
    id: 'carl-cox-chateau-de-chambord-cercle',
    filePrefix: 'Carl Cox',
    musicRoom: 'modul8-infinity',
    policy: { mode: 'uplift', activation_level: 3, counts_as_uplift: true },
  },
];

const viewGroups = {
  '01 Human Review Flow': 'human_review_flow',
  '02 Citizen Needs Scores': 'citizen_needs_scores',
  '03 Meditative Values Applied': 'meditative_values_applied',
  '04 Mono Myth Hero Journey': 'monomyth_hero_journey',
  '05 Dadirri Mindfulness': 'dadirri_mindfulness',
  '06 Musicianship + Emotion': 'musicianship_emotion',
  '07 Memory': 'memory',
  '08 Gold Standard': 'gold_standard',
};

function normalized(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function parseJson(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeTopNeeds(value) {
  const parsed = parseJson(value, null);
  const items = Array.isArray(parsed)
    ? parsed
    : String(value || '').split(/[,;|]/).map((item) => item.trim()).filter(Boolean);
  return items
    .map((item) => typeof item === 'string' ? item : item.need || item.name || item.label)
    .filter(Boolean)
    .slice(0, 4);
}

function fieldName(field) {
  if (typeof field === 'string') return field;
  if (!field || typeof field !== 'object') return null;
  return field.name || field.property || field.field || field.column || field.title || null;
}

function fieldsForView(views, viewName) {
  let view;
  if (Array.isArray(views)) {
    view = views.find((candidate) => {
      const name = candidate?.name || candidate?.title || candidate?.view || candidate?.label;
      return name === viewName;
    });
  } else {
    view = views?.[viewName];
  }
  const fields = Array.isArray(view) ? view : view?.fields || view?.properties || view?.columns || [];
  return fields.map(fieldName).filter(Boolean);
}

function pick(row, fields) {
  return Object.fromEntries(fields.filter((field) => Object.hasOwn(row, field)).map((field) => [field, row[field]]));
}

function sourceRows(source) {
  if (Array.isArray(source.records)) return source.records;
  if (Array.isArray(source.rows)) return source.rows;
  if (Array.isArray(source.results)) return source.results;
  throw new Error(`${SOURCE_NAME} does not contain a records, rows, or results array.`);
}

function replaceVersion(source, pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`Could not find ${label} cache version.`);
  return source.replace(pattern, replacement);
}

function replaceTelevisionCacheReference(source, cacheToken, label) {
  const pattern = /adaptive-environment-television\.js\?v=[^"']+/g;
  if (!source.match(pattern)?.length) throw new Error(`Could not find ${label} cache version.`);
  return source.replace(pattern, `adaptive-environment-television.js?v=${cacheToken}`);
}

function addTelevisionTracks(source, tracks) {
  const marker = 'const TRACK_CATALOGUE = [';
  const start = source.indexOf(marker);
  if (start < 0) throw new Error('Could not find TRACK_CATALOGUE in adaptive-environment-television.js.');
  const end = source.indexOf('\n  ];', start);
  if (end < 0) throw new Error('Could not find the end of TRACK_CATALOGUE.');
  const currentBlock = source.slice(start, end);
  const additions = tracks
    .filter((track) => !currentBlock.includes(`id: ${JSON.stringify(track.id)}`))
    .map((track) => `    { id: ${JSON.stringify(track.id)}, artist: ${JSON.stringify(track.artist)}, title: ${JSON.stringify(track.title)}, localVideoSrc: ${JSON.stringify(track.local_video_file)}, musicRoom: ${JSON.stringify(track.music_room)}, presentation: "live_dj_set" }`);
  if (!additions.length) return source;
  const before = source.slice(0, end);
  const separator = before.trimEnd().endsWith(',') ? '\n' : ',\n';
  return `${before}${separator}${additions.join(',\n')}\n${source.slice(end)}`;
}

function updatePolicy(policy, promoted) {
  const entries = promoted.map(({ track, config }) => ({
    id: track.id,
    ...config.policy,
    media_class: 'long_form_dj_set',
  }));
  const ids = new Set(entries.map((entry) => entry.id));
  const arrayKey = ['track_profiles', 'profiles', 'tracks'].find((key) => Array.isArray(policy[key]));
  if (arrayKey) {
    policy[arrayKey] = [...policy[arrayKey].filter((entry) => !ids.has(entry.id || entry.track_id)), ...entries];
    return;
  }
  const objectKey = ['track_profiles', 'profiles', 'tracks'].find((key) => policy[key] && typeof policy[key] === 'object');
  if (objectKey) {
    for (const entry of entries) {
      policy[objectKey][entry.id] = Object.fromEntries(Object.entries(entry).filter(([key]) => key !== 'id'));
    }
    return;
  }
  policy.track_profiles = entries;
}

const [sourceText, catalogueText, policyText, televisionText, adaptiveVideoText, indexText, televisionHtmlText, adaptiveVideoHtmlText, djFiles] = await Promise.all([
  fs.readFile(path.join(IAM_DIR, SOURCE_NAME), 'utf8'),
  fs.readFile(path.join(IAM_DIR, CATALOGUE_NAME), 'utf8'),
  fs.readFile(path.join(IAM_DIR, POLICY_NAME), 'utf8'),
  fs.readFile(path.join(IAM_DIR, 'adaptive-environment-television.js'), 'utf8'),
  fs.readFile(path.join(IAM_DIR, 'adaptive-music-video.js'), 'utf8'),
  fs.readFile(path.join(IAM_DIR, 'index.html'), 'utf8'),
  fs.readFile(path.join(IAM_DIR, 'adaptive-environment-television.html'), 'utf8'),
  fs.readFile(path.join(IAM_DIR, 'adaptive-music-video.html'), 'utf8'),
  fs.readdir(DJ_DIR),
]);

const source = JSON.parse(sourceText);
const catalogue = JSON.parse(catalogueText);
const policy = JSON.parse(policyText);
const rows = sourceRows(source);
const views = catalogue.tensor_field_bible?.views || {};
const importedAt = new Date().toISOString();

if (rows.length !== 7) throw new Error(`Expected 7 approved DJ-set rows, found ${rows.length}.`);

const promoted = configs.map((config) => {
  const row = rows.find((candidate) => normalized(candidate.Artist).startsWith(normalized(config.artistKey)));
  if (!row) throw new Error(`No approved Notion row found for ${config.artistKey}.`);
  if (String(row.Status || '').toLowerCase() !== 'approved') throw new Error(`${row.Artist} is not approved.`);
  const fileName = djFiles.find((candidate) => normalized(candidate).startsWith(normalized(config.filePrefix)));
  if (!fileName) throw new Error(`No source video found for ${config.filePrefix}.`);
  const localVideoFile = `a s s e t s/d j  s e t s/${fileName}`;
  const tensorProfile = Object.fromEntries(
    Object.entries(viewGroups).map(([viewName, groupName]) => [groupName, pick(row, fieldsForView(views, viewName))]),
  );
  const citizenScores = tensorProfile.citizen_needs_scores || {};
  const track = {
    id: config.id,
    priority: Number(row.Priority) || 2,
    artist: row.Artist,
    title: row.Track,
    presentation: 'live_dj_set',
    media_class: 'long_form_dj_set',
    source_record_url: row.url || row.URL || '',
    local_video_file: localVideoFile,
    youtube_video_id: row['YouTube ID'] || '',
    primary_environmental_function: row['Primary Environmental Function'] || '',
    top_needs: normalizeTopNeeds(row['Top 4 / 37 Need Mapping']),
    citizen_need_affinities: Object.fromEntries(Object.entries(citizenScores).filter(([, value]) => Number.isFinite(Number(value))).map(([key, value]) => [key, Number(value)])),
    trajectory: row['Lyric Emotional Trajectory'] || row['Emotional Trajectory'] || '',
    music_room: config.musicRoom,
    safety: {
      youth_safety: row['Youth Safety'] || '',
      memory_zone: row['Memory Zone'] || '',
      requires_support_context: false,
      age_restricted: false,
      avoid_during_acute_distress: config.policy.mode === 'restricted',
      not_suitable_for: parseJson(row['Not Suitable For'], row['Not Suitable For'] || []),
      sensitive_content: row['Sensitive Content'] || '',
    },
    editorial_summary: row['Why This Track'] || '',
    tensor_profile: tensorProfile,
    notion_export: {
      source_json: SOURCE_NAME,
      imported_at: importedAt,
      column_count: Object.keys(row).length,
      row,
    },
  };
  track.tensor_profile.runtime_delivery = {
    selected_track_id: track.id,
    local_video_file: localVideoFile,
    youtube_video_id: track.youtube_video_id,
    music_room: config.musicRoom,
    presentation: track.presentation,
    source_record_url: track.source_record_url,
    media_class: track.media_class,
  };
  return { track, config };
});

const promotedIds = new Set(promoted.map(({ track }) => track.id));
catalogue.tracks = [...catalogue.tracks.filter((track) => !promotedIds.has(track.id)), ...promoted.map(({ track }) => track)];
catalogue.generated_at = importedAt;
catalogue.long_form_dj_sets = {
  schema: 'um_dj_set_tensor_approved_v1.0',
  source_json: SOURCE_NAME,
  approved_count: promoted.length,
  gold_calibration_unchanged: true,
  media_availability: 'Cloudflare Stream UID required before staging playback',
};
if (catalogue.notion_source_export && typeof catalogue.notion_source_export === 'object') {
  catalogue.notion_source_export.hydrated_catalogue_track_count = catalogue.tracks.length;
  catalogue.notion_source_export.long_form_approved_row_count = promoted.length;
  catalogue.notion_source_export.long_form_source_json = SOURCE_NAME;
}
updatePolicy(policy, promoted);

const updatedTelevision = addTelevisionTracks(televisionText, promoted.map(({ track }) => track));
const updatedAdaptiveVideo = replaceVersion(adaptiveVideoText, /music-video-catalogue-\d+/g, 'music-video-catalogue-3', 'adaptive music catalogue');
const televisionCacheToken = `music-tv-${createHash('sha256').update(updatedTelevision).digest('hex').slice(0, 12)}`;
const updatedIndex = replaceTelevisionCacheReference(indexText, televisionCacheToken, 'index television');
const updatedTelevisionHtml = replaceTelevisionCacheReference(televisionHtmlText, televisionCacheToken, 'television page');
const updatedAdaptiveVideoHtml = replaceVersion(adaptiveVideoHtmlText, /adaptive-video-\d+/g, 'adaptive-video-10', 'adaptive video page');

await Promise.all([
  fs.writeFile(path.join(IAM_DIR, CATALOGUE_NAME), `${JSON.stringify(catalogue, null, 2)}\n`),
  fs.writeFile(path.join(IAM_DIR, POLICY_NAME), `${JSON.stringify(policy, null, 2)}\n`),
  fs.writeFile(path.join(IAM_DIR, 'adaptive-environment-television.js'), updatedTelevision),
  fs.writeFile(path.join(IAM_DIR, 'adaptive-music-video.js'), updatedAdaptiveVideo),
  fs.writeFile(path.join(IAM_DIR, 'index.html'), updatedIndex),
  fs.writeFile(path.join(IAM_DIR, 'adaptive-environment-television.html'), updatedTelevisionHtml),
  fs.writeFile(path.join(IAM_DIR, 'adaptive-music-video.html'), updatedAdaptiveVideoHtml),
]);

console.log(`Promoted ${promoted.length} approved DJ sets; runtime catalogue now contains ${catalogue.tracks.length} tracks.`);
