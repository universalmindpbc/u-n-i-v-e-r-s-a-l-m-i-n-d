"""Independent source-coordinate, electronic-field and chemistry checks."""
from pathlib import Path
import json, hashlib, numpy as np
root=Path(__file__).resolve().parents[1]
data=root/'Informatics/molecular/data/interactions'
contact=json.loads((data/'contact.json').read_text());quantum=json.loads((data/'quantum.json').read_text())
raw=(root/'research/informatics/molecular-atlas-build/interaction-source/7qvm.pdb').read_bytes()
assert hashlib.sha256(raw).hexdigest()==contact['sourceSHA256']==quantum['sourceSHA256']
source={}
for line in raw.decode().splitlines():
    if line[:6].strip() in ('ATOM','HETATM') and line[16] in (' ','A'):
        source[(line[21],int(line[22:26]),line[12:16].strip())]=np.array([float(line[i:i+8]) for i in (30,38,46)])
for a in contact['ligand']+contact['pocket']:
    np.testing.assert_array_equal(a['position'],source[(a['chain'],a['residue'],a['name'])])
names=['CG','CD1','CE1','CZ','CE2','CD2'];rings=[np.array([source[(c,r,n)] for n in names]) for c,r in [('L',2),('R',291)]]
centers=[r.mean(axis=0) for r in rings];normals=[np.linalg.svd(r-c)[2][-1] for r,c in zip(rings,centers)]
m=contact['measurements']
assert abs(np.linalg.norm(centers[0]-centers[1])-m['centroidDistanceAngstrom'])<1e-10
assert abs(np.degrees(np.arccos(abs(normals[0]@normals[1])))-m['ringPlaneAngleDegrees'])<1e-9
assert abs(min(np.linalg.norm(a-b) for a in rings[0] for b in rings[1])-m['closestRingCarbonAngstrom'])<1e-10
assert abs(np.linalg.norm(source[('L',2,'OH')]-source[('R',316,'O')])-m['hydrogenBondHeavyAtomDistanceAngstrom'])<1e-10
atoms=quantum['atoms'];positions=np.array([a['position'] for a in atoms]);heavy=[a for a in atoms if a['element']!='H']
original=np.array([source[('L' if a['group']=='Tyr2' else 'R',2 if a['group']=='Tyr2' else 291,a['name'])] for a in heavy]);transformed=np.array([a['position'] for a in heavy])
np.testing.assert_allclose(np.linalg.norm(original[:,None]-original[None,:],axis=2),np.linalg.norm(transformed[:,None]-transformed[None,:],axis=2),atol=1e-9)
composition={e:sum(a['element']==e for a in atoms) for e in ['C','H','O']};assert composition=={'C':14,'H':16,'O':1}
assert sum({'C':6,'H':1,'O':8}[a['element']] for a in atoms)-quantum['charge']==quantum['electrons']==108
assert quantum['scfConverged'] and quantum['spin']==0 and len(atoms)==31
for a in atoms:
    if a['element']=='H':
        d=min(np.linalg.norm(np.array(a['position'])-b['position']) for b in heavy if a['group']==b['group']);assert .94<d<1.11
xyz='\n'.join(a['element']+' '+' '.join(f'{v:.9f}' for v in a['position']) for a in atoms)
assert hashlib.sha256(xyz.encode()).hexdigest()==quantum['fragmentSHA256']
np.testing.assert_allclose(np.array([list(map(float,l.split()[1:])) for l in (data/'fragment.xyz').read_text().splitlines()[2:]]),positions,atol=1e-8)
pdb=np.array([[float(l[i:i+8]) for i in (30,38,46)] for l in (data/'fragment.pdb').read_text().splitlines() if l.startswith('HETATM')]);np.testing.assert_allclose(pdb,positions,atol=.00051)
fields={};reference_grid=None
for filename,expected in quantum['files'].items():
    raw=(data/filename).read_bytes();assert hashlib.sha256(raw).hexdigest()==expected
    lines=raw.decode().splitlines();natoms=int(lines[2].split()[0]);assert natoms==len(atoms)
    origin=np.array(list(map(float,lines[2].split()[1:])));grid=[list(map(float,l.split())) for l in lines[3:6]];counts=np.array([int(r[0]) for r in grid]);steps=np.array([r[1:] for r in grid]);assert np.all(counts>20)
    cube_atoms=np.array([list(map(float,l.split()[2:])) for l in lines[6:6+natoms]]);np.testing.assert_allclose(cube_atoms*.529177210903,positions,atol=1e-6)
    values=np.fromstring(' '.join(lines[6+natoms:]),sep=' ');assert len(values)==np.prod(counts) and np.isfinite(values).all()
    grid_signature=lines[2:6]
    if reference_grid is None:reference_grid=grid_signature
    else:assert reference_grid==grid_signature
    dv=abs(np.linalg.det(steps));integral=float(np.sum(values if filename=='density.cube' else values**2)*dv)
    if filename!='density.cube':assert abs(integral-1)<.002
    else:assert values.min()>=0 and 100<integral<110
    fields[filename]={'grid':counts.tolist(),'sampledIntegral':integral,'bytes':len(raw),'sha256':expected}
result={'passed':True,'sourceAtomsMatch':True,'heavyAtomDistancesPreserved':True,'composition':composition,'electrons':108,'measurements':m,'fields':fields,'densityGridLimit':'Visualization sampling undersamples core peaks; sampled integral is not the molecular electron count.'}
print(json.dumps(result,indent=2))
