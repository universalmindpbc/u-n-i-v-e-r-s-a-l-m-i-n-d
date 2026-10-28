(() => {
  const form = document.querySelector('[data-access-form]');
  const password = document.getElementById('password');
  const error = document.getElementById('gate-error');
  password.addEventListener('focus', () => { document.body.dataset.accessFocus = 'true'; });
  password.addEventListener('blur', () => { delete document.body.dataset.accessFocus; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    error.textContent = '';
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
      await fullscreen;
      if (enteredFullscreen) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) await Promise.resolve(exit.call(document)).catch(() => {});
      }
      error.textContent = problem.message;
    } finally { button.disabled = false; }
  });
})();
