import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Script } from "node:vm";

const root = resolve(import.meta.dirname, "..");
const page = readFileSync(resolve(root, "i  a m/sexed-wallet-mockup.html"), "utf8");

assert.match(page, /<meta name="robots" content="noindex, nofollow">/);
assert.match(page, /data-name-control="hyphenated"/);
assert.match(page, /data-name-control="closed"/);
assert.match(page, /data-viewport-control="mobile"/);
assert.match(page, /class="wallet-status-row"/);
assert.match(page, /class="wallet-status-divider"/);
assert.match(page, /class="sexed-link"/);
assert.match(page, /class="preview-video"/);
assert.match(page, /data-preview-video/);
assert.match(page, /Wolford x Sergio Rossi\.mp4/);
assert.match(page, /object-fit: cover/);
assert.match(page, />sex-ed<\/button>/);
assert.match(page, /min-height: 106px/);
assert.match(page, /font-size: 10px/);
assert.match(page, /color: rgba\(255, 255, 255, 0\.65\)/);
assert.match(page, /border: 1px solid rgba\(255, 255, 255, 0\.3\)/);
assert.match(page, /class="now-playing"[\s\S]*?class="wallet-status-divider"[\s\S]*?class="sexed-link"/);
assert.match(page, /James Bondage Party/);
assert.match(page, /width: min\(390px, calc\(100vw - 24px\)\)/);
assert.match(page, /width: min\(520px, calc\(100% - 48px\)\)/);
assert.doesNotMatch(page, /sexed-feature/);
assert.doesNotMatch(page, /wallet-category--sexed/);
assert.doesNotMatch(page, /data-placement-control/);
assert.doesNotMatch(page, /data-placement=/);
assert.doesNotMatch(page, /sexed-wallet-mockup-background\.jpg/);
assert.doesNotMatch(page, /animation:/);

const inlineScript = page.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(inlineScript, "The mock-up must include its name and viewport controls.");
new Script(inlineScript[1], { filename: "sexed-wallet-mockup.inline.js" });

console.log("Sexed wallet mock-up preflight passed.");
