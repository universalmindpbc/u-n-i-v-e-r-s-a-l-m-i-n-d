import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const robots = read("robots.txt");
const stagingRobots = read("robots-staging.txt");
const sitemap = read("sitemap.xml");
const llms = read("llms.txt");

const publicPaths = [
  "/vogue/iam/induction.html",
  "/vogue/iam/index.html",
  "/vogue/iam/vogue-self-report.html",
  "/vogue/iam/about.html",
  "/vogue/iam/science.html",
  "/vogue/iam/sound-prototype-research.html",
  "/vogue/iam/our-team.html",
  "/vogue/iam/technology-citizen-needs.html",
  "/vogue/iam/technology-inference-engine.html",
];

const researchPaths = [
  "/vogue/iam/a%20s%20s%20e%20t%20s/r%20e%20s%20e%20a%20r%20c%20h/Universal%20Mind%20%5B%20I%20o%20H%20%5D%20-%20EMDR%20Medical%20Research.pdf",
  "/vogue/iam/a%20s%20s%20e%20t%20s/r%20e%20s%20e%20a%20r%20c%20h/Universal%20Mind%20%5B%20I%20o%20H%20%5D%20-%20Sound%20Medical%20Research.pdf",
  "/vogue/iam/a%20s%20s%20e%20t%20s/r%20e%20s%20e%20a%20r%20c%20h/Universal%20Mind%20%5B%20I%20o%20H%20%5D%20-%20Mantra%20Medical%20Research.pdf",
];

const trainingAgents = [
  "GPTBot",
  "Google-Extended",
  "Applebot-Extended",
  "ClaudeBot",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "meta-externalagent",
];

for (const agent of trainingAgents) {
  assert.match(
    robots,
    new RegExp(`User-agent: ${agent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\nDisallow: /`),
    `${agent} must remain blocked`,
  );
}

assert.match(robots, /User-agent: \*\n[\s\S]*Disallow: \/vogue\/iam\//);
assert.match(robots, /Disallow: \/i%20%20a%20m\//);
assert.match(robots, /Disallow: \/\*\.html\$/);
assert.match(robots, /Disallow: \/\*\.pdf\$/);
assert.equal(stagingRobots.trim(), "# The permanent proofing environment must not be indexed.\nUser-agent: *\nDisallow: /*");

for (const publicPath of [...publicPaths, ...researchPaths]) {
  assert.ok(robots.includes(`Allow: ${publicPath}`), `robots.txt must allow ${publicPath}`);
  const canonicalUrl = `https://universalmind.tv${publicPath}`;
  assert.ok(sitemap.includes(`<loc>${canonicalUrl}</loc>`), `sitemap.xml must list ${canonicalUrl}`);
  assert.ok(llms.includes(canonicalUrl), `llms.txt must link ${canonicalUrl}`);
}

for (const forbidden of [
  "stakeholders/budget",
  "quantum-tree-control",
  "system-prompt",
  "/api/",
  "handover",
]) {
  assert.ok(!sitemap.includes(forbidden), `sitemap.xml must not expose ${forbidden}`);
  assert.ok(!llms.includes(forbidden), `llms.txt must not expose ${forbidden}`);
}

assert.match(
  llms,
  /> Universal Mind is the company\. I AM is its first experience: live electronic music television for mental health\./,
);
assert.match(llms, /Check in\. Unlock exclusive content\./);
assert.match(llms, /Not another mental-health app\./);
assert.match(robots, /Sitemap: https:\/\/universalmind\.tv\/sitemap\.xml/);

const metadataPages = {
  "i  a m/induction.html": "https://universalmind.tv/vogue/iam/induction.html",
  "i  a m/index.html": "https://universalmind.tv/vogue/iam/index.html",
  "i  a m/vogue-self-report.html": "https://universalmind.tv/vogue/iam/vogue-self-report.html",
  "i  a m/about.html": "https://universalmind.tv/vogue/iam/about.html",
  "i  a m/science.html": "https://universalmind.tv/vogue/iam/science.html",
  "i  a m/sound-prototype-research.html": "https://universalmind.tv/vogue/iam/sound-prototype-research.html",
  "i  a m/our-team.html": "https://universalmind.tv/vogue/iam/our-team.html",
  "i  a m/technology-citizen-needs.html": "https://universalmind.tv/vogue/iam/technology-citizen-needs.html",
  "i  a m/technology-inference-engine.html": "https://universalmind.tv/vogue/iam/technology-inference-engine.html",
};

for (const [relativePath, canonicalUrl] of Object.entries(metadataPages)) {
  const html = read(relativePath);
  assert.ok(
    html.includes('<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">'),
    `${relativePath} must explicitly allow indexing`,
  );
  assert.ok(
    html.includes(`<link rel="canonical" href="${canonicalUrl}">`),
    `${relativePath} must declare its canonical URL`,
  );
  assert.match(html, /<meta name="description" content="[^"]+">/, `${relativePath} must have a description`);
}

for (const relativePath of ["i  a m/induction.html", "i  a m/science.html", "i  a m/sound-prototype-research.html"]) {
  const html = read(relativePath);
  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.ok(jsonLdBlocks.length > 0, `${relativePath} must include JSON-LD`);
  for (const [, json] of jsonLdBlocks) JSON.parse(json);
}

console.log("Public crawler surface preflight passed.");
