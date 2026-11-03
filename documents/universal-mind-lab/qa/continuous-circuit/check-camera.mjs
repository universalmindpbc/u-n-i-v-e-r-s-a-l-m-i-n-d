import assert from 'node:assert/strict';
import {orbitPose,overviewPose,mobileOverviewPose,ORBIT_ENTRY,ORBIT_CIRCUIT,ORBIT_DURATION} from '../../../../lab/orbit.mjs';
import {storyFrame,ORBIT_START,STORY_END} from '../../../../lab/story.mjs';
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const speeds=[],turns=[];let prev,previousDirection;
for(let t=ORBIT_ENTRY;t<ORBIT_ENTRY+ORBIT_CIRCUIT;t+=1/60){
 const p=orbitPose(t);assert(Math.abs(p.position[1]-2.6)<1e-8);
 const delta=p.target.map((v,i)=>v-p.position[i]),len=Math.hypot(...delta),direction=delta.map(v=>v/len);
 if(prev)speeds.push(distance(p.position,prev.position)*60);
 if(previousDirection)turns.push(Math.acos(Math.max(-1,Math.min(1,direction.reduce((s,v,i)=>s+v*previousDirection[i],0))))*60*180/Math.PI);
 prev=p;previousDirection=direction;
}
assert(Math.min(...speeds)>3);assert(Math.max(...speeds)/Math.min(...speeds)<1.02,'No repeated easing/stops around circuit');
for(const t of [ORBIT_ENTRY,ORBIT_ENTRY+ORBIT_CIRCUIT])for(const key of ['position','target']){
 const h=.0001,a=orbitPose(t-h)[key],b=orbitPose(t)[key],c=orbitPose(t+h)[key];
 const incoming=b.map((v,i)=>(v-a[i])/h),outgoing=c.map((v,i)=>(v-b[i])/h);
 assert(distance(incoming,outgoing)<.02,'Continuous velocity at circuit joins');
}
for(const [mobile,portrait,height] of [[false,false,1000],[true,true,647],[true,true,568],[true,false,390]]){
 assert.deepEqual(orbitPose(ORBIT_DURATION,mobile,portrait,height).position,(mobile?mobileOverviewPose(portrait,height):overviewPose()).position);
}
assert.equal(storyFrame(38).tourView,'truck');assert.equal(storyFrame(ORBIT_START).phase,'orbit');assert.equal(storyFrame(STORY_END).tourView,'overview');
console.log(JSON.stringify({passed:true,durationSeconds:ORBIT_DURATION,circuitSeconds:ORBIT_CIRCUIT,eyeHeight:2.6,speed:{min:Math.min(...speeds),max:Math.max(...speeds)},maximumTurnDegreesPerSecond:Math.max(...turns)},null,2));
