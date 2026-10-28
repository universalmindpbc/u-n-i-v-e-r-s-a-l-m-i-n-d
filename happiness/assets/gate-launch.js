(() => {
  const form = document.querySelector('[data-access-form]');
  const password = document.getElementById('password');
  const error = document.getElementById('gate-error');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let retainedFilm = null;
  const getBackgroundFilm = () => retainedFilm;
  const setBackgroundVisible = visible => {
    const show = Boolean(visible && retainedFilm && !reduced.matches);
    document.body.dataset.backgroundVisible = String(show);
    if (!show) retainedFilm?.pause();
  };
  window.UniversalMindEntry = {getBackgroundFilm, setBackgroundVisible};
  const startEntryBackground = () => {
    if (reduced.matches) return;
    if (!retainedFilm) {
      retainedFilm = document.createElement('video');
      retainedFilm.className = 'happiness-entry-background';
      retainedFilm.src = '/home/assets/festival-loop.mp4?v=silent-1';
      retainedFilm.setAttribute('muted', '');
      retainedFilm.setAttribute('playsinline', '');
      retainedFilm.setAttribute('webkit-playsinline', '');
      retainedFilm.setAttribute('aria-hidden', 'true');
      retainedFilm.loop = true; retainedFilm.controls = false;
      retainedFilm.playsInline = true; retainedFilm.preload = 'auto';
      retainedFilm.disablePictureInPicture = true;
      retainedFilm.disableRemotePlayback = true;
      document.body.prepend(retainedFilm);
    }
    delete document.body.dataset.backgroundVisible;
    retainedFilm.muted = true; retainedFilm.defaultMuted = true; retainedFilm.volume = 0;
    // Keep the same element after authentication. This exact submit action
    // grants playback before any asynchronous request or iframe navigation.
    try { Promise.resolve(retainedFilm.play()).catch(() => {}); } catch (_) {}
  };
  window.addEventListener('pagehide', () => retainedFilm?.pause());
  password.addEventListener('focus', () => { document.body.dataset.accessFocus = 'true'; });
  password.addEventListener('blur', () => { delete document.body.dataset.accessFocus; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    error.textContent = '';
    startEntryBackground();
    // Fullscreen is requested directly from this explicit visitor gesture.
    const request = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
    let enteredFullscreen = false;
    let fullscreen = Promise.resolve();
    try {
      if (request) fullscreen = Promise.resolve(request.call(document.documentElement)).then(() => { enteredFullscreen = true; }).catch(() => {});
    } catch {}
    try {
      const response = await fetch('/happiness/', {method:'POST', body:new FormData(form), credentials:'same-origin', headers:{Accept:'application/json'}});
      const result = await response.json();
      if (!response.ok || !result.granted) throw new Error(result.error || 'Please check your invitation password.');
      await fullscreen;
      document.body.dataset.accessState = 'granted';
      document.dispatchEvent(new Event('um:access-granted'));
      const stage = document.createElement('iframe');
      stage.className = 'events-stage';
      stage.title = 'Happiness';
      stage.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
      stage.allowFullscreen = true;
      stage.src = '/happiness/?experience=1';
      document.body.append(stage);
      form.closest('main').inert = true;
      password.value = '';
    } catch (problem) {
      setBackgroundVisible(false);
      await fullscreen;
      if (enteredFullscreen) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) await Promise.resolve(exit.call(document)).catch(() => {});
      }
      error.textContent = problem.message;
    } finally { button.disabled = false; }
  });
})();
