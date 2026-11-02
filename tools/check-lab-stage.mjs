import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('lab/index.html');
const js = read('lab/lab.mjs');
const css = read('lab/lab.css');
assert.match(html, /name="robots" content="noindex,nofollow"/);
for (const p of ['lab/vendor/three.module.js', 'lab/vendor/OrbitControls.js', 'lab/vendor/LICENSE-three.txt']) assert.ok(fs.statSync(path.join(root,p)).size > 500);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length, 'HTML IDs are unique');
for (const m of js.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(m[1]), `Missing element ${m[1]}`);
for (const p of ['overview', 'main', 'food', 'river']) assert.ok(html.includes(`data-view="${p}"`));
assert.ok(html.includes('<noscript>') && html.includes('id="plan"') && html.includes('id="place-list"'));
assert.ok(js.includes('prefers-reduced-motion') && js.includes('webglcontextlost'));
assert.ok(css.includes('@media(max-width:600px)'));
assert.doesNotMatch(html + js, /<audio|<video|<iframe|\.play\(|requestFullscreen\(|<form|type="email"/);
assert.doesNotMatch(html + js, /src="https?:\/\/|fetch\(|localStorage|sessionStorage/);
assert.ok(html.includes('proposed collaborations') && html.includes('Free membership'));
const manifest = JSON.parse(read('documents/universal-mind-lab/reference-manifest.json'));
assert.equal(manifest.records.length, 26);
for (const row of manifest.records) {
  const bytes = fs.readFileSync(path.join(root,'documents/universal-mind-lab',row.destination_path));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256,`${row.id} original hash`);
}
console.log(JSON.stringify({ passed:true, originalReferences:26, selfHosted3D:true, planFallback:true, noIntakeOrPlayback:true, places:4 }));
