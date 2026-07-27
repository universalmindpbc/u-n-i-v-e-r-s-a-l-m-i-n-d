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
const requiredAssets = ["icon.png", "icon@2x.png", "icon@3x.png"];
const assets = path.join(root, "apple-wallet", "assets");

const values = {
  PASS_TYPE_IDENTIFIER: process.env.HAPPINESS_APPLE_PASS_TYPE_IDENTIFIER || "pass.com.universalmind.happiness.preview",
  SERIAL_NUMBER: process.env.HAPPINESS_APPLE_SERIAL_NUMBER || "UM-000001-PREVIEW",
  TEAM_IDENTIFIER: process.env.HAPPINESS_APPLE_TEAM_IDENTIFIER || "PREVIEWTEAM",
  WEB_SERVICE_URL: process.env.HAPPINESS_APPLE_WEB_SERVICE_URL || "https://rewards.universalmind.tv/apple-wallet",
  AUTHENTICATION_TOKEN: process.env.HAPPINESS_APPLE_AUTHENTICATION_TOKEN || "unsigned-preview-not-for-installation",
  BALANCE: process.env.HAPPINESS_APPLE_BALANCE || "0",
  MEMBER_DISPLAY_ID: process.env.HAPPINESS_APPLE_MEMBER_DISPLAY_ID || "UM · 000 001",
  WALLET_URL: process.env.HAPPINESS_APPLE_WALLET_URL || "https://universalmind.tv/wallet/",
};

if (signed) {
  for (const key of ["HAPPINESS_APPLE_PASS_TYPE_IDENTIFIER", "HAPPINESS_APPLE_TEAM_IDENTIFIER", "HAPPINESS_APPLE_AUTHENTICATION_TOKEN"]) {
    if (!process.env[key]) throw new Error(`${key.toLowerCase()}_required_for_signing`);
  }
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
let pass = fs.readFileSync(path.join(root, "apple-wallet", "happiness-pass.template.json"), "utf8");
for (const [key, value] of Object.entries(values)) pass = pass.replaceAll(`{{${key}}}`, value);
JSON.parse(pass);
fs.writeFileSync(path.join(output, "pass.json"), `${pass}\n`);
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

console.log(`${signed ? "Signed" : "Unsigned"} HAPPINESS pass source prepared at ${output}`);
