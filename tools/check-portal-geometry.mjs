import assert from 'node:assert/strict';
import {solids,portalZones,placedVertices} from '../lab/portal-geometry.mjs';
import {storyFrame,ORBIT_START,STORY_END} from '../lab/story.mjs';
import {orbitPose,ORBIT_ENTRY} from '../lab/orbit.mjs';
const expected={tetrahedron:[4,6,4,{3:4}],cube:[8,12,6,{4:6}],octahedron:[6,12,8,{3:8}],dodecahedron:[20,30,12,{5:12}],icosahedron:[12,30,20,{3:20}],truncatedIcosahedron:[60,90,32,{5:12,6:20}]};
const minus=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const report=[];
for(const [key,s] of Object.entries(solids)){
 const lens=s.edges.map(([a,b])=>Math.hypot(...minus(s.vertices[a],s.vertices[b]))),spread=Math.max(...lens)-Math.min(...lens);
 assert(spread<1e-9,key+' unequal edges');s.vertices.forEach(v=>assert(Math.abs(Math.hypot(...v)-1)<1e-9,key+' circumradius'));
 for(const face of s.faces){const p=face.map(i=>s.vertices[i]),normal=cross(minus(p[1],p[0]),minus(p[2],p[0]));p.forEach(v=>assert(Math.abs(dot(minus(v,p[0]),normal))<1e-9,key+' planar face'));
  const angles=p.map((v,i)=>{const a=minus(p[(i+1)%p.length],v),b=minus(p[(i+p.length-1)%p.length],v);return dot(a,b)/Math.hypot(...a)/Math.hypot(...b);});assert(Math.max(...angles)-Math.min(...angles)<1e-9,key+' regular face angles');
 }
 const counts={};s.faces.forEach(f=>counts[f.length]=(counts[f.length]||0)+1);
 if(!s.compound){assert.deepEqual([s.vertices.length,s.edges.length,s.faces.length,counts],expected[key]);assert.equal(s.vertices.length-s.edges.length+s.faces.length,2);for(const [a,b] of s.edges)assert.equal(s.faces.filter(f=>f.some((v,i)=>v===a&&f[(i+1)%f.length]===b||v===b&&f[(i+1)%f.length]===a)).length,2);}
 else assert.deepEqual([s.vertices.length,s.edges.length,s.faces.length],[8,12,8]);
 report.push({shape:key,vertices:s.vertices.length,edges:s.edges.length,faces:counts,maxEdgeError:spread});
}
assert.equal(portalZones.length,7);assert.equal(new Set(portalZones.map(z=>z.shape)).size,7);
assert.deepEqual(portalZones.map(z=>z.label),['s . t . e . a . m .','m a n t r a','s o u n d','c o m e d y','s e x - e d','a t e l i e r','e m d r']);
const dimensions=portalZones.map(z=>{
 const vertices=placedVertices(z),s=solids[z.shape],lengths=s.edges.map(([a,b])=>Math.hypot(...minus(vertices[a],vertices[b])));
 assert(Math.max(...lengths)-Math.min(...lengths)<1e-9,z.id+' placed edge distortion');
 const size=[0,1,2].map(i=>Math.max(...vertices.map(v=>v[i]))-Math.min(...vertices.map(v=>v[i]))),minY=Math.min(...vertices.map(v=>v[1]));
 if(z.id==='mantra')assert(Math.max(...size)-Math.min(...size)<1e-9,'cube aspect ratio');
 if(['sound','emdr'].includes(z.id))assert(Math.abs(minY)<1e-9,'face on grass');
 return {zone:z.id,sizeMetres:size,lowestVertexMetres:minY,groundIntersection:minY<-.01};
});
assert.equal(storyFrame(73).tourView,'portal');assert.equal(storyFrame(82.99).tourView,'portal');
assert.equal(storyFrame(ORBIT_START).phase,'orbit');assert.equal(storyFrame(STORY_END).tourView,'overview');
const entry={position:[-11,19,95],target:[-34,1.9,66]};
for(const mobile of [false,true]){
 const first=orbitPose(0,mobile,mobile,780,entry);for(const key of ['position','target'])assert.deepEqual(first[key],entry[key]);
 const before=orbitPose(ORBIT_ENTRY-.00001,mobile,mobile,780,entry),after=orbitPose(ORBIT_ENTRY+.00001,mobile,mobile,780,entry);
 for(const key of ['position','target'])assert(Math.hypot(...minus(after[key],before[key]))<.001,'continuous Portal-to-circuit join');
}
console.log(JSON.stringify({pass:true,uniformCircumradius:true,continuousStoryJoin:true,report,dimensions},null,2));
