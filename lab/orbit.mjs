/** Continuous 24-second site circuit. Coordinates are metres in the scene. */
export const orbitShots=[
 {t:0,shot:'runway',position:[16,9,46],target:[0,1.5,23]},
 {t:3,shot:'stage-front',position:[0,4.2,6],target:[0,2.2,-17.6]},
 {t:5.5,shot:'apple',position:[38,12,19],target:[17,2,1]},
 {t:8,shot:'east-stage',position:[31,16,-30],target:[0,3,-12]},
 {t:10.5,shot:'behind-stage',position:[-3,16,-40],target:[0,3,-13]},
 {t:12.5,shot:'support',position:[-37,15,-35],target:[-26,2,-12]},
 {t:15,shot:'video-trailers',position:[-58,8,23],target:[-40,2.8,22]},
 {t:17,shot:'rear-trailer',position:[-54,7,47],target:[-40,2.8,36]},
 {t:18.5,shot:'playground',position:[-25,17,57],target:[-17,1.8,24]},
 {t:24,shot:'overview',position:[65,51,82],target:[-1,0,0]}
];
const smooth=t=>t*t*t*(t*(t*6-15)+10);
const cubic=(a,b,c,d,t)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
export function overviewPose(){return {position:[78.2,73.2,98.4],target:[-1,12,0]};}
export function mobileOverviewPose(portrait=false,height=647){
 if(!portrait)return {position:[102,130,134],target:[-1,40,0]};
 // Pull back 30% and reserve sky above the forest for the portrait headline.
 const lift=Math.max(20,28+(647-height)*.16)+35;
 return {position:[132.9,117+lift,174.2],target:[-1,lift,0]};
}
export function orbitPose(seconds,mobile=false,portrait=false,height=647){
 const time=Math.max(0,Math.min(24,seconds));let i=0;
 while(i<orbitShots.length-2&&time>orbitShots[i+1].t)i++;
 const b=orbitShots[i],c=orbitShots[i+1],a=orbitShots[Math.max(0,i-1)],d=orbitShots[Math.min(orbitShots.length-1,i+2)],u=smooth((time-b.t)/(c.t-b.t));
 const target=b.target.map((n,k)=>cubic(a.target[k],n,c.target[k],d.target[k],u));
 const position=b.position.map((n,k)=>cubic(a.position[k],n,c.position[k],d.position[k],u));
 if(mobile){const wide=smooth(Math.max(0,(time-18.5)/5.5)),end=orbitShots.at(-1),mobileEnd=mobileOverviewPose(portrait,height);for(let k=0;k<3;k++){const expandedEnd=end.target[k]+(end.position[k]-end.target[k])*1.15;position[k]=target[k]+(position[k]-target[k])*1.15+(mobileEnd.position[k]-expandedEnd)*wide;target[k]+=(mobileEnd.target[k]-end.target[k])*wide;}}
 if(!mobile){const wide=smooth(Math.max(0,(time-18.5)/5.5)),end=orbitShots.at(-1),final=overviewPose();for(let k=0;k<3;k++){position[k]+=(final.position[k]-end.position[k])*wide;target[k]+=(final.target[k]-end.target[k])*wide;}}
 return {position,target,shot:u<.5?b.shot:c.shot};
}
