import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {geometry,transformPoint,PHI} from '../research/informatics/molecular-atlas-build/geometry.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const [name,v,e] of [['tetrahedron',4,6],['cube',8,12],['octahedron',6,12],['dodecahedron',20,30],['icosahedron',12,30],['stellated',8,12],['truncated-icosahedron',60,90]]){
 const g=geometry(name);assert.equal(g.vertices.length,v);assert.equal(g.edges.length,e);
 assert.ok(g.vertices.every(p=>Math.abs(Math.hypot(...p)-1)<1e-12));
 const lengths=g.edges.map(([a,b])=>Math.hypot(...g.vertices[a].map((x,i)=>x-g.vertices[b][i])));
 assert.ok(Math.max(...lengths)-Math.min(...lengths)<1e-12);
 const moved=g.vertices.map(p=>transformPoint(p,{radius:7,scale:1.5,centre:[12,-6,4],rotation:37,offset:.8}));
 assert.ok(g.edges.every(([a,b],i)=>Math.abs(Math.hypot(...moved[a].map((x,k)=>x-moved[b][k]))-10.5*lengths[i])<1e-10));
}
// Recover the convex supporting faces independently from the generated edges.
const truncated=geometry('truncated-icosahedron'),faces=new Map(),epsilon=1e-9;
const subtract=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
for(let i=0;i<60;i++)for(let j=i+1;j<60;j++)for(let k=j+1;k<60;k++){
 const origin=truncated.vertices[i],normal=cross(subtract(truncated.vertices[j],origin),subtract(truncated.vertices[k],origin));
 const length=Math.hypot(...normal);if(length<epsilon)continue;
 const distances=truncated.vertices.map(v=>dot(subtract(v,origin),normal)/length);
 if(Math.min(...distances)<-epsilon&&Math.max(...distances)>epsilon)continue;
 const face=distances.flatMap((distance,index)=>Math.abs(distance)<epsilon?[index]:[]);
 faces.set(face.join(','),face);
}
assert.equal(faces.size,32);
assert.equal([...faces.values()].filter(face=>face.length===5).length,12);
assert.equal([...faces.values()].filter(face=>face.length===6).length,20);
assert.equal(truncated.vertices.length-truncated.edges.length+faces.size,2);
assert.ok(truncated.vertices.every((_,i)=>truncated.edges.filter(edge=>edge.includes(i)).length===3));
assert.ok(truncated.edges.every(([a,b])=>[...faces.values()].filter(face=>face.includes(a)&&face.includes(b)).length===2));
const html=await fs.readFile(path.join(root,'Informatics/molecular/index.html'),'utf8');
assert.match(html,/<option value="stellated">Stellated octahedron<\/option><option value="truncated-icosahedron">Truncated icosahedron<\/option>/);
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
