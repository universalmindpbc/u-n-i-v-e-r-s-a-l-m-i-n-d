import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const landing = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const directory = fs.readFileSync(path.join(root, 'home/index.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'home/directory.css'), 'utf8');
for (const script of landing.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(script[1]);
const copy = [
  'Universal Mind is an electronic music company for mental health',
  'WATCH TV', 'watch electronic music &amp; fashion as mindfulness',
  'ATTEND EVENTS', 'attend electronic music &amp; fashion as mindfulness',
  'ACTIVATE FESTIVALS', 'activate our happiness currency for health, safety &amp; risk management at your festivals',
  'EXPLORE RESEARCH', 'explore our bioinformatics platform for mental health'
];
for (const text of copy) assert(directory.includes(text), `Missing approved copy: ${text}`);
const asset = landing.match(/class="access-flower"\s+src="([^"]+)"/)[1];
assert(directory.includes(`class="directory-flower" src="${asset}"`));
for (const width of ['94px', '82px']) {
  assert(landing.includes(`width: ${width}`));
  assert(styles.includes(`width: ${width}`));
}
const flowerRules = [...styles.matchAll(/\.directory-flower\s*\{([^}]+)\}/g)].map(match => match[1]).join('\n');
assert(!/opacity|filter|mix-blend-mode/.test(flowerRules));
assert(directory.includes('href="/iam/"'));
assert(directory.includes('href="/events/?experience=1"'));
assert(directory.includes('href="/informatics/"'));
const festivals = directory.match(/<a[^>]+data-destination="festivals"[^>]*>/)[0];
assert(festivals.includes('aria-disabled="true"') && !festivals.includes('href='));
assert(landing.includes('window.location.assign("/home/")'));
console.log('Directory source: exact copy, original flower, responsive sizes, routes and landing syntax verified.');
