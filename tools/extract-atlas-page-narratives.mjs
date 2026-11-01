// Evaluate only existing pure text templates; never run interactive page code.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const site=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../Informatics');
const read=p=>fs.readFileSync(path.join(site,p),'utf8');
const base='https://universalmind.tv/informatics/';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const s=read('science.js'),data=JSON.parse(read('pilot-v1/oxtr-tfbs-v1/catalogue.json'));
const context=vm.createContext({URL,root:base,tfbsRoot:base+'pilot-v1/oxtr-tfbs-v1/',data,s:data.summary,esc,external:(url,label)=>`<a href="${url}">${esc(label)}</a>`,download:(f,l)=>`<a href="${base}pilot-v1/oxtr-tfbs-v1/${f}" download>${l}</a>`});
vm.runInContext(s.slice(s.indexOf('function tfbsSourceGuide(data)'),s.indexOf('\n  async function loadTfbs',s.indexOf('function tfbsSourceGuide(data)'))),context);
const template=(source,start,end)=>source.slice(source.indexOf(start)+start.length,source.indexOf(end,source.indexOf(start)+start.length));
const evaluate=(source,start,end)=>vm.runInContext(template(source,start,end),context);
const learning=evaluate(s,'tfbsLearning.innerHTML = ',';\n  document.body.append(tfbsLearning)');
const transcription=evaluate(s,'transcription.innerHTML=',';\n  document.body.append(transcription)');
const catalogue=evaluate(s.slice(s.indexOf('async function loadTfbs')),'        content.innerHTML = ',';\n        content.querySelector');
const geometrySource=read('tfbs-geometry.js');
Object.assign(context,{root:new URL('experiment-v1/',base+'pilot-v1/oxtr-tfbs-v1/'),views:{line:'Original DNA line',circle:'Full-position circle',m9:'Modulus 9 circle'},colors:{alpha:'',beta:'',gamma:'',epsilon:''},view:'line',pattern:'beta'});
const comparison=evaluate(geometrySource,'  host.innerHTML=',';\n');
const research=read('research.js');
const expression=research.slice(research.indexOf('const descriptions=d.views.map'),research.indexOf('\nconst colors='))+';globalThis.result=descriptions;';
const geometry={};
for(const r of JSON.parse(read('pilot-v1/index.json')).records){
 const d=JSON.parse(read(r.file));const c={d};
 vm.runInNewContext('const m=d.modulus,p=d.pisano_period,b=d.beta,g=d.gamma,e=d.epsilon,ep=d.epsilon_path;const seq=a=>a.join(" → ");'+expression,c);
 geometry[r.modulus]=d.views.map((v,i)=>({id:v.id,title:v.name,description:c.result[i][0],sequence:c.result[i][1],convention:c.result[i][2],calculation:c.result[i][3]}));
}
process.stdout.write(JSON.stringify({transcription:{learning,transcription,catalogue,comparison},geometry}));
