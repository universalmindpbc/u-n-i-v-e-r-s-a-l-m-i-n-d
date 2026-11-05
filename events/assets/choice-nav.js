(() => {
  let shell;
  try { if (parent !== window) shell = parent.UniversalMindEntry; } catch {}
  let labFrame=null,labOpen=false;
  const isChoice=()=>Boolean(document.querySelector('.event-options'));
  const labLink=()=>document.querySelector('.event-option--lab');
  function markLabReady(){
    if(!labFrame?.contentWindow.UniversalMindLab)return;
    labLink()?.removeAttribute('aria-disabled');
    labLink()?.removeAttribute('aria-busy');
  }
  function prepareLab(){
    if(!isChoice()||labFrame)return;
    if(shell?.openDestination)window.UniversalMindEntry=shell;
    labLink().setAttribute('aria-disabled','true');
    labLink().setAttribute('aria-busy','true');
    labFrame=document.createElement('iframe');
    labFrame.className='prepared-lab';labFrame.title='Universal Mind Lab';
    labFrame.allow='autoplay; fullscreen; encrypted-media; picture-in-picture';
    labFrame.allowFullscreen=true;labFrame.inert=true;labFrame.setAttribute('aria-hidden','true');
    labFrame.addEventListener('load',markLabReady);
    labFrame.src='/lab/?prepare=1';document.body.append(labFrame);
  }
  window.addEventListener('um:lab-ready',markLabReady);
  function launchLab(href){
    if(!labFrame?.contentWindow.UniversalMindLab)return;
    labOpen=true;document.body.dataset.labOpen='true';document.body.dataset.entered='true';document.title='Universal Mind Lab';
    document.querySelectorAll('.choice-header,.choice-main').forEach(e=>e.inert=true);
    labFrame.inert=false;labFrame.removeAttribute('aria-hidden');
    // Start media in this exact click stack; navigation and fullscreen follow it.
    labFrame.contentWindow.UniversalMindLab.launch();
    if(shell?.adoptRoute){shell.adoptRoute(href);history.replaceState({labOpen:true},'',href);}
    else history.pushState({labOpen:true},'',href);
    labFrame.focus();
  }
  window.addEventListener('popstate',event=>{
    if(event.state?.umShellRoute || event.state?.umRetainedEntry)return;
    if(!labOpen||location.pathname==='/lab/')return;
    labFrame?.contentDocument.querySelectorAll('video,audio').forEach(v=>v.pause());
    labFrame?.remove();labFrame=null;labOpen=false;delete document.body.dataset.labOpen;
    delete document.body.dataset.entered;document.dispatchEvent(new Event('lab:return'));
    document.title='Events — Universal Mind';
    document.querySelectorAll('.choice-header,.choice-main').forEach(e=>e.inert=false);
    prepareLab();
  });
  // Install before the choices render so an immediate click retains the root shell.
  document.addEventListener('click', event => {
    const link = event.target.closest?.('[data-event-route]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (new URL(link.href).pathname === '/lab/' && isChoice()) {
      event.preventDefault();
      if(link.getAttribute('aria-disabled')!=='true')launchLab(link.href);
      return;
    }
    if (shell?.openDestination) {
      event.preventDefault();
      shell.openDestination(link.href, link.getAttribute('aria-label') || link.textContent.trim());
    }
  });
  const initFullscreen = () => {
  prepareLab();
  const button = document.querySelector('[data-events-fullscreen]');
  if (!button) return;
  const owner = shell?.fullscreenActive ? parent.document : document;
  const active = () => shell?.fullscreenActive ? shell.fullscreenActive() : Boolean(owner.fullscreenElement || owner.webkitFullscreenElement);
  const supported = () => shell?.fullscreenSupported ? shell.fullscreenSupported() : Boolean(owner.documentElement.requestFullscreen || owner.documentElement.webkitRequestFullscreen);
  const sync = () => {
    button.hidden = !supported();
    button.setAttribute('aria-label', active() ? 'Exit fullscreen' : 'Enter fullscreen');
  };
  button.addEventListener('click', async () => {
    try {
      if (active()) {
        if (shell?.exitFullscreen) await shell.exitFullscreen();
        else await (owner.exitFullscreen || owner.webkitExitFullscreen)?.call(owner);
      } else if (shell?.requestFullscreen) await shell.requestFullscreen();
      else await (owner.documentElement.requestFullscreen || owner.documentElement.webkitRequestFullscreen)?.call(owner.documentElement);
    } catch {}
    sync();
  });
  owner.addEventListener('fullscreenchange', sync);
  owner.addEventListener('webkitfullscreenchange', sync);
  window.addEventListener('pagehide', () => {
    owner.removeEventListener('fullscreenchange', sync);
    owner.removeEventListener('webkitfullscreenchange', sync);
  });
  sync();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initFullscreen, {once:true});
  else initFullscreen();
})();
