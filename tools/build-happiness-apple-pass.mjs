import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const signed = process.argv.includes("--signed");
const outputFlag = process.argv.indexOf("--output");
const output = outputFlag >= 0 ? path.resolve(process.argv[outputFlag + 1]) : path.join(os.tmpdir(), "happiness-pass-preview");
const archiveFlag = process.argv.indexOf("--archive");
const archive = archiveFlag >= 0 ? path.resolve(process.argv[archiveFlag + 1]) : null;
const requiredAssets = [
  "icon.png", "icon@2x.png", "icon@3x.png",
  "logo.png", "logo@2x.png", "logo@3x.png",
  "strip.png", "strip@2x.png", "strip@3x.png",
];
const assets = path.join(root, "apple-wallet", "assets");

const values = {
  PASS_TYPE_IDENTIFIER: process.env.HAPPINESS_APPLE_PASS_TYPE_IDENTIFIER || "pass.tv.universalmind.happiness",
  SERIAL_NUMBER: process.env.HAPPINESS_APPLE_SERIAL_NUMBER || "UM-000001-PREVIEW",
  TEAM_IDENTIFIER: process.env.HAPPINESS_APPLE_TEAM_IDENTIFIER || "3458V3D263",
  BALANCE: process.env.HAPPINESS_APPLE_BALANCE || "0",
  MEMBER_DISPLAY_ID: process.env.HAPPINESS_APPLE_MEMBER_DISPLAY_ID || "UM · 000 001",
  WALLET_URL: process.env.HAPPINESS_APPLE_WALLET_URL || "https://universalmind.tv/wallet/",
};

if (signed) {
  for (const key of ["HAPPINESS_APPLE_PASS_TYPE_IDENTIFIER", "HAPPINESS_APPLE_TEAM_IDENTIFIER"]) {
    if (!process.env[key]) throw new Error(`${key.toLowerCase()}_required_for_signing`);
  }
  if (process.env.HAPPINESS_APPLE_WEB_SERVICE_URL && !process.env.HAPPINESS_APPLE_AUTHENTICATION_TOKEN) {
    throw new Error("happiness_apple_authentication_token_required_for_updates");
  }
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
let passSource = fs.readFileSync(path.join(root, "apple-wallet", "happiness-pass.template.json"), "utf8");
for (const [key, value] of Object.entries(values)) passSource = passSource.replaceAll(`{{${key}}}`, value);
const pass = JSON.parse(passSource);
if (process.env.HAPPINESS_APPLE_WEB_SERVICE_URL) {
  pass.webServiceURL = process.env.HAPPINESS_APPLE_WEB_SERVICE_URL;
  pass.authenticationToken = process.env.HAPPINESS_APPLE_AUTHENTICATION_TOKEN;
}
fs.writeFileSync(path.join(output, "pass.json"), `${JSON.stringify(pass, null, 2)}\n`);
for (const asset of requiredAssets) fs.copyFileSync(path.join(assets, asset), path.join(output, asset));

const manifest = {};
for (const file of ["pass.json", ...requiredAssets]) {
  manifest[file] = createHash("sha1").update(fs.readFileSync(path.join(output, file))).digest("hex");
}
fs.writeFileSync(path.join(output, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

if (signed) {
  const signingInputs = [
    process.env.HAPPINESS_APPLE_CERT_PEM,
    process.env.HAPPINESS_APPLE_KEY_PEM,
    process.env.HAPPINESS_APPLE_WWDR_PEM,
  ];
  if (signingInputs.some((input) => !input)) throw new Error("apple_pass_signing_material_required");
  const signature = spawnSync("openssl", [
    "smime", "-binary", "-sign",
    "-certfile", process.env.HAPPINESS_APPLE_WWDR_PEM,
    "-signer", process.env.HAPPINESS_APPLE_CERT_PEM,
    "-inkey", process.env.HAPPINESS_APPLE_KEY_PEM,
    "-in", path.join(output, "manifest.json"),
    "-out", path.join(output, "signature"),
    "-outform", "DER",
  ], { encoding: "utf8" });
  if (signature.status !== 0) throw new Error(`apple_pass_signature_failed: ${signature.stderr.trim()}`);
}

if (archive) {
  if (!signed) throw new Error("apple_pass_archive_requires_signature");
  fs.mkdirSync(path.dirname(archive), { recursive: true });
  fs.rmSync(archive, { force: true });
  const packaged = spawnSync("zip", ["-q", "-X", archive, "pass.json", "manifest.json", "signature", ...requiredAssets], {
    cwd: output,
    encoding: "utf8",
  });
  if (packaged.status !== 0) throw new Error(`apple_pass_archive_failed: ${packaged.stderr.trim()}`);
}

console.log(`${signed ? "Signed" : "Unsigned"} HAPPINESS pass source prepared at ${output}${archive ? ` and ${archive}` : ""}`);
