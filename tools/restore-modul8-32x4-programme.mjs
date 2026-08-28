import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const schedulePath = path.join(iam, "broadcast-schedule-v1.json");
const sha12 = (source) => crypto.createHash("sha256").update(source).digest("hex").slice(0, 12);

const newProgrammeIds = [
  "rihanna-global-citizens-festival-2016",
  "ricardo-villalobos-circoloco-dc10-ibiza-2026",
  "flume-coachella-2022-live",
  "fred-again-thomas-bangalter-usb002-alexandra-palace-2026",
  "skrillex-fred-again-four-tet-coachella",
];

const displacedOriginals = new Map([
  ["1:13", "anfisa-letyago-dj-mag-hq"],
  ["1:21", "cassy-sunday-school-miami"],
  ["2:2", "pete-cannon-manchester"],
  ["3:4", "lilly-palmer-dj-mag-hq"],
  ["3:22", "boys-noize-coachella-2026-live"],
]);

const insertionsAfter = {
  1: new Map([
    ["anfisa-letyago-dj-mag-hq", ["rihanna-global-citizens-festival-2016"]],
    ["charlotte-de-witte-tomorrowland-winter-2026", ["fred-again-thomas-bangalter-usb002-alexandra-palace-2026"]],
    ["cassy-sunday-school-miami", ["ricardo-villalobos-circoloco-dc10-ibiza-2026"]],
    ["pete-cannon-manchester", ["flume-coachella-2022-live"]],
    ["boys-noize-coachella-2026-live", ["skrillex-fred-again-four-tet-coachella"]],
  ]),
  2: new Map([
    ["charlotte-de-witte-tomorrowland-winter-2026", ["fred-again-thomas-bangalter-usb002-alexandra-palace-2026"]],
    ["pete-cannon-manchester", ["flume-coachella-2022-live"]],
    ["cassy-sunday-school-miami", ["ricardo-villalobos-circoloco-dc10-ibiza-2026"]],
    ["david-guetta-tomorrowland-2026", ["rihanna-global-citizens-festival-2016"]],
    ["boys-noize-coachella-2026-live", ["skrillex-fred-again-four-tet-coachella"]],
  ]),
  3: new Map([
    ["lilly-palmer-dj-mag-hq", ["fred-again-thomas-bangalter-usb002-alexandra-palace-2026"]],
    ["pete-cannon-manchester", ["flume-coachella-2022-live"]],
    ["david-guetta-tomorrowland-2026", ["rihanna-global-citizens-festival-2016"]],
    ["ricardo-villalobos-arpiar-circo-loco-ibiza", ["ricardo-villalobos-circoloco-dc10-ibiza-2026"]],
    ["boys-noize-coachella-2026-live", ["skrillex-fred-again-four-tet-coachella"]],
  ]),
  4: new Map([
    ["charlotte-de-witte-tomorrowland-winter-2026", ["fred-again-thomas-bangalter-usb002-alexandra-palace-2026"]],
    ["david-guetta-tomorrowland-2026", ["rihanna-global-citizens-festival-2016"]],
    ["cassy-sunday-school-miami", ["ricardo-villalobos-circoloco-dc10-ibiza-2026"]],
    ["boys-noize-coachella-2026-live", ["skrillex-fred-again-four-tet-coachella"]],
    ["pete-cannon-manchester", ["flume-coachella-2022-live"]],
  ]),
};

const energyProfiles = {
  "sven-vath-tomorrowland-belgium-2016": { phase: "Rolling + positive", opening: 4, middle: 4.5, closing: 4, arousal: .92, calm: .18 },
  "ellen-allien-le-jardin-suspendu-paris": { phase: "Warm + hypnotic", opening: 3, middle: 4, closing: 3, arousal: .88, calm: .22 },
  "ricardo-villalobos-franco-cinelli-house-music-special": { phase: "Warm + hypnotic", opening: 2, middle: 3, closing: 2, arousal: .68, calm: .52 },
  "ricardo-villalobos-sunwaves-romania": { phase: "Warm + hypnotic", opening: 2, middle: 3, closing: 3, arousal: .68, calm: .52 },
  "ellen-allien-boiler-room-sydney": { phase: "Warm + hypnotic", opening: 3.5, middle: 4, closing: 3.5, arousal: .88, calm: .22 },
  "margaret-dygas-submarine": { phase: "Warm + hypnotic", opening: 2, middle: 3, closing: 2, arousal: .68, calm: .52 },
  "lilly-palmer-dj-mag-hq": { phase: "Warm + hypnotic", opening: 4.5, middle: 5, closing: 5, arousal: .98, calm: .08 },
  "sven-vath-awakenings-festival-2017": { phase: "Rolling + positive", opening: 4, middle: 5, closing: 4, arousal: .98, calm: .08 },
  "nastia-drum-bass-sunset-the-lab-ibiza": { phase: "Rolling + positive", opening: 4, middle: 5, closing: 5, arousal: .98, calm: .08 },
  "lilly-palmer-edc-las-vegas-2026": { phase: "Rolling + positive", opening: 4, middle: 5, closing: 3.5, arousal: .98, calm: .08 },
  "ricardo-villalobos-ruta-5-sacre-paris": { phase: "Warm + hypnotic", opening: 2, middle: 3, closing: 2, arousal: .68, calm: .52 },
  "nina-kraviz-eiffel-tower-cercle": { phase: "Rolling + positive", opening: 3, middle: 5, closing: 4, arousal: .96, calm: .08 },
  "anfisa-letyago-dj-mag-hq": { phase: "Warm + hypnotic", opening: 4, middle: 5, closing: 4, arousal: .98, calm: .08 },
  "charlotte-de-witte-tomorrowland-winter-2026": { phase: "Rolling + positive", opening: 4, middle: 5, closing: 4.5, arousal: .98, calm: .08 },
  "miss-monique-biosphere-montreal-cercle": { phase: "Warm + hypnotic", opening: 3, middle: 4, closing: 4, arousal: .92, calm: .24 },
  "peggy-gou-palais-des-beaux-arts-cercle": { phase: "Warm + hypnotic", opening: 3, middle: 4, closing: 4, arousal: .9, calm: .26 },
  "sven-vath-boiler-room-marseille": { phase: "Warm + hypnotic", opening: 3, middle: 4, closing: 3, arousal: .88, calm: .22 },
  "sonja-moonear-trotamundo-lost-beach-club": { phase: "Warm + hypnotic", opening: 2, middle: 3, closing: 3, arousal: .68, calm: .52 },
  "lilly-palmer-stone-quarry-germany": { phase: "Rolling + positive", opening: 4, middle: 5, closing: 5, arousal: .98, calm: .08 },
  "carl-cox-chateau-de-chambord-cercle": { phase: "Rolling + positive", opening: 3.5, middle: 4.5, closing: 4, arousal: .96, calm: .1 },
  "cassy-sunday-school-miami": { phase: "Warm + hypnotic", opening: 2, middle: 3, closing: 2, arousal: .68, calm: .52 },
  "ricardo-villalobos-arpiar-circo-loco-ibiza": { phase: "Warm + hypnotic", opening: 2, middle: 3, closing: 3, arousal: .68, calm: .52 },
  "david-guetta-tomorrowland-2026": { phase: "Warm + hypnotic", opening: 4, middle: 5, closing: 5, arousal: .92, calm: .18 },
  "pete-cannon-manchester": { phase: "Rolling + positive", opening: 4, middle: 5, closing: 5, arousal: .98, calm: .08 },
  "maayan-nidam-boiler-room-bucharest": { phase: "Warm + hypnotic", opening: 2, middle: 3, closing: 3, arousal: .68, calm: .52 },
  "boys-noize-coachella-2026-live": { phase: "Rolling + positive", opening: 4, middle: 5, closing: 4, arousal: .92, calm: .18 },
  "sonja-moonear-tomorrowland-belgium-2016": { phase: "Warm + hypnotic", opening: 2, middle: 3, closing: 3, arousal: .68, calm: .52 },
  "rihanna-global-citizens-festival-2016": { phase: "Rolling + positive", direction: "Rise", opening: 3.5, middle: 4.5, closing: 4, arousal: .88, calm: .18 },
  "ricardo-villalobos-circoloco-dc10-ibiza-2026": { phase: "Warm + hypnotic", direction: "Hold", opening: 2, middle: 3, closing: 3, arousal: .68, calm: .52 },
  "flume-coachella-2022-live": { phase: "Build + movement", direction: "Rise", opening: 3.5, middle: 4.5, closing: 4, arousal: .88, calm: .2 },
  "fred-again-thomas-bangalter-usb002-alexandra-palace-2026": { phase: "Peak + release", direction: "Release", opening: 4, middle: 5, closing: 4.5, arousal: .96, calm: .08 },
  "skrillex-fred-again-four-tet-coachella": { phase: "Peak + release", direction: "Release", opening: 4.5, middle: 5, closing: 5, arousal: .98, calm: .06 },
};

const markets = [
  { key: "sydney", label: "Sydney", timeZone: "Australia/Sydney", latitude: -33.8688, longitude: 151.2093 },
  { key: "ibiza", label: "Ibiza", timeZone: "Europe/Madrid", latitude: 38.9067, longitude: 1.4206 },
  { key: "los_angeles", label: "Los Angeles", timeZone: "America/Los_Angeles", latitude: 34.0522, longitude: -118.2437 },
];

const normalizedDegrees = (value) => ((value % 360) + 360) % 360;
const radians = (degrees) => degrees * Math.PI / 180;
const degrees = (radiansValue) => radiansValue * 180 / Math.PI;

function localDateParts(timestampMs, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(timestampMs)).filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: parts.weekday,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

function dayOfYear(year, month, day) {
  return Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86400000);
}

function solarEventUtcMs(year, month, day, latitude, longitude, sunrise) {
  const zenith = 90.833;
  const dayNumber = dayOfYear(year, month, day);
  const longitudeHour = longitude / 15;
  const approximateTime = dayNumber + (((sunrise ? 6 : 18) - longitudeHour) / 24);
  const meanAnomaly = (0.9856 * approximateTime) - 3.289;
  const trueLongitude = normalizedDegrees(
    meanAnomaly + (1.916 * Math.sin(radians(meanAnomaly))) + (0.02 * Math.sin(radians(2 * meanAnomaly))) + 282.634,
  );
  let rightAscension = normalizedDegrees(degrees(Math.atan(0.91764 * Math.tan(radians(trueLongitude)))));
  rightAscension += Math.floor(trueLongitude / 90) * 90 - Math.floor(rightAscension / 90) * 90;
  rightAscension /= 15;
  const sinDeclination = 0.39782 * Math.sin(radians(trueLongitude));
  const cosDeclination = Math.cos(Math.asin(sinDeclination));
  const cosHour = (
    Math.cos(radians(zenith)) - (sinDeclination * Math.sin(radians(latitude)))
  ) / (cosDeclination * Math.cos(radians(latitude)));
  if (cosHour < -1 || cosHour > 1) return null;
  const localHour = (sunrise ? 360 - degrees(Math.acos(cosHour)) : degrees(Math.acos(cosHour))) / 15;
  const localMeanTime = localHour + rightAscension - (0.06571 * approximateTime) - 6.622;
  const utcHour = ((localMeanTime - longitudeHour) % 24 + 24) % 24;
  return Date.UTC(year, month - 1, day) + (utcHour * 3600000);
}

function localClock(timestampMs, timeZone) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(timestampMs));
}

function clockOnly(timestampMs, timeZone) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(timestampMs));
}

function daypart(hour) {
  if (hour < 6) return "Overnight";
  if (hour < 10) return "Morning";
  if (hour < 18) return "Daytime";
  if (hour < 22) return "Evening";
  return "Late night";
}

function solarPhase(timestampMs, market) {
  const local = localDateParts(timestampMs, market.timeZone);
  const targetDate = `${local.year}-${String(local.month).padStart(2, "0")}-${String(local.day).padStart(2, "0")}`;
  const alignToLocalDate = (candidateMs) => {
    if (!Number.isFinite(candidateMs)) return null;
    return [-2, -1, 0, 1, 2]
      .map((dayOffset) => candidateMs + (dayOffset * 86400000))
      .find((alignedMs) => {
        const aligned = localDateParts(alignedMs, market.timeZone);
        return `${aligned.year}-${String(aligned.month).padStart(2, "0")}-${String(aligned.day).padStart(2, "0")}` === targetDate;
      }) ?? null;
  };
  const sunriseMs = alignToLocalDate(solarEventUtcMs(local.year, local.month, local.day, market.latitude, market.longitude, true));
  const sunsetMs = alignToLocalDate(solarEventUtcMs(local.year, local.month, local.day, market.latitude, market.longitude, false));
  if (!Number.isFinite(sunriseMs) || !Number.isFinite(sunsetMs)) return { phase: "unknown", sunrise: null, sunset: null };
  const phase = timestampMs < sunriseMs - (90 * 60000)
    ? "night"
    : timestampMs < sunriseMs
      ? "pre-dawn"
      : timestampMs < sunriseMs + (90 * 60000)
        ? "sunrise"
        : timestampMs < sunsetMs - (90 * 60000)
          ? "daylight"
          : timestampMs < sunsetMs + (60 * 60000)
            ? "sunset"
            : "night";
  return {
    phase,
    sunrise: clockOnly(sunriseMs, market.timeZone),
    sunset: clockOnly(sunsetMs, market.timeZone),
  };
}

function anchorContext(startMs, endMs) {
  return Object.fromEntries(markets.map((market) => {
    const local = localDateParts(startMs, market.timeZone);
    const solar = solarPhase(startMs, market);
    return [market.key, {
      start: localClock(startMs, market.timeZone),
      end: localClock(endMs, market.timeZone),
      daypart: daypart(local.hour),
      solar_phase: solar.phase,
      sunrise: solar.sunrise,
      sunset: solar.sunset,
    }];
  }));
}

const schedule = JSON.parse(await fs.readFile(schedulePath, "utf8"));
const modul8 = schedule.channels.find(({ id }) => id === "party-modul8-infinity");
if (!modul8) throw new Error("Missing party-modul8-infinity schedule");

const durationById = new Map(modul8.schedule.map(({ track_id: trackId, duration_seconds: durationSeconds }) => [trackId, Number(durationSeconds)]));
for (const [id, durationSeconds] of [
  ["anfisa-letyago-dj-mag-hq", 3628.37],
  ["cassy-sunday-school-miami", 2512.52],
  ["pete-cannon-manchester", 10593.78],
  ["lilly-palmer-dj-mag-hq", 3459.98],
  ["boys-noize-coachella-2026-live", 4553.85],
]) durationById.set(id, durationSeconds);

const originalPasses = new Map();
for (let pass = 1; pass <= 4; pass += 1) {
  const currentPassEntries = modul8.schedule
    .filter(({ global_week_pass: currentPass }) => currentPass === pass)
    .sort((a, b) => a.global_week_position - b.global_week_position);
  const entries = currentPassEntries.length === 32
    ? currentPassEntries
      .filter(({ track_id: trackId }) => !newProgrammeIds.includes(trackId))
      .map((current) => ({ track_id: current.track_id, duration_seconds: durationById.get(current.track_id) }))
    : currentPassEntries.map((current) => ({
      track_id: displacedOriginals.get(`${pass}:${current.global_week_position}`) || current.track_id,
      duration_seconds: durationById.get(displacedOriginals.get(`${pass}:${current.global_week_position}`) || current.track_id),
    }));
  if (entries.length !== 27 || new Set(entries.map(({ track_id: trackId }) => trackId)).size !== 27) {
    throw new Error(`Pass ${pass} does not restore the complete 27-programme seed`);
  }
  originalPasses.set(pass, entries);
}

const expanded = [];
for (let pass = 1; pass <= 4; pass += 1) {
  for (const original of originalPasses.get(pass)) {
    expanded.push({ ...original, global_week_pass: pass });
    for (const insertedId of insertionsAfter[pass].get(original.track_id) || []) {
      expanded.push({
        track_id: insertedId,
        duration_seconds: durationById.get(insertedId),
        global_week_pass: pass,
      });
    }
  }
}

const anchorMs = Date.parse(modul8.epoch_utc || schedule.epoch_utc);
let cursorSeconds = 0;
for (let index = 0; index < expanded.length; index += 1) {
  const current = expanded[index];
  const startMs = anchorMs + (cursorSeconds * 1000);
  const endMs = startMs + (current.duration_seconds * 1000);
  const context = anchorContext(startMs, endMs);
  current.global_week_position = expanded.slice(0, index + 1).filter(({ global_week_pass: pass }) => pass === current.global_week_pass).length;
  current.rotation = current.global_week_pass;
  current.rotation_position = current.global_week_position;
  current.global_sequence = index + 1;
  current.start_offset_seconds = Number(cursorSeconds.toFixed(3));
  current.anchor_start_utc = new Date(startMs).toISOString();
  current.anchor_context = context;
  current.content_energy_profile = energyProfiles[current.track_id] || null;
  cursorSeconds += current.duration_seconds;
}

for (let pass = 1; pass <= 4; pass += 1) {
  const passEntries = expanded.filter(({ global_week_pass: currentPass }) => currentPass === pass);
  if (passEntries.length !== 32) throw new Error(`Pass ${pass} has ${passEntries.length} programmes instead of 32`);
  if (new Set(passEntries.map(({ track_id: trackId }) => trackId)).size !== 32) throw new Error(`Pass ${pass} does not contain 32 distinct programmes`);
  for (const id of newProgrammeIds) {
    if (passEntries.filter(({ track_id: trackId }) => trackId === id).length !== 1) throw new Error(`${id} is not present exactly once in pass ${pass}`);
  }
}

const cycleSeconds = expanded.reduce((sum, { duration_seconds: durationSeconds }) => sum + durationSeconds, 0);
if (Math.abs(cycleSeconds - 700317.8) > .01) throw new Error(`Unexpected expanded cycle length: ${cycleSeconds}`);

schedule.version = "broadcast_schedule_v1.14";
modul8.schedule = expanded;
modul8.global_week_programming = {
  strategy: "four_complete_32_programme_rotations_contextual_global_daypart_arc",
  anchor_utc: new Date(anchorMs).toISOString(),
  seed_programmes: 27,
  added_programmes: 5,
  distinct_programmes: 32,
  plays_per_programme: 4,
  rotations: 4,
  programmes_per_rotation: 32,
  occurrence_count: 128,
  cycle_seconds: cycleSeconds,
  cycle_duration: "194h 31m 58s",
  seven_day_variance_seconds: cycleSeconds - (7 * 24 * 60 * 60),
  priority_market: "Australia/Sydney",
  complementary_markets: ["Europe/Madrid", "America/Los_Angeles"],
  context_model: "Sydney work-day and night arc with per-occurrence Ibiza and Los Angeles local daypart plus sunrise/sunset seed context",
  duration_policy: "Complete source programmes; no truncation, omission or overlap",
};

await fs.writeFile(schedulePath, `${JSON.stringify(schedule, null, 2)}\n`);

const scheduleSource = await fs.readFile(schedulePath, "utf8");
const scheduleToken = `broadcast-schedule-${sha12(scheduleSource)}`;
for (const name of ["broadcast-clock-v1.js", "programme-guide.js"]) {
  const filePath = path.join(iam, name);
  const source = await fs.readFile(filePath, "utf8");
  await fs.writeFile(filePath, source.replace(/broadcast-schedule-[a-f0-9]{12}/g, scheduleToken));
}

const clockSource = await fs.readFile(path.join(iam, "broadcast-clock-v1.js"), "utf8");
const guideSource = await fs.readFile(path.join(iam, "programme-guide.js"), "utf8");
const clockToken = `broadcast-clock-${sha12(clockSource)}`;
const guideToken = `programme-guide-${sha12(guideSource)}`;
for (const name of ["index.html", "index-alt.html", "adaptive-environment-television.html", "program.html"]) {
  const filePath = path.join(iam, name);
  const source = await fs.readFile(filePath, "utf8");
  await fs.writeFile(filePath, source
    .replace(/broadcast-clock-[a-f0-9]{12}/g, clockToken)
    .replace(/programme-guide-[a-f0-9]{12}/g, guideToken));
}

console.log(JSON.stringify({
  version: schedule.version,
  occurrences: expanded.length,
  distinct_programmes: new Set(expanded.map(({ track_id: trackId }) => trackId)).size,
  cycle_seconds: cycleSeconds,
  cycle_duration: modul8.global_week_programming.cycle_duration,
  schedule_token: scheduleToken,
  clock_token: clockToken,
  guide_token: guideToken,
  new_programme_occurrences: Object.fromEntries(newProgrammeIds.map((id) => [id, expanded.filter(({ track_id: trackId }) => trackId === id).length])),
}, null, 2));
