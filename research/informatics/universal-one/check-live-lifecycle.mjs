import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('../../../Informatics/universal-one-live.js',import.meta.url),'utf8');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function harness(){
 const sent=[],states=[],requests=[];let channel,peer,resolveResearch,resolveMic;
 const track={enabled:true,stop(){this.stopped=true;}};const stream={getTracks:()=>[track],getAudioTracks:()=>[track]};
 class Channel extends EventTarget{readyState='open';send(v){sent.push(JSON.parse(v));}close(){this.readyState='closed';}}
 class Peer{connectionState='connected';constructor(){peer=this;}addTrack(){}createDataChannel(){channel=new Channel();return channel;}async createOffer(){return {sdp:'test-offer'};}async setLocalDescription(){}async setRemoteDescription(){channel.dispatchEvent(new Event('open'));}close(){this.connectionState='closed';}}
 const sandbox={window:{RTCPeerConnection:Peer},RTCPeerConnection:Peer,navigator:{mediaDevices:{getUserMedia:async()=>stream}},Audio:class{play(){return Promise.resolve();}pause(){}},AbortController,setTimeout,clearTimeout,fetch:async()=>({ok:true,text:async()=>'test-answer'})};
 vm.runInNewContext(code,sandbox);
 const live=sandbox.window.UniversalOneLive({request:async(path,body,signal)=>{requests.push({path,signal});if(path==='/research')return new Promise(r=>resolveResearch=r);return {json:async()=>({value:'test-ephemeral'})};},history:()=>[],context:()=>({}),onState:(s,label)=>states.push({s,label}),onMicrophone:()=>{},onUser:()=>{},onAssistant:()=>{}});
 return {live,track,sent,states,requests,emit:e=>channel.onmessage({data:JSON.stringify(e)}),researchResult:()=>resolveResearch({json:async()=>({answer:'Late result',sources:[]})}),delayMic:()=>{sandbox.navigator.mediaDevices.getUserMedia=()=>new Promise(r=>resolveMic=r);},resolveMic:()=>resolveMic(stream)};
}
const h=harness();
try{
 await h.live.start();assert(h.live.getState().active);assert(!h.track.enabled);
 h.emit({type:'response.created'});h.emit({type:'output_audio_buffer.stopped'});await pause(950);
 assert(!h.track.enabled,'An earlier audio-stop event never opens the mic during active response generation');
 h.emit({type:'response.done',response:{status:'completed',output:[]}});await pause(950);assert(h.track.enabled);
 h.emit({type:'response.created'});h.emit({type:'output_audio_buffer.started'});h.live.toggleMute();assert.equal(h.states.at(-1).s,'speaking');assert(!h.track.enabled);
 h.emit({type:'output_audio_buffer.stopped'});h.emit({type:'response.done',response:{status:'completed',output:[]}});await pause(950);assert(!h.track.enabled);h.live.toggleMute();assert(h.track.enabled);
 h.emit({type:'response.created'});const call={type:'function_call',name:'ask_research',call_id:'test-call',arguments:'{"question":"Test the cited research"}'};
 h.emit({type:'response.done',response:{status:'completed',output:[call]}});assert(h.live.getState().pending);assert(!h.track.enabled);
 h.live.interrupt();assert(h.requests.at(-1).signal.aborted);const count=h.sent.length;h.researchResult();await pause(0);assert.equal(h.sent.length,count,'Interrupted retrieval never sends a late answer');
 h.live.end();assert(h.track.stopped);assert(!h.live.getState().microphone);
}finally{h.live.end();}
const late=harness();late.delayMic();const starting=late.live.start();late.live.end();late.resolveMic();await starting;assert(late.track.stopped);assert.equal(late.requests.length,0);assert(!late.live.getState().active);
console.log('Live voice gates, mute, interrupted retrieval and late microphone cancellation passed.');
