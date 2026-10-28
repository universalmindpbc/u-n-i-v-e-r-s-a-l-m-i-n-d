(() => {
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
  });
  const observer = new ResizeObserver(schedule);
  observer.observe(map);
  destinations.forEach((destination) => observer.observe(destination));
  flower.addEventListener('load', schedule);
  document.fonts.ready.then(schedule);
  window.addEventListener('pageshow', schedule);
  schedule();
})();
