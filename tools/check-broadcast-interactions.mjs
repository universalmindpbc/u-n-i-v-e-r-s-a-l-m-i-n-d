import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IAM_DIR = path.join(ROOT, "i  a m");

const [
  schedule,
  mantraLibrary,
  clock,
  interactions,
  mantraSampler,
  television,
  index,
  televisionPage,
  endpoint,
] = await Promise.all([
  fs.readFile(path.join(IAM_DIR, "broadcast-schedule-v1.json"), "utf8").then(JSON.parse),
  fs.readFile(path.join(IAM_DIR, "api", "mantra-library.json"), "utf8").then(JSON.parse),
  fs.readFile(path.join(IAM_DIR, "broadcast-clock-v1.js"), "utf8"),
  fs.readFile(path.join(IAM_DIR, "broadcast-interactions-v1.js"), "utf8"),
  fs.readFile(path.join(IAM_DIR, "mantra-sampler.js"), "utf8"),
  fs.readFile(path.join(IAM_DIR, "adaptive-environment-television.js"), "utf8"),
  fs.readFile(path.join(IAM_DIR, "index.html"), "utf8"),
  fs.readFile(path.join(IAM_DIR, "adaptive-environment-television.html"), "utf8"),
  fs.readFile(path.join(IAM_DIR, "api", "broadcast-interactions.php"), "utf8"),
]);

function phpListMembers(source, constantName) {
  const match = source.match(new RegExp(`const ${constantName} = \\[([\\s\\S]*?)\\];`));
  assert.ok(match, `${constantName} is missing.`);
  return Array.from(match[1].matchAll(/'([^']+)'/g), (candidate) => candidate[1]);
}

const expectedSharedChannelIds = schedule.channels
  .filter((channel) => ["videos", "parties", "radio"].includes(channel.format))
  .map((channel) => channel.id);
const endpointChannelIds = phpListMembers(endpoint, "ALLOWED_CHANNEL_IDS");

assert.equal(expectedSharedChannelIds.length, 9, "The interaction prototype must cover exactly nine Music broadcasts.");
assert.deepEqual(new Set(endpointChannelIds), new Set(expectedSharedChannelIds), "The coordinator room allowlist must match all nine Music broadcasts.");
assert.ok(endpointChannelIds.every((id) => !id.startsWith("fashion-")), "Fashion must stay outside the nine-stream interaction prototype.");

const playableMantraIds = Object.values(mantraLibrary.banks)
  .flat()
  .filter((item) => !item.reserved && item.asset)
  .map((item) => item.id);
assert.equal(playableMantraIds.length, 9, "The internal test must expose all nine currently playable mantras.");
assert.match(endpoint, /const MANTRA_LIBRARY_PATH = __DIR__ \. '\/mantra-library\.json';/, "The coordinator must use the editable mantra library.");
assert.match(endpoint, /function mantra_durations_ms\(\): array/, "The coordinator must derive its mantra allowlist dynamically.");
assert.match(endpoint, /!empty\(\$item\['reserved'\]\)/, "Reserved mantra placeholders must remain unavailable.");
assert.match(endpoint, /trim\(\(string\) \(\$item\['asset'\]/, "Only mantra slots with audio may be shared.");
assert.match(endpoint, /\(\(\$end - \$start\) \/ \$speed\) \* 1000/, "Shared cadence must follow the edited sample duration and speed.");
assert.match(endpoint, /array_key_exists\(\$assetId, \$mantraDurations\)/, "Every currently playable library mantra must be accepted without a stale hardcoded list.");

assert.match(clock, /programmeStartMs/, "The broadcast clock must expose the exact programme start.");
assert.match(clock, /programmeInstanceId/, "The broadcast clock must expose a unique programme instance.");
assert.match(interactions, /POLL_INTERVAL_MS = 450/, "The internal test must poll the shared room frequently enough to schedule audio ahead.");
assert.match(interactions, /credentials: "same-origin"/, "The interaction client must remain inside the existing Panthur staging environment.");
assert.match(interactions, /fetchPayload\("GET"/, "The browser client must receive shared events.");
assert.match(interactions, /fetchPayload\("POST"/, "The browser client must send shared events.");
assert.match(interactions, /sendBloom/, "The browser client cannot send Blooms.");
assert.match(interactions, /sendMantra/, "The browser client cannot send mantras.");
assert.match(interactions, /locallyRenderedEventIds/, "The sender cannot suppress its delayed shared echo.");
assert.match(interactions, /source_event_ids/, "The client cannot identify its own optimistic interaction.");
assert.match(interactions, /renderedLocally: true/, "Shared sends must record immediate local rendering.");
assert.match(interactions, /programmeInstanceId/, "The browser client is not scoped to the exact broadcast programme.");
assert.match(interactions, /IAMMantraSampler\?\.playShared/, "Incoming shared mantras are not routed to the local sampler.");
assert.match(mantraSampler, /armSharedAudio/, "Shared mantra audio is not preloaded and unlocked on entry.");
assert.match(mantraSampler, /playShared/, "The sampler cannot schedule a remote mantra.");
assert.match(mantraSampler, /serverPlayAtMs/, "The sampler is not using the server-scheduled play time.");
assert.match(mantraSampler, /IAMBroadcastInteractions\?\.sendMantra/, "A mantra tap is not routed through the shared coordinator.");
assert.match(mantraSampler, /await playItem\(item, \{ exclusive: true \}\)/, "A mantra tap must always play locally without waiting for the coordinator.");
assert.match(mantraSampler, /mantraPlaybackMode = shared \? "shared" : "local"/, "Mantra playback timing is not observable for live QA.");
assert.match(television, /IAMBroadcastInteractions\?\.setBroadcast/, "Broadcast entry does not join the matching interaction room.");
assert.match(television, /IAMBroadcastInteractions\?\.clear/, "Leaving shared playback does not leave the interaction room.");
assert.match(television, /IAMBroadcastInteractions\?\.sendBloom/, "Bloom taps are not routed through the shared coordinator.");
assert.match(television, /iam:shared-bloom/, "Remote Blooms are not rendered with the approved reaction system.");
assert.match(
  television,
  /releaseReactionFlood\(reactionType\);\s*window\.IAMBroadcastInteractions\?\.sendBloom/s,
  "The sender Bloom must render before its asynchronous shared send."
);

assert.match(endpoint, /const BLOOM_PERSON_COOLDOWN_MS = 2000;/, "Bloom personal cadence must remain conservative.");
assert.match(endpoint, /const BLOOM_PERSON_LIMIT_PER_MINUTE = 6;/, "Bloom personal minute limit must remain conservative.");
assert.match(endpoint, /const DOVE_GLOBAL_GAP_MS = 6000;/, "The shared dove needs a longer global recovery gap.");
assert.match(endpoint, /const MANTRA_PERSON_COOLDOWN_MS = 1500;/, "Mantra sharing needs only an accidental double-tap guard; local pads must never lock.");
assert.match(endpoint, /const MANTRA_GLOBAL_LIMIT_PER_MINUTE = 2;/, "No more than two shared mantras may start per minute.");
assert.match(endpoint, /const MANTRA_QUIET_MS = 8000;/, "Every shared mantra must retain a quiet recovery interval.");
assert.match(endpoint, /\$current\['id'\].*=== \$assetId/s, "Matching mantra taps must coalesce during playback.");
assert.match(endpoint, /shared_queue_full/, "Competing mantras must not create an unbounded queue.");
assert.match(endpoint, /recent_event_ids/, "Repeated network events must be idempotent.");
assert.match(endpoint, /source_event_ids/, "Shared events must identify contributing taps so senders do not replay delayed echoes.");
assert.match(endpoint, /ALLOWED_BLOOM_IDS/, "Arbitrary visual events must not be accepted.");
assert.match(endpoint, /mantra_durations_ms\(\)/, "Arbitrary audio events must not be accepted.");
assert.match(endpoint, /staging\.universalmind\.tv/, "The coordinator must remain staging-only.");
assert.match(endpoint, /flock\(\$handle, LOCK_EX\)/, "Concurrent interactions must be serialized.");
assert.doesNotMatch(endpoint, /\$input\[(?:'text'|'url'|'audio'|'asset_url')\]/, "The coordinator must not accept arbitrary text, URLs or audio.");

const interactionToken = `broadcast-interactions-${createHash("sha256").update(interactions).digest("hex").slice(0, 12)}`;
for (const page of [index, televisionPage]) {
  assert.match(page, /iam-broadcast-interaction-endpoint/, "A broadcast page is missing the staging interaction endpoint.");
  assert.match(page, /content="api\/broadcast-interactions\.php"/, "A broadcast page must use the existing Panthur staging backend.");
  assert.ok(page.includes(`broadcast-interactions-v1.js?v=${interactionToken}`), `The interaction cache token must be ${interactionToken}.`);
}

console.log(`Broadcast interactions preflight passed (${interactionToken}): nine shared Music streams, six approved Blooms, every playable library mantra, deterministic cadence and programme-isolated same-origin coordination.`);
