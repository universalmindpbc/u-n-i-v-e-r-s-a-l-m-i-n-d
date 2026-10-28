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
assert(page.includes('id="watch-film"'));
assert(!page.includes('class="experience-footer"')&&!page.includes('id="motion-toggle"'));
assert(!page.includes('research signals require validation'));
assert(access.includes('hash_equals')&&access.includes('allowedPasswordHashes'));
assert(!/[a-f0-9]{64}/.test(access),'Do not duplicate invitation digests');
assert(media.includes('happiness_require_access();'));
assert(media.includes("require __DIR__ . '/film-config.php'"));
assert(read('happiness/film-config.php').includes('8dc27681c2ab042abf567389868cea9e'));
assert(script.includes('background.muted=true;background.defaultMuted=true;background.volume=0;'));
assert(script.includes('playerFrame?.remove()')&&script.includes('loadGeneration'));
const film=page.match(/<section id="film-view"[\s\S]*?<\/section>/)[0];
const events=read('events/index.php');
const back=events.match(/<button id="film-back"[^\n]+/)[0];
assert(film.includes(back),'Keep the signed-off Events Back button');
assert.equal((film.match(/<button\b/g)||[]).length,2,'Keep only Back and the requested video fullscreen control');
assert(film.includes('id="film-fullscreen"')&&film.includes('href="#icon-expand"'));
assert(!film.includes('<input')&&!film.includes('data-open-about'));
assert(film.includes('class="film-timecode"'));
const styles=read('happiness/assets/happiness.css'), eventStyles=read('events/assets/events.css');
for(const selector of ['.film-back{','.film-back span{','.film-back:hover{','.film-timecode{']){
 const original=eventStyles.slice(eventStyles.indexOf(selector)).split('}')[0]+'}';
 assert(styles.includes(original),`Keep the signed-off Events style: ${selector}`);
}
assert(script.includes("prefers-reduced-motion: reduce")&&network.includes('document.hidden'));
const png=fs.readFileSync(path.join(root,'happiness/assets/universal-mind-flower.png'));
assert.equal(png[25],6,'Original flower requires RGBA transparency');
assert.equal(png.readUInt32BE(16),1352);assert.equal(png.readUInt32BE(20),1364);
console.log('Happiness: approved copy, central presentation launch, protected media, original alpha logo, silent loop and player cleanup verified.');
