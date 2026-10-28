(() => {
  'use strict';
  const loop = document.getElementById('opening-loop');
  const watch = document.getElementById('watch-film');
  const view = document.getElementById('film-view');
  const frame = document.getElementById('film-player');
  const close = document.getElementById('close-film');
  const motion = document.getElementById('motion-toggle');
  const status = document.getElementById('film-status');
  const playback = document.getElementById('playback-status');
  const poster = document.querySelector('.poster');
  let media, loading, player;
  let soundEnabled = true;
  const sound = document.getElementById('sound-toggle');
  function soundLabel() { sound.textContent = soundEnabled ? 'Sound on' : 'Sound off'; sound.setAttribute('aria-label', soundEnabled ? 'Mute sound' : 'Enable sound'); }
  sound.addEventListener('click', () => { soundEnabled = !soundEnabled; loop.muted = !soundEnabled; soundLabel(); if(motionEnabled) loop.play().catch(() => {}); });
  document.getElementById('fullscreen-toggle').addEventListener('click', () => {
    const host = window.parent.document;
    if(host.fullscreenElement) host.exitFullscreen?.(); else host.documentElement.requestFullscreen?.().catch(() => {});
  });
  let motionEnabled = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  function motionLabel() {
    motion.textContent = motionEnabled ? 'Pause motion' : 'Resume motion';
    motion.setAttribute('aria-label', motionEnabled ? 'Pause background motion' : 'Resume background motion');
  }
  async function getMedia() {
    if (media && media.expires * 1000 > Date.now()) return media;
    if (loading) return loading;
    loading = fetch('media.php', {credentials:'same-origin',cache:'no-store'})
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Please try again.'); media = data; return data; })
      .finally(() => { loading = null; });
    return loading;
  }
  async function startLoop() {
    if (!motionEnabled || !view.hidden || document.hidden) return;
    try {
      const data = await getMedia();
      if (!loop.src || loop.dataset.expires !== String(data.expires)) {
        loop.src = data.loop; loop.dataset.expires = String(data.expires);
      }
      loop.muted = !soundEnabled;
      try { await loop.play(); } catch(error) {
        if(error.name !== 'NotAllowedError') throw error;
        soundEnabled = false; loop.muted = true; soundLabel(); sound.textContent = 'Enable sound'; await loop.play();
      }
    } catch { /* The still poster remains available when autoplay or delivery is unavailable. */ }
  }
  loop.addEventListener('playing', () => loop.classList.add('ready'));
  loop.addEventListener('error', () => { loop.classList.remove('ready'); motionEnabled = false; motionLabel(); });
  motion.addEventListener('click', () => { motionEnabled = !motionEnabled; motionLabel(); if(motionEnabled) startLoop(); else loop.pause(); });
  function closeFilm() {
    player?.pause(); player = null; frame.removeAttribute('src');
    view.hidden = true; poster.inert = false; document.body.classList.remove('film-open');
    playback.textContent = ''; watch.focus(); startLoop();
  }
  watch.addEventListener('click', async () => {
    status.textContent = ''; watch.disabled = true;
    try {
      const data = await getMedia();
      loop.pause(); view.hidden = false; poster.inert = true; document.body.classList.add('film-open');
      playback.textContent = 'Loading film…';
      frame.src = `${data.film}?autoplay=true&controls=true&preload=auto&letterboxColor=black`;
      player = Stream(frame);
      player.addEventListener('playing', () => { playback.textContent = ''; });
      player.addEventListener('ended', closeFilm);
      player.addEventListener('error', () => { playback.textContent = 'Playback paused. Close the film and try again.'; });
      close.focus();
    } catch(error) { status.textContent = error.message; }
    finally { watch.disabled = false; }
  });
  close.addEventListener('click', closeFilm);
  document.addEventListener('keydown', event => {
    if (view.hidden) return;
    if (event.key === 'Escape') closeFilm();
    if (event.key === 'Tab' && event.shiftKey && document.activeElement === close) { event.preventDefault(); frame.focus(); }
  });
  document.addEventListener('visibilitychange', () => { if(document.hidden) loop.pause(); else startLoop(); });
  window.addEventListener('pagehide', () => { loop.pause(); player?.pause(); frame.removeAttribute('src'); });
  soundLabel(); motionLabel(); startLoop();
})();
