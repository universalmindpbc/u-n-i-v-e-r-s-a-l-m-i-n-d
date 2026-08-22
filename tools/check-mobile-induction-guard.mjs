import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const induction = read("i  a m/induction.html");
const mobileStyle = read("i  a m/mobile-editorial-surface.css");
const mobileScript = read("i  a m/mobile-editorial-surface.js");
const htaccess = read(".htaccess");

const mobileScriptIndex = induction.indexOf('src="mobile-editorial-surface.js');
const visitCookieIndex = induction.indexOf('const cookieName = "universalMindIAmInductionVisits"');

assert.ok(mobileScriptIndex >= 0, "Induction must load the mobile editorial controller");
assert.ok(mobileScriptIndex < visitCookieIndex, "Mobile detection must run before the induction visit-cookie redirect");
assert.match(
  induction,
  /if \(window\.IAMMobileEditorial\?\.active\) return;/,
  "Mobile editorial visits must bypass the desktop self-report redirect",
);
assert.match(
  induction,
  /<section class="mobile-experience-notice"[\s\S]*An iOS SDK is in development[\s\S]*<\/section>/,
  "Induction must retain the approved mobile availability notice",
);
assert.match(
  induction,
  /<script>window\.IAMMobileEditorial\?\.apply\(\);<\/script>/,
  "Induction must apply mobile mode after its body is available",
);
assert.match(
  mobileStyle,
  /html\[data-mobile-editorial="true"\] \.induction-page \.induction-alternate__explore\s*\{\s*display: none;/,
  "Mobile mode must hide the full-experience Explore link",
);
assert.match(
  mobileScript,
  /const active = !forcedFullExperience && \(forcedMobileEditorial \|\| \(coarsePointer && shortSide < 600\)\);/,
  "Mobile detection must preserve the full=1 escape hatch",
);
assert.match(
  htaccess,
  /RewriteRule \^vogue\/iam\/\.\*\\\.html\$ \/vogue\/iam\/induction\.html\?mobile=1 \[R=302,L,NE\]/,
  "Media-heavy smartphone routes must remain gated to induction",
);

console.log("Mobile induction checks passed: no visit-cookie loop, approved notice restored, full experience remains gated.");
