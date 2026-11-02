"use strict";
(() => {
  const frames = {research: document.querySelector('#research-frame'), connect: document.querySelector('#connect-frame')};
  const initial = window.PortalRoutes.resolve();
  if (initial?.id === 'research') document.documentElement.dataset.libraryQuery = initial.query.toString() ? '?' + initial.query : '';
  function navigate(area) {
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    document.dispatchEvent(new CustomEvent('atlas:navigate', {detail: area}));
  }
  function load(area, extra) {
    const frame = frames[area];
    if (!frame) return;
    const url = new URL(area === 'connect' ? 'connect.html' : 'library.html', document.baseURI);
    if (area === 'research') url.search = document.documentElement.dataset.libraryQuery || '';
    if (extra) for (const [key, value] of Object.entries(extra)) if (value) url.searchParams.set(key, value);
    if (area === 'research') document.documentElement.dataset.libraryQuery = url.search;
    url.searchParams.set('embedded', '1');
    window.PortalRoutes.loadFrame(frame, url.href);
  }
  document.addEventListener('atlas:area', event => load(event.detail));
  document.addEventListener('click', event => {
    const link = event.target.closest('[data-library],[data-connect]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const area = link.hasAttribute('data-connect') ? 'connect' : 'research';
    if (area === 'research') document.documentElement.dataset.libraryQuery = '';
    load(area, area === 'research' ? {collection: link.dataset.library || 'all', target: link.dataset.libraryGene || ''} : null);
    navigate(area);
  }, true);
  function followLink(event) {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank' || link.hasAttribute('download') || link.getAttribute('href').startsWith('#')) return;
    const route = window.PortalRoutes.resolve(link.href);
    if (route?.portal !== 'informatics') return;
    event.preventDefault(); event.stopImmediatePropagation();
    document.dispatchEvent(new CustomEvent('atlas:route', {detail: {route, mode: 'push'}}));
  }
  document.addEventListener('click', followLink, true);
  const known = () => [...document.querySelectorAll('#atlas-frame,#molecular-frame,#quantum-frame,#research-frame,#connect-frame')];
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || !known().some(frame => frame.contentWindow === event.source)) return;
    const data = event.data;
    if (data?.type === 'informatics:connect') navigate('connect');
    else if (data?.type === 'informatics:library-navigate' && window.InformaticsNavigation.entries.some(entry => entry.id === data.area)) navigate(data.area);
    else if (data?.type === 'informatics:close-library') navigate('geometry');
    else if (data?.type === 'informatics:library-selection' && frames.research.contentWindow === event.source) {
      const route = window.PortalRoutes.resolve(data.href);
      if (route?.id !== 'research') return;
      document.documentElement.dataset.libraryQuery = new URL(route.href).search;
      if (document.querySelector('#experience').dataset.area === 'research') window.PortalRoutes.commit(route.href, 'replace');
    }
  });
  for (const frame of known()) frame.addEventListener('load', () => {
    if (!frame.getAttribute('src')) return;
    const doc = frame.contentDocument;
    if (!doc) return;
    doc.addEventListener('pointerdown', () => document.dispatchEvent(new Event('atlas:close-navigation')));
    doc.addEventListener('click', followLink, true);
  });
})();
