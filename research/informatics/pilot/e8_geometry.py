"""Reproduce the E8 root projections and attach their pure geometry to M9/P24."""
import csv
import hashlib
import itertools
import json
import math
from fractions import Fraction
from pathlib import Path
import shutil
import zipfile
from csv_records import write_record, read_record

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / 'Informatics/pilot-v1'
VERSION = 'e8-m9-p24-2026-11-09-v3'
WORD24 = [[0,0,0,-2,-2,0,0,0],[0,0,0,0,0,2,2,0],[1,1,-1,-1,1,-1,1,-1],[-1,1,-1,1,1,-1,1,-1],[0,0,-2,0,-2,0,0,0],[-2,0,0,0,0,0,-2,0],[-1,1,1,-1,-1,-1,-1,-1],[1,-1,-1,1,1,-1,1,-1]]
WORD30 = [[1,-1,-1,-1,-1,-1,-1,1],[2,2,0,0,0,0,0,0]]
for i in range(6):
    r=[0]*8; r[i]=-2; r[i+1]=2; WORD30.append(r)

def roots():
    result=[]
    for i,j in itertools.combinations(range(8),2):
        for a,b in itertools.product((-2,2),repeat=2):
            r=[0]*8; r[i]=a; r[j]=b; result.append(r)
    result.extend(list(r) for r in itertools.product((-1,1),repeat=8) if r.count(-1)%2==0)
    return result

def transform(x,word):
    for r in word:
        k=sum(a*b for a,b in zip(x,r))/4
        x=[a-k*b for a,b in zip(x,r)]
    return x

def multiply(a,b):
    return [[sum(a[i][k]*b[k][j] for k in range(8)) for j in range(8)] for i in range(8)]

def projection(rr,word,period):
    index={tuple(r):i for i,r in enumerate(rr)}
    permutation=[]
    for root in rr:
        x=root
        for r in word:
            dot=sum(a*b for a,b in zip(x,r)); assert dot%4==0
            x=[a-(dot//4)*b for a,b in zip(x,r)]
        permutation.append(index[tuple(x)])
    todo=set(range(240)); orbits=[]
    while todo:
        i=min(todo); orbit=[]
        while i in todo:
            todo.remove(i); orbit.append(i); i=permutation[i]
        assert len(orbit)==period
        orbits.append(orbit)
    identity=[[Fraction(int(i==j)) for j in range(8)] for i in range(8)]
    matrix=identity
    for r in word:
        reflection=[[identity[i][j]-Fraction(r[i]*r[j],4) for j in range(8)] for i in range(8)]
        matrix=multiply(reflection,matrix)
    power=identity
    for exponent in range(1,period+1):
        power=multiply(matrix,power)
        assert (power==identity)==(exponent==period)
    assert multiply([[matrix[j][i] for j in range(8)] for i in range(8)],matrix)==identity
    if period==24:
        w2=multiply(matrix,matrix); w4=multiply(w2,w2); w8=multiply(w4,w4)
        assert all(w8[i][j]-w4[i][j]+identity[i][j]==0 for i in range(8) for j in range(8))
    x=[1.0]+[0.0]*7; u=[0.0]*8; v=[0.0]*8
    for k in range(period):
        theta=2*math.pi*k/period
        u=[a+b*math.cos(theta) for a,b in zip(u,x)]
        v=[a+b*math.sin(theta) for a,b in zip(v,x)]
        x=transform(x,word)
    u=[a/math.sqrt(sum(b*b for b in u)) for a in u]
    v=[a/math.sqrt(sum(b*b for b in v)) for a in v]
    assert abs(sum(a*b for a,b in zip(u,v)))<1e-12
    xy=[[sum(r[i]*u[i]/2 for i in range(8)),sum(r[i]*v[i]/2 for i in range(8))] for r in rr]
    # Stable root-index tiebreak for coincident radii.
    orbits.sort(key=lambda orbit:(round(math.hypot(*xy[orbit[0]]),12),orbit[0]))
    radii=[math.hypot(*xy[o[0]]) for o in orbits]
    scale=max(radii)
    assert len({tuple(round(n,10) for n in p) for p in xy})==240
    for orbit,radius in zip(orbits,radii):
        assert max(abs(math.hypot(*xy[i])-radius) for i in orbit)<1e-12
        angles=[math.atan2(xy[i][1],xy[i][0]) for i in orbit]
        for a,b in zip(angles,angles[1:]+angles[:1]):
            assert abs((b-a)%(2*math.pi)-2*math.pi/period)<1e-11
    return dict(period=period,orbit_count=len(orbits),orbits=orbits,permutation=permutation,
                reflection_roots_scaled2=word,weyl_matrix=[[float(n) for n in r] for r in matrix],
                orthonormal_basis=[u,v],normalization_radius=scale,
                xy=[[round(n/scale,12) for n in p] for p in xy],
                orbit_radii=[round(n/scale,12) for n in radii],distinct_radii=len(set(round(n,10) for n in radii)))

def build():
    rr=roots()
    assert len({tuple(r) for r in rr})==240 and all(sum(a*a for a in r)==8 for r in rr)
    assert all(sum(sum(a*b for a,b in zip(r,s))==4 for s in rr)==56 for r in rr)
    a,b=0,1; pairs=[]; fib=[]
    while (a,b) not in pairs:
        pairs.append((a,b));fib.append(a);a,b=b,(a+b)%9
    assert (a,b)==(0,1) and len(fib)==24
    record=json.loads((DATA/'m9.json').read_text())
    alpha,beta,gamma=record['alpha'],record['beta'],record['gamma']
    assert alpha['residues']==fib
    assert gamma['alpha_indices']==[i for i,v in enumerate(fib) if v%3==0]
    assert all(path[0]==path[-1] and all((b-a)%24==8 for a,b in zip(path,path[1:])) for path in gamma['triangle_paths'])
    cycle=beta['display_cycle']
    assert len(cycle)==len(set(cycle))==6 and all((2*a)%9==b for a,b in zip(cycle,cycle[1:]+cycle[:1]))
    layers=dict(
        alpha=dict(label='Alpha',color='#5ca8ff',default_visible=True,circle_positions=24,display_values=alpha['display_values'],source_field='alpha',description='The 24 Fibonacci residues modulo 9, with zero displayed as 9.'),
        beta=dict(label='Beta',color='#ffea42',default_visible=False,circle_positions=9,display_cycle=cycle,closed_path=cycle+cycle[:1],recognised_doubling_cycle=beta['recognised_doubling_cycle'],source_field='beta',description='The six interior interval sums form the doubling cycle modulo 9. The stored order begins at 4.',angular_rule='Value v is placed at 2*pi*v/9 clockwise from north; 9 is north.'),
        gamma=dict(label='Gamma',color='#ff84c5',default_visible=True,circle_positions=24,alpha_indices=gamma['alpha_indices'],clock_positions=gamma['clock_positions'],display_values=gamma['clockwise_values'],triangle_paths=gamma['triangle_paths'],source_field='gamma',description='Two equilateral triangles join the six Alpha nodes whose residues are divisible by three.'))
    return dict(schema='universal-informatics/e8-geometry/v1',version=VERSION,title='E8 and the 24-step cycle',
        scope='Pure geometry: symbolic composition and computed projections of the E8 root system.',
        definitions=dict(rank=8,root_count=240,lie_algebra_dimension=248,root_norm_squared=2,nearest_neighbors_per_root=56,nearest_neighbor_edges=6720),
        conventions=dict(root_coordinates='Divide roots_scaled2 by two. Root IDs are zero-based array indices.',
            matrix_action='Column vectors. Apply the listed root reflections in order: s_r(x) = x - (x dot r) r, for roots r of squared length two.',
            projection='Dot each root with both orthonormal basis vectors, then divide by normalization_radius. Stored xy values are rounded to 12 decimal places.',
            cycle_alignment='Each orbit begins at its lowest root index. The display rotates the first orbit start to north. Shared step indices are a comparison convention, not a canonical map from Fibonacci values to roots. The separate M9 reference remains fixed while the 30-step Coxeter cycle advances.',
            symbolic_layout='The symbolic view retains ten sets of 24 positions; its radii and phases are chosen for composition and are not an orthogonal E8 projection.'),
        roots_scaled2=rr,fibonacci=dict(modulus=9,period=24,residues=fib,display_values=[x or 9 for x in fib],states=[list(pair) for pair in pairs],zero_display=9),
        projections={'p24':projection(rr,WORD24,24),'p30':projection(rr,WORD30,30)},
        symbolic=dict(orbit_radii=[round(.80+j*.02,6) for j in range(10)],orbit_phase_degrees=[(j%2)*7.5 for j in range(10)],reference_radius=.56),
        sequence_layers=layers,
        overlay_layout=dict(reference_radius=.56,label_radius=.64,gamma_radius=.34,beta_radius=.34,computed_root_radius=.98,north='Alpha index 0 and Beta value 9 share north.',radial_rule='Alpha occupies the outer M9 circle. Gamma is an inset copy of its six selected nodes, preserving their angles. Beta uses the same inset radius on its native nine-position value grid.',computed_layout='The exact E8 projection and M9 reference occupy separate panels with independent uniform display scales. They appear side by side on wide screens and vertically on narrow screens.',scope='Angular positions, values and paths retain native M9 geometry. Display radii and alignment with E8 are drawing conventions.'),
        guide=dict(label='Symbolic 8 / 6 / 3 guide',angular_grid_positions=24,octagon_step=3,hexagon_step=4,triangle_step=8,geometry='Octagon, hexagon and inner equilateral triangle. The six-point star is the independently controlled Gamma layer.',radius_ratios=[1,round(.34/.44,12),round(.17/.44,12)],octagon_radius=.44,hexagon_radius=.34,triangle_radius=.17,hexagon_radius_equals='Inset Gamma radius',note='The polygons share a 24-position angular grid. They are an optional symbolic overlay, not additional E8 roots.'),
        views=[dict(id='symbolic',label='Symbolic composition',kind='schematic'),dict(id='p24',label='E8 · 24-step projection',kind='orthogonal_projection'),dict(id='p30',label='E8 · 30-step projection',kind='orthogonal_projection')],
        comparison=dict(established='Fibonacci modulo 9 has period 24. An order-24 E8 symmetry has ten root orbits of length 24.',question='What structure does a fixed map from the M9/P24 cycle to E8 root orbits preserve beyond cycle length?',limit='Shared cycle length alone does not identify the Fibonacci recurrence with E8.'),
        verification=dict(root_enumeration='112 integer roots and 128 half-integer roots; all 240 are unique.',orthogonality='Both Weyl matrices are exactly orthogonal in rational arithmetic.',orders='Exact matrix orders 24 and 30; all smaller positive powers checked.',order24_polynomial='W^8 - W^4 + I = 0, verified exactly.',orbits='Ten cycles of 24 and eight cycles of 30 partition all roots.',projection='Orthonormality, constant orbit radii, distinct projected points and angular steps checked with tolerance 1e-11.',pisano='The state (0,1) first returns modulo 9 after 24 steps.'),
        sources=[dict(title='American Institute of Mathematics · What is E8?',url='https://admin.aimath.org/E8/e8.html'),dict(title='Frenkel and Gross · A rigid irregular connection on the projective line, section 15',url='https://people.math.harvard.edu/~gross/preprints/gm-revised1.pdf#page=33'),dict(title='John Stembridge · What is the E8 picture?',url='https://websites.umich.edu/~jrs/coxplain.html')])

def write(path,value):
    path.write_text(json.dumps(value,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n')

def zip_replace(path,replacements):
    temp=path.with_suffix('.e8-working.zip')
    with zipfile.ZipFile(path) as old,zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED) as new:
        for item in old.infolist():
            if item.filename not in replacements:
                with old.open(item) as src,new.open(item,'w') as dst:shutil.copyfileobj(src,dst)
        for name,file in replacements.items():
            info=zipfile.ZipInfo(name,date_time=(2026,11,9,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
            new.writestr(info,file.read_bytes())
    temp.replace(path)

def publish():
    data=build(); write(DATA/'e8-m9-p24.json',data)
    write_record(DATA/'csv-shared/e8-m9-p24.csv',data)
    assert read_record(DATA/'csv-shared/e8-m9-p24.csv')==json.loads((DATA/'e8-m9-p24.json').read_text())
    record=json.loads((DATA/'m9.json').read_text());record['e8_geometry']=data
    (DATA/'m9.json').write_text(json.dumps(record,ensure_ascii=False,indent=2,allow_nan=False)+'\n')
    write_record(DATA/'csv-records/m9.csv',record)
    assert read_record(DATA/'csv-records/m9.csv')==json.loads((DATA/'m9.json').read_text())
    digest=hashlib.sha256((DATA/'m9.json').read_bytes()).hexdigest()
    for name in ['index','dataset','m1-m1001']:
        p=DATA/(name+'.json');manifest=json.loads(p.read_text())
        for r in manifest['records']:
            if r['modulus']==9:r['sha256']=digest
        manifest.setdefault('geometry_supplements',{})['e8']=dict(record_id=record['id'],version=VERSION,json='pilot-v1/e8-m9-p24.json',csv='pilot-v1/csv-shared/e8-m9-p24.csv',scope=data['scope'])
        write(p,manifest);write_record(DATA/'csv-shared'/(name+'.csv'),manifest)
    summary=DATA/'m1-m1001.csv'
    with summary.open(encoding='utf-8-sig',newline='') as f:
        reader=csv.DictReader(f);fields=list(reader.fieldnames);rows=list(reader)
    for field in ['e8_geometry_json','e8_geometry_csv','e8_root_count','e8_cycle_lengths']:
        if field not in fields:fields.append(field)
    for row in rows:
        if int(row['modulus'])==9:
            row.update(e8_geometry_json='pilot-v1/e8-m9-p24.json',e8_geometry_csv='pilot-v1/csv-shared/e8-m9-p24.csv',e8_root_count='240',e8_cycle_lengths='24;30')
            if 'sha256' in row:row['sha256']=digest
    with summary.open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(rows)
    for name in ['M1-M1001-README.txt','M1-M1001-CSV-README.txt']:
        p=DATA/name;original=p.read_text().split('\nE8 geometry —')[0]
        p.write_text(original+'\nE8 geometry — 9 November 2026\n\nThe M9 record includes e8_geometry: all 240 roots, exact Weyl matrices, ordered root cycles, projection bases, coordinates, symbolic drawing conventions, M9 residues and source references. e8-m9-p24.json and csv-shared/e8-m9-p24.csv contain the same complete geometry. The two computed projections use cycles of 24 and 30; the symbolic composition and 8 / 6 / 3 guide are labelled separately. Independently controlled Alpha, Beta and Gamma layers retain their native angles, values and paths. Alpha is blue, Beta yellow and Gamma pink. Gamma and Beta are inset to separate the central shapes from the Alpha label band. Symbolic roots occupy an outer halo with a clear gap. Exact projections keep their coordinates and display the M9 reference in a separate panel at an independent scale. The M9 reference remains fixed in the 30-step view.\n')
    common=['m9.json','e8-m9-p24.json','index.json','dataset.json','m1-m1001.json','m1-m1001.csv','M1-M1001-README.txt','M1-M1001-CSV-README.txt']
    zip_replace(DATA/'m1-m1001-data.zip',{'pilot-v1/'+n:DATA/n for n in common})
    files=['m1-m1001.csv','M1-M1001-CSV-README.txt','csv-records/m9.csv','csv-shared/e8-m9-p24.csv']+['csv-shared/'+n+'.csv' for n in ['index','dataset','m1-m1001']]
    zip_replace(DATA/'m1-m1001-csv.zip',{n:DATA/n for n in files})
    print(json.dumps({'passed':True,'roots':240,'cycle24':len(data['projections']['p24']['orbits']),'cycle30':len(data['projections']['p30']['orbits']),'record_sha256':digest,'csv_roundtrip':True}))

if __name__=='__main__':publish()
