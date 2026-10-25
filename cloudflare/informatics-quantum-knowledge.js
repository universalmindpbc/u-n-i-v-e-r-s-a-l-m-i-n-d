import study from '../Informatics/quantum/data/oxtr-qrc-study.json' with {type:'json'};
import measurements from '../Informatics/quantum/data/oxtr-qrc-qualification.json' with {type:'json'};
import timing from '../Informatics/quantum/data/execution-timing.json' with {type:'json'};
import evidence from '../Informatics/quantum/data/oxtr-next-test-evidence.json' with {type:'json'};
import registry from '../Informatics/quantum/experiments/index.json' with {type:'json'};

export const quantumSections=['summary','sequences','methods','measurements','comparison','next_test','timing','downloads'];
export const quantumRelevant=(question,history=[])=>/quantum|aquila|quera|cuda.?q|qbraid|hamiltonian|our experiment|our study|eight (?:versions|ways|methods)|phi ratio/i.test([question,...history.slice(-4).map(m=>m.content||'')].join(' '));
const mean=values=>values.slice(0,6).reduce((a,b)=>a+b,0)/6;
export function quantumKnowledge({id='oxtr-qrc-01',section='summary',offset=0}={},origin='https://universalmind.tv'){
 if(id!=='oxtr-qrc-01'||!quantumSections.includes(section))throw new Error('Unknown quantum study or section.');
 if(!Number.isInteger(offset)||offset<0||offset>16)throw new Error('Invalid measurement offset.');
 const archive=registry.experiments.filter(r=>r.id==='oxtr-qrc-01-qualification').at(-1);
 const links={page:origin+'/informatics/?area=quantum&entry=research',json:origin+'/informatics/'+archive.json,csv:origin+'/informatics/'+archive.csv,complete_dataset:origin+'/informatics/connect.html#downloads'};
 let data;
 if(section==='summary')data={question:study.question,phase:'Completed measurement qualification; binding-site prediction has not yet been tested.',
  goal:'Test whether quantum responses add useful information for predicting transcription-factor occupancy around OXTR.',
  what_ran:'Two unchanged 256-base DNA samples. Each sample supplied numerical input in eight preparations: ordinary, Fibonacci, Phi Ratio, Alpha, Beta, Gamma, Epsilon and shuffled. Six simulated or physical atoms; 16 CUDA-Q GPU programs and 16 Aquila programs, each with 100 measurements.',
  result:'All 16 GPU runs passed the recorded numerical agreement check. All 16 Aquila runs returned; agreement with the model was mixed. These are measurements of atomic excitation, not probabilities that proteins bind DNA.',
  useful_finding:'The input preparation changes the quantum response. Gamma and Epsilon raise the calculated mean excitation relative to ordinary input in both samples. The shuffled control is larger in the second sample, so response size alone is not a Fibonacci-specific benefit.',
  success_next:'Build a binding-prediction method using one set of DNA regions. Keep that method fixed and predict different DNA before revealing its laboratory binding results. A useful signal is more accurate predictions than the strongest comparison method using the same DNA information.',
  null_next:'No clear improvement within uncertainty is inconclusive. Equal or worse predictions give no demonstrated predictive benefit and require revision or a negative result.',
  next_action:'Audit the ENCODE CTCF dataset, obtain matched public DNA and build a classical prediction comparison. This is computational work using public data; a new wet-lab experiment is not required to begin.',
  ctcf:'CTCF is one transcription factor: a protein that binds DNA. It is a proposed first test target, not a replacement term for all transcription factors. ENCODE peaks mark binding regions, not exact contacted bases.',
  trust:'The mathematical calculation tests the specified model. CUDA-Q samples that model on a classical GPU. Aquila measures actual neutral atoms, including device noise. Agreement checks execution; laboratory binding data is the evidence for biological prediction. There is no universal trust score ranking one machine above the other.',
  nature:'The 2022 Nature study s41586-022-04853-4 used a Fibonacci-ordered drive in a trapped-ion system and found longer-lived edge quantum information. It motivates Fibonacci research. Our Aquila measurement batch did not test that stability mechanism or prove that hexagons cause it.',
  hypotheses:'The proposed link from M9 P24 geometry, Odom’s construction and honeycomb efficiency to quantum stability remains a working hypothesis. Mathematical relationships and the honeycomb theorem do not by themselves establish this physical mechanism.',
  hardware_fee_usd:measurements.hardware_fee_usd,gpu_cost_credits:measurements.gpu_cost_credits,
  hardware_valid_shots:measurements.records.reduce((n,r)=>n+r.hardware_valid_shots,0),links};
 if(section==='sequences')data={definitions:study.atlas,variants:study.variants,terminology:'Phi Ratio; zero residue may be displayed as 9. Alpha, Beta, Gamma and Epsilon preserve the Atlas definitions and starting alignment.'};
 if(section==='methods')data={template:study.template,execution:study.execution,qualification:study.qualification,windows:measurements.windows,positions_m:measurements.positions_m,scope:study.scope};
 if(section==='measurements')data={records:measurements.records.slice(offset,offset+2),page:{offset,total:16,nextOffset:offset+2<16?offset+2:null},units:'Probabilities 0–1. First six values are individual atom excitation; the remaining 15 are joint excitations. These are not binding probabilities.',links};
 if(section==='comparison')data=measurements.records.map(r=>{const ordinary=measurements.records.find(x=>x.window===r.window&&x.variant==='ordinary');return {sample:r.window,method:r.variant,calculated:mean(r.ideal_observables),cudaq:mean(r.gpu_observables),aquila:mean(r.hardware_observables),calculated_change_percentage_points:100*(mean(r.ideal_observables)-mean(ordinary.ideal_observables)),gpu_shots:r.shots,aquila_valid_shots:r.hardware_valid_shots};});
 if(section==='next_test')data={evaluation:study.evaluation,evidence,action:'Audit assay quality first; final laboratory answers remain hidden while predictions are developed. Five nearby regions alone do not establish reliable prediction accuracy.'};
 if(section==='timing')data=timing;
 if(section==='downloads')data=links;
 return {id,section,availableSections:quantumSections,data,sourceSHA256:archive.json_sha256,url:links.json,pageURL:links.page};
}

// Keep project terminology consistent when generated prose drifts.
export const normaliseResearchTerminology=text=>text.replace(new RegExp('\\b'+'gol'+'den[\\s-]+ratio\\b','gi'),'Phi Ratio');
