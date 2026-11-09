import assert from 'node:assert/strict';
import {quantumCommand} from '../../../cloudflare/informatics-quantum-command.js';
let reservations=0,calls=0,lastBody;
const env={RESEARCH_MODEL:'gpt-6-astra',BUDGET:{idFromName:x=>x,get:()=>({fetch:async()=>{reservations++;return Response.json({allowed:true});}})}};
const request=body=>new Request('https://example.test/quantum/command',{method:'POST',body:JSON.stringify(body)});
const provider=(status,command)=>async(e,path,body)=>{calls++;lastBody=body;return Response.json({id:'receipt',status,output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(command)}]}]});};
await assert.rejects(quantumCommand(env,request({question:''}),provider('completed',{})),e=>e.status===400);
assert.equal(calls,0);assert.equal(reservations,0);
await assert.rejects(quantumCommand(env,request({question:'Run this study'}),provider('incomplete',{action:'start',question:'OXTR question'})),/not understood/);
await assert.rejects(quantumCommand(env,request({question:'Run this study'}),provider('completed',{action:'hardware',question:'OXTR question'})),/failed validation/);
const result=await(await quantumCommand(env,request({question:'Run this study',currentQuestion:'OXTR question',history:Array(30).fill({role:'user',content:'x'.repeat(10000)})}),provider('completed',{action:'start',question:'OXTR question'}))).json();
assert.equal(result.action,'start');assert.equal(result.provider_response_id,'receipt');assert.equal(lastBody.store,false);assert.equal(lastBody.max_output_tokens,1400);assert.equal(lastBody.service_tier,'default');assert.equal(JSON.parse(lastBody.input[0].content).latest_visitor_message,'Run this study');assert(JSON.stringify(lastBody.input).length<25000);
console.log('Quantum command validation, incomplete-response handling and bounded context passed.');

for(const action of ['capabilities','hardware_capabilities']){const result=await(await quantumCommand(env,request({question:'Do you have access to the Quantum Agents?'}),provider('completed',{action,question:''}))).json();assert.equal(result.action,action);}
