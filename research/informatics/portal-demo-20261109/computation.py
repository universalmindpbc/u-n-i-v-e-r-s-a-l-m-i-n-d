"""Deterministic Wolfram Quantum Framework and CUDA-Q checks of proposed AHS.

Only validated numeric parameters enter the kernels. No visitor or model code is
evaluated. Each receipt is tied to the exact Braket action and live device data.
"""
import hashlib,json,math,re,urllib.request
from itertools import combinations
MCP='https://agenttools.wolfram.com/mcp'

def sha(value):return hashlib.sha256(value.encode()).hexdigest()
def call(name,args):
 body={'jsonrpc':'2.0','id':1,'method':'tools/call','params':{'name':name,'arguments':args}}
 req=urllib.request.Request(MCP,data=json.dumps(body).encode(),headers={'Content-Type':'application/json','Accept':'application/json, text/event-stream','User-Agent':'Universal-Informatics/1.0'})
 with urllib.request.urlopen(req,timeout=75) as r:raw=r.read(2000000).decode()
 if raw.startswith('event:') or raw.startswith('data:'):
  raw=next(line[5:].strip() for line in raw.splitlines() if line.startswith('data:') and '"result"' in line)
 data=json.loads(raw)
 if data.get('error') or data.get('result',{}).get('isError'):raise RuntimeError('The Wolfram calculation needs attention. Hardware remains unsubmitted.')
 return data['result']

def inputs(action,caps):
 a=json.loads(action);sites=[[float(x)*1e6 for x in p] for p in a['setup']['ahs_register']['sites']];n=len(sites)
 if n>12:raise RuntimeError('This design exceeds the currently verified local simulation capacity. Refine the method or connect a larger simulator before hardware launch.')
 c6=float(caps['paradigm']['rydberg']['c6Coefficient'])*1e30
 pairs=list(combinations(range(n),2));coupling=[c6/sum((sites[i][d]-sites[j][d])**2 for d in [0,1])**3 for i,j in pairs]
 fields={}
 for key,scale in [('amplitude',1e-6),('detuning',1e-6),('phase',1)]:
  f=a['hamiltonian']['drivingFields'][0][key]['time_series'];fields[key]=([float(v)*1e6 for v in f['times']],[float(v)*scale for v in f['values']])
 return n,pairs,coupling,fields

def wl(value):
 if isinstance(value,(list,tuple)):return '{'+','.join(wl(v) for v in value)+'}'
 if isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value):return repr(value).replace('e','*^')
 raise ValueError('Wolfram input must be finite numeric data.')

def wolfram(action,caps):
 n,pairs,coupling,fields=inputs(action,caps)
 # Build the Hamiltonian independently in Wolfram, using its QuantumOperator.
 definitions=';'.join(name+'=Interpolation['+wl(list(zip(*fields[field])))+',InterpolationOrder->1]' for name,field in [('omega','amplitude'),('delta','detuning'),('phase','phase')])
 code='Module[{n='+str(n)+',pairs='+wl([[i+1,j+1] for i,j in pairs])+',coupling='+wl(coupling)+',bits,diag,op,mat,omega,delta,phase,t,y,sol,p,hermitian},'+definitions+';'
 code+='bits=Table[BitGet[i,q],{i,0,2^n-1},{q,0,n-1}];diag=Table[Sum[coupling[[k]] bits[[i,pairs[[k,1]]]] bits[[i,pairs[[k,2]]]],{k,Length[pairs]}],{i,2^n}];'
 code+='mat[t_?NumericQ]:=SparseArray[Join[Table[{i,i}->(diag[[i]]-delta[t] Total[bits[[i]]]),{i,2^n}],Flatten[Table[{i+1,BitXor[i,2^q]+1}->(omega[t]/2 Exp[I phase[t](1-2 BitGet[i,q])]),{i,0,2^n-1},{q,0,n-1}],1]],{2^n,2^n}];'
 duration=wl(fields['amplitude'][0][-1]);mid=wl(fields['amplitude'][0][-1]/2)
 code+='op=PacletSymbol["Wolfram/QuantumFramework","QuantumOperator"][mat['+mid+']];hermitian=Max[Abs[Flatten[Normal[op["Matrix"]-ConjugateTranspose[op["Matrix"]]]]]]<10^-10;'
 code+='sol=NDSolveValue[{y\'[t]==-I mat[t].y[t],y[0]==UnitVector[2^n,1]},y,{t,0,'+duration+'},AccuracyGoal->9,PrecisionGoal->8,MaxStepFraction->1/1000];p=Abs[sol['+duration+']]^2;'
 code+='ExportString[<|"framework"->ToString[Head[op],InputForm],"dimension"->Dimensions[op["Matrix"]],"hermitian"->hermitian,"probabilities"->p,"probability_sum"->Total[p]|>,"RawJSON"]]'
 result=call('WolframLanguageEvaluator',{'code':code,'timeConstraint':60})
 texts=[c.get('text','') for c in result.get('content',[]) if c.get('type')=='text'];receipt=None
 for text in texts:
  # The evaluator returns an outer output object; RawJSON may be a JSON string.
  candidates=[text]+re.findall(r'Out\[\d+\]=\s*("(?:\\.|[^"\\])*")',text)
  try:
   outer=json.loads(text)
   if isinstance(outer,dict):candidates.extend(v for v in outer.values() if isinstance(v,str))
  except (ValueError,TypeError):pass
  for item in candidates:
   try:
    parsed=json.loads(item)
    if isinstance(parsed,str):parsed=json.loads(parsed)
    if isinstance(parsed,dict) and 'probabilities' in parsed:receipt=parsed
   except (ValueError,TypeError):pass
 if receipt is None:raise RuntimeError('Wolfram returned no usable numerical receipt. No hardware submission was made.')
 if not receipt.get('hermitian') or 'QuantumOperator' not in receipt.get('framework','') or len(receipt.get('probabilities',[]))!=2**n or abs(receipt.get('probability_sum',0)-1)>1e-6:raise RuntimeError('The Wolfram model check did not pass.')
 return {**receipt,'action_sha256':sha(action),'code':code,'code_sha256':sha(code),'response_sha256':sha(json.dumps(result,sort_keys=True)),'endpoint':MCP,'execution':'fresh'}

def simulate(action,caps,wolfram_receipt):
 import numpy as np
 from scipy.integrate import solve_ivp
 import cudaq
 n,pairs,coupling,fields=inputs(action,caps);dim=2**n;idx=np.arange(dim);bits=((idx[:,None]>>np.arange(n))&1);diagonal=sum((v*bits[:,i]*bits[:,j] for v,(i,j) in zip(coupling,pairs)),np.zeros(dim))
 def pulse(name,t):return float(np.interp(t,*fields[name]))
 def rhs(t,y):
  drive=sum((np.exp(1j*pulse('phase',t)*(1-2*bits[:,i]))*y[idx^(1<<i)] for i in range(n)),np.zeros(dim,dtype=complex))
  return -1j*(pulse('amplitude',t)/2*drive+(diagonal-pulse('detuning',t)*bits.sum(axis=1))*y)
 knots=sorted(set(t for times,values in fields.values() for t in times));state=np.zeros(dim,dtype=complex);state[0]=1
 for left,right in zip(knots,knots[1:]):
  sol=solve_ivp(rhs,[left,right],state,method='DOP853',rtol=1e-10,atol=1e-12,max_step=.01)
  if not sol.success:raise RuntimeError('The independent local calculation did not converge.')
  state=sol.y[:,-1]
 reference=abs(state)**2;wp=np.array(wolfram_receipt['probabilities']);wf_error=float(np.max(abs(reference-wp)))
 if wf_error>1e-5 or abs(reference.sum()-1)>1e-7:raise RuntimeError('Wolfram and the independent calculation disagree. Hardware remains unsubmitted.')
 cudaq.set_target('qpp-cpu');error=1.;cq=None
 for dt in [.01,.005,.0025,.00125]:
  k=cudaq.make_kernel();q=k.qalloc(n);steps=0
  for left,right in zip(knots,knots[1:]):
   count=math.ceil((right-left)/dt);step=(right-left)/count
   for j in range(count):
    t=left+(j+.5)*step;o=pulse('amplitude',t);d=pulse('detuning',t);p=pulse('phase',t)
    for i in range(n):k.rz(p,q[i]);k.rx(o*step/2,q[i]);k.rz(-p,q[i])
    for i in range(n):k.r1(d*step,q[i])
    for v,(i,jj) in zip(coupling,pairs):k.cr1(-v*step,q[i],q[jj])
    for i in range(n):k.rz(p,q[i]);k.rx(o*step/2,q[i]);k.rz(-p,q[i])
    steps+=1
  cq=abs(np.asarray(cudaq.get_state(k)))**2;error=float(np.max(abs(cq-reference)))
  if error<1e-4:break
 if error>=1e-4:raise RuntimeError('CUDA-Q needs a more accurate simulation before hardware launch.')
 return {'action_sha256':sha(action),'backend':'CUDA-Q qpp-cpu','new_GPU_USD':0,'wolfram_reference_max_probability_error':wf_error,'cuda_q_max_probability_error':error,'probabilities':cq.tolist(),'expected_atom_excitation':(cq@bits).tolist(),'time_step_us':dt,'steps':steps,'passed':True}
