import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const source = read("i  a m/programme-catalogue-v1.js");
const streamSource = read("i  a m/cloudflare-stream-catalogue.js");
const schedule = JSON.parse(read("i  a m/broadcast-schedule-v1.json"));
const index = read("i  a m/index.html");
const comedyCss = read("i  a m/comedy-channel-v1.css");
const comedyController = read("i  a m/comedy-channel-v1.js");
const guide = read("i  a m/programme-guide.js");

const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: "programme-catalogue-v1.js" });
vm.runInNewContext(streamSource, sandbox, { filename: "cloudflare-stream-catalogue.js" });
const catalogue = sandbox.window.IAMProgrammeCatalogue;
const comedy = Array.from(catalogue.comedyProgrammes);
const sexEd = Array.from(catalogue.sexEdEpisodes);

assert.equal(catalogue.totalComedySeconds, 30299.27, "The leading-trailer Comedy wheel must last 08:24:59.27.");
assert.deepEqual(
  comedy.map((item) => item.id),
  [
    "comedy-midnight-gospel-trailer",
    "comedy-big-lez-show",
    "comedy-midnight-gospel-trailer-2",
    "comedy-mike-nolan-show",
    "comedy-midnight-gospel-trailer-3",
    "comedy-mike-nolans-long-weekend",
    "comedy-midnight-gospel-trailer-4",
    "comedy-clarence-claymore",
    "comedy-midnight-gospel-trailer-5",
    "comedy-sassy-the-sasquatch",
    "comedy-midnight-gospel-trailer-6",
    "comedy-donny-clarence-show",
    "comedy-midnight-gospel-trailer-7",
    "comedy-sassy-behind-the-scenes",
  ],
  "The Midnight Gospel trailer must lead the wheel and separate every Comedy series block.",
);

assert.deepEqual(Array.from(comedy.find((item) => item.id === "comedy-big-lez-show").segments, (item) => item.title), ["Season 1", "Season 2", "Season 3", "Season 4"]);
assert.deepEqual(Array.from(comedy.find((item) => item.id === "comedy-mike-nolan-show").segments, (item) => item.title), ["Yeah Nah Yeah", "FTC", "Anotha Day Anotha Dolla", "Ding Dong Delli", "Lantana Bush"]);
assert.deepEqual(Array.from(comedy.find((item) => item.id === "comedy-donny-clarence-show").segments, (item) => item.title), ["Prankz", "Thunda", "Put Em Up", "Fore", "Grit Mailman", "Sugar Glider"]);

const uniqueComedyFiles = new Set(comedy.flatMap((item) => Array.from(item.segments).map((segment) => segment.fileName)));
assert.equal(uniqueComedyFiles.size, 20, "Every requested Comedy source file must be represented once, with the trailer reused only as a separator.");
assert.equal(sexEd.length, 14);
assert.equal(Math.round(sexEd.reduce((sum, item) => sum + Number(item.durationSeconds || 0), 0) * 1000) / 1000, 41254.854, "The full Sex Ed wheel must remain inside the 12-hour Program horizon.");
assert.deepEqual(sexEd.slice(8).map((item) => [item.episode, item.title, item.artist]), [
  ["09", "Five Stages of Subspace", "Alesandra Madison"],
  ["10", "Subspace & Topspace", "Luna Agneya"],
  ["11", "Pleasuring a Woman", "Hitomi Mochizuki"],
  ["12", "BDSM: The New Religion?", "Gemma Li & Seraphyna"],
  ["13", "Submission & the Male Brain", "Alla Mephistopheles"],
  ["14", "Becoming NYC’s #1 Dominatrix", "Mistress Seren"],
]);
assert.ok(sexEd.slice(8).every((item) => !item.presentation && !item.radioStation), "New Sex Ed episodes must use the standard EMDR presentation and private Sex Ed audio clock.");
assert.deepEqual(sexEd.slice(6, 8).map((item) => item.radioStation), ["cafe-del-mar-chill", "cafe-del-mar-chill"], "Only the two existing yoga episodes retain Cafe del Mar Chill.");
const newlyUploadedFiles = [...uniqueComedyFiles, ...sexEd.slice(8).map((item) => item.fileName)];
const newlyUploadedAssets = newlyUploadedFiles.map((fileName) => sandbox.window.IAMCloudflareStream.assetFor(fileName));
assert.equal(newlyUploadedFiles.length, 26);
assert.ok(newlyUploadedAssets.every((asset) => /^[a-f0-9]{32}$/.test(asset?.uid || "")), "All 26 requested source files must resolve to exact Cloudflare Stream UIDs.");
assert.equal(new Set(newlyUploadedAssets.map((asset) => asset.uid)).size, 26, "Every requested source file must resolve to its own Stream object.");

const comedyChannel = schedule.channels.find((channel) => channel.id === "comedy-jarrad-wright");
const sexEdChannel = schedule.channels.find((channel) => channel.id === "sex-ed-james-bondage");
assert.deepEqual(comedyChannel.schedule.map((entry) => entry.track_id), comedy.map((item) => item.id));
assert.deepEqual(sexEdChannel.schedule.map((entry) => entry.track_id), sexEd.map((item) => item.id));
assert.match(guide, /channel\?\.format === mode && channel\?\.internal !== true/, "The private Sex Ed audio clock must never appear as a second public Sex Ed card.");
assert.equal((index.match(/data-program-mode="comedy"/g) || []).length, 1);
assert.equal((index.match(/data-program-mode="sex-ed"/g) || []).length, 1);
assert.equal((index.match(/data-sex-ed-card(?:\s|>)/g) || []).length, 14);
assert.match(comedyCss, /\.adaptive-television-comedy-video[\s\S]*?object-fit: cover/);
assert.match(read("i  a m/programme-guide.css"), /\.program-panel__footer button\[hidden\][\s\S]*?display: none/, "Programme-only modes must not display the legacy MORE control.");
assert.match(comedyController, /segmentOffset/);
assert.match(comedyController, /currentTime = state\.segmentOffset/);
assert.match(guide, /IAMComedyChannel\?\.joinBroadcast/);
assert.match(guide, /IAMSexEdProgramme\?\.openEpisode/);
assert.doesNotMatch(index, /__SEX_ED_\d+_UID__/);

new vm.Script(comedyController, { filename: "comedy-channel-v1.js" });
new vm.Script(guide, { filename: "programme-guide.js" });

console.log("Comedy and Sex Ed programme sequence, presentation, and navigation checks passed.");
