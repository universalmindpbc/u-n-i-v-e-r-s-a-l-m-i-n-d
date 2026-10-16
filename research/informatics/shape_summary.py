"""Summaries of the selected Gamma/Beta constructions, not an exhaustive shape search."""
def shape_summary(d):
    nodes=d['gamma']['alpha_indices']; n=d['pisano_period']; triangles=d['gamma']['triangle_paths']
    assert nodes==[i*n//6 for i in range(6)]
    assert all((t[j+1]-t[j])%n==n//3 for t in triangles for j in range(3))
    chevron=d['modulus']==9 and d['beta']['interval_residues']==[4,8,7,5,1,2]
    return {'rule_version':'selected-nodes-v1','scope':'Selected Gamma nodes and derived Beta only. Other node selections and rotated shapes are not yet assessed.',
      'circle_role':'Pisano-period plotting framework', 'angle_convention':'Clockwise from north; 0 degrees means the reference north-south alignment.',
      'shapes':[
        {'name':'Equilateral triangle','status':'Present','count':2,'orientation':'North / south','rotation_degrees':0,'alpha_paths':triangles},
        {'name':'Hexagon','status':'Present','count':1,'orientation':'North–south','rotation_degrees':0,'alpha_paths':[nodes+[nodes[0]]]},
        {'name':'2D stellated octahedron','status':'Present','count':1,'orientation':'North–south','rotation_degrees':0,'alpha_paths':triangles,'definition':'Two intersecting equilateral triangles in this 2D construction.'},
        {'name':'Chevron','status':'Present' if chevron else 'Absent','count':1 if chevron else 0,'orientation':'North–south' if chevron else None,'rotation_degrees':0 if chevron else None,'beta_values':d['beta']['display_cycle'] if chevron else []}],
      'other_orientations_status':'Not yet assessed'}
