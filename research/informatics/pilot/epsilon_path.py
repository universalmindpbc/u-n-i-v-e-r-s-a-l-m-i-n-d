"""M18 reference path: geometric presence is separate from the native 3-6-9 test."""
def reference_path(d):
 if d['modulus']!=18:return None
 assert d['pisano_period']==24
 route=[0,8,20,12,4,16,0];a=d['alpha']['residues'];native=[a[i] or 18 for i in route];reduced=[a[i]%9 or 9 for i in route]
 assert native==[18,3,15,18,3,15,18] and reduced==[9,3,6,9,3,6,9]
 return {'rule_version':'epsilon-path-m18-v1','reference':'M9P24 unicursal route on the same 24-position circle','alpha_indices':route,'clock_positions':[i or 24 for i in route],'native_values':native,'reduced_m9_values':reduced,'geometry_present':True,'native_369_qualifies':False,'reduced_369_qualifies':True,'verification':'Python checked: route positions and both value sequences. Physical interpretation not assessed.','native_svg':'pilot-v1/views/m18/epsilon.svg','native_png':'pilot-v1/views/m18/epsilon.png','reduced_svg':'pilot-v1/views/m18/epsilon-m9.svg','reduced_png':'pilot-v1/views/m18/epsilon-m9.png'}
def draw_path(d,out):
 import drawing
 from drawing import Drawing,pt,FG,MUTED
 e=d.get('epsilon_path')
 if not e:return
 directory=out/'views/m18';directory.mkdir(parents=True,exist_ok=True);drawing.OUT=directory
 for mode,values,key in [('Native M18',e['native_values'],'epsilon'),('Reduced to M9',e['reduced_m9_values'],'epsilon-m9')]:
  g=Drawing('Epsilon · '+mode,'Same M18P24 reference path; only the displayed values change.');g.circle((400,365),238,'#34434e')
  points=[pt(i,24) for i in e['alpha_indices']];g.line(points,FG,3)
  for x,y in zip(points,points[1:]):g.arrow(x,y,FG)
  for step,(i,v) in enumerate(zip(e['alpha_indices'][:-1],values[:-1]),1):
   g.circle(pt(i,24),4,FG,fill=FG);g.text(v,pt(i,24,270),24);g.text(f'{step:02}',pt(i,24,292),11,MUTED)
  g.text('M18 / P24',(400,32),12,MUTED);g.text('Epsilon · '+mode,(400,690),24);g.text('Same path · arrows show traversal',(400,723),14,MUTED);g.text(' → '.join(map(str,values)),(400,752),16);g.save(key)
 d['views'].insert(3,{'id':'epsilon','name':'Epsilon','svg':e['native_svg'],'png':e['native_png']})
