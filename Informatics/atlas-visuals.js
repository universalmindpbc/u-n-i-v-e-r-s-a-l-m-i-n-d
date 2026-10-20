'use strict';
(()=>{
const $=selector=>document.querySelector(selector), NS='http://www.w3.org/2000/svg';
const C={alpha:'#5ca8ff',beta:'#ffea42',gamma:'#ff84c5',hex:'#62d998',white:'#e5edf2',muted:'#859aa8',guide:'#30424e'};
const clamp=value=>Math.max(0,Math.min(1,value));
const node=(tag,attrs={},parent)=>{const element=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attrs))element.setAttribute(key,value);parent.append(element);return element;};
const label=(parent,value,x,y,attrs={})=>{const element=node('text',{x,y,fill:C.white,'font-size':15,'text-anchor':'middle',...attrs},parent);element.textContent=value;element.style.textAnchor=attrs['text-anchor']||'middle';return element;};
const line=(parent,points,color=C.white,attrs={})=>node('path',{d:points.map((p,i)=>`${i?'L':'M'}${p.join(',')}`).join(' '),fill:'none',stroke:color,'stroke-width':1.5,'stroke-linecap':'round','stroke-linejoin':'round',...attrs},parent);
const circle=(parent,x,y,r,color=C.guide,attrs={})=>node('circle',{cx:x,cy:y,r,fill:'none',stroke:color,'stroke-width':1,...attrs},parent);
const polar=(cx,cy,r,index,total)=>[cx+r*Math.sin(index*2*Math.PI/total),cy-r*Math.cos(index*2*Math.PI/total)];
const draw=(element,progress)=>{element.setAttribute('pathLength','1');element.setAttribute('stroke-dasharray','1');element.setAttribute('stroke-dashoffset',String(1-clamp(progress)));};
function reset(svg,title,description){svg.replaceChildren();const prefix=svg.id.startsWith('sound')?'sound':'vision';node('title',{id:prefix+'-svg-title'},svg).textContent=title;node('desc',{id:prefix+'-svg-desc'},svg).textContent=description;}
const round=value=>Number(value.toFixed(2));
const phraseBars=[4,8,16,32,64,128], residues=phraseBars.map(n=>n%9);
const semitones=[0,2,4,5,7,9,11,12], names=['C','D','E','F','G','A','B','C'];
const frequencies=reference=>semitones.map(n=>reference*Math.pow(2,(n-9)/12));
const fifths=['C','G','D','A','E','B','F♯ / G♭','D♭','A♭','E♭','B♭','F'];
const scales={C:['C','D','E','F','G','A','B'],G:['G','A','B','C','D','E','F♯'],D:['D','E','F♯','G','A','B','C♯'],A:['A','B','C♯','D','E','F♯','G♯'],E:['E','F♯','G♯','A','B','C♯','D♯'],B:['B','C♯','D♯','E','F♯','G♯','A♯'],F:['F','G','A','B♭','C','D','E']};
// The same calculations drive the labels, workings and verification.
window.InformaticsSoundMath=Object.freeze({phraseBars,residues,semitones,frequencies,fifths,scales});
let activeArea=null,soundView='sequence',reference=440,key='C',tone=528;
const descriptions={
 sequence:{label:'SEQUENCE STRUCTURE',title:'Doubling the phrase',description:'A four-bar phrase doubles to 8, 16, 32, 64 and 128 bars. Reducing each length modulo 9 gives a repeating six-value cycle.',equation:'4 → 8 → 7 → 5 → 1 → 2',caption:'Phrase length in bars, mapped onto the nine positions of the Beta circle.',steps:6,accent:C.beta,atlas:'beta',link:'Compare with Beta in Geometry →',workings:'<p>In 4/4, each bar contains four quarter-note beats. Here the numbers count bars in a phrase. Doubling is the structural choice being explored.</p><table><thead><tr><th>Bars</th><th>Calculation</th></tr></thead><tbody>'+phraseBars.map((n,i)=>`<tr><td>${n}</td><td>${n} = 9 × ${Math.floor(n/9)} + ${residues[i]}</td></tr>`).join('')+'</tbody></table><p>The M9 / P24 Beta cycle is <code>1, 2, 4, 8, 7, 5</code>. Starting at 4 rotates the same cycle to <code>4, 8, 7, 5, 1, 2</code>.</p><p>Within the Atlas, Beta is calculated by summing the Alpha values strictly between successive Gamma positions and reducing modulo 9. These two calculations produce the same six-value cycle.</p>'},
 melody:{label:'MELODIC STRUCTURE',title:'One · three · five · eight',description:'Select the first, third and fifth degrees of C major, then repeat the tonic at the octave: C, E, G, C. These degree numbers are selected Fibonacci numbers.',equation:'1 · 3 · 5 · 8\nC · E · G · C',caption:'Scale degrees identify the notes. The interval ratios describe the distances between their frequencies.',steps:4,accent:C.alpha,atlas:'alpha',link:'Compare with Alpha in Geometry →',workings:'<p>The Fibonacci sequence begins <code>0, 1, 1, 2, 3, 5, 8…</code>. The chord selects degrees <code>1, 3, 5, 8</code>; these are selected values within the sequence.</p><p>A major triad is degrees 1, 3 and 5. Degree 8 repeats its root one octave higher.</p><table><thead><tr><th>Degree</th><th>Just ratio</th><th>12-TET ratio</th></tr></thead><tbody><tr><td>1</td><td>1</td><td>1</td></tr><tr><td>3</td><td>5/4</td><td>1.25992</td></tr><tr><td>5</td><td>3/2</td><td>1.49831</td></tr><tr><td>8</td><td>2</td><td>2</td></tr></tbody></table><p>12-TET means twelve equal divisions of the octave. Its frequency ratio after <code>n</code> semitones is <code>2^(n/12)</code>. Just intonation gives the chord the proportional frequencies <code>4 : 5 : 6 : 8</code>.</p>'},
 fifths:{label:'CIRCLE OF FIFTHS',title:'A fifth, then another',description:'Move through the twelve pitch classes by fifths. Seven consecutive positions — F, C, G, D, A, E, B — supply the notes of C major when arranged within one octave.',equation:'Perfect fifth: 3 : 2\nOctave: 2 : 1',caption:'The twelve-position circle uses equal temperament. Inspect the workings to compare it with pure 3:2 fifths.',steps:12,accent:C.gamma,atlas:'alpha',link:'Compare with Alpha in Geometry →',workings:'<p>A pure perfect fifth multiplies frequency by <code>3/2</code>. Divide by 2 as needed to bring the result into the starting octave.</p><p>Starting from F, the chain <code>F → C → G → D → A → E → B</code> contains the C-major collection. Ordering those notes by pitch gives <code>C D E F G A B</code>.</p><p>In twelve-tone equal temperament each fifth is <code>2^(7/12) ≈ 1.49831</code>. Twelve steps return to the same pitch class.</p><p>Twelve pure 3:2 fifths exceed seven octaves by <code>531441/524288 ≈ 1.01364</code>. This small difference is the Pythagorean comma.</p><p><code>3/2</code> is one ratio of successive Fibonacci numbers. The sequence <code>3/2, 5/3, 8/5, 13/8…</code> approaches the Phi Ratio. Repeating the fixed ratio 3/2 is a separate operation.</p>'},
 scale:{label:'SIX AROUND ONE',title:'A tonic and six companions',description:'Place the tonic at the centre and the six other notes of its major scale around it. Trace the hexagon, then return to the centre.',equation:'1 tonic + 6 notes = 7\n2 · 2 · 1 · 2 · 2 · 2 · 1',caption:'The hexagon shows the six-around-one arrangement. The numbered intervals show the unequal pitch spacing of the major scale.',steps:7,accent:C.hex,atlas:'gamma',link:'Compare with Gamma in Geometry →',workings:'<p>The seven distinct notes of C major are <code>C D E F G A B</code>. C at the centre leaves six notes on the perimeter.</p><p>The steps from one note to the next, including the return to C, are <code>2, 2, 1, 2, 2, 2, 1</code> semitones. Equal distances in the drawing represent positions in the arrangement.</p><p>Move from C major to G major and six note names remain: <code>C D E G A B</code>. F changes to F♯.</p><p>We hypothesise relationships between these musical constructions and the M9 / P24 sequences. Combining a rhythmic Beta mapping with a melodic Alpha selection leaves an explicit question: what rule maps that combination to Gamma or Epsilon? The workings remain open for that investigation.</p>'},
 tuning:{label:'TUNING & FREQUENCY',title:'A reference and a ratio',description:'Choose the reference frequency for A4. The notes move together while the interval ratios stay the same. Compare the tuning reference with a separate 528 Hz tone.',equation:'f = A4 × 2^((n − 9)/12)',caption:'Twenty milliseconds of an ideal sine wave. Reference tuning and a single tone are separate settings.',steps:8,accent:C.alpha,atlas:'alpha',link:'Explore the sequence in Geometry →',workings:'<p>The reference sets A4 to <code>432, 440 or 444 Hz</code>. Every equal-tempered note follows the same ratio rule. Here <code>n</code> is the number of semitones above C4.</p><p>Relative to A4 = 440 Hz, A4 = 432 Hz shifts every note by approximately −31.77 cents. A4 = 444 Hz shifts every note by approximately +15.67 cents. One semitone is 100 cents.</p><p>The separate 528 Hz tone is included as a named solfeggio-frequency example. A single tone does not define the tuning of a whole piece.</p><p>Changing the tuning reference preserves relative intervals. The research question is whether these stimulus settings modulate emotional and biological responses.</p>'}
};
function renderSequence(t){
 const svg=$('#sound-diagram');reset(svg,'Doubling phrase lengths and the Beta cycle','4, 8, 16, 32, 64 and 128 bars reduce modulo 9 to 4, 8, 7, 5, 1 and 2.');
 label(svg,'PHRASE LENGTH',45,42,{'text-anchor':'start','font-size':11,fill:C.muted,class:'diagram-mono'});label(svg,'MODULO 9',535,42,{'font-size':11,fill:C.muted,class:'diagram-mono'});
 circle(svg,535,280,144,C.alpha,{'stroke-width':.7});
 for(let i=0;i<9;i++){const p=polar(535,280,144,i,9),q=polar(535,280,174,i,9);circle(svg,...p,2,C.muted,{fill:C.muted});label(svg,i||9,...q,{fill:[0,3,6].includes(i)?C.muted:C.white,'font-size':18});}
 const points=residues.map(n=>polar(535,280,144,n,9));const track=line(svg,[...points,points[0]],C.beta,{'stroke-width':2});draw(track,t);
 phraseBars.forEach((bars,i)=>{const y=100+i*64,amount=clamp(t*6-i),opacity=.25+.75*amount;label(svg,String(bars),46,y,{'text-anchor':'start','font-size':17,fill:amount?C.white:C.muted});line(svg,[[94,y],[94+bars*1.65*amount,y]],C.beta,{'stroke-width':2,opacity});label(svg,'→ '+residues[i],333,y,{'font-size':15,opacity,fill:C.beta});});
 label(svg,'bars',46,493,{'text-anchor':'start','font-size':11,fill:C.muted});label(svg,'4 → 8 → 7 → 5 → 1 → 2',535,500,{'font-size':14,fill:C.beta,class:'diagram-mono'});
 if(t>0){const length=track.getTotalLength(),p=track.getPointAtLength(length*t);circle(svg,p.x,p.y,4,C.white,{fill:C.white});}
}
function renderMelody(t){
 const svg=$('#sound-diagram');reset(svg,'C major: scale degrees 1, 3, 5 and 8','A major triad with its octave, shown on a piano roll.');
 const selected=[0,2,4,7], x=60,width=75,top=210,height=170;
 label(svg,'C MAJOR',360,54,{'font-size':12,fill:C.muted,class:'diagram-mono'});
 const points=selected.map((n,i)=>[x+n*width+width/2,155-(i%2)*46]);const chord=line(svg,points,C.alpha,{'stroke-width':1.7});draw(chord,t);if(t>0&&t<1){const p=chord.getPointAtLength(chord.getTotalLength()*t);circle(svg,p.x,p.y,4,C.white,{fill:C.white});}
 names.forEach((name,i)=>{const selectIndex=selected.indexOf(i),amount=selectIndex<0?0:clamp(t*4-selectIndex);node('rect',{x:x+i*width,y:top,width:width-2,height,fill:amount?'#5ca8ff22':'#ffffff06',stroke:amount?C.alpha:C.guide,'stroke-width':1},svg);label(svg,name,x+i*width+width/2,top+height-36,{'font-size':20,fill:amount?C.white:C.muted});label(svg,String(i+1),x+i*width+width/2,top+height+36,{'font-size':17,fill:amount?C.alpha:C.muted});if(selectIndex>=0){circle(svg,...points[selectIndex],4,C.alpha,{fill:C.alpha,opacity:amount});label(svg,String(i+1),points[selectIndex][0],points[selectIndex][1]-25,{fill:C.alpha,opacity:amount,'font-size':20});}});
 for(const index of [0,1,3,4,5])node('rect',{x:x+(index+1)*width-22,y:top,width:44,height:95,fill:'#03070a',stroke:C.guide,'stroke-width':1},svg);
 label(svg,'SCALE DEGREE',360,466,{'font-size':11,fill:C.muted,class:'diagram-mono'});label(svg,'1        3        5        8',360,507,{'font-size':19,fill:C.alpha,class:'diagram-mono'});
}
function renderFifths(t){
 const svg=$('#sound-diagram');reset(svg,'Circle of fifths','Twelve equal-tempered pitch classes arranged by fifths, with the seven notes of C major highlighted.');
 const cx=360,cy=273,r=180;circle(svg,cx,cy,r,C.guide);circle(svg,cx,cy,130,C.guide,{'stroke-width':.5,'stroke-dasharray':'2 8'});
 const points=Array.from({length:13},(_,i)=>polar(cx,cy,r,i,12));const track=line(svg,points,C.gamma,{'stroke-width':1.6});draw(track,t);if(t>0&&t<1){const p=track.getPointAtLength(track.getTotalLength()*t);circle(svg,p.x,p.y,4,C.white,{fill:C.white});}
 fifths.forEach((name,i)=>{const p=polar(cx,cy,r,i,12),q=polar(cx,cy,r+36,i,12),chosen=i<=5||i===11,visible=clamp(t*12-i);circle(svg,...p,chosen?4:2,chosen?C.alpha:C.muted,{fill:chosen?C.alpha:C.muted,opacity:.3+.7*visible});label(svg,name,...q,{'font-size':name.length>3?13:19,fill:chosen?C.white:C.muted,opacity:.45+.55*visible});});
 label(svg,'C MAJOR',cx,cy-23,{'font-size':12,fill:C.alpha,class:'diagram-mono'});label(svg,'F · C · G · D · A · E · B',cx,cy+10,{'font-size':16});label(svg,'seven consecutive fifths',cx,cy+43,{'font-size':11,fill:C.muted});
 label(svg,'3 : 2  /  perfect fifth',360,535,{'font-size':12,fill:C.gamma,class:'diagram-mono'});
}
function renderScale(t){
 const svg=$('#sound-diagram');reset(svg,key+' major: six notes around the tonic','The tonic sits at the centre of a hexagon with the other six scale notes around it.');
 const cx=360,cy=260,r=170,notes=scales[key],points=Array.from({length:7},(_,i)=>polar(cx,cy,r,i,6));circle(svg,cx,cy,r,C.alpha,{'stroke-width':.6});
 for(let i=0;i<6;i++){line(svg,[[cx,cy],points[i]],C.guide,{'stroke-width':.7,'stroke-dasharray':'2 5'});label(svg,notes[i+1],...polar(cx,cy,r+33,i,6),{'font-size':23,fill:C.white,opacity:.25+.75*clamp(t*7-i)});circle(svg,...points[i],3,C.hex,{fill:C.hex,opacity:.25+.75*clamp(t*7-i)});}
 const perimeter=line(svg,points,C.hex,{'stroke-width':2});draw(perimeter,t*7/6);if(t>0&&t<6/7){const p=perimeter.getPointAtLength(perimeter.getTotalLength()*t*7/6);circle(svg,p.x,p.y,4,C.white,{fill:C.white});}const inward=line(svg,[points[0],[cx,cy]],C.white,{'stroke-width':1.5});draw(inward,t*7-6);
 circle(svg,cx,cy,54,C.hex,{'stroke-width':.8});label(svg,notes[0],cx,cy-7,{'font-size':38});label(svg,'MAJOR',cx,cy+27,{'font-size':10,fill:C.muted,class:'diagram-mono'});
 label(svg,[...notes,notes[0]].join('   '),360,495,{'font-size':19});label(svg,'2     2     1     2     2     2     1',360,530,{'font-size':13,fill:C.hex,class:'diagram-mono'});
}
function renderTuning(t){
 const svg=$('#sound-diagram');reset(svg,'Tuning reference and frequency','An A4 reference sine wave and a separate 528 Hz sine wave, followed by the equal-tempered C major scale frequencies.');
 const x0=65,x1=655,seconds=.02;
 for(const [index,hz,color,name]of [[0,reference,C.alpha,'A4 = '+reference+' Hz'],[1,tone,C.gamma,tone+' Hz tone']]){const y=144+index*150;label(svg,name,65,y-60,{'text-anchor':'start','font-size':15,fill:color});line(svg,[[x0,y],[x1,y]],C.guide);const points=Array.from({length:401},(_,n)=>[x0+(x1-x0)*n/400,y-37*Math.sin(2*Math.PI*hz*seconds*n/400)]);const wave=line(svg,points,color,{'stroke-width':1.4});draw(wave,t);label(svg,'0 ms',x0,y+62,{'text-anchor':'start','font-size':10,fill:C.muted});label(svg,'20 ms',x1,y+62,{'text-anchor':'end','font-size':10,fill:C.muted});}
 const hz=frequencies(reference);label(svg,'C MAJOR · 12-TONE EQUAL TEMPERAMENT',360,423,{'font-size':11,fill:C.muted,class:'diagram-mono'});hz.forEach((value,i)=>{const x=65+i*84;label(svg,names[i]+(i===7?'5':'4'),x,464,{'font-size':15});label(svg,round(value),x,495,{'font-size':12,fill:C.alpha,class:'diagram-mono'});});label(svg,'Hz',360,535,{'font-size':11,fill:C.muted});
}
const renderers={sequence:renderSequence,melody:renderMelody,fifths:renderFifths,scale:renderScale,tuning:renderTuning};
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function transport(){
 const play=$('#sound-play'),svg=$('#sound-diagram');let progress=1,playing=false,last=0,elapsed=0,request=0;
 const duration=()=>({sequence:3000,melody:2400,fifths:3400,scale:2800,tuning:2400}[soundView]);
 function update(){play.textContent=playing?'Ⅱ':'▷';play.setAttribute('aria-label',(playing?'Pause ':'Play ')+'sound diagram animation');play.title=playing?'Pause animation':'Play animation';play.setAttribute('aria-pressed',String(playing));svg.dataset.progress=progress.toFixed(4);svg.dataset.playing=String(playing);renderers[soundView](progress);}
 function pause(){playing=false;cancelAnimationFrame(request);request=0;last=0;update();}
 function frame(now){if(!playing)return;if(last)elapsed+=Math.min(now-last,80);last=now;const cycle=duration()+1100;if(elapsed>=cycle)elapsed%=cycle;progress=clamp(elapsed/duration());update();request=requestAnimationFrame(frame);}
 function start(replay=false){if(activeArea!=='sound'||document.hidden)return;if(replay||progress>=1){elapsed=0;progress=0;}playing=true;last=0;cancelAnimationFrame(request);update();request=requestAnimationFrame(frame);}
 function restart(){pause();elapsed=0;progress=reduced.matches?1:0;update();if(activeArea==='sound'&&!reduced.matches)start(true);}
 play.addEventListener('click',()=>playing?pause():start());$('#sound-replay').addEventListener('click',()=>start(true));
 $('#sound-svg').addEventListener('click',()=>{
 const wasPlaying=playing;pause();const current=progress;progress=1;update();
 const clone=svg.cloneNode(true);progress=current;update();if(wasPlaying)start();
 clone.setAttribute('xmlns',NS);clone.setAttribute('width','720');clone.setAttribute('height','560');
 const background=document.createElementNS(NS,'rect');background.setAttribute('width','100%');background.setAttribute('height','100%');background.setAttribute('fill','#05090c');clone.prepend(background);
 node('style',{},clone).textContent='text{font-family:Arial,Helvetica,sans-serif;dominant-baseline:central;letter-spacing:.02em}.diagram-mono{font-family:monospace;letter-spacing:.04em}';
 const blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='universal-informatics-'+soundView+'.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 return{pause,restart};
}
const soundTransport=transport();
function selectSound(view,{focus=false}={}){
 if(!descriptions[view])view='sequence';soundTransport.pause();soundView=view;const info=descriptions[view];
 for(const button of document.querySelectorAll('[data-sound-view]')){const selected=button.dataset.soundView===view;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;if(selected&&focus)button.focus();}
 $('#sound-construction').setAttribute('aria-labelledby','sound-tab-'+view);$('#area-sound').style.setProperty('--sound-accent',info.accent);$('#sound-construction').style.setProperty('--sound-accent',info.accent);
 $('#sound-view-label').textContent=info.label;$('#sound-view-title').textContent=info.title;$('#sound-view-description').textContent=info.description;$('#sound-equation').textContent=info.equation;$('#sound-caption').textContent=info.caption;$('#sound-workings>div').innerHTML=info.workings;$('#sound-workings').open=false;
 const link=$('#sound-atlas-link');link.dataset.scienceAtlas=info.atlas;link.textContent=info.link;
 $('#sound-options').replaceChildren();
 if(view==='scale'){$('#sound-options').innerHTML='<label class="atlas-field">Major scale<select id="sound-key">'+Object.keys(scales).map(name=>`<option value="${name}">${name} major</option>`).join('')+'</select></label>';$('#sound-key').value=key;$('#sound-key').addEventListener('change',e=>{key=e.target.value;soundTransport.restart();});}
 if(view==='tuning'){$('#sound-options').innerHTML='<label class="atlas-field">Tuning reference<select id="sound-reference"><option value="432">A4 = 432 Hz</option><option value="440">A4 = 440 Hz</option><option value="444">A4 = 444 Hz</option></select></label><p class="atlas-small">Comparison tone: 528 Hz</p>';$('#sound-reference').value=reference;$('#sound-reference').addEventListener('change',e=>{reference=Number(e.target.value);soundTransport.restart();});}
 soundTransport.restart();
 if(activeArea==='sound'){const url=new URL(location.href);url.searchParams.set('sound',view);history.replaceState(null,'',url);}
}
document.querySelectorAll('[data-sound-view]').forEach(button=>button.addEventListener('click',()=>selectSound(button.dataset.soundView)));
$('.sound-view-nav').addEventListener('keydown',event=>{const keys=['ArrowLeft','ArrowRight','Home','End'];if(!keys.includes(event.key))return;event.preventDefault();const views=Object.keys(descriptions),index=views.indexOf(soundView);const next=event.key==='Home'?0:event.key==='End'?views.length-1:(index+(event.key==='ArrowRight'?1:-1)+views.length)%views.length;selectSound(views[next],{focus:true});});
document.addEventListener('atlas:area',event=>{activeArea=event.detail;soundTransport.pause();if(activeArea==='sound')selectSound(new URLSearchParams(location.search).get('sound')||soundView);});
document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('page-hidden',document.hidden);if(document.hidden)soundTransport.pause();});
window.addEventListener('pagehide',()=>soundTransport.pause());
selectSound(new URLSearchParams(location.search).get('sound')||'sequence');
})();
