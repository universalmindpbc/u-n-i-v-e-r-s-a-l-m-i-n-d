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
  const open = () => {
    if (frame) return;
    // Keep this document alive for the login-to-directory fullscreen transition.
    // Destinations retain their existing top-level browser context.
    document.querySelectorAll('video,audio').forEach(media => media.pause());
    frame = document.createElement('iframe');
    frame.className = 'um-experience-frame';
    frame.title = 'Universal Mind directory';
    frame.allow = 'autoplay; fullscreen';
    frame.allowFullscreen = true;
    frame.src = '/home/';
    document.body.append(frame);
    document.body.classList.add('is-experience-shell');
    history.replaceState({ umDirectory: true }, '', '/home/');
    frame.focus();
  };
  window.UniversalMindEntry = {
    requestFullscreen: request,
    exitFullscreen: exit,
    fullscreenActive: active,
    fullscreenSupported: supported,
    cancelLoginFullscreen,
    open
  };
})();
