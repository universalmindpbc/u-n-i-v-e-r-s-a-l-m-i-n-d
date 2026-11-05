// Follow a normal Home link in a window. In fullscreen, navigate inside the
// document that owns fullscreen, including the nested Events → Lab journey.
document.addEventListener('click', event => {
  const link = event.target.closest?.('a[data-lab-home]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  let owner = window;
  try {
    while (owner.parent !== owner && owner.parent.UniversalMindEntry) owner = owner.parent;
  } catch { /* Keep the nearest same-origin owner. */ }
  const shell = owner.UniversalMindEntry;
  if (!shell?.fullscreenActive()) return;
  const handled = shell.openHomeInFullscreen
    ? shell.openHomeInFullscreen()
    : shell.openDestination(link.href, 'Universal Mind home');
  if (handled) event.preventDefault();
});
