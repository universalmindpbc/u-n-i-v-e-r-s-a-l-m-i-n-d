(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const experience=$('experience'), background=$('opening-loop'), film=$('film-view'), about=$('about-panel');
  const motion=$('motion-toggle'), reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused=reduced.matches, player=null, playerFrame=null, playerTimer=0, loadGeneration=0;
  let filmOpener=null, aboutOpener=null, loading=false, sdkPromise=null, seeking=false;
  const format=time=>`${Math.floor(Math.max(0,time||0)/60)}:${String(Math.floor(Math.max(0,time||0)%60)).padStart(2,'0')}`;
  function syncMotion(){
    const stop=motionPaused||!film.hidden||document.hidden||!about.hidden;
    document.body.dataset.motion=stop?'paused':'running';
    window.HappinessNetwork?.setPaused(stop);
    motion.setAttribute('aria-pressed',String(motionPaused));
    motion.setAttribute('aria-label',motionPaused?'Resume animation':'Pause animation');
    motion.querySelector('.motion-text').textContent=motionPaused?'Resume animation':'Pause animation';
    motion.querySelector('.motion-symbol').textContent=motionPaused?'▷':'Ⅱ';
    background.muted=true;background.defaultMuted=true;background.volume=0;
    if(stop){background.pause();return;}
    if(!background.getAttribute('src')) background.src=background.dataset.src;
    background.play().catch(()=>{});
  }
  background.addEventListener('playing',()=>background.classList.add('is-ready'));
  motion.addEventListener('click',()=>{motionPaused=!motionPaused;syncMotion();});
  reduced.addEventListener('change',event=>{motionPaused=event.matches;syncMotion();});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&player){player.pause();updateTransport();}
    syncMotion();
  });

  // Curved paths are positioned from the actual responsive elements.
  function drawConnections(){
    const root=$('ecosystem').getBoundingClientRect();
    const rect=id=>{const r=$(id).getBoundingClientRect();return {x:r.left-root.left,y:r.top-root.top,w:r.width,h:r.height};};
    const watch=rect('watch-anchor'), field=rect('network-field'), control=rect('control-anchor');
    const group=$('connection-paths');group.replaceChildren();
    $('connections').setAttribute('viewBox',`0 0 ${root.width} ${root.height}`);
    const mobile=innerWidth<=800;
    const path=(d,kind='')=>{
      for(const pulse of [false,true]){
        const p=document.createElementNS('http://www.w3.org/2000/svg','path');
        p.setAttribute('d',d);p.setAttribute('class',`connection-line ${kind} ${pulse?'connection-pulse':''}`);
        group.append(p);
      }
    };
    if(!mobile){
      const a={x:watch.x+watch.w,y:watch.y+watch.h*.5}, b={x:field.x+field.w*.13,y:field.y+field.h*.48};
      path(`M${a.x} ${a.y} C${a.x+70} ${a.y} ${b.x-80} ${b.y} ${b.x} ${b.y}`);
      const x=field.x+field.w*.87,y=field.y+field.h*.46;
      path(`M${x} ${y} C${x+60} ${y} ${control.x-65} ${control.y+50} ${control.x} ${control.y+50}`);
      path(`M${field.x+field.w*.2} ${field.y+field.h*.72} C${field.x-35} ${field.y+field.h*.93} ${watch.x-35} ${watch.y+watch.h+90} ${watch.x+watch.w*.3} ${watch.y+watch.h-12}`,'connection-return');
    } else {
      path(`M${watch.x+watch.w/2} ${watch.y+watch.h} C${watch.x+watch.w/2} ${field.y+30} ${field.x+field.w*.4} ${field.y+25} ${field.x+field.w*.4} ${field.y+field.h*.13}`);
      path(`M${field.x+field.w*.6} ${field.y+field.h*.86} C${field.x+field.w*.6} ${control.y-30} ${control.x+control.w*.65} ${control.y-40} ${control.x+control.w*.65} ${control.y}`);
      path(`M${field.x+field.w*.18} ${field.y+field.h*.65} C${field.x-20} ${field.y+field.h*.5} ${watch.x-36} ${watch.y+watch.h+30} ${watch.x+watch.w*.1} ${watch.y+watch.h*.6}`,'connection-return');
    }
    const ports=[...document.querySelectorAll('.response-port')].map(el=>{const r=el.getBoundingClientRect();return {x:r.left-root.left+r.width/2,y:r.top-root.top+r.height/2};});
    const from={x:control.x+control.w*.65,y:control.y+control.h};
    ports.forEach(port=>path(`M${from.x} ${from.y} C${from.x} ${port.y-30} ${port.x} ${port.y-36} ${port.x} ${port.y}`));
  }
  let connectionFrame=0;
  const scheduleConnections=()=>{cancelAnimationFrame(connectionFrame);connectionFrame=requestAnimationFrame(drawConnections);};
  const resizeObserver=new ResizeObserver(scheduleConnections);resizeObserver.observe($('ecosystem'));
  window.addEventListener('resize',scheduleConnections,{passive:true});
  document.querySelectorAll('[data-detail]').forEach(button=>{
    button.setAttribute('aria-pressed','false');
    button.addEventListener('click',()=>{
      const active=button.getAttribute('aria-pressed')==='true';
      document.querySelectorAll('[data-detail]').forEach(item=>item.setAttribute('aria-pressed','false'));
      button.setAttribute('aria-pressed',String(!active));
      $('system-detail').textContent=active?'':`${button.dataset.detail} — ${button.dataset.description}`;
    });
  });

  function syncInert(){experience.inert=!film.hidden||!about.hidden;film.inert=!about.hidden;}
  function openAbout(opener){
    aboutOpener=opener;about.hidden=false;$('global-nav-toggle').setAttribute('aria-expanded','true');
    syncInert();syncMotion();$('about-close').focus();
  }
  function closeAbout(){
    about.hidden=true;$('global-nav-toggle').setAttribute('aria-expanded','false');syncInert();syncMotion();aboutOpener?.focus();
  }
  $('global-nav-toggle').addEventListener('click',event=>openAbout(event.currentTarget));
  document.querySelectorAll('[data-open-about]').forEach(button=>button.addEventListener('click',()=>openAbout(button)));
  $('about-close').addEventListener('click',closeAbout);$('about-return').addEventListener('click',closeAbout);
  about.addEventListener('click',event=>{if(event.target===about)closeAbout();});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      if(!about.hidden){event.preventDefault();closeAbout();}
      else if(!film.hidden){event.preventDefault();closeFilm();}
    }
    if(event.key==='Tab'&&!about.hidden){
      const items=[...about.querySelectorAll('button,a[href],input,[tabindex="0"]')];
      const first=items[0],last=items.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });

  function loadSDK(){
    if(window.Stream)return Promise.resolve();
    if(sdkPromise)return sdkPromise;
    sdkPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='https://embed.cloudflarestream.com/embed/sdk.latest.js';
      const timeout=setTimeout(()=>{script.remove();sdkPromise=null;reject(new Error('The player is taking too long to load. Please try again.'));},18000);
      script.onload=()=>{clearTimeout(timeout);if(window.Stream)resolve();else{sdkPromise=null;reject(new Error('The player is unavailable. Please try again.'));}};
      script.onerror=()=>{clearTimeout(timeout);script.remove();sdkPromise=null;reject(new Error('The player is unavailable. Please try again.'));};document.head.append(script);
    });return sdkPromise;
  }
  function updateTransport(){
    if(!player)return;
    const duration=Number(player.duration)||355,time=Number(player.currentTime)||0;
    $('film-timecode').value=`${format(time)} / ${format(duration)}`;
    $('film-seek').max=String(duration);if(!seeking)$('film-seek').value=String(time);
    const paused=Boolean(player.paused);
    $('film-pause').textContent=paused?'▶':'Ⅱ';$('film-pause').setAttribute('aria-label',paused?'Play presentation':'Pause presentation');
    const muted=Boolean(player.muted);
    $('film-sound').textContent=muted?'Sound off':'Sound on';$('film-sound').setAttribute('aria-label',muted?'Unmute presentation':'Mute presentation');
    film.dataset.playback=paused?'paused':'playing';film.dataset.currentTime=String(time);
  }
  async function openFilm(start,opener){
    if(loading||!film.hidden)return;
    const generation=++loadGeneration;loading=true;filmOpener=opener;
    $('film-status').textContent='';film.hidden=false;syncInert();syncMotion();
    $('playback-status').textContent='Loading presentation…';$('film-back').focus();
    film.dataset.playback='loading';
    try{
      const [response]=await Promise.all([fetch('media.php',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(18000)}),loadSDK()]);
      const media=await response.json();
      if(!response.ok)throw new Error(media.error||'Please refresh and enter your invitation password.');
      if(generation!==loadGeneration)return;
      const url=new URL(media.film);url.searchParams.set('autoplay','true');url.searchParams.set('controls','false');url.searchParams.set('preload','auto');url.searchParams.set('startTime',`${start}s`);
      const iframe=document.createElement('iframe');iframe.title='Happiness — full presentation';iframe.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';iframe.allowFullscreen=true;iframe.src=url.href;iframe.tabIndex=-1;
      playerFrame=iframe;$('film-mount').replaceChildren(iframe);player=window.Stream(iframe);
      player.volume=1;player.muted=false;
      const ready=()=>{if(generation!==loadGeneration)return;$('playback-status').textContent='';updateTransport();};
      player.addEventListener('playing',ready);
      let playbackAttempted=false;
      player.addEventListener('canplay',()=>{
        if(generation!==loadGeneration||playbackAttempted)return;
        playbackAttempted=true;
        Promise.resolve(player.play()).catch(()=>{if(generation===loadGeneration){$('playback-status').textContent='Press Play to begin the presentation.';updateTransport();}});
      });
      player.addEventListener('play',updateTransport);player.addEventListener('pause',updateTransport);
      player.addEventListener('timeupdate',()=>{if(Number(player?.currentTime)>0)ready();});
      player.addEventListener('waiting',()=>{if(generation===loadGeneration)$('playback-status').textContent='Buffering…';});
      player.addEventListener('ended',()=>{$('playback-status').textContent='Presentation complete';updateTransport();});
      player.addEventListener('error',()=>{if(generation===loadGeneration)$('playback-status').textContent='The presentation is unavailable. Use Back to try again.';});
      let seekApplied=false;
      player.addEventListener('loadedmetadata',()=>{if(generation===loadGeneration&&!seekApplied&&start){seekApplied=true;player.currentTime=start;}});
      playerTimer=setInterval(updateTransport,350);
    }catch(error){
      if(generation!==loadGeneration)return;
      closeFilm();$('film-status').textContent=error.name==='TimeoutError'?'The presentation is taking too long to load. Please try again.':error.message;
    }finally{if(generation===loadGeneration)loading=false;}
  }
  function closeFilm(){
    ++loadGeneration;loading=false;clearInterval(playerTimer);
    if(player){try{player.pause();}catch{}}
    player=null;playerFrame?.remove();playerFrame=null;$('film-mount').replaceChildren();film.hidden=true;delete film.dataset.playback;
    $('playback-status').textContent='';$('film-timecode').value='0:00 / 5:55';$('film-seek').value='0';
    syncInert();syncMotion();filmOpener?.focus();
  }
  document.querySelectorAll('[data-film-start]').forEach(button=>button.addEventListener('click',()=>openFilm(Number(button.dataset.filmStart),button)));
  $('film-back').addEventListener('click',closeFilm);
  $('film-pause').addEventListener('click',()=>{if(player){if(player.paused)Promise.resolve(player.play()).catch(()=>{$('playback-status').textContent='Playback is unavailable. Use Back to try again.';});else player.pause();updateTransport();}});
  $('film-sound').addEventListener('click',()=>{if(player){player.muted=!player.muted;updateTransport();}});
  $('film-seek').addEventListener('input',()=>{seeking=true;$('film-timecode').value=`${format(Number($('film-seek').value))} / ${format(Number($('film-seek').max))}`;});
  $('film-seek').addEventListener('change',()=>{if(player)player.currentTime=Number($('film-seek').value);seeking=false;});
  $('film-seek').addEventListener('blur',()=>{seeking=false;});

  function fullscreenDocument(){try{return parent.document;}catch{return document;}}
  function syncFullscreen(){
    const doc=fullscreenDocument(),active=Boolean(doc.fullscreenElement||doc.webkitFullscreenElement);
    $('fullscreen-toggle').setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');$('fullscreen-toggle').title=active?'Exit fullscreen':'Enter fullscreen';
  }
  $('fullscreen-toggle').addEventListener('click',async()=>{
    const doc=fullscreenDocument();
    try{if(doc.fullscreenElement||doc.webkitFullscreenElement)await(doc.exitFullscreen||doc.webkitExitFullscreen).call(doc);
    else await(doc.documentElement.requestFullscreen||doc.documentElement.webkitRequestFullscreen)?.call(doc.documentElement);}catch{}
    syncFullscreen();
  });
  fullscreenDocument().addEventListener('fullscreenchange',syncFullscreen);fullscreenDocument().addEventListener('webkitfullscreenchange',syncFullscreen);
  window.addEventListener('pagehide',()=>{background.pause();if(player)player.pause();clearInterval(playerTimer);cancelAnimationFrame(connectionFrame);resizeObserver.disconnect();});
  window.addEventListener('pageshow',()=>{resizeObserver.observe($('ecosystem'));scheduleConnections();syncMotion();});
  scheduleConnections();syncMotion();syncFullscreen();
})();
