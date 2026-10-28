(() => {
  'use strict';
  const loop = document.getElementById('opening-loop');
  const watch = document.getElementById('watch-film');
  const view = document.getElementById('film-view');
  const mount = document.getElementById('film-mount');
  const nativeFilm = document.getElementById('native-film');
  const retryFilm = document.getElementById('film-retry');
  const useNativeFilm = Boolean(nativeFilm.canPlayType('application/vnd.apple.mpegurl'));
  const timecode = document.getElementById('film-timecode');
  const status = document.getElementById('film-status');
  const playback = document.getElementById('playback-status');
  const poster = document.querySelector('.poster');
  const flower = document.getElementById('global-nav-toggle');
  const about = document.getElementById('about-panel');
  const maximise = document.getElementById('fullscreen-toggle');
  const host = window.parent.document;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let media, loading, player, frame, returnFocus, streamLoading;
  let openingPending = false;
  if (reducedMotion) { loop.autoplay = false; loop.pause(); }

  function syncFullscreen() {
    maximise.hidden = Boolean(host.fullscreenElement || host.webkitFullscreenElement);
  }
  maximise.addEventListener('click', () => {
    const target = host.documentElement;
    const request = target.requestFullscreen || target.webkitRequestFullscreen;
    if (request) Promise.resolve(request.call(target)).catch(() => {});
  });
  host.addEventListener('fullscreenchange', syncFullscreen);
  host.addEventListener('webkitfullscreenchange', syncFullscreen);

  // Pointer interaction never inherits Safari's keyboard focus decoration.
  document.addEventListener('pointerdown', () => { document.body.dataset.input = 'pointer'; }, {passive:true});
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab') document.body.dataset.input = 'keyboard';
  });

  function loadStreamPlayer() {
    if (typeof Stream === 'function') return Promise.resolve();
    if (streamLoading) return streamLoading;
    streamLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://embed.cloudflarestream.com/embed/sdk.latest.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => { script.remove(); streamLoading = null; reject(new Error('The film player is unavailable. Please try again.')); };
      document.head.append(script);
    });
    return streamLoading;
  }

  async function getMedia() {
    if (media && media.expires * 1000 > Date.now()) return media;
    if (loading) return loading;
    loading = fetch('media.php', {credentials:'same-origin',cache:'no-store'})
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Please try again.'); media = data; return data; })
      .finally(() => { loading = null; });
    return loading;
  }
  async function startLoop({gesture = false} = {}) {
    if (reducedMotion || (!view.hidden && about.hidden) || document.hidden || (openingPending && !gesture)) return;
    openingPending = true;
    try {
      // The source is already in the HTML; no player SDK or media API is needed.
      loop.muted = true;
      loop.defaultMuted = true;
      loop.playsInline = true;
      loop.volume = 0;
      await loop.play();
      delete loop.dataset.gestureRequired;
    } catch(error) {
      if (error.name === 'NotAllowedError') loop.dataset.gestureRequired = 'true';
    } finally { openingPending = false; }
  }
  loop.addEventListener('playing', () => loop.classList.add('ready'));
  loop.addEventListener('loadeddata', () => loop.classList.add('ready'));
  if (loop.readyState >= 2) loop.classList.add('ready');
  loop.addEventListener('error', () => loop.classList.remove('ready'));
  // iOS recognises touchend/click as media gestures; pointerdown alone is insufficient.
  const retryLoopFromGesture = () => { if (loop.paused) startLoop({gesture:true}); };
  document.addEventListener('touchend', retryLoopFromGesture, {passive:true});
  document.addEventListener('click', retryLoopFromGesture);
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') retryLoopFromGesture();
  });
  loop.addEventListener('loadeddata', () => startLoop());

  function formatTime(value) {
    const seconds = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function updateTimecode() {
    if (player) timecode.textContent = `${formatTime(player.currentTime)} / ${formatTime(player.duration || 142)}`;
  }
  function syncPanels() {
    const panelOpen = !about.hidden;
    poster.inert = panelOpen || !view.hidden;
    view.inert = panelOpen;
    flower.setAttribute('aria-expanded', String(panelOpen));
    flower.setAttribute('aria-label', panelOpen ? 'Close About' : 'About');
    document.body.classList.toggle('panel-open', panelOpen);
    document.body.classList.toggle('about-open', !about.hidden);
    if (!view.hidden && about.hidden) loop.pause();
  }
  function dismissPanels() {
    about.hidden = true; syncPanels();
  }
  function returnToPoster({focus = true} = {}) {
    player?.pause(); player = null; frame?.remove(); frame = null;
    nativeFilm.hidden = true; nativeFilm.removeAttribute('src'); nativeFilm.load(); retryFilm.hidden = true;
    view.hidden = true; document.body.classList.remove('film-open');
    playback.textContent = ''; timecode.textContent = '0:00 / 2:22'; syncPanels();
    if (focus && about.hidden) watch.focus();
    startLoop();
  }
  document.getElementById('film-back').addEventListener('click', () => returnToPoster());
  flower.addEventListener('click', () => {
    if (!about.hidden) { dismissPanels(); return; }
    openAbout();
  });
  function openAbout() {
    returnFocus = document.activeElement;
    about.hidden = false; syncPanels();
    about.scrollTop = 0;
    about.querySelector('article').focus({preventScroll:true});
    startLoop();
  }
  document.getElementById('proposal-about').addEventListener('click', openAbout);
  document.getElementById('about-return').addEventListener('click', () => {
    dismissPanels();
    (returnFocus && !returnFocus.closest('[hidden]') ? returnFocus : flower).focus();
  });

  function showFilm() {
    status.textContent = ''; loop.pause(); dismissPanels(); view.hidden = false;
    document.body.classList.add('film-open'); syncPanels();
    playback.textContent = 'Loading film…'; retryFilm.hidden = true;
  }
  function playNativeFilm() {
    nativeFilm.muted = false; nativeFilm.volume = 1;
    // Keep play() in the visitor's tap handler: no fetch, SDK or iframe boundary.
    const playing = nativeFilm.play();
    Promise.resolve(playing).catch(error => {
      if (player !== nativeFilm || view.hidden) return;
      playback.textContent = error.name === 'NotAllowedError' ? '' : 'The film is temporarily unavailable. Please try again.';
      retryFilm.hidden = false;
    });
  }
  nativeFilm.addEventListener('playing', () => {
    if (player === nativeFilm) { playback.textContent = ''; retryFilm.hidden = true; }
  });
  nativeFilm.addEventListener('timeupdate', updateTimecode);
  nativeFilm.addEventListener('durationchange', updateTimecode);
  nativeFilm.addEventListener('ended', () => { if (player === nativeFilm) returnToPoster(); });
  nativeFilm.addEventListener('error', () => {
    if (player === nativeFilm) { playback.textContent = 'The film is temporarily unavailable. Please try again.'; retryFilm.hidden = false; }
  });
  nativeFilm.addEventListener('pause', () => {
    if (player === nativeFilm && !view.hidden && !nativeFilm.ended) retryFilm.hidden = false;
  });
  retryFilm.addEventListener('click', () => {
    if (player === nativeFilm) playNativeFilm();
    else if (player) Promise.resolve(player.play()).then(() => { retryFilm.hidden = true; }).catch(() => {});
  });

  watch.addEventListener('click', async () => {
    if (useNativeFilm) {
      if (!nativeFilm.dataset.hls) { status.textContent = 'The film is temporarily unavailable. Please try again.'; return; }
      showFilm(); nativeFilm.hidden = false; player = nativeFilm;
      nativeFilm.src = nativeFilm.dataset.hls;
      playNativeFilm(); flower.focus(); return;
    }
    status.textContent = 'Loading film…'; watch.disabled = true;
    try {
      const [data] = await Promise.all([getMedia(), loadStreamPlayer()]);
      showFilm();
      frame = document.createElement('iframe'); frame.id = 'film-player'; frame.title = 'athousandminds — teaser film';
      frame.allow = 'autoplay; encrypted-media; fullscreen'; frame.allowFullscreen = true; frame.tabIndex = -1;
      frame.src = `${data.film}?autoplay=true&controls=false&preload=auto&letterboxColor=black`;
      mount.replaceChildren(frame);
      const currentPlayer = Stream(frame); player = currentPlayer;
      currentPlayer.controls = false; currentPlayer.muted = false; currentPlayer.volume = 1;
      currentPlayer.addEventListener('playing', () => { if(player===currentPlayer) { playback.textContent = ''; retryFilm.hidden = true; } });
      currentPlayer.addEventListener('timeupdate', updateTimecode);
      currentPlayer.addEventListener('durationchange', updateTimecode);
      currentPlayer.addEventListener('ended', () => { if(player===currentPlayer) returnToPoster(); });
      currentPlayer.addEventListener('error', () => { if(player===currentPlayer) playback.textContent = 'The film is temporarily unavailable. Please refresh and try again.'; });
      currentPlayer.play().catch(() => {
        if (player === currentPlayer) { playback.textContent = ''; retryFilm.hidden = false; }
      });
      flower.focus();
    } catch(error) { status.textContent = error.message; }
    finally { watch.disabled = false; }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!about.hidden) { dismissPanels(); flower.focus(); }
      else if (!view.hidden) returnToPoster();
    }
    if (event.key === 'Tab' && !about.hidden) {
      const controls = [flower, ...about.querySelectorAll('button:not([tabindex="-1"]),a[href]')].filter(el => !el.hidden);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement.tagName === 'ARTICLE')) {event.preventDefault();last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
    }
  });
  document.addEventListener('visibilitychange', () => { if(document.hidden) loop.pause(); else startLoop(); });
  window.addEventListener('pageshow', () => startLoop());
  window.addEventListener('pagehide', () => {
    loop.pause(); player?.pause(); frame?.remove();
    host.removeEventListener('fullscreenchange', syncFullscreen);
    host.removeEventListener('webkitfullscreenchange', syncFullscreen);
  });
  syncFullscreen(); startLoop();
})();
