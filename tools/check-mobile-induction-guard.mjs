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
const deployScript = read("deploy-panthurlive.sh");

const mobileScriptIndex = induction.indexOf('src="mobile-editorial-surface.js');
const visitCookieIndex = induction.indexOf('const cookieName = "universalMindIAmInductionVisits"');
const expectedMobileDestinations = [
  ["induction.html?mobile=1", "induction"],
  ["about.html?aboutTopLevel=1", "about"],
  ["science.html", "science"],
  ["research.html", "research"],
  ["privacy-first.html", "privacy first"],
  ["business-model.html", "business model"],
  ["impact.html", "impact"],
  ["our-team.html", "our team"],
  ["mailto:bk@universalmind.tv?subject=I%20Am%20Vogue%20%7C%20Referral", "contact"],
  ["shop.html", "shop"],
];

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
for (const [href, label] of expectedMobileDestinations) {
  assert.ok(
    induction.includes(`href="${href}"`) && induction.includes(`>${label}</a>`),
    `Induction mobile navigation must include ${label}`,
  );
}
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
for (const page of ["research", "privacy-first", "business-model", "impact"]) {
  assert.ok(mobileScript.includes(`"${page}.html"`), `Mobile direct-route allowlist must include ${page}`);
  assert.ok(mobileScript.includes(`"${page}"`), `Mobile global navigation must include ${page}`);
}
assert.ok(mobileScript.includes('"contact"'), "Mobile global navigation must include Contact");
assert.match(
  htaccess,
  /\(induction\|about\|science\|research\|privacy-first\|business-model\|impact\|our-team\|shop\|shop-science\)\\\.html/,
  "Smartphone server allowlist must retain all approved editorial pages",
);
assert.match(
  deployScript,
  /\(induction\|about\|science\|research\|privacy-first\|business-model\|impact\|our-team\|shop\|shop-science\)\\\.html/,
  "Panthur redirect deployment must publish the approved smartphone allowlist",
);
assert.match(
  htaccess,
  /RewriteRule \^vogue\/iam\/\.\*\\\.html\$ \/vogue\/iam\/induction\.html\?mobile=1 \[R=302,L,NE\]/,
  "Media-heavy smartphone routes must remain gated to induction",
);

console.log("Mobile induction checks passed: ten destinations visible, stakeholder pages direct, media-heavy experience remains gated.");
