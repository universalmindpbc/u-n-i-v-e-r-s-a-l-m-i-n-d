(() => {
  const canvas = document.querySelector('[data-directory-rain]');
  const context = canvas?.getContext('2d');
  if (!context) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  // The same glyph vocabulary and pearl tones as the landing page.
  const abstractGlyphs = ['0','1','2','3','7','<','>','[',']','=','+','*','·','⋮','⋯','⌁','⌇','⌗','△','▽','◇','◊','⟡','┆','┊','╱','╲','╳','⌞','⌜','⌟','⌝'];
  const signatureGlyphs = ['V','V','V','V','I','A','M'];
  const pearlTones = [[255,245,237],[255,224,236],[232,226,255]];
  const random = (a,b) => a + Math.random() * (b-a);
  const pick = items => items[Math.floor(Math.random()*items.length)];
  const glyph = () => {
    const character = Math.random()<.18 ? pick(signatureGlyphs) : pick(abstractGlyphs);
    const anomaly = (character==='V' && Math.random()<.22) || Math.random()<.026;
    return {character, editorial:Math.random()<.17, tone:anomaly?pick(pearlTones):[255,255,255]};
  };
  let width=0,height=0,cell=23,columns=[],exclusions=[],frame=0,lastTime=0,paused=motion.matches;
  const resetColumn = column => {
    column.headY=random(-cell*5,-cell);
    column.speed=random(66,152);
    column.opacity=random(.7,1);
    column.length=Math.round(random(18,36));
    column.advance=0;
    column.glyphs=Array.from({length:column.length},glyph);
  };
  const measure = () => {
    exclusions=[...document.querySelectorAll('h1,.destination-copy,.directory-flower')].map(el=>{
      const rect=el.getBoundingClientRect();
      return {left:rect.left-12,right:rect.right+12,top:rect.top-12,bottom:rect.bottom+12};
    });
  };
  const rebuild = () => {
    width=innerWidth;height=innerHeight;cell=width<520?18:width<980?21:23;
    const ratio=Math.min(devicePixelRatio||1,1.75);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    context.setTransform(ratio,0,0,ratio,0,0);
    const fullCount=Math.ceil(width/cell)+1;
    const count=Math.max(1,Math.round(fullCount*.1));
    columns=Array.from({length:count},(_,index)=>{
      const column={x:(index+random(.2,.8))*width/count};resetColumn(column);
      column.headY=random(cell,height+(column.length-2)*cell);return column;
    });
    canvas.dataset.rainColumns=String(count);
    canvas.dataset.landingColumns=String(fullCount);
    canvas.dataset.rainDensity='0.1';canvas.dataset.rainAnomalies='pearl-blush';
    measure();
  };
  const draw = delta => {
    context.clearRect(0,0,width,height);context.textAlign='center';context.textBaseline='middle';
    columns.forEach(column=>{
      column.headY+=column.speed*delta;column.advance+=column.speed*delta;
      while(column.advance>=cell){column.advance-=cell;column.glyphs.unshift(glyph());column.glyphs.pop();}
      for(let index=column.length-1;index>=0;index--){
        const y=column.headY-index*cell;
        if(y<0||y>height||exclusions.some(r=>column.x>r.left&&column.x<r.right&&y>r.top&&y<r.bottom))continue;
        const item=column.glyphs[index],alpha=Math.max(.035,Math.pow(1-index/Math.max(1,column.length-1),1.42)*column.opacity);
        context.font=item.character==='V'&&item.editorial?`${Math.round(cell*1.06)}px Didot, "Bodoni 72", serif`:`${Math.round(cell*.86)}px "SFMono-Regular", Menlo, Consolas, monospace`;
        context.fillStyle=`rgba(${item.tone.join(',')},${index===0?Math.min(1,alpha+.22):alpha})`;
        context.fillText(item.character,column.x,y);
      }
      if(column.headY-column.length*cell>height)resetColumn(column);
    });
  };
  const tick = time => {
    frame=0;
    if(paused||document.hidden||document.body.classList.contains('is-experience-shell')){canvas.dataset.rainStatus='paused';lastTime=0;return;}
    if(!lastTime||time-lastTime>=1000/30){draw(lastTime?Math.min((time-lastTime)/1000,.08):0);lastTime=time;}
    frame=requestAnimationFrame(tick);
  };
  const start = () => {
    cancelAnimationFrame(frame);lastTime=0;
    const stop=paused||document.hidden||document.body.classList.contains('is-experience-shell');
    canvas.dataset.rainStatus=stop?'paused':'running';
    if(!stop)frame=requestAnimationFrame(tick);
    else if(motion.matches){draw(0);canvas.dataset.rainStatus='static';}
  };
  document.addEventListener('directory:motion',event=>{paused=event.detail.paused;start();});
  document.addEventListener('directory:routes-ready',measure);
  document.addEventListener('visibilitychange',start);
  motion.addEventListener('change',()=>{paused=motion.matches;start();});
  window.addEventListener('resize',()=>{rebuild();start();},{passive:true});
  window.addEventListener('pagehide',()=>cancelAnimationFrame(frame));
  window.addEventListener('pageshow',start);
  rebuild();start();
})();
