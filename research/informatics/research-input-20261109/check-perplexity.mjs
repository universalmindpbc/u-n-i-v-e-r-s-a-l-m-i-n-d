import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {perplexitySearch} from '../../../cloudflare/informatics-literature-fallback.js';
const receiptPath=import.meta.dirname+'/perplexity-connection.json';
try{await fs.access(receiptPath);throw Error('A connection receipt already exists; do not repeat paid verification.');}catch(e){if(e.code!=='ENOENT')throw e;}
await fs.writeFile(receiptPath,JSON.stringify({status:'reserved',reservedUSD:.005,createdAt:new Date().toISOString()})+'\n');
const env={PERPLEXITY_ENABLED:'true',PERPLEXITY_API_KEY:(await fs.readFile('/private/tmp/um-perplexity-staging-key','utf8')).trim(),BUDGET:{idFromName:n=>n,get:()=>({fetch:async()=>Response.json({allowed:true,reservation:'connection-verification',reservedUSD:.005,limitUSD:.005})})}};
const result=await perplexitySearch(env,{query:'GRIN2B transcription regulation binding sites research',reason:'Verify public scientific web discovery for the approved research integration.'});
const receipt={...result,results:result.results?.map(({text,...r})=>({...r,extractedCharacters:text.length}))};
await fs.writeFile(receiptPath,JSON.stringify(receipt,null,2)+'\n');
assert.equal(result.status,'retrieved');assert(result.results.length>0);
console.log(JSON.stringify({status:result.status,results:result.results.length,requestId:result.requestId,reservedUSD:.005}));
