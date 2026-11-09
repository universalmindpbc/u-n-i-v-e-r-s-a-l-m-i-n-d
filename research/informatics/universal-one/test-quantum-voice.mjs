import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const sent=[],questions=[],users=[];let data;
class Channel{readyState='open';addEventListener(name,fn){if(name==='open')queueMicrotask(fn);}send(s){sent.push(JSON.parse(s));}close(){}}
class Peer{connectionState='connected';createDataChannel(){return data=new Channel();}addTrack(){}async createOffer(){return {type:'offer',sdp:'test'};}async setLocalDescription(){}async setRemoteDescription(){}close(){}}
class Audio{play(){return Promise.resolve();}pause(){}}
const track={enabled:false,stop(){}};
const window={RTCPeerConnection:Peer,UniversalOneNeedsResearch:()=>true};
const sandbox={window,RTCPeerConnection:Peer,Audio,AbortController,console,queueMicrotask,setTimeout:()=>1,clearTimeout(){},navigator:{mediaDevices:{getUserMedia:async()=>({getAudioTracks:()=>[track],getTracks:()=>[track]})}},fetch:async()=>({ok:true,text:async()=>'test'})};
vm.runInNewContext(fs.readFileSync(new URL('../../../Informatics/universal-one-live.js',import.meta.url),'utf8'),sandbox);
const live=window.UniversalOneLive({request:async path=>Response.json(path==='/research'?{answer:'Research only.',sources:[]}:{value:'test'}),history:()=>[],context:()=>({area:'quantum'}),answer:async(q,signal,raw)=>{questions.push({q,raw});return {answer:'Your existing study is queued.',sources:[],version:'quantum-conversation-v1'};},onState(){},onMicrophone(){},onUser:s=>users.push(s),onAssistant(){}});
await live.start();
const emit=e=>data.onmessage({data:JSON.stringify(e)});
emit({type:'response.done',response:{status:'completed',output:[{type:'function_call',name:'ask_research',call_id:'no-visitor-command',arguments:'{"question":"Run a study"}'}]}});
await new Promise(r=>setImmediate(r));assert.equal(questions.length,0,'A model-generated command cannot start a study without a visitor transcript');
emit({type:'conversation.item.input_audio_transcription.completed',item_id:'speech-1',transcript:'Please run the question in my Quantum form.'});
emit({type:'response.done',response:{status:'completed',output:[{type:'function_call',name:'ask_research',call_id:'command-1',arguments:'{"question":"Run the current quantum investigation"}'}]}});
await new Promise(r=>setImmediate(r));
assert.equal(users.length,1);assert.equal(questions.length,1);assert.equal(questions[0].raw,'Please run the question in my Quantum form.');
assert(sent.some(e=>e.type==='conversation.item.create'&&e.item?.type==='function_call_output'&&JSON.parse(e.item.output).answer==='Your existing study is queued.'));
emit({type:'response.done',response:{status:'completed',output:[{type:'function_call',name:'ask_research',call_id:'command-1',arguments:'{"question":"Run it again"}'}]}});
await new Promise(r=>setImmediate(r));assert.equal(questions.length,1);live.end();assert.equal(live.getState().active,false);
console.log('Transcribed voice command, tool receipt, duplicate call and cleanup checks passed.');
