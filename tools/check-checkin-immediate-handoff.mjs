import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const globe = read("i  a m/globe.js");
const homepageCheckin = read("i  a m/homepage-checkin.js");
const homepage = read("i  a m/index.html");
const selfReport = read("i  a m/vogue-self-report.html");

const forbiddenCopy = [
  "Encrypting your check-in",
  "Preparing your experience",
  "Saving only with your permission",
  "Encrypted and remembered",
  "We could not securely save this check-in",
];

for (const phrase of forbiddenCopy) {
  assert.equal(globe.includes(phrase), false, `globe.js must not contain: ${phrase}`);
  assert.equal(selfReport.includes(phrase), false, `self-report must not contain: ${phrase}`);
}

const submitStart = globe.indexOf("async function submitIamCheckIn()");
const submitEnd = globe.indexOf("\nif (iamForm && iamStart", submitStart);
assert.ok(submitStart >= 0 && submitEnd > submitStart, "check-in submit function must exist");

const submitFlow = globe.slice(submitStart, submitEnd);
assert.equal(submitFlow.includes("recordCheckin"), false, "database writes must not block the submit page");
assert.ok(submitFlow.includes('transitionIamState("thanks", "✓ Thank you."'), "original thank-you transition must remain");
assert.ok(submitFlow.includes("queuePendingCheckInPipeline(phrase)"), "check-in pipeline must be queued before navigation");
assert.match(selfReport, /data-iam-next-page="index\.html\?v=checkin-immediate-20260802"/, "self-report must force a fresh homepage after check-in");

assert.ok(homepageCheckin.includes("window.IAMCitizenData.recordCheckin(pending.phrase).then"), "homepage must start the staging save asynchronously");
assert.equal(homepageCheckin.includes("await window.IAMCitizenData.recordCheckin"), false, "homepage must not await the staging save");
assert.equal(selfReport.includes("data-citizen-data-status"), false, "self-report must not expose database status copy");

const clientIndex = homepage.indexOf('src="citizen-data-client.js');
const globeIndex = homepage.indexOf('src="globe.js');
const handoffIndex = homepage.indexOf('src="homepage-checkin.js');
assert.ok(clientIndex >= 0 && clientIndex < globeIndex && globeIndex < handoffIndex, "homepage scripts must load in background-save order");

console.log("checkin_immediate_handoff=passed");
