import assert from "node:assert/strict";
import { mantraTarget } from "../i  a m/adaptive-sound/mantra-policy-v1.js";
const input = { enabled:true, platformEnabled:true, masterEnabled:true, available:true, advancing:true, quantumGain:.055 };
for(const flag of ['enabled','platformEnabled','masterEnabled','available','advancing'])assert.equal(mantraTarget({...input,[flag]:false}),0);
for(const quantumGain of [undefined,NaN,Infinity,-1,0])assert.equal(mantraTarget({...input,quantumGain}),0);
for(let i=0;i<=1000;i++)assert.ok(Math.abs(mantraTarget({...input,quantumGain:i/1000})-(i/1000)/3)<1e-15);
for(const speechRms of [undefined,0,.001,.12])assert.ok(Math.abs(mantraTarget({...input,speechRms})-.055/3)<1e-15,'No independent speech-band gate');
console.log('Exact one-third Quantum Tree gain, all transport/master guards, and no second masking detector passed.');
