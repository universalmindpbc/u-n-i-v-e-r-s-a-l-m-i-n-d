import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ALPHA,KING,KING_BITS,KING_INTS,HAMMING,ANCHOR,ZERO,DAY,coordinate,fromCoordinate,entropy,transform,timewave,timewaveAt} from '../Informatics/spacetime/model.mjs';
import {YEARLY,MONTHLY,KELLEY,META} from '../Informatics/spacetime/data.mjs';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const close=(a,b,eps=1e-10)=>assert.ok(Math.abs(a-b)<=eps*Math.max(1,Math.abs(b)),`${a} differs from ${b}`);
assert.deepEqual(ALPHA,JSON.parse(readFileSync(join(root,'Informatics/pilot-v1/m9.json'))).alpha.residues);
assert.equal(ALPHA.length,24); assert.equal(KING_BITS.length,64); assert.equal(new Set(KING_INTS).size,64);
assert.deepEqual(KING_INTS.slice(0,4),[63,0,17,34]); assert.deepEqual(KING_INTS.slice(-2),[21,42]);
assert.ok(KING.every(x=>x>=0&&x<=8)); assert.ok(HAMMING.every(x=>x>=1&&x<=6));
assert.equal(192/24,8);assert.equal(192/64,3);
for(const unit of ['day','month','year','decade'])for(const anchor of [ANCHOR,Date.UTC(2004,1,29)])for(const t of [Date.UTC(1700,0,1),Date.UTC(1999,11,31,12),Date.UTC(2000,1,29,12),Date.UTC(2025,11,31,23)])close(fromCoordinate(coordinate(t,unit,anchor),unit,anchor),t,1e-14);
assert.equal(coordinate(Date.UTC(2000,2,1),'month'),2);assert.equal(coordinate(Date.UTC(2000,2,1),'day'),60);
close(entropy([0],0),0);close(entropy([0,1,2,3],0),2);
for(const seq of [ALPHA,KING])for(const x of [-193.25,0,.5,13.75,192]){
 close(transform(seq,x,'multiscale',1),transform(seq,x));
 for(const method of ['values','change','entropy','multiscale'])close(transform(seq,x,method),transform(seq,x+192,method));
}
assert.equal(YEARLY.length,326);assert.equal(MONTHLY.length,277*12);assert.equal(KELLEY.length,384);assert.equal(KELLEY[119],22);
assert.equal(YEARLY[0].year,1700);assert.equal(YEARLY.at(-1).year,2025);assert.equal(MONTHLY[0].year,1749);
assert.equal(timewaveAt(ZERO,KELLEY),0);assert.equal(timewaveAt(ZERO+DAY,KELLEY),null);
const html=readFileSync(join(root,'Informatics/spacetime/index.html'),'utf8');
assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive">/);
assert.match(readFileSync(join(root,'Informatics/spacetime/.htaccess'),'utf8'),/X-Robots-Tag "noindex, nofollow, noarchive"/);
assert.ok(!/\b(?:should|could|would)\b/i.test(html));
// Evaluate the retained C function directly, avoiding the reference CLI formatting buffer.
const ref=join(root,'research/informatics/spacetime-20261110/reference/twz-point.c');
const scratch=mkdtempSync(join(tmpdir(),'spacetime-math-'));
let report;
try {
 const harness=join(scratch,'reference.c'),binary=join(scratch,'reference');
 writeFileSync(harness,`#define main archived_cli_main\n#include "${ref}"\n#undef main\nint main(int argc,char **argv){set_powers();for(int i=1;i<argc;i++){long double x=strtold(argv[i],0);printf("%.18Lg\\n",f(x,0));}return 0;}\n`);
 execFileSync('/usr/bin/clang',['-w',harness,'-o',binary]);
 const days=[0,1e-8,.00001,.001,.125,.5,.999999,1,1.001,6,63.99999,64,64.00001,383.9999,384,384.5,4095.999,4096,24576,100000,114311.45833333333,...Array.from({length:100},(_,i)=>i*1123.137+0.314159)];
 const values=execFileSync(binary,days.map(String),{encoding:'utf8'}).trim().split('\n').map(Number);
 const comparisons=days.map((day,i)=>{const actual=timewave(day,KELLEY);close(actual,values[i],1e-11);return{days:day,c:values[i],javascript:actual,absolute_error:Math.abs(actual-values[i])};});
 report={status:'passed',source:META.timewave_source,seed:META.timewave_seed,points:comparisons.length,max_absolute_error:Math.max(...comparisons.map(r=>r.absolute_error)),comparisons};
 if(process.argv.includes('--record'))writeFileSync(join(root,'research/informatics/spacetime-20261110/math-verification.json'),JSON.stringify(report,null,2)+'\n');
}finally{rmSync(scratch,{recursive:true,force:true});}
console.log(JSON.stringify({status:'passed',reference_points:report.points,max_absolute_error:report.max_absolute_error,checks:['Atlas alpha','King Wen binary encoding','shared periods','calendar reversibility','entropy','periodic transforms','solar coverage','noindex','Timewave C reference']}));
