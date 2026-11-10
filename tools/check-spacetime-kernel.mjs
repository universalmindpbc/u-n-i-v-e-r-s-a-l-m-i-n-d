import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {HUMAN} from '../Informatics/spacetime/human.mjs';
import {YEARLY,MONTHLY} from '../Informatics/spacetime/data.mjs';
import {KERNEL} from '../Informatics/spacetime/kernel-manifest.mjs';
const base=new URL('../Informatics/spacetime/',import.meta.url);
execFileSync(process.execPath,[new URL('./build-spacetime-kernel.mjs',import.meta.url).pathname,'--check']);
const raw=readFileSync(new URL('kernel.json',base)),k=JSON.parse(raw);
assert.equal(createHash('sha256').update(raw).digest('hex'),KERNEL.sha256);
assert.equal(new Set(k.series.map(s=>s.id)).size,11);
let count=0,missing=0;
for(const s of k.series){
 const source=s.id==='solar-annual'?YEARLY:s.id==='solar-monthly'?MONTHLY:HUMAN.find(h=>h.id===s.id).rows;
 assert.equal(s.observations.length,source.length);
 let last=-Infinity;
 for(let i=0;i<source.length;i++){
  const r=s.observations[i],native=source[i];count++;
  for(const[key,value]of Object.entries(native))assert.deepEqual(r[key],value,`${s.id}/${i}/${key}`);
  const start=Date.parse(r.interval_start),end=Date.parse(r.interval_end_exclusive),stamp=Date.parse(r.date+'T00:00:00Z');
  assert.ok(start>last&&end>start&&stamp>=start&&stamp<end);last=start;
  assert.equal(new Date(start).getUTCDate(),1);
  assert.equal((new Date(end).getUTCFullYear()-new Date(start).getUTCFullYear())*12+new Date(end).getUTCMonth()-new Date(start).getUTCMonth(),s.cadence==='Annual'?12:1);
  assert.equal(r.valid,Number.isFinite(r.value));assert.equal(r.available_at,null);
  if(!r.valid){assert.equal(r.value,null);missing++;}
 }
}
assert.equal(count,9425);assert.ok(missing>=13);
assert.equal(k.series.find(s=>s.id==='market-return').observations[0].valid,false);
assert.equal(k.series.find(s=>s.id==='market-volatility').observations[11].valid,false);
assert.equal(k.series.find(s=>s.id==='market-volatility').observations[12].valid,true);
assert.equal(k.series.find(s=>s.id==='conflict').observations[0].low,51133);
assert.equal(k.models.find(m=>m.id==='fibonacci').values.length,24);
assert.equal(k.models.find(m=>m.id==='king').encoding.length,64);
assert.equal(k.shared_clock.position_realignment_steps,192);
assert.deepEqual(k.analysis_contract.results,[]);
assert.equal(k.access.mcp_server_implemented,false);
const report={status:'passed',sha256:KERNEL.sha256,series:k.series.length,records:count,missing_values:missing,checks:['All native values and source fields preserved','Calendar interval boundaries and sorted unique observations','Null masks and unavailable release timestamps','Derived market warm-up periods','Conflict bounds retained','Mathematical periods and native encodings','No fabricated analysis results or MCP server','Deterministic generation and pinned content hash']};
const out=new URL('../research/informatics/spacetime-zen-20261110/',import.meta.url);mkdirSync(out,{recursive:true});writeFileSync(new URL('kernel-verification.json',out),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
