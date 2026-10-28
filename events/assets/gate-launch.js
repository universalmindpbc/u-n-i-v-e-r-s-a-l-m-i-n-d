(() => {
  const form = document.querySelector('[data-access-form]');
  const password = document.getElementById('password');
  const error = document.getElementById('gate-error');
  password.addEventListener('focus', () => { document.body.dataset.accessFocus = 'true'; });
  password.addEventListener('blur', () => { delete document.body.dataset.accessFocus; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true; error.textContent = '';
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
    } catch (problem) { error.textContent = problem.message; }
    finally { button.disabled = false; }
  });
})();
