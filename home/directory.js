(() => {
  const film = document.querySelector('.festival-film');
  const ambientToggle = document.querySelector('.ambient-toggle');
  const fullscreenToggle = document.querySelector('.fullscreen-toggle');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = motion.matches;
  let shell = window.UniversalMindEntry;
  try {
    if (window.parent !== window && window.parent.UniversalMindEntry) shell = window.parent.UniversalMindEntry;
  } catch (_) { /* A standalone directory retains its own fullscreen control. */ }
  const syncFullscreen = () => {
    fullscreenToggle.hidden = !shell?.fullscreenSupported();
    const label = shell?.fullscreenActive() ? 'Exit fullscreen' : 'Enter fullscreen';
    fullscreenToggle.setAttribute('aria-label', label);
    fullscreenToggle.title = label;
  };
  fullscreenToggle.addEventListener('click', async () => {
    if (shell?.fullscreenActive()) await shell.exitFullscreen();
    else await shell?.requestFullscreen();
    syncFullscreen();
  });
  const fullscreenDocument = shell === window.UniversalMindEntry ? document : window.parent.document;
  fullscreenDocument.addEventListener('fullscreenchange', syncFullscreen);
  fullscreenDocument.addEventListener('webkitfullscreenchange', syncFullscreen);
  syncFullscreen();

  const syncFilm = () => {
    ambientToggle.dataset.paused = String(film.paused);
    const label = film.paused ? 'Play background video' : 'Pause background video';
    ambientToggle.setAttribute('aria-label', label);
    ambientToggle.title = label;
  };
  const playFilm = () => {
    // This decorative layer is always silent, including resumed playback.
    film.muted = true;
    film.defaultMuted = true;
    film.volume = 0;
    void film.play().catch(syncFilm);
  };
  film.muted = true;
  film.defaultMuted = true;
  film.volume = 0;
  film.src = film.dataset.src;
  film.addEventListener('loadeddata', () => { film.classList.add('is-ready'); syncFilm(); });
  film.addEventListener('play', syncFilm);
  film.addEventListener('pause', syncFilm);
  film.addEventListener('error', () => { ambientToggle.hidden = true; });
  ambientToggle.addEventListener('click', () => {
    userPaused = !film.paused;
    if (userPaused) film.pause();
    else playFilm();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) film.pause();
    else if (!userPaused) playFilm();
  });
  motion.addEventListener('change', () => {
    userPaused = motion.matches;
    if (userPaused) film.pause();
    else if (!document.hidden) playFilm();
  });
  window.addEventListener('pagehide', () => {
    film.pause();
    fullscreenDocument.removeEventListener('fullscreenchange', syncFullscreen);
    fullscreenDocument.removeEventListener('webkitfullscreenchange', syncFullscreen);
  });
  window.addEventListener('pageshow', () => {
    fullscreenDocument.addEventListener('fullscreenchange', syncFullscreen);
    fullscreenDocument.addEventListener('webkitfullscreenchange', syncFullscreen);
    syncFullscreen();
    if (!userPaused && !document.hidden) playFilm();
  });
  if (!userPaused && !document.hidden) playFilm();
  syncFilm();

  const map = document.querySelector('.route-map');
  const routes = document.querySelector('.routes');
  const flower = document.querySelector('.directory-flower');
  const destinations = [...document.querySelectorAll('[data-destination]')];
  if (!map || !routes || !flower) return;

  let frame = 0;
  const draw = () => {
    const bounds = map.getBoundingClientRect();
    const centre = flower.getBoundingClientRect();
    const x = centre.left + centre.width / 2 - bounds.left;
    const y = centre.top + centre.height / 2 - bounds.top;
    routes.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    // Keep the image's native transparency against the same black backdrop.
    const clearance = routes.querySelector('.flower-space');
    clearance.setAttribute('cx', x);
    clearance.setAttribute('cy', y);
    clearance.setAttribute('r', Math.max(centre.width, centre.height) / 2);
    const compact = window.matchMedia('(max-width: 760px)').matches;
    destinations.forEach((destination) => {
      const station = destination.querySelector('.station').getBoundingClientRect();
      const endX = station.left + station.width / 2 - bounds.left;
      const endY = station.top + station.height / 2 - bounds.top;
      const path = routes.querySelector(`[data-route="${destination.dataset.destination}"]`);
      const dx = endX - x;
      const dy = endY - y;
      const bend = endX - dx * .28;
      path.setAttribute('d', compact
        ? `M ${x} ${y} C ${x} ${y + dy * .55}, ${endX} ${y + dy * .45}, ${endX} ${endY}`
        : `M ${x} ${y} C ${x + dx * .48} ${y}, ${bend} ${y}, ${bend} ${y + dy * .5} C ${bend} ${endY}, ${endX - dx * .1} ${endY}, ${endX} ${endY}`);
    });
    routes.classList.add('is-ready');
  };
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(draw);
  };
  destinations.forEach((destination) => {
    const path = routes.querySelector(`[data-route="${destination.dataset.destination}"]`);
    const highlight = () => path.classList.toggle('is-active', destination.matches(':hover, :focus-visible') && destination.hasAttribute('href'));
    ['pointerenter', 'pointerleave', 'focus', 'blur'].forEach((event) => destination.addEventListener(event, highlight));
    destination.addEventListener('click', event => {
      if (!destination.hasAttribute('href') || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      film.pause();
    });
  });
  const observer = new ResizeObserver(schedule);
  observer.observe(map);
  destinations.forEach((destination) => observer.observe(destination));
  flower.addEventListener('load', schedule);
  document.fonts.ready.then(schedule);
  window.addEventListener('pageshow', schedule);
  schedule();
})();
