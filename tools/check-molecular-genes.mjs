import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {dnaWindow,genomicPosition,complement,DNA_WINDOW} from '../research/informatics/molecular-atlas-build/dna.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const index=await read('Informatics/molecular/data/genes/index.json');
assert.deepEqual(index.genes.map(g=>g.symbol),['OXTR','SLC6A4','DRD2','GRIN1','GRIN2B','IL6','NR3C1','DOCK2','CD38']);
for(const metadata of index.genes){
 const symbol=metadata.symbol.toLowerCase(),g=await read('Informatics/molecular/data/genes/'+symbol+'.json');
 const raw=async suffix=>JSON.parse(gunzipSync(await fs.readFile(path.join(root,'research/informatics/molecular-atlas-build/gene-sources',symbol+suffix))).toString());
 const ucsc=await raw('-dna.json.gz'),ensembl=await raw('-crosscheck.json.gz'),annotation=await raw('-annotation.json.gz');
 let expected=ucsc.dna.toUpperCase();if(g.strand===-1)expected=[...expected].reverse().map(b=>complement[b]).join('');
 assert.equal(g.sequence,expected);assert.equal(g.sequence,ensembl.seq.toUpperCase());assert.equal(g.length,g.end-g.start+1);assert.equal(g.sequence.length,g.length);assert.equal(createHash('sha256').update(g.sequence).digest('hex'),metadata.sha256);
 const canonical=annotation.Transcript.find(t=>t.id===g.canonicalTranscript.split('.')[0]);assert.ok(canonical);assert.equal(g.tss,g.strand===1?canonical.start:canonical.end);assert.equal(g.exons.length,canonical.Exon.length);
 for(const exon of g.exons){assert.ok(canonical.Exon.some(e=>e.start===exon.start&&e.end===exon.end));assert.equal(exon.length,exon.end-exon.start+1);assert.equal(genomicPosition(g,exon.offset),g.strand===1?exon.start:exon.end);}
 for(const offset of [0,1,g.length-48,g.length, ...g.exons.map(e=>e.offset)]){const w=dnaWindow(g,offset);assert.equal(w.sequence.length,DNA_WINDOW);assert.equal(w.sequence,g.sequence.slice(w.start,w.start+48));assert.ok(w.start>=0&&w.start+48<=g.length);assert.equal(w.position(0),genomicPosition(g,w.start));assert.equal(w.position(47),genomicPosition(g,w.start+47));assert.ok(Math.abs(Math.hypot(...w.point(0,0).map((n,i)=>n-w.point(0,1)[i]))-20)<1e-10);}
}
console.log('Nine genes: independent DNA-source agreement, SHA-256, strand orientation, canonical exons, transcription starts and 48-base boundary windows passed.');
