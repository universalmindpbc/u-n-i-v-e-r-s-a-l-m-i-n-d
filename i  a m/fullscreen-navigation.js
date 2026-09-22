// Keep the fullscreen WebView alive until its exit has completed. In Safari,
// unloading it during the AppKit transition can crash the browser process.
export async function leaveFullscreen(document) {
  const active = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement || document.webkitIsFullScreen);
  if (!active()) return;
  const exit = document.exitFullscreen || document.webkitExitFullscreen || document.webkitCancelFullScreen;
  if (!exit) throw new Error('Fullscreen exit is unavailable');

  await new Promise((resolve, reject) => {
    let exited = false;
    let returned = false;
    let promisePending = false;
    let timeout;
    const cleanup = () => {
      clearTimeout(timeout);
      document.removeEventListener('fullscreenchange', changed);
      document.removeEventListener('webkitfullscreenchange', changed);
    };
    const fail = error => { cleanup(); reject(error); };
    const complete = () => {
      if (!returned || promisePending || !exited || active()) return;
      cleanup();
      resolve();
    };
    const changed = () => { exited = !active(); complete(); };
    document.addEventListener('fullscreenchange', changed);
    document.addEventListener('webkitfullscreenchange', changed);
    // Failure must never fall through to navigation while fullscreen is active.
    timeout = setTimeout(() => fail(new Error('Fullscreen exit did not complete')), 6000);
    try {
      const result = exit.call(document);
      returned = true;
      if (result?.then) {
        promisePending = true;
        Promise.resolve(result).then(() => {
          promisePending = false;
          exited = !active();
          complete();
        }, fail);
      } else {
        // Legacy WebKit has no Promise: its fullscreenchange is authoritative.
        complete();
      }
    } catch (error) { fail(error); }
  });
  // Allow the completed exit to settle before releasing the media/WebView.
  await new Promise(resolve => setTimeout(resolve, 300));
  if (active()) throw new Error('Fullscreen was re-entered during navigation');
}

export async function navigateFromTelevision({ document, pause, teardown, navigate }) {
  pause();
  await leaveFullscreen(document);
  teardown();
  navigate();
}
