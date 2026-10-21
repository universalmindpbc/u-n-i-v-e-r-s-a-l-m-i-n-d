import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {dnaModel,dnaModelSource,complement} from '../research/informatics/molecular-atlas-build/dna.js';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const raw=read('research/informatics/molecular-atlas-build/dna-model-source/nab-lbdna-reference.pdb');
assert.equal(createHash('sha256').update(raw).digest('hex'),dnaModelSource.referenceSHA256);
const seq='GCGCGGCTGATAAACGAAAGC',reference=dnaModel({symbol:'REFERENCE',chromosome:'test',sequence:seq,start:1,end:seq.length,strand:1});
let maxError=0;
for(const line of raw.split('\n')){
 if(!line.startsWith('ATOM')||line.slice(76,78).trim()==='H')continue;
 const residue=Number(line.slice(22,26)),chain=residue<=21?'A':'B',r=chain==='A'?residue:residue-21;
 if(r===1||r===21)continue;
 const atom=reference.atoms.find(a=>a.chain===chain&&a.residue===r&&a.name===line.slice(12,16).trim());assert.ok(atom);
 const original=[Number(line.slice(46,54))-20*3.38/2,Number(line.slice(30,38)),Number(line.slice(38,46))];
 maxError=Math.max(maxError,Math.hypot(...atom.position.map((x,i)=>x-original[i])));
}
assert.ok(maxError<.002);
const pairAtoms={A:[['N6','O4'],['N1','N3']],T:[['O4','N6'],['N3','N1']],C:[['N4','O6'],['N3','N1'],['O2','N2']],G:[['O6','N4'],['N1','N3'],['N2','O2']]};
const dna=JSON.parse(read('Informatics/molecular/data/genes/oxtr.json'));
let checked=0;
for(const sequence of ['ACGT'.repeat(12),...['A','C','G','T'].flatMap(a=>['A','C','G','T'].map(b=>(a+b).repeat(24))),dna.sequence.slice(15,63)]){
 const m=dnaModel({...dna,sequence},0),lookup=new Map(m.atoms.map(a=>[a.chain+':'+a.residue+':'+a.name,a]));
 const at=(c,r,n)=>lookup.get(c+':'+r+':'+n),distance=(a,b)=>Math.hypot(...a.position.map((x,i)=>x-b.position[i]));
 assert.equal(m.atoms.filter(a=>a.name==='P').length,94);assert.equal(new Set(m.atoms.map(a=>a.chain+':'+a.residue)).size,96);
 for(const chain of ['A','B'])for(let r=1;r<=48;r++){
  const base=chain==='A'?sequence[r-1]:complement[sequence[48-r]];assert.equal(at(chain,r,"C1'").base,base);
  if(r<48){const d=distance(at(chain,r,"O3'"),at(chain,r+1,'P'));assert.ok(d>1.5&&d<1.65,`Backbone link ${d}`);}
  const glycosidic=distance(at(chain,r,"C1'"),at(chain,r,'AG'.includes(base)?'N9':'N1'));assert.ok(glycosidic>1.3&&glycosidic<1.6);
 }
 for(let i=0;i<48;i++)for(const [a,b] of pairAtoms[sequence[i]]){const d=distance(at('A',i+1,a),at('B',48-i,b));assert.ok(d>2.7&&d<3.2,`Base pairing ${d}`);}
 assert.equal(m.pdb.split('\n').filter(l=>l.startsWith('ATOM')).length,m.atoms.length);checked++;
}
assert.throws(()=>dnaModel({...dna,sequence:'N'.repeat(48)}),/unresolved reference base/);
console.log(JSON.stringify({passed:true,referenceRoundTripMaxErrorAngstrom:maxError,modelSequences:checked,checks:['PDB coordinates and chemical element fields','antiparallel strands','Watson-Crick atom pairing distances','phosphodiester continuity','glycosidic bond distances','5-prime termini','explicit ambiguous-base failure']}));
