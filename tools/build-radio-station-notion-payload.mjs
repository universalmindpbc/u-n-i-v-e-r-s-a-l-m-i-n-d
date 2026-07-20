import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "i  a m", "radio-station-tensor-notion-export-v1.0.json");
const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

const editorial = {
  "cafe-del-mar-calm": { zone: "Green", valence: "Positive", memory: "Spiritual Awe", specificity: "Generic / atmospheric", nostalgia: .3, agency: "Same / neutral", hero: "New Ordinary", dadirri: "Embodied Peace", meditative: "Anxiety to Peace Of Mind", supporting: ["Dadirri", "Healing Wisdom of Nature"] },
  "cafe-del-mar-chill": { zone: "Green", valence: "Positive", memory: "Belonging", specificity: "Familiar cultural memory", nostalgia: .52, agency: "Same / neutral", hero: "New Ordinary", dadirri: "Presence", meditative: "Dadirri", supporting: ["This Too Shall Pass", "Healing Wisdom of Nature"] },
  "cafe-del-mar-house": { zone: "Green", valence: "Positive", memory: "Triumph", specificity: "Familiar cultural memory", nostalgia: .42, agency: "Higher", hero: "Resurrection", dadirri: "Celebration", meditative: "Common Humanity via Body", supporting: ["Awakening the Dreamtime"] },
  "groove-salad": { zone: "Green", valence: "Positive", memory: "Spiritual Awe", specificity: "Generic / atmospheric", nostalgia: .44, agency: "Higher", hero: "New Ordinary", dadirri: "Clarity", meditative: "Dadirri", supporting: ["Anxiety to Peace Of Mind", "Healing Wisdom of Nature"] },
  "groove-salad-classic": { zone: "Green", valence: "Bittersweet", memory: "Nostalgia", specificity: "Familiar cultural memory", nostalgia: .9, agency: "Same / neutral", hero: "Return With Elixir", dadirri: "Integration", meditative: "This Too Shall Pass", supporting: ["Dadirri", "Compassion Without Fixing"] },
  "sanctuary-dark-electro": { zone: "Amber", valence: "Transformational", memory: "Identity", specificity: "Familiar cultural memory", nostalgia: .62, agency: "Higher", hero: "Call To Adventure", dadirri: "Courage", meditative: "Common Humanity via Body", supporting: ["Awakening the Dreamtime"] },
  "sanctuary-retro": { zone: "Green", valence: "Bittersweet", memory: "Nostalgia", specificity: "Familiar cultural memory", nostalgia: .94, agency: "Higher", hero: "Return With Elixir", dadirri: "Integration", meditative: "This Too Shall Pass", supporting: ["Common Humanity via Body", "Dadirri"] },
};

const stageGate = {
  "cafe-del-mar-calm": "calm",
  "cafe-del-mar-chill": "chill",
  "cafe-del-mar-house": "house",
  "groove-salad": "calm",
  "groove-salad-classic": "chill",
  "sanctuary-dark-electro": "house",
  "sanctuary-retro": "chill",
};

const pages = source.records.map((station) => {
  const notes = editorial[station.id];
  const interpretation = `${station.display_title} is a continuous ${station.primary_environmental_function} environment. Rank it from the complete citizen-needs profile, explicit work context, group context, musical continuity, personal affinity and adjacent exploration.`;
  const properties = {
    "Track": station.display_title,
    "Artist": station.provider,
    "Status": "Approved",
    "Priority": station.editorial_priority,
    "Music Video": "__NO__",
    "Lyrics Source": "Unavailable",
    "Training Utility": "High",
    "Gold Standard Set": "None",
    "Primary Environmental Function": station.primary_environmental_function,
    "Secondary Environmental Functions": JSON.stringify(station.secondary_environmental_functions),
    "Top 4 Needs": JSON.stringify(station.top_needs),
    "Suitable Citizen State": station.suitable_citizen_state,
    "Not Suitable Citizen State": station.not_suitable_citizen_state,
    "Overall Music Feeling": station.editorial_notes,
    "Energy / Body Response": `Continuous ${station.context.intensity} intensity with ${station.context.density} density and a ${station.context.trajectory} trajectory.`,
    "GPT Interpretation": interpretation,
    "Why This Track": `Adds a distinct 24/7 ${station.primary_environmental_function} station to Universal Mind's adaptive Radio pool.`,
    "Editorial Notes": `${station.editorial_notes} Approved by Ben for the password-locked private stakeholder demo on 2026-07-20. Station-level values describe the continuous channel rather than every individual song.`,
    "Youth Safety": "Safe",
    "Music Video Trigger Sensitivity": "Safe",
    "Music Video Adult Themes Grade": "None",
    "Music Video Adult Themes Notes": "Not applicable: audio-only station inside an 18+ stakeholder demo.",
    "Music Video Body Exposure Score": 0,
    "Music Video Sexualisation Score": 0,
    "Memory Safety Grade": notes.zone,
    "Memory Zone": notes.zone,
    "Memory Valence": notes.valence,
    "Primary Memory Type": notes.memory,
    "Memory Specificity": notes.specificity,
    "Nostalgia Intensity": notes.nostalgia,
    "Psychological Safety": station.need_scores["Psychological Safety"] ?? .72,
    "Agency After Listening": notes.agency,
    "Hope After Listening": "Higher",
    "Primary Hero Stage": notes.hero,
    "Primary Dadirri Value": notes.dadirri,
    "Meditative Primary": notes.meditative,
    "Meditative Supporting": JSON.stringify(notes.supporting),
    "Recording Format": "Live",
    "Recording Medium": JSON.stringify(["Other Digital"]),
    "Mastering Medium": JSON.stringify(["Unknown"]),
    "Mixing Medium": JSON.stringify(["Other Digital"]),
    "Label Recordings": station.provider,
    "Label Distribution": "Continuous internet radio stream",
    "Performers": "Continuous curated station; performers vary by programme.",
    "Writers": "Continuous curated station; writers vary by programme.",
    "Sensitive Audience Use Notes": station.not_suitable_citizen_state,
    "Human Variability Notes": "Station programming varies over time; explicit choices, listening duration, skips and returns refine personal affinity without locking the citizen into one pattern.",
    "JSON Profile": JSON.stringify(JSON.stringify({ media_class: "radio_station", station_id: station.id, provider: station.provider, stream_url: station.stream_url, player_url: station.player_url, stage_gate: stageGate[station.id], private_demo_approved: true, selector_policy: "music_channel_selector_v1.0" })),
    ...station.need_scores,
  };
  const content = [
    "## Runtime station profile",
    "",
    `- **Media class:** \`radio_station\``,
    `- **24/7 mode:** Radio`,
    `- **Adaptive stage gate:** ${stageGate[station.id]}`,
    `- **Primary function:** ${station.primary_environmental_function}`,
    `- **Public player:** [Open the station player](${station.player_url})`,
    `- **Runtime stream:** ${station.stream_url}`,
    "",
    "> Approved by Ben for Universal Mind's password-locked private stakeholder demo. The selector treats this as a continuous station profile, then learns from explicit choices, listening duration, skips and returns.",
    "",
    "## Delivery rule",
    "",
    interpretation,
    "",
    "The station participates in the shared `videos | parties | radio` navigation. Solo citizens may switch immediately. In joined audio rooms, a selection becomes one vote for the next shared source.",
  ].join("\n");
  return { icon: "📻", properties, content };
});

process.stdout.write(JSON.stringify({ parent: { data_source_id: source.source_data_source.replace("collection://", "") }, pages }));
