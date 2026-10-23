import fs from 'node:fs';
export const endpoint='https://informatics-universal-one-staging.universalmind.workers.dev';
const token=()=>fs.readFileSync(process.env.UO_QA_TOKEN_FILE||'/private/tmp/uo-secrets/qa-token','utf8').trim();
export async function installQAAuth(page){
 await page.route(endpoint+'/**',route=>route.continue({headers:{...route.request().headers(),'X-Research-QA':token()}}));
}
export async function readBudget(){
 const response=await fetch(endpoint+'/budget-status',{headers:{Origin:'https://staging.universalmind.tv','X-Research-QA':token()}});
 if(!response.ok)throw Error('QA counter access failed');return response.json();
}
