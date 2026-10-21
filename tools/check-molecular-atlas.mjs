import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {geometry,transformPoint,PHI} from '../research/informatics/molecular-atlas-build/geometry.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const [name,v,e] of [['tetrahedron',4,6],['cube',8,12],['octahedron',6,12],['dodecahedron',20,30],['icosahedron',12,30],['stellated',8,12]]){
 const g=geometry(name);assert.equal(g.vertices.length,v);assert.equal(g.edges.length,e);
 assert.ok(g.vertices.every(p=>Math.abs(Math.hypot(...p)-1)<1e-12));
 const lengths=g.edges.map(([a,b])=>Math.hypot(...g.vertices[a].map((x,i)=>x-g.vertices[b][i])));
 assert.ok(Math.max(...lengths)-Math.min(...lengths)<1e-12);
 const moved=g.vertices.map(p=>transformPoint(p,{radius:7,scale:1.5,centre:[12,-6,4],rotation:37,offset:.8}));
 assert.ok(g.edges.every(([a,b],i)=>Math.abs(Math.hypot(...moved[a].map((x,k)=>x-moved[b][k]))-10.5*lengths[i])<1e-10));
}
assert.ok(Math.abs(geometry('odom').ratio-PHI)<1e-12);assert.equal(geometry('phi').points.length,89);
const records=JSON.parse(await fs.readFile(path.join(root,'Informatics/molecular/data/catalogue.json'),'utf8')).records;
assert.deepEqual(records.map(r=>r.id),['OXTR','SLC6A4','DRD2','NMDA','IL6','NR3C1','DOCK2','CD38']);
assert.deepEqual(records.find(r=>r.id==='NMDA').genes,['GRIN1','GRIN2B']);
for(const record of records){
 const bytes=await fs.readFile(path.join(root,'Informatics/molecular/data',record.pdb.toLowerCase()+'.bcif'));assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256);
 assert.ok(record.sequences.length);assert.ok(record.sequences.every(s=>s.sequence.length===s.length&&record.chains.includes(s.chain)));
 assert.ok(record.resolution>0);assert.match(record.source,/^https:\/\/www\.rcsb\.org\/structure\/[A-Z0-9]{4}$/);
 assert.ok((await fs.stat(path.join(root,'Informatics/molecular/thumbnails',record.id.toLowerCase()+'.png'))).size>1000);
}
for(const rel of ['index.html','atlas.js','atlas.css']){const text=await fs.readFile(path.join(root,'Informatics/molecular',rel),'utf8');assert.doesNotMatch(text,/\b(?:should|could|would)\b|golden ratio|\bDOC2\b/i);}
console.log('Molecular Atlas: 8 coordinate checksums, construct sequences, solid edge counts/lengths, transform invariance, Odom Phi Ratio and 89-point sphere passed.');
