"""Publish an explicit qualification record from receipts, never a predictive claim."""
from pathlib import Path
import json, hashlib
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent
OUT = ROOT/'results'
SITE = Path('/private/tmp/um-quantum-lab-20261025/Informatics/quantum/data')
def read(name): return json.loads((OUT/name).read_text())
def save(path,data): path.write_text(json.dumps(data,indent=2)+'\n')
local, gpu, hw = read('qualification.json'), read('gpu-qualification.json'), read('hardware-qualification.json')
assert local['complete'] and gpu['complete'] and len(hw['records'])==16
inputs=read('inputs.json'); physics=read('physical-model.json'); wolfram=read('wolfram-comparison.json')
ih=hashlib.sha256((OUT/'inputs.json').read_bytes()).hexdigest()
records=[]
for r in local['records']:
 g=next(x for x in gpu['cases'] if x['id']==r['id'])
 h=next(x for x in hw['records'] if x['id']==r['id'])
 records.append({'id':r['id'],'window':r['window'],'variant':r['variant'],'ideal_observables':r['ideal_observables'],
                 'gpu_observables':g['measured_observables'],'gpu_counts':g['counts'],'shots':g['shots'],
                 'gpu_job_id':g['job_id'],'hardware_task_id':h['task_arn'].rsplit('/',1)[1],
                 'hardware_state':h['status'],'qasm_sha256':r['qasm_sha256'],
                 **({'hardware_observables':h['measured_observables'],'hardware_counts':h['counts'],'hardware_valid_shots':h['fully_occupied_shots']} if h.get('measured_observables') else {})})
artifact={'schema':'universal-informatics/qualification-results/v1','study_id':'oxtr-qrc-01','study_version':'1.0.0','model_version':'1.1.0-qualification',
          'updated_at':hw['at'],'purpose':'Two-window measurement qualification. Occupancy prediction is not yet evaluated.',
          'input_sha256':ih,'positions_m':physics['positions_m'],'windows':[{k:r[k] for k in ['id','start','end']} for r in inputs['rows']],
          'records':records,'gpu_cost_credits':gpu['cost_credits'],'hardware_fee_usd':20.80,
          'assay_candidate':'ENCODE ENCSR932ZMX · CTCF · GM23338','local_convergence_max_error':max(r['convergence'][-1]['max_observable_error'] for r in local['records']),
          'wolfram_reference_max_error':wolfram['maximum_probability_error']}
save(SITE/'oxtr-qrc-qualification.json',artifact)
def receipt(run,execution,backend,at,task=None):
 r={'run_id':run,'model_version':'1.1.0-qualification','execution':execution,'backend':backend,'completed_at':at,'input_sha256':ih}
 if task:r['task_id']=task
 return r
def report(kind,title,finding,receipt,metrics,details):
 return {'state':'complete','kind':kind,'study_id':'oxtr-qrc-01','study_version':'1.0.0','title':title,'finding':finding,'receipt':receipt,'metrics':metrics,'details':details,'phase':'qualification'}
classical=report('classical','The mathematical model passed its checks.',
 'All 16 programs passed numerical comparison. Wolfram Quantum Framework independently matched the reference case. This establishes a consistent calculation for the first measurement phase; it does not yet establish improved prediction of OXTR occupancy.',
 receipt('oxtr-qrc-01-local-qualification','classical-cpu','SciPy reference + CUDA-Q CPU + Wolfram Quantum Framework',local['at']),
 [{'label':'Model cases checked','value':16},{'label':'Maximum final numerical difference','value':'0.0000583 in probability'},{'label':'Wolfram reference difference','value':'0.00000000726 in probability'}],
 ['Six atoms, full 64-state evolution, all 15 pair interactions. Same coordinates, pulses and interactions in the GPU and Aquila programs.',
  'Two motif-rich 256-base OXTR windows were selected without occupancy labels. They qualify execution and are not an independent prediction test.',
  'Native Fibonacci, Phi Ratio, Alpha, Beta, Gamma and Epsilon are compared with ordinary and shuffled inputs.',
  'Gamma and Epsilon produce distinct simulated responses. At 100 shots, measurement uncertainty can be larger than that difference.'])
simulation=report('simulation','All 16 GPU simulations are complete.',
 'The CUDA-Q programs ran on the NVIDIA GPU through qBraid. All sampled responses passed the prespecified numerical agreement check. Explore how each representation changes the response of the six-atom model.',
 receipt('oxtr-qrc-01-gpu-qualification','cudaq-gpu','CUDA-Q compiled programs → qBraid NVIDIA GPU',gpu['at'],gpu['cases'][1]['job_id']),
 [{'label':'Study simulations','value':'16 × 100 shots'},{'label':'Ordering check','value':'Passed · 8 shots'},{'label':'GPU charge','value':'0 credits'}],
 ['The circles show simulated excitation probabilities, not protein binding probabilities. Every point includes 100-shot sampling uncertainty.',
  'The acceptance check uses six binomial standard errors plus two counts; it is an execution check, not a predictive-performance result.',
  'No classifier was trained in this qualification batch. OXTR occupancy evaluation remains a separate phase using held-out biological evidence.'])
simulation['response_data']='oxtr-qrc-qualification.json'
state=json.loads((SITE/'oxtr-qrc-state.json').read_text())
state.update(state='measurement_phase',updated_at=hw['at'],updated_on=hw['at'][:10],phase='qualification',
             status_label='First measurement phase',caption='16 GPU simulations complete. 16 Aquila tasks accepted. OXTR occupancy prediction remains to be evaluated.')
state['stages'].update({
 'model':{'state':'complete','label':'Model checks passed','message':'All 16 programs passed numerical checks. Wolfram Quantum Framework independently verified the reference Hamiltonian and evolution.'},
 'classical':{'state':'complete','label':'Numerical checks complete'},
 'simulation':{'state':'complete','label':'16 GPU runs complete','message':'All eight representations were simulated for two OXTR windows. CUDA-Q compiled programs ran through qBraid on an NVIDIA GPU at zero credit cost.'},
 'hardware':{'state':'queued','label':'16 Aquila tasks accepted','message':'The 16 matched programs have Amazon Braket task receipts. Each requests 100 measurements. Results appear after hardware processing and comparison.'},
 'evidence':{'state':'specified','label':'Prediction evaluation follows','message':'This first batch checks the measurement route. The larger benchmark compares held-out occupancy predictions against strong classical baselines.'},
 'result':{'state':'planned','label':'Simulation checks available','message':'The numerical and GPU qualification results are available under Classical results. Biological prediction has not yet been evaluated.'}})
state['jobs']=[{'provider':'qBraid','id':g['job_id'],'state':g['status']} for g in gpu['cases']]+[{'provider':'Amazon Braket / QuEra','id':h['task_arn'].rsplit('/',1)[1],'state':h['status']} for h in hw['records']]
completed=sum(h['status']=='COMPLETED' for h in hw['records'])
running=sum(h['status']=='RUNNING' for h in hw['records'])
queued=sum(h['status']=='QUEUED' for h in hw['records'])
failed=sum(h['status'] in ['FAILED','CANCELLED'] for h in hw['records'])
state['stages']['hardware'].update(state='failed' if failed else 'complete' if completed==16 else 'running' if running else 'queued',
 label=f'{completed}/16 returned · {running} running' if running else f'{completed}/16 returned · {queued} queued',
 message=f'Recorded at {hw["at"]}: {completed} completed, {running} running, {queued} queued, {failed} interrupted. All 16 tasks have saved receipts. The comparison is released after the full batch is evaluated.')
state['caption']=f'16 GPU simulations complete. Aquila: {completed} completed, {running} running, {queued} queued. Status recorded {hw["at"]}. Occupancy prediction remains to be evaluated.'
state['reports'].update(classical=classical,simulation=simulation)
save(SITE/'oxtr-qrc-state.json',state)
study=json.loads((SITE/'oxtr-qrc-study.json').read_text())
study['status']='measurement_qualification'
study['scope']='The first measurement phase has completed CPU and GPU checks and has submitted 16 Aquila programs. Held-out occupancy prediction remains to be evaluated.'
study['execution']['current_stage']='hardware'
study['execution']['job_records']=state['jobs']
study['qualification']={'version':'1.1.0-qualification','status':'hardware_submitted','report':'oxtr-qrc-qualification.json','methods':'oxtr-qrc-qualification.md',
                        'windows':2,'representations':8,'shots_per_program':100,'scope':'Execution and numerical qualification; no biological prediction result.'}
study['review']={'status':'Measurement phase activated','next':'Retrieve Aquila measurements and compare them with the matched simulations before the held-out prediction benchmark.','methods_url':'data/oxtr-qrc-protocol.md'}
study['delivery']['phase']='measurement_qualification'
save(SITE/'oxtr-qrc-study.json',study)
print('Published data prepared from 17 GPU and 16 Aquila receipts.')
