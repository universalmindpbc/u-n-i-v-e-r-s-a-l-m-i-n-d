import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const page=read('happiness/index.php'), access=read('happiness/access.php'), media=read('happiness/media.php');
const script=read('happiness/assets/happiness.js'), network=read('happiness/assets/network.js');
const about=[
 'Happiness is a universal happiness currency for festivals globally, powered via Apple Watch. Attendees at festivals are rewarded when they are safe, healthy and happy, together as one.',
 'Happiness also powers a real time public health &amp; safety index for festivals, mitigating risk. People own their data and ethics are via The Ethics Centre and Center for Humane Technology, in conjunction with Apple Watch, together as one.',
 'Our mission is lowering the mass cancelation of festivals globally, via lowering the cost of risk mitigation for festivals, including user pays police, security, medical and insurance, while ensuring events are safe and healthy, together as one.'
];
for(const paragraph of about)assert(page.includes(`<p>${paragraph}</p>`),'Approved About text changed');
assert(page.includes('real time public health &amp; safety index for festivals'));
assert.equal((page.match(/id="[^"]+"/g)||[]).length,new Set(page.match(/id="[^"]+"/g)).size,'Duplicate element IDs');
assert(page.includes('data-film-start="60"')&&page.includes('data-film-start="103"'));
assert(page.includes('research signals require validation'));
assert(access.includes('hash_equals')&&access.includes('allowedPasswordHashes'));
assert(!/[a-f0-9]{64}/.test(access),'Do not duplicate invitation digests');
assert(media.includes('happiness_require_access();'));
assert(media.includes('8dc27681c2ab042abf567389868cea9e'));
assert(script.includes('background.muted=true;background.defaultMuted=true;background.volume=0;'));
assert(script.includes('playerFrame?.remove()')&&script.includes('loadGeneration'));
assert(script.includes("prefers-reduced-motion: reduce")&&network.includes('document.hidden'));
const png=fs.readFileSync(path.join(root,'happiness/assets/universal-mind-flower.png'));
assert.equal(png[25],6,'Original flower requires RGBA transparency');
assert.equal(png.readUInt32BE(16),1352);assert.equal(png.readUInt32BE(20),1364);
console.log('Happiness: approved copy, chapters, protected media, original alpha logo, silent loop and player cleanup verified.');
