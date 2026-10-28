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

  let autoplayBlocked = false;
  let playAttempt = null;
  const syncFilm = () => {
    const needsPlay = userPaused || autoplayBlocked;
    ambientToggle.dataset.paused = String(needsPlay);
    const label = needsPlay ? 'Play background motion' : 'Pause background motion';
    ambientToggle.setAttribute('aria-label', label);
    ambientToggle.title = label;
  };
  const playFilm = () => {
    if (userPaused || document.hidden || document.body.classList.contains('is-experience-shell')) return;
    film.muted = true;
    film.defaultMuted = true;
    film.volume = 0;
    film.playsInline = true;
    if (playAttempt) return;
    try {
      playAttempt = Promise.resolve(film.play()).then(() => {
        autoplayBlocked = false;
        delete document.body.dataset.festivalMedia;
      }).catch(error => {
        if (error.name !== 'AbortError') {
          autoplayBlocked = true;
          document.body.dataset.festivalMedia = 'awaiting-play';
        }
      }).finally(() => { playAttempt = null; syncFilm(); });
    } catch (_) { autoplayBlocked = true; syncFilm(); }
  };
  film.muted = true;
  film.defaultMuted = true;
  film.volume = 0;
  film.playsInline = true;
  film.autoplay = !userPaused;
  // Keep the parser-declared source intact so Safari can start native autoplay.
  if (!film.getAttribute('src')) film.src = film.dataset.src;
  film.addEventListener('loadeddata', () => { film.classList.add('is-ready'); playFilm(); });
  film.addEventListener('canplay', playFilm);
  film.addEventListener('playing', () => { autoplayBlocked = false; film.classList.add('is-ready'); syncFilm(); });
  film.addEventListener('pause', syncFilm);
  film.addEventListener('error', () => { autoplayBlocked = true; document.body.dataset.festivalMedia = 'unavailable'; syncFilm(); });
  ambientToggle.addEventListener('click', () => {
    userPaused = autoplayBlocked ? false : !userPaused;
    autoplayBlocked = false;
    if (userPaused) film.pause();
    else playFilm();
    syncFilm();
    document.dispatchEvent(new CustomEvent('directory:motion', { detail: { paused: userPaused } }));
  });
  // iOS may defer even silent autoplay until a visitor gesture.
  document.addEventListener('pointerup', event => {
    if (event.target.closest('.ambient-toggle')) return;
    if (!userPaused && film.paused) playFilm();
  }, { passive: true });
  document.addEventListener('directory:motion', event => {
    if (event.detail.paused) film.pause();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) film.pause();
    else playFilm();
  });
  motion.addEventListener('change', () => {
    userPaused = motion.matches;
    film.autoplay = !userPaused;
    if (userPaused) film.pause();
    else playFilm();
    syncFilm();
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
    playFilm();
  });
  playFilm();
  syncFilm();

  const map = document.querySelector('.route-map');
  const routes = document.querySelector('.routes');
  const flower = document.querySelector('.directory-flower');
  const destinations = [...document.querySelectorAll('[data-destination]')];
  if (!map || !routes || !flower) return;

  let frame = 0;
  let geometry = [];
  let lastGeometryTime = -Infinity;
  // Independent branch contours, with different departure angles and inflections.
  const contours = {
    watch: [[0, 0], [.28, .02], [.52, .26], [.48, .66], [.73, .94], [1, 1]],
    events: [[0, 0], [.05, .34], [.40, .65], [.78, .62], [1, 1]],
    festivals: [[0, 0], [-.10, .26], [.16, .60], [.65, .68], [.88, .89], [1, 1]],
    research: [[0, 0], [.34, -.03], [.60, .18], [.54, .60], [.80, .87], [1, 1]]
  };
  const curve = points => {
    const coordinate = point => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    let d = `M ${coordinate(points[0])}`;
    for (let index = 0; index < points.length - 1; index++) {
      const before = points[Math.max(0, index - 1)], start = points[index];
      const end = points[index + 1], after = points[Math.min(points.length - 1, index + 2)];
      const a = { x: start.x + (end.x - before.x) / 6, y: start.y + (end.y - before.y) / 6 };
      const b = { x: end.x - (after.x - start.x) / 6, y: end.y - (after.y - start.y) / 6 };
      d += ` C ${coordinate(a)}, ${coordinate(b)}, ${coordinate(end)}`;
    }
    return d;
  };
  const animate = (time = 0, force = false) => {
    if (!force && time - lastGeometryTime < 1000 / 24) return;
    lastGeometryTime = time;
    geometry.forEach((route, routeIndex) => {
      const points = route.points.map((point, index, all) => {
        if (index === 0 || index === all.length - 1 || motion.matches) return point;
        const amplitude = Math.min(6, route.span * .018);
        return {
          x: point.x + Math.sin(time / (3800 + routeIndex * 410) + index * 1.7 + routeIndex) * amplitude,
          y: point.y + Math.sin(time / (4700 + routeIndex * 360) + index * 1.2 - routeIndex) * amplitude
        };
      });
      const d = curve(points);
      route.paths.forEach(path => path.setAttribute('d', d));
    });
  };
  const draw = () => {
    const bounds = map.getBoundingClientRect();
    const centre = flower.getBoundingClientRect();
    const x = centre.left + centre.width / 2 - bounds.left;
    const y = centre.top + centre.height / 2 - bounds.top;
    routes.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    const clearance = routes.querySelector('.flower-space');
    clearance.setAttribute('cx', x);
    clearance.setAttribute('cy', y);
    clearance.setAttribute('r', Math.max(flower.offsetWidth, flower.offsetHeight) / 2);
    geometry = destinations.map(destination => {
      const station = destination.querySelector('.station').getBoundingClientRect();
      const dx = station.left + station.width / 2 - bounds.left - x;
      const dy = station.top + station.height / 2 - bounds.top - y;
      const name = destination.dataset.destination;
      const group = routes.querySelector(`[data-route="${name}"]`);
      return {
        span: Math.hypot(dx, dy),
        points: contours[name].map(([u, v]) => ({ x: x + dx * u, y: y + dy * v })),
        paths: [group.querySelector('.rail-line'), group.querySelector('.rail-flow'), routes.querySelector(`[data-reveal="${name}"]`)]
      };
    });
    animate(0, true);
    routes.classList.add('is-ready');
    document.dispatchEvent(new Event('directory:routes-ready'));
  };
  window.UniversalMindRoutes = { animate };
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
      if (shell?.openDestination) {
        event.preventDefault();
        film.pause();
        shell.openDestination(destination.href, destination.querySelector('.destination-label').textContent);
      }
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
