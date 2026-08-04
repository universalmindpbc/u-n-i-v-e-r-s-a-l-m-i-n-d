import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const intakePath = path.join(root, "tools/accessories-health-product-intake.json");
const assetDirectory = path.join(root, "i  a m/a s s e t s/shop-mockup/product-catalogue/accessories-health");
const intake = JSON.parse(fs.readFileSync(intakePath, "utf8"));

fs.mkdirSync(assetDirectory, { recursive: true });

async function download(record) {
  const destination = path.join(assetDirectory, record.asset);
  if (record.userSuppliedFile) {
    assert.ok(fs.existsSync(destination), `${record.id} supplied editorial image is missing`);
    const bytes = fs.statSync(destination).size;
    assert.ok(bytes > 1000, `${record.id} supplied editorial image is unexpectedly small`);
    return { id: record.id, asset: record.asset, bytes, source: "user_supplied" };
  }
  const response = await fetch(record.sourceImageUrl, {
    headers: { "User-Agent": "Universal Mind locked MVP product-media importer" },
    redirect: "follow",
  });
  assert.ok(response.ok, `${record.id} image download failed: ${response.status}`);
  assert.match(response.headers.get("content-type") || "", /^image\//, `${record.id} did not return an image`);
  await finished(Readable.fromWeb(response.body).pipe(fs.createWriteStream(destination)));
  const bytes = fs.statSync(destination).size;
  assert.ok(bytes > 1000, `${record.id} image is unexpectedly small`);
  return { id: record.id, asset: record.asset, bytes };
}

const downloads = [];
for (let index = 0; index < intake.length; index += 6) {
  downloads.push(...await Promise.all(intake.slice(index, index + 6).map(download)));
}

assert.equal(downloads.length, 36, "All 36 lead product media assets must download");
console.log(JSON.stringify({ downloaded: downloads.length, assets: downloads }, null, 2));
