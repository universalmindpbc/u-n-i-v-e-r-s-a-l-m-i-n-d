import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const index = read("i  a m/index.html");
const controller = read("i  a m/adaptive-environment-television.js");
const styles = read("i  a m/adaptive-environment-television.css");
const catalogueSource = read("i  a m/cloudflare-stream-catalogue.js");
const manifest = JSON.parse(read("cloudflare-stream-new-videos-20260830-manifest.json"));
const ethicsManifest = JSON.parse(read("cloudflare-stream-jbh-ethics-20260831-manifest.json"));

const sandbox = { window: {} };
vm.runInNewContext(catalogueSource, sandbox, { filename: "cloudflare-stream-catalogue.js" });

const expectedStreams = new Map([
  ["Karl Lagerfeld & Shashi Solluna - Nice Guy vs. Toxic Masculinity.mp4", "2c099816dba26973d4d4d36452d05f99"],
  ["Pirelli 2010 Calendar.mp4", "3be25d8ba3bb884e35ab57cc6f5c43c3"],
  ["Shashi Solluna - How I Healed my Sexual Pain using Nature.mp4", "d064fc7c011c38b9423b0b177ef61368"],
]);
const expectedSourceHashes = new Map([
  ["Karl Lagerfeld & Shashi Solluna - Nice Guy vs. Toxic Masculinity.mp4", "54ea86cb413b89c6e8fe284f030d42ce4df2161c5b5b09b0048688c4928ef01d"],
  ["Pirelli 2010 Calendar.mp4", "bf07d752d941ba01a4f8a8990934af34ed5dfe0d885047cfc3fbf6418d86c29f"],
  ["Shashi Solluna - How I Healed my Sexual Pain using Nature.mp4", "cb877bfd4057fa1d9cc29a30f566061a4aabb3032ac6a792ab40b346c0740fea"],
]);

assert.equal(manifest.files.length, 3);
for (const [fileName, uid] of expectedStreams) {
  assert.equal(sandbox.window.IAMCloudflareStream.assetFor(fileName)?.uid, uid);
  const record = manifest.files.find((file) => file.fileName === fileName);
  assert.ok(record, `${fileName} is missing from the ingest manifest`);
  assert.equal(record.uid, uid);
  assert.equal(record.sourceSha256, expectedSourceHashes.get(fileName));
  assert.equal(record.status, "ready");
}

const expectedEthicsStreams = new Map([
  ["Shashi Solluna - How I Healed my Sexual Pain using Nature +12dB.mp4", "1b9695e43908ddeb7f483480f4e2c261"],
  ["The Shamen - LSI (Love Sex Intelligence) HD_1.mp4", "181f8904e190da728c3dce0ac00de471"],
]);
assert.equal(ethicsManifest.files.length, 2);
for (const [fileName, uid] of expectedEthicsStreams) {
  assert.equal(sandbox.window.IAMCloudflareStream.assetFor(fileName)?.uid, uid);
  const record = ethicsManifest.files.find((file) => file.fileName === fileName);
  assert.ok(record, `${fileName} is missing from the ethics ingest manifest`);
  assert.equal(record.uid, uid);
  assert.equal(record.status, "ready");
}
assert.equal(ethicsManifest.files.find((file) => file.audioGainDb)?.audioGainDb, 12);

assert.match(index, /data-emdr-jbh-background[^>]*data-stream-role="fashion"/);
assert.match(index, /data-emdr-jbh-foreground[^>]*data-stream-role="music"/);
assert.match(controller, /key: "jbh-ii"[\s\S]{0,500}backgroundAudible: true,[\s\S]{0,100}foregroundMuted: true/);
assert.match(controller, /key: "jbh-ii"[\s\S]{0,500}backgroundFileName: "Shashi Solluna - How I Healed my Sexual Pain using Nature \+12dB\.mp4"/);
assert.match(controller, /key: "jbh-iii"[\s\S]{0,500}backgroundAudible: false,[\s\S]{0,100}foregroundMuted: false,[\s\S]{0,100}syncLayers: true/);
assert.match(controller, /JBH_EDITORIAL_PROGRAMME_MIX_LEVEL = \.36/);
assert.match(controller, /configureVideo\(emdrJbhBackground, preset\.backgroundFileName, Boolean\(preset\.backgroundAudible\)\);[\s\S]{0,180}configureVideo\(emdrJbhForeground, preset\.foregroundFileName, !preset\.foregroundMuted\);[\s\S]{0,180}window\.IAMStreamController\?\.play\?\.\(emdrJbhBackground\)/);
assert.match(controller, /Math\.abs\(drift\) > \.18/);
assert.match(controller, /requestJbhContentConsent\(selectedPreset\.sensitiveContent\)/);
assert.match(controller, /if \(card\.dataset\.sexEdSensitive\) return/);
assert.match(controller, /resolvePersistentProgrammeMixTarget\(media, baseline, requestedTarget\)/);
assert.match(controller, /document\.body\.classList\.contains\("television-emdr-jbh-editorial-active"\)[\s\S]{0,260}target = Math\.min\(target, JBH_EDITORIAL_PROGRAMME_MIX_LEVEL\)/);
assert.match(controller, /function fadeShopArrivalProgrammeVolume[\s\S]{0,650}resolvePersistentProgrammeMixTarget\(media, baseline, requestedTarget\)/);
assert.match(controller, /function setVoiceAssistantProgramVolume[\s\S]{0,420}resolvePersistentProgrammeMixTarget\(media, baseline, baseline \* duckFactor\)/);

assert.match(index, /data-sex-ed-episode="15"[^>]*data-sex-ed-file="Pirelli 2010 Calendar\.mp4"[^>]*data-sex-ed-background-file="Shashi Solluna - How I Healed my Sexual Pain using Nature \+12dB\.mp4"/);
assert.match(index, /data-sex-ed-episode="16"[^>]*data-sex-ed-file="Karl Lagerfeld &amp; Shashi Solluna - Nice Guy vs\. Toxic Masculinity\.mp4"[^>]*data-sex-ed-background-file="Karl Lagerfeld &amp; Shashi Solluna - Nice Guy vs\. Toxic Masculinity\.mp4"/);
assert.match(index, /<strong>Healing Sexual Trauma in Nature<\/strong>[\s\S]{0,100}<span>Shashi Solana<\/span>/);
assert.match(index, /<strong>Dissolving Toxic Masculinity<\/strong>[\s\S]{0,120}<span>Karl Lagerfeld &amp; Shashi Solana<\/span>/);
assert.doesNotMatch(index.match(/data-sex-ed-episode="15"[\s\S]{0,900}/)?.[0] || "", /wallet-fashion-reference/);
assert.doesNotMatch(index.match(/data-sex-ed-episode="16"[\s\S]{0,900}/)?.[0] || "", /wallet-fashion-reference/);
assert.match(index, /data-sex-ed-episode="15"[\s\S]{0,1000}3be25d8ba3bb884e35ab57cc6f5c43c3\/thumbnails\/thumbnail\.jpg\?time=330s/);
assert.match(index, /data-sex-ed-episode="16"[\s\S]{0,1000}2c099816dba26973d4d4d36452d05f99\/thumbnails\/thumbnail\.jpg\?time=600s/);

const ethicsModal = index.match(/<section class="jbh-ethics"[\s\S]*?<\/section>/)?.[0] || "";
assert.match(index, /16 lessons<\/p>[\s\S]{0,260}data-jbh-ethics-open[\s\S]{0,120}>ethics<\/button>/);
assert.match(ethicsModal, /data-stream-file="The Shamen - LSI \(Love Sex Intelligence\) HD_1\.mp4"/);
assert.equal((ethicsModal.match(/adaptive-television-reaction__glyph--flora-trigger/g) || []).length, 3);
assert.match(ethicsModal, /<strong>LSI<\/strong> — Love · Sex · Intelligence/);
assert.match(ethicsModal, /<h2 id="jbh-ethics-title">Ethics<\/h2>/);
assert.match(ethicsModal, /James Bondage is 24\/7 electronic music television broadcasting sex x mindfulness, bringing emotional intelligence to the bedroom, soundtracked to minimal, electro and EBM - Electronic Body Music\./);
assert.match(ethicsModal, /Our James Bondage Health series \[ sex-ed \] shares female lead conversations about tantra, relationships, intimacy and mental health, from the leading voices in the space\./);
assert.match(ethicsModal, /<h3>Values and framework:<\/h3>/);
assert.match(ethicsModal, /LSI triangle \(love, sex, intelligence\)[\s\S]*female first[\s\S]*all female hosted[\s\S]*no more violence[\s\S]*no more shame[\s\S]*healthy body image[\s\S]*free[\s\S]*honesty[\s\S]*thriving mental health[\s\S]*mindfulness[\s\S]*dadirri[\s\S]*emotional intelligence[\s\S]*trauma informed[\s\S]*no health claims[\s\S]*transparent[\s\S]*research lead[\s\S]*powered via ethics\.org\.au[\s\S]*partnership to be confirmed/);
assert.equal((ethicsModal.match(/<li>/g) || []).length, 17);
assert.doesNotMatch(ethicsModal, /template for sexual wellbeing|jbh-ethics__sound|role="listitem"/);
assert.match(ethicsModal, /Many ways of being\.[\s\S]*age, race, gender, identity, lived experience and opportunity[\s\S]*centring women across sexual orientations[\s\S]*relevant to men[\s\S]*non-binary people and others[\s\S]*transgender people and gay men[\s\S]*suitably experienced specialists[\s\S]*do not claim expertise we do not yet have/);
assert.match(ethicsModal, /Partnerships with consent\.[\s\S]*Black Rainbow[\s\S]*Aboriginal and Torres Strait Islander LGBTIQA\+SB perspectives[\s\S]*subject to their interest, leadership and agreement[\s\S]*No partnership is currently confirmed[\s\S]*no association is implied without their consent/);
assert.match(ethicsModal, /https:\/\/www\.miriamrosefoundation\.org\.au\/dadirri/);
assert.match(ethicsModal, /https:\/\/ethics\.org\.au\//);
assert.match(ethicsModal, /https:\/\/blackrainbow\.org\.au\//);
assert.doesNotMatch(ethicsModal, /Shashi|Pirelli|youtube|youtu\.be/i);
assert.match(controller, /async function openJbhEthics[\s\S]{0,1800}ensureSexEdStream\(jbhEthicsVideo, "music"\)/);
assert.match(controller, /jbhEthicsVideo\.muted = false[\s\S]{0,100}jbhEthicsVideo\.volume = 1/);
assert.match(controller, /JBH_ETHICS_PROGRAMME_MIX_LEVEL = 0/);
assert.match(controller, /function maintainJbhEthicsSilence[\s\S]{0,800}document\.querySelectorAll\("video, audio"\)[\s\S]{0,800}soundResearchAudio/);
assert.match(controller, /function hardMuteMediaForJbhEthics[\s\S]{0,1200}media\.volume = 0;[\s\S]{0,100}media\.muted = true/);
assert.match(controller, /function soundResearchOutputMultiplier\(\)[\s\S]{0,160}jbh-ethics-open[\s\S]{0,80}return 0/);
assert.match(index, /data-emdr-jbh-foreground-canvas/);
assert.match(controller, /function drawEmdrJbhForegroundFrame[\s\S]{0,1800}drawMediaCover\(context, emdrJbhForeground/);
assert.match(styles, /\.adaptive-television-emdr-jbh-foreground[\s\S]{0,220}clip-path: inset\(50%\)/);
assert.match(styles, /body\.television-emdr-jbh-editorial-active \.adaptive-television-emdr-jbh-foreground-canvas[\s\S]{0,100}opacity: 1/);
assert.match(styles, /\.adaptive-television-reaction-wallet\[data-wallet-view="emdr"\]\[data-emdr-controls-view="gif"\][\s\S]{0,220}width: min\(1460px/);
assert.match(styles, /data-emdr-controls-view="stellar"\][\s\S]{0,140}width: min\(1460px/);
assert.match(styles, /\.adaptive-television-emdr-jbh-background,[\s\S]{0,120}\.jbh-ethics__video[\s\S]{0,180}-webkit-user-drag: none/);

const editorNote = index.match(/<div class="jbh-content-gate__editor-note"[^>]*>([\s\S]*?)<\/div>/)?.[1] || "";
const visibleNote = editorNote
  .replace(/<br\s*\/?>/g, " ")
  .replace(/<[^>]+>/g, " ")
  .replaceAll("&amp;", "&")
  .replace(/\s+/g, " ")
  .trim();
assert.ok(visibleNote.includes("Editor's Note: This video utilizes archival footage from the 2010 Pirelli campaign to celebrate the timeless beauty and soft expression of female sensuality in nature."));
assert.ok(visibleNote.includes("Our inclusion of this footage is strictly an appreciation of the imagery itself and does not constitute an endorsement of the creator's conduct."));
assert.ok(visibleNote.includes("Support & Helplines: If this content causes distress, or if you or someone you know has been impacted by sexual assault or abuse, free and confidential support is available 24/7 in Australia:"));
assert.ok(visibleNote.includes("1800RESPECT : Call 1800 737 732 or text/chat online at 1800respect.org.au"));
assert.ok(visibleNote.includes("Lifeline: Call 13 11 14 or text 0477 13 11 14 at lifeline.org.au"));
assert.match(index, /href="tel:1800737732"/);
assert.match(index, /href="sms:0477131114"/);
assert.match(styles, /\.jbh-content-gate__panel[\s\S]*?max-height: min\(82vh, 760px\)[\s\S]*?overflow-y: auto/);
assert.match(styles, /body\.television-emdr-jbh-editorial-active \.adaptive-television-emdr-jbh-background/);

new vm.Script(controller, { filename: "adaptive-environment-television.js" });
console.log("JBH ii and iii EMDR and Sex Ed editorial contracts passed.");
