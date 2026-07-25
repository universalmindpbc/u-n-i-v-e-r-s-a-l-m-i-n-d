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
assert.match(page, /class="sexed-link"/);
assert.match(page, />sex-ed<\/button>/);
assert.match(page, /font-size: 13\.3px/);
assert.match(page, /color: rgba\(255, 255, 255, 0\.77\)/);
assert.match(page, /border-top: 1px solid rgba\(255, 255, 255, 0\.15\)/);
assert.match(page, /border-bottom: 1px solid rgba\(255, 255, 255, 0\.15\)/);
assert.match(page, /James Bondage Party/);
assert.match(page, /sexed-wallet-mockup-background\.jpg/);
assert.match(page, /width: min\(390px, calc\(100vw - 24px\)\)/);
assert.match(page, /width: min\(520px, calc\(100% - 48px\)\)/);
assert.doesNotMatch(page, /sexed-feature/);
assert.doesNotMatch(page, /wallet-category--sexed/);
assert.doesNotMatch(page, /data-placement-control/);
assert.doesNotMatch(page, /data-placement=/);

const inlineScript = page.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(inlineScript, "The mock-up must include its name and viewport controls.");
new Script(inlineScript[1], { filename: "sexed-wallet-mockup.inline.js" });

console.log("Sexed wallet mock-up preflight passed.");
