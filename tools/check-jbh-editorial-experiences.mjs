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

assert.match(index, /data-emdr-jbh-background[^>]*data-stream-role="fashion"/);
assert.match(index, /data-emdr-jbh-foreground[^>]*data-stream-role="music"/);
assert.match(controller, /key: "jbh-ii"[\s\S]{0,500}backgroundAudible: true,[\s\S]{0,100}foregroundMuted: true/);
assert.match(controller, /key: "jbh-iii"[\s\S]{0,500}backgroundAudible: false,[\s\S]{0,100}foregroundMuted: false,[\s\S]{0,100}syncLayers: true/);
assert.match(controller, /JBH_EDITORIAL_PROGRAMME_MIX_LEVEL = \.15/);
assert.match(controller, /Math\.abs\(drift\) > \.18/);
assert.match(controller, /requestJbhContentConsent\(selectedPreset\.sensitiveContent\)/);
assert.match(controller, /if \(card\.dataset\.sexEdSensitive\) return/);

assert.match(index, /data-sex-ed-episode="15"[^>]*data-sex-ed-file="Pirelli 2010 Calendar\.mp4"[^>]*data-sex-ed-background-file="Shashi Solluna - How I Healed my Sexual Pain using Nature\.mp4"/);
assert.match(index, /data-sex-ed-episode="16"[^>]*data-sex-ed-file="Karl Lagerfeld &amp; Shashi Solluna - Nice Guy vs\. Toxic Masculinity\.mp4"[^>]*data-sex-ed-background-file="Karl Lagerfeld &amp; Shashi Solluna - Nice Guy vs\. Toxic Masculinity\.mp4"/);
assert.match(index, /<strong>Healing Sexual Trauma in Nature<\/strong>[\s\S]{0,100}<span>Shashi Solana<\/span>/);
assert.match(index, /<strong>Dissolving Toxic Masculinity<\/strong>[\s\S]{0,120}<span>Karl Lagerfeld &amp; Shashi Solana<\/span>/);

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
