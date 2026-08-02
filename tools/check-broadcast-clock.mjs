import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IAM_DIR = path.join(ROOT, "i  a m");
const schedule = JSON.parse(await fs.readFile(path.join(IAM_DIR, "broadcast-schedule-v1.json"), "utf8"));
const controller = await fs.readFile(path.join(IAM_DIR, "adaptive-environment-television.js"), "utf8");
const clockController = await fs.readFile(path.join(IAM_DIR, "broadcast-clock-v1.js"), "utf8");
const streamCatalogue = await fs.readFile(path.join(IAM_DIR, "cloudflare-stream-catalogue.js"), "utf8");
const index = await fs.readFile(path.join(IAM_DIR, "index.html"), "utf8");
const endpoint = await fs.readFile(path.join(IAM_DIR, "api", "broadcast-clock.php"), "utf8");
const stationTensor = JSON.parse(await fs.readFile(path.join(IAM_DIR, "radio-station-tensor-notion-export-v1.0.json"), "utf8"));

const crossFormatEditorialIds = ["inner-planes", "champagne-bohemia", "modul8-infinity", "james-bondage"];
const playableEditorialIds = [...crossFormatEditorialIds, "safety-cushion"];
const canonicalMusicRoomIds = playableEditorialIds;
const safetyCushionVideoAssets = [
  { trackId: "the-church-under-the-milky-way", fileName: "The Church - Under The Milky Way.mp4", uid: "19712d560f74ab319f60a224686dc7e1", duration: 298.396 },
  { trackId: "toto-africa", fileName: "Toto - Africa.mp4", uid: "e9e7a71c6463d30ad68153a87caf8666", duration: 271.298 },
  { trackId: "peter-gabriel-sledgehammer", fileName: "Peter Gabriel - Sledgehammer.mp4", uid: "d27b2cbadecf9e82bb1ae4f87566bb0f", duration: 345 },
  { trackId: "time-bandits-im-only-shooting-love", fileName: "Time Bandits - I'm Only Shooting Love.mp4", uid: "5df603b212bf6f86012b33afb42208bd", duration: 255.39 },
  { trackId: "the-smiths-how-soon-is-now", fileName: "The Smiths - How Soon Is Now.mp4", uid: "868cb171465d3b5f9987e3525ff9853e", duration: 215.9 },
  { trackId: "tears-for-fears-head-over-heels", fileName: "Tears For Fears - Head Over Heels.mp4", uid: "c172b678ede9d181b364254edb950468", duration: 255.39 },
  { trackId: "phil-collins-in-the-air-tonight", fileName: "Phil Collins - In The Air Tonight.mp4", uid: "d75e5205f40538c5ea95774d0fc879a4", duration: 293.09 },
  { trackId: "mondo-rock-come-said-the-boy", fileName: "Mondo Rock - Come Said The Boy.mp4", uid: "46dfff07c7055ea713be6fe202e2d297", duration: 282 },
  { trackId: "inxs-dont-change", fileName: "INXS - Don't Change.mp4", uid: "c2798773d4d87e3c8b4d7e9e02bdb83f", duration: 270.1 },
  { trackId: "kate-bush-running-up-that-hill", fileName: "Kate Bush - Running Up That Hill.mp4", uid: "d2b7246f4e982309ad26f079716ce915", duration: 295.79 },
  { trackId: "men-at-work-who-can-it-be-now", fileName: "Men At Work - Who Can It Be Now.mp4", uid: "4eb95e6ed02bb1ba4370d5ce8ce54fd0", duration: 207.79 },
  { trackId: "eurythmics-here-comes-the-rain-again", fileName: "Eurythmics - Here Comes The Rain Again.mp4", uid: "a4f7350e7ef712c8e12d41edcff93c27", duration: 283.5 },
  { trackId: "icehouse-electric-blue", fileName: "ICEHOUSE - Electric Blue.mp4", uid: "e268a70974dc3fe8e57d73cbb45ab9f6", duration: 276.276 },
  { trackId: "david-bowie-fashion", fileName: "David Bowie - Fashion.mp4", uid: "61aa02fa6544ab7b2ccd5be88fc274f6", duration: 207.79 },
  { trackId: "gerry-rafferty-baker-street", fileName: "Gerry Rafferty - Baker Street.mp4", uid: "38d0a05ae045cf99f369277b09e91ab7", duration: 371.8 },
  { trackId: "fleetwood-mac-everywhere", fileName: "Fleetwood Mac - Everywhere.mp4", uid: "aa4e1c6c9d63e4ed6a92037d753134da", duration: 219.496 },
  { trackId: "echo-and-the-bunnymen-the-killing-moon", fileName: "Echo & The Bunnymen - The Killing Moon.mp4", uid: "edbb056c0a295753a79c8b41d5122b2e", duration: 294.09 },
  { trackId: "dave-dobbyn-slice-of-heaven", fileName: "Dave Dobbyn - Slice of Heaven.mp4", uid: "fd1197c35a1d050846124def4d79c04d", duration: 250.39 },
  { trackId: "don-henley-the-boys-of-summer", fileName: "Don Henley - The Boys Of Summer.mp4", uid: "79a793ca8abc307e78a14221bc4ecb34", duration: 285.594 },
  { trackId: "billy-idol-eyes-without-a-face", fileName: "Billy Idol - Eyes Without A Face.mp4", uid: "6079e8e9ff406dc5e3b036f9df8242ce", duration: 294.492 },
  { trackId: "dig-two-way-dreamtime", fileName: "D I G Two Way Dreamtime.mp4", uid: "ff80e2452cc9a8781c09070ba7b6882e", duration: 239.2 },
];
const videoDurations = new Map([
  ["madonna-frozen", 329],
  ["madonna-ray-of-light", 306.994],
  ["rihanna-diamonds", 282.79],
  ["bjork-hyperballad", 239.29],
  ["tame-impala-the-less-i-know-the-better", 342.79],
  ["flume-tiny-cities", 236.59],
  ["flume-never-be-like-you-laneway", 336.79],
  ["grimes-genesis", 332.298],
  ["solange-cranes-in-the-sky", 272.198],
  ["little-simz-gorilla", 244.494],
  ["the-prodigy-everybody-in-the-place", 231],
  ["nightmares-on-wax-shape-the-future", 247.5],
  ["mia-borders", 282.7],
  ["sampa-the-great-energy", 307.9],
  ["sampa-the-great-final-form", 215],
  ["dua-lipa-be-the-one-glastonbury-2017", 209.298],
  ["charli-xcx-house-john-cale", 196],
  ["pinkpantheress-illegal-glastonbury-2025", 141.1],
  ["caroline-polachek-welcome-to-my-island", 236.092],
  ["u2-numb", 260.39],
  ["linkin-park-numb-official", 187.094],
  ["linkin-park-numb-live-2024", 192.098],
  ...safetyCushionVideoAssets.map(({ trackId, duration }) => [trackId, duration]),
]);
const djDurations = new Map([
  ["sasha-ibiza-boat-at-sunset-freqways", 5273.194],
  ["ben-bohmer-cappadocia-cercle", 5068.1],
  ["peggy-gou-palais-des-beaux-arts-cercle", 6500],
  ["miss-monique-biosphere-montreal-cercle", 7985.5],
  ["nina-kraviz-eiffel-tower-cercle", 6762.9],
  ["nastia-drum-bass-sunset-the-lab-ibiza", 5135.2],
  ["carl-cox-chateau-de-chambord-cercle", 7986.09],
  ["max-richter-cercle-odyssey-paris", 3729.19],
  ["olafur-arnalds-hafursey-iceland-cercle", 5242.2],
  ["zip-perlon-air-festival-2007", 11255.780136],
  ["zip-sammy-d-perlon-betalounge-2000", 13194.739229],
]);
const programmeTensor = JSON.parse(await fs.readFile(path.join(IAM_DIR, "programme-tensor-approved-notion-export-v1.0.json"), "utf8"));
for (const record of programmeTensor.records) {
  const profile = JSON.parse(record["JSON Profile"]);
  const target = profile.broadcast_channel?.startsWith("video-") ? videoDurations : djDurations;
  target.set(profile.selected_track_id, profile.duration_seconds);
}
const fashionRunwayIds = new Set([
  "chanel-paris-rooftops",
  "jacquemus-le-coup-de-soleil",
  "annies-ibiza-runway",
  "dolce-gabbana-valley-of-the-temples",
  "mugler-fall-winter-2021",
  "wolford-sergio-rossi-capsule",
]);
const privateRadioVisualIds = new Set(["inner-planes-radio-blue-pearl"]);
const approvedStationIds = new Set(
  stationTensor.records
    .filter((station) => !station.status || station.status === "Approved")
    .map((station) => station.id)
);

assert.equal(schedule.stage, "five_music_rooms_live_safety_cushion_ready");
assert.deepEqual(schedule.music_rooms.map((room) => room.id), canonicalMusicRoomIds);
const safetyCushion = schedule.music_rooms.find((room) => room.id === "safety-cushion");
assert.deepEqual(safetyCushion.allowed_formats, ["videos"]);
assert.equal(safetyCushion.catalogue_status, "ready");
const safetyCushionChannel = schedule.channels.find((channel) => channel.id === "video-safety-cushion");
assert.ok(safetyCushionChannel, "Safety Cushion must expose its approved Videos channel.");
assert.equal(safetyCushionChannel.format, "videos");
assert.equal(safetyCushionChannel.media_type, "video");
assert.ok(Number.isFinite(Date.parse(schedule.epoch_utc)), "The shared UTC epoch must be valid.");
assert.deepEqual(
  schedule.planning_markets.map((market) => market.name),
  ["Sydney", "Los Angeles", "Ibiza"]
);
assert.deepEqual(
  schedule.planning_markets.map((market) => market.time_zone),
  ["Australia/Sydney", "America/Los_Angeles", "Europe/Madrid"]
);
assert.equal(schedule.channels.length, 17, "The schedule must expose thirteen public Music channels, three public Fashion channels and one private Radio visual channel.");

for (const format of ["videos", "parties", "radio"]) {
  const channels = schedule.channels.filter((channel) => channel.format === format);
  const expectedEditorialIds = format === "videos" ? playableEditorialIds : crossFormatEditorialIds;
  assert.equal(channels.length, expectedEditorialIds.length, `${format} must expose its eligible editorial channels.`);
  assert.deepEqual(channels.map((channel) => channel.editorial_id), expectedEditorialIds);
  assert.deepEqual(
    channels.map((channel) => channel.name),
    format === "videos"
      ? ["Inner Planes", "Champagne Bohemia", "modul8 infinity", "james bondage", "safety cushion"]
      : ["Inner Planes", "Champagne Bohemia", "modul8 infinity", "james bondage"]
  );
}
assert.deepEqual(
  schedule.channels.filter((channel) => channel.format === "fashion").map((channel) => channel.energy_id),
  ["restore", "social-uplift", "underground-intensity"],
  "The public Fashion shelf remains an exact three-way visual pairing system."
);
assert.deepEqual(
  schedule.channels.filter((channel) => channel.format === "radio-visual").map((channel) => channel.id),
  ["radio-visual-inner-planes"],
  "Inner Planes Radio must use one dedicated private visual channel."
);

const scheduledVideos = [];
const scheduledDjSets = [];
const scheduledDjSetChannels = new Map();
const scheduledStations = new Set();
const scheduledRunways = [];
for (const channel of schedule.channels) {
  const cycleSeconds = channel.schedule.reduce((sum, entry) => sum + Number(entry.duration_seconds), 0);
  assert.notEqual(channel.available, false, `${channel.name} must now expose its approved programming.`);
  assert.ok(cycleSeconds > 0, `${channel.name} must have a continuous cycle.`);

  if (channel.format === "videos") {
    assert.equal(channel.media_type, "video");
    for (const entry of channel.schedule) {
      assert.equal(Number(entry.duration_seconds), videoDurations.get(entry.track_id), `${entry.track_id} must use its measured HLS duration.`);
      assert.match(controller, new RegExp(`id: "${entry.track_id}"`), `${entry.track_id} must exist in the player catalogue.`);
      scheduledVideos.push(entry.track_id);
    }
  } else if (channel.format === "parties") {
    assert.ok(["video", "audio"].includes(channel.media_type));
    for (const entry of channel.schedule) {
      assert.equal(Number(entry.duration_seconds), djDurations.get(entry.track_id), `${entry.track_id} must use its encoded HLS duration.`);
      assert.match(controller, new RegExp(`id: "${entry.track_id}"`), `${entry.track_id} must exist in the player catalogue.`);
      scheduledDjSets.push(entry.track_id);
      const owners = scheduledDjSetChannels.get(entry.track_id) || new Set();
      owners.add(channel.id);
      scheduledDjSetChannels.set(entry.track_id, owners);
    }
    if (channel.id === "party-james-bondage") {
      assert.equal(channel.media_type, "video");
      assert.equal(channel.visual_channel_id, "fashion-underground-intensity");
      assert.deepEqual(channel.schedule.map((entry) => entry.media_type), ["audio", "audio", "video"]);
    }
  } else if (channel.format === "radio") {
    assert.equal(channel.media_type, "radio");
    assert.equal(cycleSeconds, 86400, `${channel.name} Radio must define one exact 24-hour timetable.`);
    const approvedRadioVisualChannels = {
      "radio-inner-planes": "radio-visual-inner-planes",
      "radio-champagne-bohemia": "fashion-restore",
      "radio-modul8-infinity": "fashion-social-uplift",
      "radio-james-bondage": "fashion-underground-intensity",
    };
    assert.equal(
      channel.visual_channel_id,
      approvedRadioVisualChannels[channel.id],
      `${channel.name} Radio must retain its approved Fashion pairing.`
    );
    for (const entry of channel.schedule) {
      assert.equal(Number(entry.duration_seconds), 7200, "Stage-one Radio blocks must be two hours.");
      assert.ok(approvedStationIds.has(entry.station_id), `${entry.station_id} must be an approved radio station.`);
      scheduledStations.add(entry.station_id);
    }
  } else if (channel.format === "fashion") {
    assert.equal(channel.media_type, "fashion");
    assert.equal(cycleSeconds, 1800, `${channel.name} Fashion must define one repeating 30-minute cycle.`);
    for (const entry of channel.schedule) {
      assert.equal(Number(entry.duration_seconds), 900, "Each Fashion film must occupy one 15-minute shared block.");
      assert.ok(fashionRunwayIds.has(entry.runway_id), `${entry.runway_id} must be a verified Fashion runway.`);
      assert.match(controller, new RegExp(`assetKey: "${entry.runway_id}"`), `${entry.runway_id} must exist in the Fashion catalogue.`);
      scheduledRunways.push(entry.runway_id);
    }
  } else {
    assert.equal(channel.format, "radio-visual");
    assert.equal(channel.internal, true, "The Inner Planes Radio visual channel must remain private.");
    assert.equal(channel.media_type, "fashion");
    assert.equal(cycleSeconds, 10045.51, "Pearl must use its exact encoded HLS duration.");
    assert.equal(channel.schedule.length, 1);
    for (const entry of channel.schedule) {
      assert.equal(Number(entry.duration_seconds), 10045.51);
      assert.ok(privateRadioVisualIds.has(entry.runway_id), `${entry.runway_id} must be the private Inner Planes Radio visual.`);
      assert.match(controller, new RegExp(`assetKey: "${entry.runway_id}"`), `${entry.runway_id} must exist in the visual catalogue.`);
    }
  }

  let cursor = 0;
  let slots = 0;
  while (cursor < 86400) {
    cursor += Number(channel.schedule[slots % channel.schedule.length].duration_seconds);
    slots += 1;
    assert.ok(slots < 1000, `${channel.name} schedule did not advance.`);
  }
}

assert.deepEqual(new Set(scheduledVideos), new Set(videoDurations.keys()), "All 43 verified music videos must belong to exactly one shared channel.");
assert.equal(scheduledVideos.length, videoDurations.size, "A music video cannot belong to more than one shared channel.");
assert.deepEqual(
  safetyCushionChannel.schedule.map((entry) => entry.track_id),
  safetyCushionVideoAssets.map((asset) => asset.trackId),
  "Safety Cushion must contain the exact 21 approved videos in one continuous cycle."
);
for (const asset of safetyCushionVideoAssets) {
  assert.ok(controller.includes(`id: "${asset.trackId}"`) && controller.includes(`a s s e t s/${asset.fileName}`), `${asset.trackId} must resolve to its approved player filename.`);
  assert.ok(streamCatalogue.includes(`${JSON.stringify(asset.fileName)}: ${JSON.stringify(asset.uid)}`), `${asset.fileName} must resolve to its exact Cloudflare Stream UID.`);
}
assert.ok(!scheduledVideos.includes("nine-inch-nails-closer-glastonbury-2026"), "The unverified Nine Inch Nails item must stay outside the shared broadcast.");
assert.deepEqual(new Set(scheduledDjSets), new Set(djDurations.keys()), "All ten approved DJ sets and mixes must belong to exactly one shared channel.");
assert.ok([...scheduledDjSetChannels.values()].every((owners) => owners.size === 1), "A DJ set cannot belong to more than one shared channel.");
assert.deepEqual(scheduledStations, new Set([...approvedStationIds].filter((id) => id !== "sanctuary-retro")), "Radio timetables must use the assigned music-room sources only.");
assert.ok(!scheduledStations.has("sanctuary-retro"), "Sanctuary Retro must not be misclassified as the video-only Safety Cushion room.");
assert.deepEqual(new Set(scheduledRunways), fashionRunwayIds, "All six Fashion films must belong to exactly one shared channel.");
assert.equal(scheduledRunways.length, fashionRunwayIds.size, "A Fashion film cannot belong to more than one shared channel.");
assert.ok(!scheduledRunways.some((runwayId) => privateRadioVisualIds.has(runwayId)), "Pearl must never enter the public Fashion shelf.");

assert.match(clockController, /serverNowMs - \(\(startedAt \+ endedAt\) \/ 2\)/, "Clock sync must compensate for request round-trip latency.");
assert.match(clockController, /clockAnchorServerMs \+ \(performanceNow - clockAnchorPerformanceMs\)/, "The shared clock must advance from a monotonic performance anchor.");
assert.match(clockController, /channel\.epochMs \+ \(\(cycleIndex \* channel\.cycleSeconds \+ cursor\) \* 1000\)/, "A room-specific programme epoch must not retime every other shared channel.");
assert.match(clockController, /normalizedChannel\(channel, scheduleEpochMs\)/, "Shared channels must inherit the global epoch unless their room defines its own anchor.");
assert.match(clockController, /CLOCK_RESYNC_INTERVAL_MS = 60000/, "The server clock must be reprobed periodically.");
assert.match(clockController, /CLOCK_SMOOTHING_FACTOR = \.25/, "Periodic clock corrections must be smoothed instead of stepping playback.");
assert.match(clockController, /positiveModulo\(elapsedSeconds, channel\.cycleSeconds\)/, "Channel state must repeat continuously from the shared epoch.");
assert.match(clockController, /channels\(format = ""\)/, "The clock must expose channels by media format.");
assert.match(clockController, /previousRunwayId/, "The shared clock must expose the previous Fashion programme.");
assert.match(controller, /channels\?\.\(mode\)/, "Videos, DJ Sets, Radio and Fashion must all resolve through the shared clock.");
assert.doesNotMatch(controller, /fastSeek|soft_slow|soft_catchup|playbackRate = driftSeconds/, "Shared playback must not use approximate seeks or audible tempo correction.");
assert.match(controller, /BROADCAST_REJOIN_DRIFT_SECONDS = 1\.5/, "Shared playback must ignore small drift and reserve seeks for material divergence.");
assert.match(controller, /BROADCAST_REJOIN_REQUIRED_SAMPLES = 3/, "A controlled rejoin must require consecutive drift samples.");
assert.match(controller, /BROADCAST_REJOIN_BUFFER_SECONDS = 12/, "A controlled rejoin must wait for a safe buffer.");
assert.match(controller, /BROADCAST_REJOIN_COOLDOWN_MS = 30000/, "Controlled rejoins must have a seek-storm cooldown.");
assert.match(controller, /media\.currentTime = targetSeconds/, "Controlled rejoins must use a precise currentTime assignment.");
assert.match(controller, /MUSIC_HANDOFF_PRELOAD_LEAD_SECONDS = 45/, "Every video channel must prepare its next programme before rollover.");
assert.match(controller, /preloadUpcomingMusicVideo\(state\)/, "Shared video playback must preload the next scheduled music video.");
assert.match(controller, /activateBufferedMusicHandoff/, "Shared video playback must activate a buffered incoming video instead of detaching the outgoing picture first.");
assert.match(controller, /waitForAlignedMusicVideo/, "The incoming video must be clock-aligned before it is revealed.");
assert.match(controller, /oldVideo\.pause\(\)[\s\S]*localVideo = incoming/, "The outgoing video must remain active until the incoming video is ready.");
assert.match(controller, /broadcastHandoffPlaybackRate = incoming\.playbackRate\.toFixed\(2\)/, "Completed handoffs must expose their locked playback rate for live QA.");
assert.match(clockController, /window\.location\.hostname === "staging\.universalmind\.tv"/, "Accelerated transition QA must remain staging-only.");
assert.match(clockController, /broadcast_qa_offset_seconds/, "Staging must support deterministic all-channel rollover proof.");
assert.match(controller, /broadcastCorrection = "live_station_locked"/, "Shared Radio must retain the station selected by the timetable.");
assert.match(controller, /\["parties", "radio", "videos"\]\.includes\(extendedSession\.format\)/, "The personal opening video must honour the assigned 80/10/10 extended-session format.");
assert.match(controller, /item\.editorialId === selectedRoom/, "The extended livestream must remain inside the needs-matched music room.");
assert.match(controller, /selectedRoom === "safety-cushion" && selectedFormat !== "videos"/, "Safety Cushion must remain video-only in the runtime handoff.");
assert.match(controller, /musicContinuationReason = "personal_opening_complete"/, "The needs-matched livestream invitation must follow the personal opening video.");
assert.match(controller, /radio_energy_match/, "Shared Radio must automatically pair with the matching Fashion energy channel.");
assert.match(controller, /joinRadioVisualBroadcastChannel/, "Shared Radio must use an independent visual layer instead of replacing public Fashion.");
assert.match(controller, /synchronizeRadioVisualBroadcastPlayback/, "The independent Radio visual must retain shared-clock synchronization.");
assert.match(controller, /synchronizeBroadcastMedia\(radioVisualVideo, targetSeconds/, "The independent Radio visual must use the same rate-locked rejoin policy.");
assert.match(controller, /radioIsActiveProgramme \? "radio-visual" : "music"/, "The crossfader right endpoint must remain the Radio visual while Radio is playing.");
assert.match(controller, /revealMinimumSeconds:\s*RADIO_FASHION_REVEAL_BUFFER_SECONDS/, "Shared Radio must begin its Fashion picture before the station safety buffer.");
assert.match(controller, /audio_party_visual_pair/, "James Bondage audio-led parties must pair with the Fashion broadcast clock.");
assert.match(controller, /startAudioLedParty/, "The Zip and Sammy D mixes must use the audio-led party player.");
assert.match(controller, /fashionBroadcastBlockRemainingSeconds/, "Fashion playback must remain locked to its 15-minute shared block.");
assert.match(controller, /musicShelfRecommendationIds/, "The recommended channel must be stored independently from fixed shelf order.");
assert.match(index, /data-broadcast-join>join the broadcast</);
assert.match(index, /data-broadcast-choose>choose another channel</);
assert.match(index, /data-broadcast-entry-vibe/);
assert.match(index, /data-broadcast-entry-format/);
assert.doesNotMatch(index, /data-broadcast-programme-(?:previous|now|next)/, "The noisy previous/now/next guide must stay out of the shared-channel view.");
assert.doesNotMatch(index, /data-music-mode="fashion"/, "Fashion must stay outside the Videos, Parties and Radio selector.");
assert.match(index, /data-video-mode="fashion"/, "Fashion must remain available through Mix.");
assert.match(index, /Fashion · shared channels/, "Mix > Fashion must open the three synchronized Fashion channels.");
assert.match(controller, /MUSIC_BROADCAST_FORMATS = \["videos", "parties", "radio"\]/, "The Music selector must expose exactly Videos, Parties and Radio.");
assert.match(controller, /is-current-broadcast/, "The exact joined channel must have a dedicated current state.");
assert.match(controller, /activeBroadcastChannelIdForMode/, "Current state must resolve from the joined broadcast channel ID.");
assert.doesNotMatch(controller, /VIBE · \$\{item\.broadcastChannelName\}/, "Generic VIBE hierarchy must not be overlaid on channel cards.");
assert.match(controller, /BROADCAST_EDITORIAL_ORDER = \["inner-planes", "champagne-bohemia", "modul8-infinity", "james-bondage", "safety-cushion"\]/);
assert.match(index, /data-music-mode="parties"[^>]*>Parties</);
assert.match(index, /CHANNEL · <strong data-broadcast-entry-vibe>INNER PLANES/);
assert.doesNotMatch(index, /data-broadcast-vod|watch from the beginning/i);
assert.doesNotMatch(controller, /watchBroadcastFromBeginning|watchFromBeginning|broadcast_watch_from_beginning/);
assert.match(index, /broadcast-clock-v1\.js/);
assert.match(endpoint, /microtime\(true\) \* 1000/);
assert.match(endpoint, /Cache-Control: no-store/);

console.log("Broadcast clock preflight passed: five canonical music rooms use buffered, clock-aligned video handoffs; Safety Cushion has one ready 21-track Videos feed and no Parties or Radio.");
