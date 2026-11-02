(() => {
  let shell;
  try { if (parent !== window) shell = parent.UniversalMindEntry; } catch {}
  // Install before the choices render so an immediate click retains the root shell.
  document.addEventListener('click', event => {
    const link = event.target.closest?.('[data-event-route]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (shell?.openDestination) {
      event.preventDefault();
      shell.openDestination(link.href, link.getAttribute('aria-label') || link.textContent.trim());
    }
  });
  const initFullscreen = () => {
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
