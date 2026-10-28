(() => {
  const root = document.documentElement;
  const intro = document.querySelector('h1');
  const routes = document.querySelector('.routes');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const names = ['watch', 'events', 'festivals', 'research'];
  const tracks = names.map(name => {
    const group = routes.querySelector(`[data-route="${name}"]`);
    return {
      name, group,
      path: group.querySelector('.rail-outline'),
      reveal: routes.querySelector(`[data-reveal="${name}"]`),
      train: group.querySelector('.rail-train'),
      destination: document.querySelector(`[data-destination="${name}"]`),
      length: 0
    };
  });
  const text = intro.textContent;
  intro.setAttribute('aria-label', text);
  let typedDuration = 180;
  const characters = Array.from(text, character => {
    const span = document.createElement('span');
    span.className = 'intro-character';
    span.textContent = character;
    span.setAttribute('aria-hidden', 'true');
    typedDuration += character === ' ' ? 50 : 27;
    return { span, at: typedDuration };
  });
  intro.replaceChildren(...characters.map(character => character.span));
  const routeStart = typedDuration + 380;
  const routeDuration = 980;
  const routeInterval = 1140;
  const descriptionsAt = routeStart + 3 * routeInterval + routeDuration + 220;
  const completeAt = descriptionsAt + 620;
  let elapsed = 0;
  let lastTime = 0;
  let frame = 0;
  let paused = motion.matches;
  let typedCount = -1;
  let completed = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * (3 - 2 * value);

  const updateGeometry = () => {
    tracks.forEach(track => { track.length = track.path.getTotalLength(); });
  };
  document.addEventListener('directory:routes-ready', updateGeometry);

  const type = count => {
    if (count === typedCount) return;
    characters.forEach((character, index) => {
      character.span.classList.toggle('is-visible', index < count);
      character.span.classList.toggle('is-cursor', index === count - 1 && count < characters.length);
    });
    typedCount = count;
    intro.dataset.typedCharacters = String(count);
  };

  const positionTrain = (track, progress, opacity = 1) => {
    if (!track.length || opacity <= 0) {
      track.train.setAttribute('opacity', '0');
      return;
    }
    const distance = track.length * clamp(progress);
    const point = track.path.getPointAtLength(distance);
    const before = track.path.getPointAtLength(Math.max(0, distance - 1));
    const after = track.path.getPointAtLength(Math.min(track.length, distance + 1));
    const angle = Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI;
    track.train.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle})`);
    track.train.setAttribute('opacity', String(opacity));
  };

  const render = () => {
    const count = characters.filter(character => elapsed >= character.at).length;
    type(count);
    root.dataset.story = elapsed < routeStart ? 'intro' : 'routes';
    tracks.forEach((track, index) => {
      const progress = clamp((elapsed - routeStart - index * routeInterval) / routeDuration);
      const revealed = progress >= .8;
      track.reveal.style.setProperty('--rail-offset', String(1 - ease(progress)));
      track.group.dataset.progress = progress.toFixed(3);
      track.destination.classList.toggle('is-revealed', revealed);
      positionTrain(track, ease(progress), progress > 0 && progress < 1 ? 1 : 0);
    });
    if (elapsed >= descriptionsAt) root.dataset.story = 'descriptions';
    if (elapsed >= completeAt) {
      root.dataset.story = 'complete';
      completed = true;
      // A single small train travels at a time, in the same four-route order.
      const cycle = 3500;
      const travel = 2600;
      const ambient = elapsed - completeAt;
      const activeIndex = Math.floor(ambient / cycle) % tracks.length;
      const localTime = ambient % cycle;
      tracks.forEach((track, index) => {
        const progress = clamp(localTime / travel);
        const opacity = Math.min(clamp(progress / .08), clamp((1 - progress) / .09));
        positionTrain(track, ease(progress), !paused && !motion.matches && index === activeIndex && localTime < travel ? opacity : 0);
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
    if (!paused && !document.hidden) frame = requestAnimationFrame(tick);
  };
  const finish = () => {
    elapsed = Math.max(elapsed, completeAt);
    render();
    tracks.forEach(track => track.train.setAttribute('opacity', '0'));
  };

  // Keyboard navigation and reduced motion never wait for the entrance sequence.
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
  else resume();
})();
