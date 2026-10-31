(() => {
  const chapter = document.querySelector('#music-measurement');
  if (!chapter) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'measurement-dialog';
  dialog.setAttribute('aria-label', 'Music Atlas measurement mockup');
  dialog.innerHTML = '<div class="measurement-dialog-bar"><p>MUSIC ATLAS · MEASUREMENT</p><button type="button" data-measurement-zoom aria-pressed="false">Original size +</button><button type="button" data-measurement-close aria-label="Close measurement mockup" autofocus>Close ×</button></div><div class="measurement-dialog-scroll" tabindex="0" aria-label="Image; scroll to explore"><img alt=""></div>';
  const image = dialog.querySelector('img');
  const zoom = dialog.querySelector('[data-measurement-zoom]');
  let opener;
  function setZoom(enlarged) {
    dialog.dataset.enlarged = String(enlarged);
    zoom.setAttribute('aria-pressed', String(enlarged));
    zoom.textContent = enlarged ? 'Fit image −' : 'Original size +';
  }
  chapter.querySelectorAll('[data-measurement-image]').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      const source = button.querySelector('img');
      image.src = source.src;
      image.alt = source.alt;
      dialog.style.setProperty('--measurement-image-width', `${source.naturalWidth || source.width}px`);
      setZoom(false);
      (document.fullscreenElement || document.body).append(dialog);
      dialog.showModal();
      dialog.querySelector('.measurement-dialog-scroll').scrollTo(0, 0);
    });
  });
  zoom.addEventListener('click', () => setZoom(dialog.dataset.enlarged !== 'true'));
  dialog.querySelector('[data-measurement-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => opener?.focus({preventScroll: true}));
  document.addEventListener('informatics:return', () => { if (dialog.open) dialog.close(); });
})();
