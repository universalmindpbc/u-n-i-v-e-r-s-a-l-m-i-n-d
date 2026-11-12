import fs from 'node:fs/promises';
const file='/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/i n f o r m a t i c s/research/universal-one-quantum-20261109/command-spend.json';
// Reserve US$1 for voice/transcription; commands share the other US$1.
export async function guardedCommand(route){
 let ledger;try{ledger=JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;ledger={limitUSD:1,reservedVoiceAndTranscriptionUSD:1,calls:[]};}
 const used=ledger.calls.reduce((n,c)=>n+c.chargedUpperUSD,0);
 if(used+0.4>ledger.limitUSD)return route.fulfill({status:429,contentType:'application/json',body:'{"error":"The approved command verification allowance is used."}'});
 const row={id:crypto.randomUUID(),chargedUpperUSD:0.4,status:'reserved'};ledger.calls.push(row);await fs.writeFile(file,JSON.stringify(ledger,null,2)+'\n');
 const response=await route.fetch({headers:{...route.request().headers(),'X-Research-QA-Max-USD':'0.40'},timeout:110000});
 const body=await response.json();
 const current=JSON.parse(await fs.readFile(file,'utf8')),saved=current.calls.find(x=>x.id===row.id);
 if(body.qaSpend&&Number.isFinite(body.qaSpend.chargedUpperUSD)&&body.qaSpend.chargedUpperUSD<=0.4){saved.chargedUpperUSD=body.qaSpend.chargedUpperUSD;saved.status='reconciled';saved.providerResponse=body.provider_response_id;}
 await fs.writeFile(file,JSON.stringify(current,null,2)+'\n');await route.fulfill({response});
}
