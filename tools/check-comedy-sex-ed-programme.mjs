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

assert.equal(catalogue.totalComedySeconds, 29288.89, "The direct-entry Comedy wheel must last 08:08:08.89.");
assert.equal(comedy[0].artist, "Jarrad Wright", "The live Comedy wheel must open directly in Jarrad Wright programming.");
assert.deepEqual(
  comedy.map((item) => item.id),
  [
    "comedy-big-lez-show",
    "comedy-mike-nolan-show",
    "comedy-mike-nolans-long-weekend",
    "comedy-clarence-claymore",
    "comedy-sassy-the-sasquatch",
    "comedy-donny-clarence-show",
    "comedy-sassy-behind-the-scenes",
  ],
  "The live Comedy wheel must contain only the seven requested Jarrad Wright programme blocks.",
);
assert.equal(comedy.some((item) => item.id.includes("midnight-gospel")), false, "The Midnight Gospel trailer must remain out of the live wheel for now.");

assert.deepEqual(Array.from(comedy.find((item) => item.id === "comedy-big-lez-show").segments, (item) => item.title), ["Season 1", "Season 2", "Season 3", "Season 4"]);
assert.deepEqual(Array.from(comedy.find((item) => item.id === "comedy-mike-nolan-show").segments, (item) => item.title), ["Yeah Nah Yeah", "FTC", "Anotha Day Anotha Dolla", "Ding Dong Delli", "Lantana Bush"]);
assert.deepEqual(Array.from(comedy.find((item) => item.id === "comedy-donny-clarence-show").segments, (item) => item.title), ["Prankz", "Thunda", "Put Em Up", "Fore", "Grit Mailman", "Sugar Glider"]);

const uniqueComedyFiles = new Set(comedy.flatMap((item) => Array.from(item.segments).map((segment) => segment.fileName)));
assert.equal(uniqueComedyFiles.size, 19, "Every live Comedy source file must be represented exactly once.");
assert.equal(sexEd.length, 16);
assert.equal(Math.round(sexEd.reduce((sum, item) => sum + Number(item.durationSeconds || 0), 0) * 1000) / 1000, 46022.294, "All sixteen on-demand Sex-Ed lessons must retain their measured durations.");
assert.deepEqual(sexEd.slice(8).map((item) => [item.episode, item.title, item.artist]), [
  ["09", "Five Stages of Subspace", "Alesandra Madison"],
  ["10", "Subspace & Topspace", "Luna Agneya"],
  ["11", "Pleasuring a Woman", "Hitomi Mochizuki"],
  ["12", "BDSM: The New Religion?", "Gemma Li & Seraphyna"],
  ["13", "Submission & the Male Brain", "Alla Mephistopheles"],
  ["14", "Becoming NYC’s #1 Dominatrix", "Mistress Seren"],
  ["15", "Healing Sexual Trauma in Nature", "Shashi Solana"],
  ["16", "Dissolving Toxic Masculinity", "Karl Lagerfeld & Shashi Solana"],
]);
assert.ok(sexEd.slice(8, 14).every((item) => !item.presentation && !item.radioStation), "Episodes 09–14 must retain the standard EMDR presentation and private Sex Ed audio clock.");
assert.ok(sexEd.slice(14).every((item) => item.presentation === "jbh-editorial" && !item.radioStation), "Episodes 15–16 must use the new JBH editorial presentation with the private Sex Ed audio clock.");
assert.deepEqual(sexEd.slice(6, 8).map((item) => item.radioStation), ["cafe-del-mar-chill", "cafe-del-mar-chill"], "Only the two existing yoga episodes retain Cafe del Mar Chill.");
const newlyUploadedFiles = [...new Set(["The Midnight Gospel _ Official Trailer _ Netflix.mp4", ...uniqueComedyFiles, ...sexEd.slice(8).flatMap((item) => [item.fileName, item.backgroundFileName].filter(Boolean))])];
const newlyUploadedAssets = newlyUploadedFiles.map((fileName) => sandbox.window.IAMCloudflareStream.assetFor(fileName));
assert.equal(newlyUploadedFiles.length, 29);
assert.ok(newlyUploadedAssets.every((asset) => /^[a-f0-9]{32}$/.test(asset?.uid || "")), "All 29 requested source files must resolve to exact Cloudflare Stream UIDs.");
assert.equal(new Set(newlyUploadedAssets.map((asset) => asset.uid)).size, 29, "Every requested source file must resolve to its own Stream object.");

const comedyChannel = schedule.channels.find((channel) => channel.id === "comedy-jarrad-wright");
const sexEdAudioChannel = schedule.channels.find((channel) => channel.id === "sex-ed");
assert.deepEqual(comedyChannel.schedule.map((entry) => entry.track_id), comedy.map((item) => item.id));
assert.equal(comedyChannel.schedule.some((entry) => entry.track_id.includes("midnight-gospel")), false, "The public Comedy schedule must join live programming without a trailer interstitial.");
assert.equal(schedule.channels.some((channel) => channel.id === "sex-ed-james-bondage"), false, "Sex-Ed must not be represented as a false public 24/7 schedule.");
assert.equal(sexEdAudioChannel?.internal, true, "The private synchronized Zip audio channel must remain available to on-demand lessons.");
assert.match(guide, /channel\?\.format === mode && channel\?\.internal !== true/, "The private Sex Ed audio clock must never appear as a second public Sex Ed card.");
assert.equal((index.match(/data-program-mode="comedy"/g) || []).length, 1);
assert.equal((index.match(/data-program-sex-ed/g) || []).length, 1);
assert.match(index, /data-program-mode="comedy"[^>]*>COMEDY<[\s\S]{0,180}data-program-sex-ed[^>]*>SEX-ED</);
assert.equal((index.match(/data-sex-ed-card(?:\s|>)/g) || []).length, 16);
assert.match(index, /<p>16 lessons<\/p>/);
assert.match(index, /data-sex-ed-episode="15"[^>]*data-sex-ed-foreground-muted="true"[^>]*data-sex-ed-background-audible="true"[^>]*data-sex-ed-sensitive="pirelli-editor-note"/);
assert.match(index, /data-sex-ed-episode="16"[^>]*data-sex-ed-foreground-muted="false"[^>]*data-sex-ed-background-audible="false"[^>]*data-sex-ed-sync-layers="true"[^>]*data-sex-ed-sensitive="18-plus"/);
assert.match(comedyCss, /\.adaptive-television-comedy-video[\s\S]*?object-fit: cover/);
assert.match(comedyCss, /--comedy-crop-scale/);
assert.match(read("i  a m/programme-guide.css"), /\.program-panel__footer button\[hidden\][\s\S]*?display: none/, "Programme-only modes must not display the legacy MORE control.");
assert.match(comedyController, /segmentOffset/);
assert.match(comedyController, /currentTime = state\.segmentOffset/);
assert.match(comedyController, /function analyseEncodedBars\(\)/);
assert.match(comedyController, /leaveForNavigation/);
assert.doesNotMatch(index, /data-comedy-close|data-comedy-now/);
assert.match(guide, /IAMComedyChannel\?\.joinBroadcast/);
assert.match(guide, /IAMSexEdProgramme\?\.openShelf/);
assert.doesNotMatch(guide, /IAMSexEdProgramme\?\.openEpisode/);
assert.doesNotMatch(index, /__SEX_ED_\d+_UID__/);

new vm.Script(comedyController, { filename: "comedy-channel-v1.js" });
new vm.Script(guide, { filename: "programme-guide.js" });

console.log("Comedy and Sex Ed programme sequence, presentation, and navigation checks passed.");
