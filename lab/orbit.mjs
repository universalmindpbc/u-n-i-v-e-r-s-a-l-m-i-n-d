/** One unbroken, arc-length paced circuit at visitor height, with entry and exit. */
export const ORBIT_ENTRY=5, ORBIT_CIRCUIT=60, ORBIT_EXIT=7;
export const ORBIT_DURATION=ORBIT_ENTRY+ORBIT_CIRCUIT+ORBIT_EXIT;
const stops=[
 {shot:'stage-front',position:[1,2.6,7],target:[0,2,-17]},
 {shot:'apple',position:[21,2.6,23],target:[18,1.5,8]},
 {shot:'east-stage',position:[29,2.6,-3],target:[0,2,-12]},
 {shot:'behind-stage',position:[20,2.6,-28],target:[0,2,-16]},
 {shot:'stage-rear',position:[-2,2.6,-33],target:[0,2,-12]},
 {shot:'support',position:[-29,2.6,-32],target:[-25,1.4,-19]},
 {shot:'food',position:[-45,2.6,-12],target:[-25,1.5,-10]},
 {shot:'video-trailers',position:[-55,2.6,25],target:[-40,2.5,27]},
 {shot:'rear-trailer',position:[-47,2.6,50],target:[-40,2.5,37]},
 {shot:'mobile-music',position:[-20,2.6,40],target:[-25,1.4,18]},
 {shot:'runway',position:[0,2.6,30],target:[0,1.7,-12]}
];
const cubic=(a,b,c,d,t)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
function spline(u){
 const k=((u%1)+1)%1*stops.length,i=Math.floor(k),t=k-i,n=stops.length;
 const [a,b,c,d]=[-1,0,1,2].map(offset=>stops[(i+offset+n)%n]);
 return {position:b.position.map((v,j)=>cubic(a.position[j],v,c.position[j],d.position[j],t)),target:b.target.map((v,j)=>cubic(a.target[j],v,c.target[j],d.target[j],t)),shot:b.shot};
}
// A single speed across the entire curve; there is no easing at intermediate stops.
const samples=2200,arc=[0];let prior=spline(0).position;
for(let i=1;i<=samples;i++){const p=spline(i/samples).position;arc.push(arc.at(-1)+Math.hypot(...p.map((v,j)=>v-prior[j])));prior=p;}
const distance=arc.at(-1);
function circuit(seconds){
 const d=Math.max(0,Math.min(1,seconds/ORBIT_CIRCUIT))*distance;
 let lo=0,hi=samples;while(lo+1<hi){const mid=(lo+hi)>>1;if(arc[mid]<d)lo=mid;else hi=mid;}
 const f=(d-arc[lo])/(arc[hi]-arc[lo]);return spline((lo+f)/samples);
}
export function overviewPose(){return {position:[78.2,73.2,98.4],target:[-1,12,0]};}
export function mobileOverviewPose(portrait=false,height=647){
 if(!portrait)return {position:[102,130,134],target:[-1,40,0]};
 const lift=Math.max(20,28+(647-height)*.16)+35;
 return {position:[132.9,117+lift,174.2],target:[-1,lift,0]};
}
const start=circuit(0),epsilon=.00001;
const entryVelocity={},exitVelocity={};
for(const key of ['position','target']){
 entryVelocity[key]=circuit(epsilon)[key].map((v,i)=>(v-start[key][i])/epsilon);
 exitVelocity[key]=start[key].map((v,i)=>(v-circuit(ORBIT_CIRCUIT-epsilon)[key][i])/epsilon);
}
function join(a,b,va,vb,t,duration){
 const h00=2*t*t*t-3*t*t+1,h10=t*t*t-2*t*t+t,h01=-2*t*t*t+3*t*t,h11=t*t*t-t*t;
 return a.map((v,i)=>h00*v+h10*duration*va[i]+h01*b[i]+h11*duration*vb[i]);
}
export function orbitPose(seconds,mobile=false,portrait=false,height=647){
 const time=Math.max(0,Math.min(ORBIT_DURATION,seconds)),zero=[0,0,0];
 if(time>=ORBIT_ENTRY&&time<=ORBIT_ENTRY+ORBIT_CIRCUIT)return circuit(time-ORBIT_ENTRY);
 const pose={shot:time<ORBIT_ENTRY?'arrival-at-runway':'overview'};
 if(time<ORBIT_ENTRY){
  const from={position:[16,9,46],target:[0,1.5,23]};if(mobile)from.position=from.position.map((v,i)=>from.target[i]+(v-from.target[i])*1.5);
  for(const key of ['position','target'])pose[key]=join(from[key],start[key],zero,entryVelocity[key],time/ORBIT_ENTRY,ORBIT_ENTRY);
 }else{
  const end=mobile?mobileOverviewPose(portrait,height):overviewPose(),u=(time-ORBIT_ENTRY-ORBIT_CIRCUIT)/ORBIT_EXIT;
  for(const key of ['position','target'])pose[key]=join(start[key],end[key],exitVelocity[key],zero,u,ORBIT_EXIT);
 }
 return pose;
}
