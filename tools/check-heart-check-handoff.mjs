#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const endpoint = read("i  a m/api/heart-check-handoff.php");
const library = read("i  a m/api/heart-check-handoff-lib.php");
const proxy = read("i  a m/api/citizen-needs-inference.php");
const worker = read("cloudflare/iam-citizen-needs-worker.js");
const homepageCheckin = read("i  a m/homepage-checkin.js");
const globe = read("i  a m/globe.js");

assert.match(endpoint, /\(\$_SERVER\['REQUEST_METHOD'\] \?\? ''\) !== 'POST'/);
assert.match(endpoint, /hash_equals\('https:\/\/' \. \$host, \$origin\)/);
assert.match(endpoint, /\$fetchSite !== '' && \$fetchSite !== 'same-origin'/);
assert.match(endpoint, /application\\\/json/);
assert.match(endpoint, /strlen\(\$rawBody\) > 4096/);
assert.match(endpoint, /has_exact_keys\(\$body, \['checkin', 'momentary_physiology'\]\)/);
assert.match(endpoint, /iam_heart_check_handoff_respond\(202, \['accepted' => true\]\);/);
assert.equal((endpoint.match(/'accepted'\s*=>/g) || []).length, 1, "The success response must have one field only.");
assert.doesNotMatch(endpoint, /workers\.dev|openai\.com|curl_init|file_get_contents\([^)]*https?:/i);
assert.doesNotMatch(endpoint, /error_log|heart_rate_bpm|heartratebpm|\bbpm\b/i, "The endpoint must never echo or log raw physiology.");

assert.match(library, /happiness_secret\('HEART_CHECK_HANDOFF_KEY'\)/);
assert.match(library, /strlen\(\$key\) !== 32/);
assert.match(library, /bin2hex\(random_bytes\(32\)\)/);
assert.match(library, /openssl_encrypt\([\s\S]*?'aes-256-gcm'/);
assert.match(library, /random_bytes\(12\)/);
assert.match(library, /'checkin_sha256' => hash\('sha256', \$normalizedCheckin\)/);
assert.match(library, /IAM_HEART_CHECK_HANDOFF_TTL_SECONDS = 60/);
assert.match(library, /chmod\(\$directory, 0700\)/);
assert.match(library, /chmod\(\$path, 0600\)/);
assert.match(library, /'secure' => true[\s\S]*?'httponly' => true[\s\S]*?'samesite' => 'Strict'/);
assert.doesNotMatch(library, /error_log|localStorage|sessionStorage|document\.cookie|location\.|analytics/i);

const envelopeStart = library.indexOf("function iam_heart_check_handoff_take_record");
const envelopeEnd = library.indexOf("function iam_heart_check_handoff_purge_expired", envelopeStart);
const takeRecord = library.slice(envelopeStart, envelopeEnd);
assert.ok(envelopeStart >= 0 && envelopeEnd > envelopeStart, "The atomic record consumer must exist.");
assert.match(takeRecord, /fopen\(\$path, 'r\+b'\)/);
assert.match(takeRecord, /flock\(\$handle, LOCK_EX\)/);
assert.ok(takeRecord.indexOf("ftruncate($handle, 0)") < takeRecord.indexOf("@unlink($path)"), "The record must be emptied before unlink.");

const consumeStart = library.indexOf("function iam_heart_check_handoff_consume");
const consumeEnd = library.indexOf("function iam_heart_check_handoff_prepare_worker_body", consumeStart);
const consume = library.slice(consumeStart, consumeEnd);
assert.ok(consume.indexOf("iam_heart_check_handoff_take_record") < consume.indexOf("openssl_decrypt"), "The record must be consumed before authenticated decryption.");
assert.match(consume, /\$age < 0 \|\| \$age >= IAM_HEART_CHECK_HANDOFF_TTL_SECONDS/);
assert.match(consume, /hash_equals\(\$payload\['checkin_sha256'\], \$expectedDigest\)/);

assert.match(proxy, /iam_heart_check_handoff_expire_cookie\(\)/);
assert.match(proxy, /iam_heart_check_handoff_consume\(/);
assert.match(proxy, /iam_heart_check_handoff_prepare_worker_body\(\$body, \$momentaryPhysiology\)/);
assert.ok(proxy.indexOf("iam_heart_check_handoff_consume(") < proxy.indexOf("curl_init($endpoint)"), "The handoff must be consumed before upstream cURL work.");
assert.ok(proxy.indexOf("iam_heart_check_handoff_consume(") < proxy.indexOf("stream_context_create"), "The handoff must be consumed before upstream stream work.");
assert.doesNotMatch(proxy, /error_log/);

const openAiStart = worker.indexOf('fetch("https://api.openai.com/v1/responses"');
const openAiEnd = worker.indexOf("const payload = await openaiResponse.json()", openAiStart);
const openAiRequest = worker.slice(openAiStart, openAiEnd);
assert.ok(openAiStart >= 0 && openAiEnd > openAiStart, "The first-party OpenAI request must exist.");
assert.doesNotMatch(openAiRequest, /heart_rate_bpm|momentaryPhysiology|momentary_physiology|shen_quick_hr/);

assert.doesNotMatch(homepageCheckin, /heart_rate_bpm|heartratebpm|\bbpm\b|heart-check-handoff/i, "The homepage must never read momentary physiology.");
const processStart = globe.indexOf("async function processPendingCheckInPipeline");
const processEnd = globe.indexOf("window.IAMCheckInPipeline", processStart);
const processPipeline = globe.slice(processStart, processEnd);
assert.equal((processPipeline.match(/requestCitizenNeedsInference\(/g) || []).length, 1, "Tuning must request inference once.");
assert.equal((processPipeline.match(/requestAdaptiveMusicVideoSelection\(/g) || []).length, 1, "Tuning must request the selector once.");

const phpRuntime = spawnSync(process.env.PHP_BIN || "php", [path.join(root, "tools/test-heart-check-handoff.php")], {
  encoding: "utf8",
});
if (phpRuntime.error?.code !== "ENOENT") {
  assert.equal(phpRuntime.status, 0, `PHP handoff behavior failed:\n${phpRuntime.stderr || phpRuntime.stdout}`);
  assert.match(phpRuntime.stdout, /heart_check_handoff=passed/);
}

console.log(JSON.stringify({
  heart_check_handoff: "passed",
  success_contract: { status: 202, body: { accepted: true } },
  encryption: "AES-256-GCM",
  ttl_seconds: 60,
  cookie: "opaque_secure_httponly_samesite_strict",
  consumption: "atomic_single_use_before_upstream",
  php_runtime: phpRuntime.error?.code === "ENOENT" ? "not_available" : "passed",
  homepage_pipeline: { inference_calls: 1, selector_calls: 1 },
}, null, 2));
