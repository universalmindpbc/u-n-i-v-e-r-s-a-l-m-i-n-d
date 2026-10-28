(() => {
  const form = document.querySelector('[data-access-form]');
  const password = document.getElementById('password');
  const error = document.getElementById('gate-error');
  let backgroundFilm = null;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const setBackgroundVisible = visible => {
    document.body.dataset.backgroundVisible = String(Boolean(visible && backgroundFilm && !reducedMotion.matches));
    if (!visible) backgroundFilm?.pause();
  };
  window.UniversalMindEntry = {getBackgroundFilm: () => backgroundFilm, setBackgroundVisible};
  function startEntryBackground() {
    if (reducedMotion.matches) return;
    if (!backgroundFilm) {
      backgroundFilm = document.createElement('video');
      backgroundFilm.className = 'events-entry-background';
      // A tiny black clip grants playback without exposing private event imagery.
      backgroundFilm.src = '/events/assets/entry-primer.mp4?v=1';
      backgroundFilm.setAttribute('muted', '');
      backgroundFilm.setAttribute('playsinline', '');
      backgroundFilm.setAttribute('webkit-playsinline', '');
      backgroundFilm.setAttribute('aria-hidden', 'true');
      backgroundFilm.loop = true; backgroundFilm.controls = false;
      backgroundFilm.playsInline = true; backgroundFilm.preload = 'auto';
      backgroundFilm.disablePictureInPicture = true; backgroundFilm.disableRemotePlayback = true;
      document.body.prepend(backgroundFilm);
    }
    delete document.body.dataset.backgroundVisible;
    backgroundFilm.muted = true; backgroundFilm.defaultMuted = true; backgroundFilm.volume = 0;
    // Invoke directly in Enter, before authentication or child navigation.
    try { Promise.resolve(backgroundFilm.play()).catch(() => {}); } catch {}
  }
  window.addEventListener('pagehide', () => backgroundFilm?.pause());
  password.addEventListener('focus', () => { document.body.dataset.accessFocus = 'true'; });
  password.addEventListener('blur', () => { delete document.body.dataset.accessFocus; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true; error.textContent = '';
    startEntryBackground();
    try {
      const response = await fetch('/events/', {method:'POST',body:new FormData(form),credentials:'same-origin',headers:{Accept:'application/json'}});
      const result = await response.json();
      if(!response.ok || !result.granted) throw new Error(result.error || 'Please check your invitation password.');
      // Keep mobile in the browser; the film has its own native fullscreen control.
      if (!matchMedia('(max-width: 700px), (pointer: coarse)').matches) {
        await document.documentElement.requestFullscreen?.().catch(() => {});
      }
      document.body.dataset.accessState = 'granted';
      document.dispatchEvent(new Event('um:access-granted'));
      const stage = document.createElement('iframe');
      stage.className = 'events-stage'; stage.title = 'A Thousand Minds';
      stage.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
      stage.src = '/events/?experience=1';
      document.body.append(stage);
      form.closest('main').inert = true;
      password.value = '';
    } catch (problem) { setBackgroundVisible(false); error.textContent = problem.message; }
    finally { button.disabled = false; }
  });
})();
