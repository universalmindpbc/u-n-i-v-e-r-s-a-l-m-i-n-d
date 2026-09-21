import assert from 'node:assert/strict';
import {createExposureSync} from '../i  a m/study/exposure-sync.js';

const end={ended:true,media_time:488.14,position:488.14,duration:488.14};
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(send,complete=()=>{}) {
 const jobs=new Map(),errors=[];let id=0;
 const sync=createExposureSync({send,complete,failed:(error,context)=>errors.push({error,context}),
  setTimer:fn=>{jobs.set(++id,fn);return id;},clearTimer:key=>jobs.delete(key)});
 return {sync,jobs,errors,async next(){const [key,fn]=jobs.entries().next().value; jobs.delete(key);fn();await settle();}};
}
let calls=[],done=0,release;
const busy=fixture(values=>{calls.push(values);return calls.length===1?new Promise(resolve=>release=resolve):Promise.resolve({state:'after_vitals'});},()=>done++);
busy.sync.push({ended:false,media_time:487});busy.sync.push(end);
release({state:'experience'});await settle();assert.equal(done,0);await busy.next();
assert.equal(done,1);assert.deepEqual(calls[1],end);assert.equal(busy.jobs.size,0);

calls=[];done=0;
const delayed=fixture(async values=>{calls.push(values);return {state:calls.length<4?'experience':'after_vitals'};},()=>done++);
delayed.sync.push(end);await settle();
for(let i=0;i<3;i++)await delayed.next();
assert.equal(done,1);assert.equal(calls.length,4);assert.ok(calls.every(v=>JSON.stringify(v)===JSON.stringify(end)));
assert.equal(delayed.jobs.size,0,'Stop polling once the after-check is confirmed');

let attempts=0;done=0;
const lost=fixture(async()=>{if(++attempts===1)throw new Error('Response lost');return {state:'after_vitals'};},()=>done++);
lost.sync.push(end);await settle();assert.equal(lost.errors[0].context.ended,true);await lost.next();assert.equal(done,1);

attempts=0;
const refresh=fixture(async()=>({state:'after_vitals'}),()=>{if(++attempts===1)throw new Error('Refresh failed');});
refresh.sync.push(end);await settle();await refresh.next();assert.equal(attempts,2);assert.equal(refresh.jobs.size,0);

const closed=fixture(async()=>({state:'experience'}));closed.sync.push(end);await settle();closed.sync.close();assert.equal(closed.jobs.size,0);
console.log('Study completion sync passed: busy requests, delayed server acceptance, lost response, failed refresh and teardown; no fabricated watched time.');
