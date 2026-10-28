import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('home/directory.js','utf8');
const flush=async()=>{for(let n=0;n<6;n++)await Promise.resolve();};
function page({reduced=false,denied=false}={}){
 const calls=[];
 const element=()=>Object.assign(new EventTarget(),{dataset:{},setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];}});
 const film=Object.assign(element(),{src:'/home/assets/festival-loop.mp4?v=silent-1',networkState:0,readyState:0,paused:true,load(){calls.push('load');this.networkState=2;},play(){calls.push('play');assert(this.readyState>=1,'Automatic play ran before metadata');if(denied)return Promise.reject(new DOMException('Denied','NotAllowedError'));this.paused=false;return Promise.resolve();},pause(){calls.push('pause');this.paused=true;}});
 const ambient=element(),fullscreen=element(),motion=Object.assign(element(),{matches:reduced});
 const document=Object.assign(new EventTarget(),{hidden:false,visibilityState:'visible',body:{classList:{contains:()=>false},dataset:{}},querySelectorAll:()=>[],querySelector:s=>({'.festival-film':film,'.ambient-toggle':ambient,'.fullscreen-toggle':fullscreen}[s]||null)});
 const timers=[];const window={matchMedia:()=>motion,setTimeout:f=>timers.push(f),addEventListener:()=>{}};window.parent=window;
 vm.runInNewContext(source,{window,document,HTMLMediaElement:{NETWORK_EMPTY:0,HAVE_METADATA:1},Promise,URLSearchParams,location:{search:''},performance:{now:()=>0},CustomEvent:class extends Event{constructor(t,o){super(t);this.detail=o.detail;}},navigator:{userAgent:'test'},getComputedStyle:()=>({opacity:'1'})});
 return {calls,film,ambient,document,timers,allow:()=>{denied=false;}};
}
const empty=page();assert.deepEqual(empty.calls,['load']);empty.film.readyState=1;empty.film.dispatchEvent(new Event('loadedmetadata'));empty.film.dispatchEvent(new Event('canplay'));await flush();assert.deepEqual(empty.calls,['load','play']);assert.equal(empty.film.muted,true);assert.equal(empty.film.playsInline,true);
empty.ambient.dispatchEvent(new Event('click'));assert(empty.film.paused);empty.document.dispatchEvent(new Event('visibilitychange'));await flush();assert.equal(empty.calls.filter(call=>call==='play').length,1);assert(empty.film.paused);
const denied=page({denied:true});denied.film.readyState=1;denied.film.dispatchEvent(new Event('loadedmetadata'));await flush();assert.equal(denied.ambient['aria-label'],'Play background motion');denied.allow();denied.ambient.dispatchEvent(new Event('click'));await flush();assert.equal(denied.film.paused,false);
const reduced=page({reduced:true});assert.deepEqual(reduced.calls,['pause']);
const stalled=page();stalled.timers.forEach(f=>f());assert.equal(stalled.ambient['aria-label'],'Play background motion');
const result={emptyResourceLoadsBeforePlayback:true,readinessEventsDeduplicatePlay:true,explicitPausePreserved:true,policyBlockManualRecovery:true,reducedMotionDoesNotLoad:true,stalledLoadExposesPlay:true,passed:true};
fs.writeFileSync('/private/tmp/um-directory-20261028/safari-silent-work/startup-state-verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
