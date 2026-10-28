(() => {
  let frame = null;
  let directoryFilm = null;
  const beginDirectoryPlayback = () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!directoryFilm) {
      directoryFilm = document.createElement('video');
      directoryFilm.className = 'um-directory-film';
      directoryFilm.muted = true;
      directoryFilm.defaultMuted = true;
      directoryFilm.volume = 0;
      directoryFilm.playsInline = true;
      directoryFilm.setAttribute('playsinline', '');
      directoryFilm.setAttribute('webkit-playsinline', '');
      directoryFilm.loop = true;
      directoryFilm.preload = 'auto';
      directoryFilm.poster = '/home/assets/festival-poster.jpg';
      directoryFilm.src = '/home/assets/festival-loop.mp4?v=silent-1';
      directoryFilm.setAttribute('aria-hidden', 'true');
      directoryFilm.disablePictureInPicture = true;
      directoryFilm.disableRemotePlayback = true;
      document.body.append(directoryFilm);
    }
    directoryFilm.dataset.userPaused = 'false';
    // Keep this call synchronous with Enter, before password hashing or fetch.
    directoryFilm.play().catch(() => {});
  };
  const cancelDirectoryPlayback = () => directoryFilm?.pause();
  let loginOwnsFullscreen = false;
  let loginCancelled = false;
  const active = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  const supported = () => Boolean(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
  const exit = async () => {
    try {
      const leave = document.exitFullscreen || document.webkitExitFullscreen;
      if (active() && leave) await leave.call(document);
    } catch (_) { /* Browser fullscreen remains under the visitor's control. */ }
  };
  const request = (fromLogin = false) => {
    if (active()) return Promise.resolve(true);
    const enter = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
    if (!enter) return Promise.resolve(false);
    loginCancelled = false;
    try {
      // Invoke directly from the visitor's action, before the network request.
      return Promise.resolve(enter.call(document.documentElement, { navigationUI: 'hide' }))
        .then(async () => {
          if (fromLogin) {
            loginOwnsFullscreen = true;
            if (loginCancelled) await exit();
          }
          return active();
        }).catch(() => false);
    } catch (_) { return Promise.resolve(false); }
  };
  const cancelLoginFullscreen = () => {
    loginCancelled = true;
    if (loginOwnsFullscreen) void exit();
    loginOwnsFullscreen = false;
  };
  const navigate = (href, title, record = true) => {
    let destination;
    try { destination = new URL(href, location.href); } catch (_) { return false; }
    if (destination.origin !== location.origin) return false;
    const route = destination.pathname + destination.search + destination.hash;
    if (record) history.pushState({ umShell: true, umShellRoute: route }, '', route);
    const showingDirectory = /^\/home\/(?:index\.html)?$/.test(destination.pathname);
    document.body.classList.toggle('um-directory-film-active', Boolean(showingDirectory && directoryFilm));
    document.querySelectorAll('video,audio').forEach(media => {
      if (media !== directoryFilm || !showingDirectory) media.pause();
    });
    document.dispatchEvent(new CustomEvent('directory:motion', { detail: { paused: true } }));
    if (!frame) {
      frame = document.createElement('iframe');
      frame.className = 'um-experience-frame';
      frame.title = title || 'Universal Mind';
      frame.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture; microphone; camera';
      frame.allowFullscreen = true;
      frame.addEventListener('load', () => {
        try {
          const child = frame.contentWindow;
          if (child.location.origin !== location.origin) return;
          const current = child.location.pathname + child.location.search + child.location.hash;
          history.replaceState({ umShell: true, umShellRoute: current }, '', current);
          // Keep explicit same-site top links inside the fullscreen owner.
          child.addEventListener('click', event => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const link = event.target.closest?.('a[href]');
            if (!link || link.hasAttribute('download')) return;
            if (link.matches('[data-destination]')) return;
            const standaloneAbout = link.matches('a[data-nav-item="about"]') && !child.document.body.classList.contains('television-room-open');
            if (link.target !== '_top' && !standaloneAbout) return;
            const url = new URL(link.href, child.location.href);
            if (url.origin !== location.origin) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            child.location.assign(url.href);
          }, true);
        } catch (_) { /* External content keeps its existing browser behavior. */ }
      });
      frame.src = destination.href;
      document.body.append(frame);
      document.body.classList.add('is-experience-shell');
    } else {
      frame.title = title || 'Universal Mind';
      frame.contentWindow.location.replace(destination.href);
    }
    frame.focus();
    return true;
  };
  const open = () => {
    if (frame) return;
    history.replaceState({ umShell: true, umShellRoute: '/home/' }, '', '/home/');
    navigate('/home/', 'Universal Mind directory', false);
  };
  const openDestination = (href, title) => {
    try {
      if (parent !== window && parent.UniversalMindEntry) return parent.UniversalMindEntry.openDestination(href, title);
    } catch (_) { /* A direct directory visit owns its own persistent document. */ }
    if (!frame) history.replaceState({ umShell: true, umShellRoute: '/home/' }, '', '/home/');
    void request();
    return navigate(href, title);
  };
  window.addEventListener('popstate', event => {
    if (frame && event.state?.umShellRoute) navigate(event.state.umShellRoute, 'Universal Mind', false);
  });
  window.addEventListener('pagehide', cancelDirectoryPlayback);
  window.UniversalMindEntry = {
    beginDirectoryPlayback,
    cancelDirectoryPlayback,
    getDirectoryFilm: () => directoryFilm,
    getBackgroundFilm: () => directoryFilm,
    setBackgroundVisible: visible => {
      document.body.classList.toggle('um-directory-film-active', Boolean(visible && directoryFilm));
      if (!visible) directoryFilm?.pause();
    },
    requestFullscreen: request,
    exitFullscreen: exit,
    fullscreenActive: active,
    fullscreenSupported: supported,
    cancelLoginFullscreen,
    openDestination,
    open
  };
})();
