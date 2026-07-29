#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../../..");
const outputPath = path.resolve(process.argv[2] || path.join(os.tmpdir(), "universal-mind-citizen-data-lambda.zip"));
const packageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "um-citizen-data-lambda-"));

const files = [
  "cloudflare/citizen-data-core.js",
  "cloudflare/citizen-data-vault.js",
  "database/infrastructure/aws/citizen-data-lambda.mjs",
];

try {
  for (const relativePath of files) {
    const destination = path.join(packageDirectory, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(repositoryRoot, relativePath), destination);
  }
  fs.writeFileSync(path.join(packageDirectory, "package.json"), '{"type":"module"}\n', { mode: 0o600 });
  fs.rmSync(outputPath, { force: true });
  const zipped = spawnSync("/usr/bin/zip", ["-q", "-r", outputPath, "."], {
    cwd: packageDirectory,
    encoding: "utf8",
  });
  if (zipped.status !== 0) throw new Error(zipped.stderr || `zip_exit_${zipped.status}`);
  const bytes = fs.readFileSync(outputPath);
  console.log(`artifact=${outputPath}`);
  console.log(`bytes=${bytes.byteLength}`);
  console.log(`sha256=${crypto.createHash("sha256").update(bytes).digest("hex")}`);
} finally {
  fs.rmSync(packageDirectory, { recursive: true, force: true });
}
