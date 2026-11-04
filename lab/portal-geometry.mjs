/** Exact regular polyhedra. Coordinates use a unit circumradius, never per-axis fitting. */
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>mul(a,1/Math.hypot(...a));
export function convexFaces(vertices){
 const planes=new Map(),epsilon=1e-7;
 for(let i=0;i<vertices.length-2;i++)for(let j=i+1;j<vertices.length-1;j++)for(let k=j+1;k<vertices.length;k++){
  let n=cross(sub(vertices[j],vertices[i]),sub(vertices[k],vertices[i]));if(Math.hypot(...n)<epsilon)continue;n=norm(n);
  let d=dot(n,vertices[i]),dist=vertices.map(v=>dot(n,v)-d);
  if(dist.some(v=>v>epsilon)&&dist.some(v=>v<-epsilon))continue;
  if(d<0){n=mul(n,-1);d=-d;}
  const ids=vertices.map((v,l)=>Math.abs(dot(n,v)-d)<epsilon?l:-1).filter(l=>l>=0),key=ids.join(',');
  if(planes.has(key))continue;
  const center=mul(ids.reduce((s,l)=>add(s,vertices[l]),[0,0,0]),1/ids.length),u=norm(sub(vertices[ids[0]],center)),v=cross(n,u);
  ids.sort((a,b)=>Math.atan2(dot(sub(vertices[a],center),v),dot(sub(vertices[a],center),u))-Math.atan2(dot(sub(vertices[b],center),v),dot(sub(vertices[b],center),u)));
  planes.set(key,ids);
 }
 return [...planes.values()];
}
function edgesOf(faces){const edges=new Map();for(const f of faces)for(let i=0;i<f.length;i++){const e=[f[i],f[(i+1)%f.length]].sort((a,b)=>a-b);edges.set(e.join(','),e);}return [...edges.values()];}
function regular(name,vertices){const radius=Math.hypot(...vertices[0]);vertices=vertices.map(v=>mul(v,1/radius));const faces=convexFaces(vertices);return {name,vertices,faces,edges:edgesOf(faces)};}
const phi=(1+Math.sqrt(5))/2;
const ico=[];for(const a of [-1,1])for(const b of [-phi,phi])ico.push([0,a,b],[a,b,0],[b,0,a]);
const cube=[];for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])cube.push([x,y,z]);
const tetra=cube.filter(v=>v[0]*v[1]*v[2]>0),octa=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const dodeca=[...cube];for(const a of [-1,1])for(const b of [-1,1])dodeca.push([0,a/phi,b*phi],[a/phi,b*phi,0],[b*phi,0,a/phi]);
const icosahedron=regular('icosahedron',ico),cut=[];
// One-third along each directed icosahedral edge: exact Archimedean truncation.
for(const [a,b] of icosahedron.edges){cut.push(mul(add(mul(icosahedron.vertices[a],2),icosahedron.vertices[b]),1/3));cut.push(mul(add(mul(icosahedron.vertices[b],2),icosahedron.vertices[a]),1/3));}
export const solids={tetrahedron:regular('tetrahedron',tetra),cube:regular('cube',cube),octahedron:regular('octahedron',octa),dodecahedron:regular('dodecahedron',dodeca),icosahedron,truncatedIcosahedron:regular('truncated icosahedron',cut)};
const a=regular('tetrahedron A',tetra),b=regular('tetrahedron B',tetra.map(v=>mul(v,-1)));
solids.stellatedOctahedron={name:'stellated octahedron',vertices:[...a.vertices,...b.vertices],faces:[...a.faces,...b.faces.map(f=>f.map(i=>i+4))],edges:[...a.edges,...b.edges.map(e=>e.map(i=>i+4))],compound:true};
export const portalZones=[
 {id:'steam',label:'s . t . e . a . m .',title:'S.T.E.A.M.',shape:'truncatedIcosahedron',position:[0,0],radius:3.6,centerY:1.9,colour:'#e6d67a',copy:'Creative technology workshops responding to live cinema, TV and advertising briefs. Explore science, technology, engineering, arts and mathematics together.'},
 {id:'mantra',label:'m a n t r a',title:'Mantra',shape:'cube',position:[-4.75,-8.23],radius:4.33,centerY:2.5,colour:'#ae91c7',copy:'Language, voice and rhythm meet microphones, sampling and electronic music. First Nations collaboration shapes the language and cultural programme.'},
 {id:'sound',label:'s o u n d',title:'Sound',shape:'octahedron',position:[4.75,-8.23],radius:4.8,centerY:4.8/Math.sqrt(3),colour:'#e9bc7e',copy:'Explore sound through synthesizers, drum machines, modular instruments and a shared listening system.'},
 {id:'comedy',label:'c o m e d y',title:'Comedy',shape:'dodecahedron',position:[9.5,0],radius:3.7,centerY:1.9,colour:'#d9df9e',copy:'Play with storytelling, humour and communication in a small circle. Practise expression, listening and connection.'},
 {id:'sexed',label:'s e x - e d',title:'Sex-ed',shape:'icosahedron',position:[4.75,8.23],radius:3.8,centerY:1.9,colour:'#ecce8a',copy:'A facilitated educational conversation about relationships, consent, communication and wellbeing.'},
 {id:'atelier',label:'a t e l l i e r',title:'Atellier',shape:'stellatedOctahedron',position:[-4.75,8.23],radius:4.2,centerY:2.45,colour:'#dda1a4',copy:'Fashion design through textiles, mannequins, garment construction and creative collaboration.'},
 {id:'emdr',label:'e m d r',title:'EMDR',shape:'tetrahedron',position:[-9.5,0],radius:4.8,centerY:1.6,colour:'#db9ca6',copy:'Explore the EMDR programme with a facilitator, sensor-equipped headsets and a comfortable small-group setting.'}
];
export const portalPlacement={x:-34,z:66,ringRadius:9.5};

export function placedVertices(config){
 const solid=solids[config.shape];
 const from=config.shape==='tetrahedron'?solid.vertices[0]:config.shape==='octahedron'?norm([1,1,1]):null;
 return solid.vertices.map(v=>{
  let rotated=v;
  if(from){const to=[0,1,0],axis=cross(from,to),c=dot(from,to);
   // Rodrigues rotation with the unnormalised cross axis. Rotation only; no deformation.
   rotated=add(add(v,cross(axis,v)),mul(cross(axis,cross(axis,v)),1/(1+c)));
  }
  return add(mul(rotated,config.radius),[0,config.centerY,0]);
 });
}
