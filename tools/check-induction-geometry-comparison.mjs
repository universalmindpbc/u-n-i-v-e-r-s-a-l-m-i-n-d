#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const playwrightModule = process.env.PLAYWRIGHT_MODULE || "playwright";
const playwright = await import(playwrightModule);
const { chromium } = playwright.default || playwright;
const fixedRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baselineRoot = path.resolve(process.env.INDUCTION_BASELINE_ROOT || "");
const outputRoot = path.resolve(process.env.INDUCTION_EVIDENCE_DIR || path.join(fixedRoot, "induction-geometry-evidence"));

assert.ok(fs.existsSync(path.join(baselineRoot, "i  a m", "induction.html")), "INDUCTION_BASELINE_ROOT must contain the pre-change repository source");
fs.mkdirSync(outputRoot, { recursive: true });

const roots = new Map([
  ["baseline", path.join(baselineRoot, "i  a m")],
  ["fixed", path.join(fixedRoot, "i  a m")],
]);

const server = http.createServer((request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  const [, variant, ...segments] = decodeURIComponent(url.pathname).split("/");
  const root = roots.get(variant);
  if (!root) return response.writeHead(404).end();
  const relative = segments.join("/") || "induction.html";
  const filePath = path.resolve(root, relative);
  if (!filePath.startsWith(`${root}${path.sep}`)) return response.writeHead(403).end();
  try {
    response.writeHead(200, { "Content-Type": mimeType(filePath), "Cache-Control": "no-store" });
    response.end(fs.readFileSync(filePath));
  } catch {
    response.writeHead(404).end();
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const chromiumServer = await chromium.launchServer({
  headless: true,
  args: ["--mute-audio", "--autoplay-policy=user-gesture-required"],
});
const browserProcess = chromiumServer.process();
assert.ok(browserProcess?.spawnargs.includes("--mute-audio"), "Chromium must be process-muted before navigation");
const browser = await chromium.connect(chromiumServer.wsEndpoint());

const report = { passed: false, process_muted: true, desktop: null, mobile: null, screenshots: {}, cleanup: false };

try {
  report.desktop = await compareViewport("desktop", { width: 1920, height: 1080 }, "?induction=show");
  report.mobile = await compareViewport("mobile", { width: 390, height: 844 }, "?mobile=1&induction=show");
  report.passed = true;
} finally {
  await browser.close().catch(() => null);
  await chromiumServer.close().catch(() => null);
  await new Promise((resolve) => server.close(resolve));
  report.cleanup = browserProcess.exitCode !== null || browserProcess.killed;
}

assert.equal(report.cleanup, true, "Owned process-muted Chromium must close");
console.log(JSON.stringify(report, null, 2));

async function compareViewport(name, viewport, query) {
  const baseline = await capture("baseline", name, viewport, query);
  const fixed = await capture("fixed", name, viewport, query);
  assert.deepEqual(Object.keys(fixed.geometry), Object.keys(baseline.geometry), `${name}: approved element set changed`);
  const deltas = {};
  for (const key of Object.keys(baseline.geometry)) {
    const expected = baseline.geometry[key];
    const actual = fixed.geometry[key];
    deltas[key] = {};
    for (const property of ["x", "y", "width", "height"]) {
      const delta = round(actual[property] - expected[property]);
      deltas[key][property] = delta;
      assert.ok(Math.abs(delta) <= 0.5, `${name}: ${key} ${property} changed by ${delta}px`);
    }
  }
  return { viewport, exact_within_px: 0.5, elements: Object.keys(baseline.geometry).length, deltas };
}

async function capture(variant, name, viewport, query) {
  const context = await browser.newContext({ viewport, serviceWorkers: "block" });
  await context.addInitScript(() => {
    HTMLMediaElement.prototype.play = function blockedPlay() {
      return Promise.reject(new DOMException("Playback blocked by geometry QA", "NotAllowedError"));
    };
  });
  await context.route("**/*", async (route) => {
    const request = route.request();
    if (request.resourceType() === "media") return route.fulfill({ status: 204, body: "" });
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") return route.abort("blockedbyclient");
    return route.continue();
  });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${port}/${variant}/induction.html${query}`, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ content: `
    *, *::before, *::after { transition: none !important; }
    .induction-copy--intro { animation: none !important; opacity: 1 !important; transform: none !important; }
    [data-arrival-consent] { display: none !important; }
  ` });
  await page.waitForTimeout(150);
  const geometry = await page.evaluate(() => {
    const selectors = [
      ["intro.identity", ".induction-copy--intro > .induction-portal-identity"],
      ["intro.chapter", ".induction-copy--intro > .induction-chapter"],
      ["intro.heading", ".induction-copy--intro > .induction-heading"],
      ["intro.p1", ".induction-copy--intro > p:nth-of-type(2)"],
      ["intro.p2", ".induction-copy--intro > p:nth-of-type(3)"],
      ["intro.p3", ".induction-copy--intro > p:nth-of-type(4)"],
      ["intro.p4", ".induction-copy--intro > p:nth-of-type(5)"],
      ["prototype.heading", ".induction-copy--prototype > .induction-subheading"],
      ["prototype.p1", ".induction-copy--prototype > p:nth-of-type(1)"],
      ["prototype.p2", ".induction-copy--prototype > p:nth-of-type(2)"],
      ["prototype.enter", ".induction-copy--prototype > .induction-enter-wrap"],
      ["mobile.notice", ".mobile-experience-notice"],
    ];
    return Object.fromEntries(selectors.flatMap(([key, selector]) => {
      const element = document.querySelector(selector);
      if (!element || getComputedStyle(element).display === "none") return [];
      const rect = element.getBoundingClientRect();
      return [[key, { x: rect.x, y: rect.y, width: rect.width, height: rect.height }]];
    }));
  });
  const screenshot = path.join(outputRoot, `${variant}-${name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  report.screenshots[`${variant}_${name}`] = screenshot;
  await context.close();
  return { geometry, screenshot };
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function mimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".html") return "text/html; charset=utf-8";
  if (extension === ".css") return "text/css; charset=utf-8";
  if (extension === ".js") return "text/javascript; charset=utf-8";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".woff2") return "font/woff2";
  return "application/octet-stream";
}
