(() => {
  const root = document.documentElement;
  const intro = document.querySelector('h1');
  const languages = [...intro.querySelectorAll('.intro-language')];
  const routes = document.querySelector('.routes');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tracks = ['watch', 'events', 'festivals', 'research'].map(name => {
    const group = routes.querySelector(`[data-route="${name}"]`);
    return {
      group,
      reveal: routes.querySelector(`[data-reveal="${name}"]`),
      flow: group.querySelector('.rail-flow'),
      destination: document.querySelector(`[data-destination="${name}"]`)
    };
  });
  const routeStart = 3600;
  const routeDuration = 2100;
  const routeInterval = 3000;
  const descriptionsAt = routeStart + 3 * routeInterval + routeDuration + 700;
  const completeAt = descriptionsAt + 1400;
  let elapsed = 0;
  let lastTime = 0;
  let frame = 0;
  let paused = motion.matches;
  let skipEntrance = false;
  let completed = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * (3 - 2 * value);

  const languageFade = () => {
    const period = 9800;
    const index = motion.matches ? 0 : Math.floor(elapsed / period) % languages.length;
    const localTime = elapsed % period;
    const opacity = motion.matches ? 1 : ease(Math.min(clamp(localTime / 1800), clamp((period - localTime) / 1800)));
    languages.forEach((language, i) => { language.style.opacity = i === index ? String(opacity) : '0'; });
    intro.dataset.language = languages[index].lang;
  };
  const flow = (track, head, opacity) => {
    track.flow.setAttribute('stroke-dashoffset', String(.22 - head));
    track.flow.setAttribute('opacity', String(opacity));
  };
  const render = () => {
    languageFade();
    const time = skipEntrance ? Math.max(elapsed, completeAt) : elapsed;
    root.dataset.story = time < routeStart ? 'intro' : 'routes';
    tracks.forEach((track, index) => {
      const progress = clamp((time - routeStart - index * routeInterval) / routeDuration);
      track.reveal.style.setProperty('--rail-offset', String(1 - ease(progress)));
      track.group.dataset.progress = progress.toFixed(3);
      track.destination.classList.toggle('is-revealed', progress >= .72);
      flow(track, ease(progress), progress > 0 && progress < 1 ? clamp((1 - progress) / .15) : 0);
    });
    if (time >= descriptionsAt) root.dataset.story = 'descriptions';
    if (time >= completeAt) {
      root.dataset.story = 'complete';
      completed = true;
      // A broad light segment travels continuously through the four paths in order.
      const cycle = 4800;
      const ambient = skipEntrance ? elapsed : elapsed - completeAt;
      const active = Math.floor(ambient / cycle) % tracks.length;
      const progress = (ambient % cycle) / cycle;
      tracks.forEach((track, index) => {
        flow(track, progress * 1.22, !motion.matches && index === active ? 1 : 0);
      });
    }
  };
  const tick = time => {
    frame = 0;
    if (paused || document.hidden) { lastTime = 0; return; }
    if (!routes.classList.contains('is-ready')) { frame = requestAnimationFrame(tick); return; }
    if (lastTime) elapsed += Math.min(100, time - lastTime);
    lastTime = time;
    render();
    frame = requestAnimationFrame(tick);
  };
  const resume = () => {
    cancelAnimationFrame(frame);
    lastTime = 0;
    root.dataset.motion = paused || document.hidden ? 'paused' : 'playing';
    if (!paused && !document.hidden) frame = requestAnimationFrame(tick);
  };
  const finish = () => {
    skipEntrance = true;
    render();
  };
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' && !completed) finish();
  }, { capture: true });
  document.addEventListener('directory:motion', event => {
    paused = event.detail.paused;
    resume();
  });
  motion.addEventListener('change', () => {
    paused = motion.matches;
    if (paused) finish();
    resume();
  });
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); lastTime = 0; });
  window.addEventListener('pageshow', resume);
  root.dataset.story = 'intro';
  tracks.forEach(track => track.reveal.style.setProperty('--rail-offset', '1'));
  if (motion.matches) finish();
  resume();
})();
