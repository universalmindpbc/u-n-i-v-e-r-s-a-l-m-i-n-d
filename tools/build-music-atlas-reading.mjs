// Publish the existing Music Atlas explanations and calculations without changing its runtime.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const site=path.join(root,'Informatics');
const source=fs.readFileSync(path.join(site,'atlas-visuals.js'),'utf8');
const start=source.indexOf('const $='),end=source.indexOf('function renderSequence(');
assert(start>=0&&end>start,'Music source declaration boundaries changed');
const context={window:{}};
vm.runInNewContext(source.slice(start,end)+'\nglobalThis.music={descriptions,alpha,gammaIndices,melodyDegrees,phraseBars,residues,semitones,names,frequencies,fifths,scales,frequencyMapping,chromaticNames,chromaticBlack};',context,{timeout:1000});
const m=context.music;
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const decode=value=>value.replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&nbsp;',' ');
const plain=value=>decode(value.replace(/<p\b[^>]*>/gi,'\n').replace(/<\/span>/gi,' ').replace(/<\/t[hd]>/gi,' | ').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(?:p|h[1-6]|section|div|figure|figcaption|tr)>/gi,'\n\n').replace(/<[^>]*>/g,'')).replace(/[ \t]+\n/g,'\n').trim();
function markdown(html){
 return decode(html.replace(/<p\b[^>]*>/gi,'\n').replace(/<\/span>/gi,' ').replace(/<table>[\s\S]*?<\/table>/g,table=>{
  const rows=[...table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(r=>[...r[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/g)].map(c=>plain(c[1]).replaceAll('|','\\|').replaceAll('\n',' ')));
  return '\n\n'+rows.map((r,i)=>'| '+r.join(' | ')+' |'+(i===0?'\n| '+r.map(()=>'---').join(' | ')+' |':'')).join('\n')+'\n\n';
 }).replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g,(_,url,text)=>`[${plain(text)}](${url})`).replace(/<code>([\s\S]*?)<\/code>/g,'`$1`').replace(/<strong>([\s\S]*?)<\/strong>/g,'**$1**').replace(/<em>([\s\S]*?)<\/em>/g,'*$1*').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(?:p|section|div|figure|figcaption)>/gi,'\n\n').replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g,(_,level,text)=>'\n\n'+ '#'.repeat(Math.min(Number(level)+1,6))+' '+plain(text)+'\n\n').replace(/<[^>]*>/g,'')).replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
const tables={
 sequence:{caption:'Phrase doubling and modulo 9',columns:['Phrase length (bars)','Quotient on division by 9','Remainder'],rows:m.phraseBars.map((n,i)=>[n,Math.floor(n/9),m.residues[i]])},
 melody:{caption:'Selected C-major degrees and interval ratios',columns:['Scale degree','Note','Semitones above C','Just ratio','12-TET ratio'],rows:m.melodyDegrees.map((d,i)=>[d,['C','E','G','C'][i],[0,4,7,12][i],['1','5/4','3/2','2'][i],2**([0,4,7,12][i]/12)])},
 scale:{caption:'C-major notes, semitone positions and the hexagonal arrangement',columns:['Degree','Note','Semitones above tonic','Placement'],rows:m.scales.C.map((n,i)=>[i+1,n,m.semitones[i],i===0?'Centre':'Perimeter '+i])},
 chromatic:{caption:'C-to-C keyboard span including the repeated endpoint',columns:['Semitones above C','Note','Key colour','Circle pitch-class index'],rows:Array.from({length:13},(_,i)=>[i,i===12?'C':m.chromaticNames[i],m.chromaticBlack.includes(i)?'Black':'White',i%12])},
 fifths:{caption:'Circle of fifths in twelve-tone equal temperament',columns:['Fifth step','Pitch class','Semitones modulo 12','12-TET frequency ratio within one octave'],rows:m.fifths.map((n,i)=>[i,n,(7*i)%12,2**(((7*i)%12)/12)])},
 tuning:{caption:'Written-frequency M9 visual presets',columns:['Frequency (Hz)','Written digits','Digit sum','M9 displayed value','Visual preset'],rows:[528,111,7.38].map(hz=>{const r=m.frequencyMapping(hz);return [hz,r.digits.join(' + '),r.sum,r.residue,r.shape];})}
};
const tableHTML=t=>`<table><caption>${esc(t.caption)}</caption><thead><tr>${t.columns.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(row=>'<tr>'+row.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')}</tbody></table>`;
const models=Object.entries(m.descriptions).map(([id,d])=>({id,label:d.label,title:d.title,description:d.description,equation:d.equation,caption:d.caption,workings_html:d.workings,workings_markdown:markdown(d.workings),atlas_family:d.atlas,table:tables[id]}));
assert.equal(models.length,6);
const indexFile=path.join(site,'index.html');
let index=fs.readFileSync(indexFile,'utf8');
for(const marker of ['MACHINE','DOWNLOADS','METADATA'])index=index.replace(new RegExp(`<!-- MUSIC ATLAS ${marker} START -->[\\s\\S]*?<!-- MUSIC ATLAS ${marker} END -->\\n?`),'');
const measurementMatch=index.match(/<section class="music-measurement"[\s\S]*?(?=\n<\/section>\n\n<section class="atlas-section atlas-vision")/);
assert(measurementMatch,'Measurement chapter boundary changed');
// Ignore generated additions when reading the approved chapter on later builds.
const measurementHTML=measurementMatch[0].split('<!-- MUSIC ATLAS DOWNLOADS START -->')[0].trim();
const figures=[...measurementHTML.matchAll(/<figure\b[^>]*>([\s\S]*?)<\/figure>/g)].map((match,i)=>{
 const html=match[1];return {order:i+1,caption:plain(html.match(/<figcaption>([\s\S]*?)<\/figcaption>/)[1]),image:html.match(/<img[^>]*src="([^"]+)"/)[1],description:decode(html.match(/<img[^>]*alt="([^"]+)"/)[1])};
});
const base='https://universalmind.tv/informatics/';
const downloadBase='music-atlas/';
const instructions=[
 'Read the six model records together with their equations, tables and workings. The wording is taken from the interactive Music Atlas.',
 'Keep units and conventions: phrase lengths count bars; chromatic pitch classes exclude the repeated octave endpoint; frequency values are in hertz.',
 'Use the selected tuning reference and key when discussing an interactive setting. The default is C major with A4 = 440 Hz.',
 'The measurement chapter describes software visual mockups and planned streams. No participant time-series samples are included in this record.',
 'Follow the source links for Geometry Atlas records and citations. Cite the ordinary Music Atlas URL or the linked model section when discussing the material.'
];
const data={schema:'universal-informatics/music-atlas/v1',title:'Universal Informatics Music Atlas',version:'2026-10-31',url:base+'?entry=research&area=sound',wiki:base+'read/music/index.html',source:{script:'atlas-visuals.js',sha256:sha(source),measurement_chapter_sha256:sha(measurementHTML)},instructions,models,settings:{default_key:'C',default_A4_hz:440,available_keys:m.scales,available_A4_hz:[432,440,444],frequency_formula:'f = A4 * 2^((n - 9)/12), where n is semitones above C4',frequencies:[432,440,444].map(A4=>({A4_hz:A4,notes:m.names.map((note,i)=>({note,semitones_above_C4:m.semitones[i],frequency_hz:m.frequencies(A4)[i]}))}))},geometry:{modulus:9,pisano_period:24,alpha_display:m.alpha,display_zero_as:9,gamma_indices_zero_based:m.gammaIndices,gamma_positions:m.gammaIndices.map(i=>i||24),gamma_alpha_values:m.gammaIndices.map(i=>m.alpha[i]),beta_cycle:[1,2,4,8,7,5],phrase_rotation:m.residues,source_json:base+'pilot-v1/m9.json',reading_page:base+'read/atlas/m9.html'},measurement:{title:'Non-invasive measurement before mRNA sequencing',text_markdown:markdown(measurementHTML.replace(/<button[\s\S]*?<\/button>/g,'')),figures},downloads:{json:base+downloadBase+'music-atlas.json',markdown:base+downloadBase+'music-atlas.md',csv:base+downloadBase+'music-atlas.csv'}};
const jsonText=JSON.stringify(data,null,2)+'\n';
const sections=models.map(model=>`<section id="music-model-${model.id}" data-music-model="${model.id}"><h2>${esc(model.label)} · ${esc(model.title)}</h2><p>${esc(model.description)}</p><pre>${esc(model.equation)}</pre><p>${esc(model.caption)}</p>${model.workings_html}${tableHTML(model.table)}</section>`).join('\n');
const tuningTable={caption:'Equal-tempered C4–C5 scale frequencies for every available A4 reference',columns:['A4 reference (Hz)','Note','Semitones above C4','Frequency (Hz)'],rows:data.settings.frequencies.flatMap(ref=>ref.notes.map(n=>[ref.A4_hz,n.note,n.semitones_above_C4,n.frequency_hz]))};
const figureTable={caption:'Measurement mockup figure descriptions',columns:['Order','Figure','Description','Image'],rows:figures.map(f=>[f.order,f.caption,f.description,f.image])};
const content=`${sections}\n<h2>Reference frequencies</h2>${tableHTML(tuningTable)}\n<h2>Measurement architecture</h2>${measurementHTML.replace(/<button[\s\S]*?<\/button>/g,'').replace(/\bid="[^"]*"/g,'').replace(/\baria-labelledby="[^"]*"/g,'')}\n${tableHTML(figureTable)}`;
const markdownText=`# ${data.title}\n\n[Interactive Music Atlas](${data.url}) · [AI / LLM Wiki](${data.wiki})\n\n## Reading this record\n\n${instructions.map(t=>'- '+t).join('\n')}\n\n${models.map(model=>`## ${model.label} · ${model.title}\n\n${model.description}\n\n${model.equation}\n\n${model.caption}\n\n${model.workings_markdown}\n\n${markdown(tableHTML(model.table))}`).join('\n\n')}\n\n## Reference frequencies\n\n${markdown(tableHTML(tuningTable))}\n\n## Geometry source\n\nAlpha display values: ${m.alpha.join(', ')}.\n\nGamma positions: ${data.geometry.gamma_positions.join(', ')}. Gamma Alpha values: ${data.geometry.gamma_alpha_values.join(', ')}.\n\n[Complete M9/P24 JSON](${data.geometry.source_json}) · [Geometry explanations](${data.geometry.reading_page})\n\n## Measurement architecture\n\n${data.measurement.text_markdown}\n\n${markdown(tableHTML(figureTable))}\n\n## Source and downloads\n\nSource: atlas-visuals.js · SHA-256: ${sha(source)}\n\n[JSON](${data.downloads.json}) · [CSV](${data.downloads.csv}) · [Markdown](${data.downloads.markdown})\n`;
// A complete lossless typed-path CSV, including narrative and numeric fields.
const csvRows=[['path','type','value']];
function flatten(value,pointer=''){
 const type=value===null?'null':Array.isArray(value)?'array':typeof value;
 if(type==='object'||type==='array'){
  csvRows.push([pointer,type,type==='array'?value.length:'']);
  for(const [key,v]of Object.entries(value))flatten(v,pointer+'/'+key.replaceAll('~','~0').replaceAll('/','~1'));
 }else csvRows.push([pointer,type,value===null?'':String(value)]);
}
flatten(data);
const csvText=csvRows.map(row=>row.map(c=>'"'+String(c).replaceAll('"','""')+'"').join(',')).join('\n')+'\n';
const jsonSafe=jsonText.replaceAll('<','\\u003c').replaceAll('>','\\u003e').replaceAll('&','\\u0026');
const machine=`<!-- MUSIC ATLAS MACHINE START -->\n<section id="music-atlas-machine" hidden aria-hidden="true" aria-label="Music Atlas semantic explanations and data">\n${content}\n</section>\n<script id="music-atlas-data" type="application/json">${jsonSafe}</script>\n<!-- MUSIC ATLAS MACHINE END -->`;
const downloadLinks=(prefix='')=>`<a href="${prefix}music-atlas/music-atlas.json" download="music-atlas.json">JSON ↓</a><a href="${prefix}music-atlas/music-atlas.csv" download="music-atlas.csv">CSV ↓</a><a href="${prefix}music-atlas/music-atlas.md" download="music-atlas.md">Markdown ↓</a>`;
const footer=`<!-- MUSIC ATLAS DOWNLOADS START -->\n<nav id="music-atlas-downloads" class="music-atlas-downloads" aria-label="Music Atlas data and AI reading"><a href="read/music/index.html" target="_blank" rel="noopener">AI / LLM Wiki for Music Atlas ↗</a>${downloadLinks()}</nav>\n<!-- MUSIC ATLAS DOWNLOADS END -->`;
const ld={ '@context':'https://schema.org','@type':'LearningResource','@id':data.url+'#music-atlas',name:data.title,url:data.url,description:'Six Music Atlas models with calculations, sequence values, musical explanations and measurement architecture.',hasPart:models.map(model=>({'@type':'LearningResource',name:model.label+' · '+model.title,url:data.wiki+'#music-model-'+model.id,text:model.description+'\n'+model.equation+'\n'+plain(model.workings_html)})),encoding:[{ '@type':'MediaObject',encodingFormat:'application/json',contentUrl:data.downloads.json},{'@type':'MediaObject',encodingFormat:'text/markdown',contentUrl:data.downloads.markdown},{'@type':'MediaObject',encodingFormat:'text/csv',contentUrl:data.downloads.csv}]};
const head=`<!-- MUSIC ATLAS METADATA START -->\n<link rel="alternate" type="application/json" href="music-atlas/music-atlas.json" title="Music Atlas data"><link rel="alternate" type="text/markdown" href="music-atlas/music-atlas.md" title="Music Atlas explanations"><link rel="alternate" type="text/csv" href="music-atlas/music-atlas.csv" title="Music Atlas complete CSV"><link rel="stylesheet" href="music-atlas/reading-links.css?v=1">\n<script type="application/ld+json" id="music-atlas-structured">${JSON.stringify(ld).replaceAll('<','\\u003c')}</script>\n<!-- MUSIC ATLAS METADATA END -->`;
for(const marker of ['MACHINE','DOWNLOADS','METADATA'])index=index.replace(new RegExp(`<!-- MUSIC ATLAS ${marker} START -->[\\s\\S]*?<!-- MUSIC ATLAS ${marker} END -->\\n?`),'');
index=index.replace('</head>',head+'\n</head>');
index=index.replace('<section class="music-measurement"',machine+'\n<section class="music-measurement"');
index=index.replace('\n</section>\n\n<section class="atlas-section atlas-vision"','\n'+footer+'\n</section>\n\n<section class="atlas-section atlas-vision"');
assert(index.includes(footer),'Music footer insertion failed');
const css='.music-atlas-downloads{display:flex;flex-wrap:wrap;gap:10px 22px;margin:32px 0 0;padding:18px 0;border-top:1px solid #30424e;font-size:12px;line-height:1.6}.music-atlas-downloads a{color:#a8bdc6;text-decoration:none}.music-atlas-downloads a:hover,.music-atlas-downloads a:focus-visible{color:#e5edf2;text-decoration:underline}\n';
const wiki=`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow,max-snippet:-1"><title>Music Atlas · AI / LLM Wiki · Universal Informatics</title><meta name="description" content="The six Music Atlas models: explanations, equations, semantic tables, complete JSON, CSV and Markdown."><link rel="canonical" href="${data.wiki}"><link rel="stylesheet" href="../reading.css"><style>code{overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;max-width:100%;display:block;overflow-x:auto;margin:20px 0}caption{text-align:left;font-weight:bold}th,td{padding:8px 12px;border-bottom:1px solid #34414a;text-align:left}pre{white-space:pre-wrap}nav{display:flex;flex-wrap:wrap;gap:14px}</style></head><body><header><p>Universal Informatics · Music Atlas</p><nav><a href="../index.html">Research reading room</a><a href="../../?entry=research&amp;area=sound">Interactive Music Atlas</a></nav></header><main><h1>AI / LLM Wiki for Music Atlas</h1><p>The explanations and workings below retain the wording of the interactive Music Atlas. All six models are available together without JavaScript or tab interaction.</p><nav aria-label="Downloads">${downloadLinks('../../')}</nav><h2>Reading this record</h2><ul>${instructions.map(t=>'<li>'+esc(t)+'</li>').join('')}</ul><nav aria-label="Music models">${models.map(model=>`<a href="#music-model-${model.id}">${esc(model.label)}</a>`).join('')}</nav>${content}<h2>Geometry source</h2><p><a href="../../pilot-v1/m9.json">Complete M9/P24 JSON</a> · <a href="../atlas/m9.html">M9/P24 Geometry explanations</a></p><h2>Source</h2><p>Generated from the existing Music Atlas source: <a href="../../atlas-visuals.js">atlas-visuals.js</a>.</p><p>SHA-256: <code>${sha(source)}</code></p></main><footer><nav aria-label="Download complete Music Atlas">${downloadLinks('../../')}</nav><p><a href="../../?entry=research&amp;area=sound">Return to Music Atlas</a></p></footer></body></html>\n`;
const outputs=new Map([['index.html',index],['music-atlas/music-atlas.json',jsonText],['music-atlas/music-atlas.md',markdownText],['music-atlas/music-atlas.csv',csvText],['music-atlas/reading-links.css',css],['read/music/index.html',wiki]]);
const check=process.argv.includes('--check');
for(const [rel,value]of outputs){const dest=path.join(site,rel);if(check)assert.equal(fs.readFileSync(dest,'utf8'),value,'Stale music reading output: '+rel);else{fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,value);}}
console.log(JSON.stringify({passed:true,check,models:models.length,figures:figures.length,outputs:[...outputs.keys()],jsonBytes:Buffer.byteLength(jsonText)}));
