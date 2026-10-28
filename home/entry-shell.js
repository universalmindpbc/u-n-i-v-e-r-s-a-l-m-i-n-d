(() => {
  let frame = null;
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
  const navigate = (url, replace = false) => {
    const target = new URL(url, window.location.href);
    if (target.origin !== window.location.origin) {
      window.location.assign(target.href);
      return;
    }
    if (!frame) {
      history.replaceState({ umShell: true, path: location.pathname + location.search + location.hash }, '', location.href);
      document.querySelectorAll('video,audio').forEach(media => media.pause());
      frame = document.createElement('iframe');
      frame.className = 'um-experience-frame';
      frame.title = 'Universal Mind';
      frame.allow = 'autoplay; fullscreen';
      frame.allowFullscreen = true;
      frame.addEventListener('load', () => {
        try {
          const current = new URL(frame.contentWindow.location.href);
          if (current.origin !== location.origin) return;
          const route = current.pathname + current.search + current.hash;
          history.replaceState({ umShell: true, path: route }, '', route);
          document.title = frame.contentDocument.title || 'Universal Mind';
        } catch (_) { /* External navigation retains its own browser behaviour. */ }
      });
      document.body.append(frame);
      document.body.classList.add('is-experience-shell');
    }
    const route = target.pathname + target.search + target.hash;
    history[replace ? 'replaceState' : 'pushState']({ umShell: true, path: route }, '', route);
    frame.contentWindow.location.replace(target.href);
    frame.focus();
  };
  window.addEventListener('popstate', event => {
    if (frame && event.state?.umShell) navigate(event.state.path, true);
  });
  window.UniversalMindEntry = {
    requestFullscreen: request,
    exitFullscreen: exit,
    fullscreenActive: active,
    fullscreenSupported: supported,
    cancelLoginFullscreen,
    open: () => navigate('/home/', true),
    navigate
  };
})();
