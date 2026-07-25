import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Script } from "node:vm";

const root = resolve(import.meta.dirname, "..");
const page = readFileSync(resolve(root, "i  a m/sexed-wallet-mockup.html"), "utf8");

assert.match(page, /<meta name="robots" content="noindex, nofollow">/);
assert.match(page, /data-placement-control="strip"/);
assert.match(page, /data-placement-control="circle"/);
assert.match(page, /data-viewport-control="mobile"/);
assert.match(page, /data-placement="strip"/);
assert.match(page, />sexed</);
assert.match(page, /James Bondage Health · Episode 01/);
assert.match(page, /Caitlin Erica · watch the conversation/);
assert.match(page, /James Bondage Party/);
assert.match(page, /sexed-wallet-mockup-background\.jpg/);
assert.match(page, /width: min\(390px, calc\(100vw - 24px\)\)/);
assert.match(page, /width: min\(520px, calc\(100% - 48px\)\)/);

const inlineScript = page.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(inlineScript, "The mock-up must include its placement controls.");
new Script(inlineScript[1], { filename: "sexed-wallet-mockup.inline.js" });

console.log("Sexed wallet mock-up preflight passed.");
