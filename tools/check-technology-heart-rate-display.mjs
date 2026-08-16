#!/usr/bin/env node

import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const iamRoot = resolve(root, "i  a m");
const chromiumExecutable = "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);

const requestedTarget = String(process.env.TARGET_URL || "").trim();
const server = requestedTarget ? null : createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url || "/", "http://127.0.0.1").pathname);
    const relative = pathname.replace(/^\/vogue\/iam\/?/, "") || "technology-citizen-needs.html";
    const file = resolve(iamRoot, relative);
    if (file !== iamRoot && !file.startsWith(`${iamRoot}${sep}`)) throw new Error("outside_root");
    const body = await readFile(file);
    response.writeHead(200, { "Content-Type": mimeTypes.get(extname(file)) || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

if (server) {
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", resolveListen);
  });
}

const address = server?.address();
if (server) assert.ok(address && typeof address === "object");
const url = requestedTarget || `http://127.0.0.1:${address.port}/vogue/iam/technology-citizen-needs.html`;
const browser = await chromium.launch({
  executablePath: chromiumExecutable,
  headless: true,
  args: ["--mute-audio"],
});

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await context.addInitScript(() => {
    sessionStorage.setItem("iamCurrentCheckinHeartRateV1", JSON.stringify({
      schema_version: "iam_current_checkin_heart_rate_v1",
      heart_rate_bpm: 72,
      measured_at: Date.now(),
      measurement_duration_seconds: 10,
      source: "shen_quick_hr",
      scope: "current_tab_session",
    }));
    sessionStorage.setItem("iamLatestInference", JSON.stringify({
      checkin: "I am calm and focused",
      updatedAt: Date.now(),
      highlights: ["Calm", "Clarity", "Attention", "Recovery"],
    }));
  });
  await context.route("**/*", async (route) => {
    if (route.request().resourceType() === "media") await route.abort();
    else await route.continue();
  });

  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("[data-checkin-heart-rate]").waitFor({ state: "visible" });
  assert.equal(await page.locator("[data-checkin-heart-rate]").innerText(), "Heart Rate · 72 BPM");
  assert.equal(await page.locator("[data-checkin-value]").innerText(), "calm and focused");

  const audit = async () => page.evaluate(() => {
    const rect = (selector) => {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      return box ? { left: box.left, top: box.top, right: box.right, bottom: box.bottom } : null;
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      status: rect(".checkin-status"),
      radar: rect(".radar-frame"),
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    };
  });

  const desktop = await audit();
  assert.equal(desktop.horizontalOverflow, false);
  assert.ok(desktop.status && desktop.radar);
  assert.ok(desktop.status.left >= 0 && desktop.status.right <= desktop.viewport.width);
  assert.ok(desktop.status.bottom < desktop.radar.bottom);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await audit();
  assert.equal(mobile.horizontalOverflow, false);
  assert.ok(mobile.status && mobile.radar);
  assert.ok(mobile.status.left >= 0 && mobile.status.right <= mobile.viewport.width);

  await page.close();
  await context.close();

  const emptyContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await emptyContext.route("**/*", async (route) => {
    if (route.request().resourceType() === "media") await route.abort();
    else await route.continue();
  });
  const emptyPage = await emptyContext.newPage();
  await emptyPage.goto(url, { waitUntil: "domcontentloaded" });
  assert.equal(await emptyPage.locator("[data-checkin-heart-rate]").isHidden(), true);
  await emptyPage.close();
  await emptyContext.close();

  process.stdout.write(`${JSON.stringify({
    heart_rate_display: "passed",
    target: requestedTarget ? "staging" : "local",
    text: "Heart Rate · 72 BPM",
    hidden_without_current_session_record: true,
    desktop,
    mobile,
  }, null, 2)}\n`);
} finally {
  await browser.close();
  if (server) await new Promise((resolveClose) => server.close(resolveClose));
}
