let cleanup = () => {};
const lifecycle = new AbortController();

function initializeImages() {
  cleanup();
  const controller = new AbortController();
  const { signal } = controller;
  const dialog = document.querySelector<HTMLDialogElement>('[data-image-viewer]');
  const enlarged = dialog?.querySelector<HTMLImageElement>('[data-image-viewer-image]');
  const caption = dialog?.querySelector<HTMLElement>('[data-image-viewer-caption]');
  let trigger: HTMLElement | null = null;
  let overflow = '', padding = '', anchoring = '';
  let savedX = 0, savedY = 0;
  let cursor: HTMLElement | null = null;
  const refreshCursor = () => document.dispatchEvent(new Event('cursor:refresh'));
  const restore = () => {
    document.documentElement.style.overflow = overflow;
    document.body.style.paddingRight = padding;
    document.documentElement.style.setProperty('overflow-anchor', anchoring);
    if (cursor) { document.body.append(cursor); cursor = null; }
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    window.scrollTo({ left: savedX, top: savedY, behavior: 'instant' });
    trigger = null;
    refreshCursor();
  };
  const close = () => { if (dialog?.open) dialog.close(); };
  document.querySelectorAll<HTMLImageElement>('img').forEach(image => { image.draggable = false; });
  document.addEventListener('dragstart', event => {
    if ((event.target as Element | null)?.closest('img, .image-zoom')) event.preventDefault();
  }, { signal });
  if (dialog && enlarged && caption) {
    document.querySelectorAll<HTMLImageElement>('.prose img').forEach(image => {
      if (image.closest('.tech-label, button, a')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'image-zoom';
      button.dataset.imageZoom = '';
      const label = document.documentElement.lang === 'pt-BR' ? 'Ampliar imagem' : 'Enlarge image';
      button.setAttribute('aria-label', `${label}: ${image.alt}`);
      button.title = label;
      image.before(button);
      button.append(image);
    });
    document.addEventListener('click', event => {
      const button = (event.target as Element | null)?.closest<HTMLElement>('[data-image-zoom]');
      const image = button?.querySelector('img');
      if (!button || !image || event.defaultPrevented) return;
      event.preventDefault();
      trigger = button;
      savedX = scrollX; savedY = scrollY;
      enlarged.src = image.currentSrc || image.src;
      enlarged.alt = image.alt;
      caption.textContent = image.closest('figure')?.querySelector('figcaption')?.textContent || image.alt;
      overflow = document.documentElement.style.overflow;
      padding = document.body.style.paddingRight;
      anchoring = document.documentElement.style.getPropertyValue('overflow-anchor');
      const gutter = innerWidth - document.documentElement.clientWidth;
      if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.setProperty('overflow-anchor', 'none');
      cursor = document.querySelector<HTMLElement>('[data-drift-cursor]');
      // Keep the cursor in the dialog's top layer while the page remains behind it.
      if (cursor) dialog.append(cursor);
      dialog.showModal();
      window.scrollTo({ left: savedX, top: savedY, behavior: 'instant' });
      refreshCursor();
    }, { signal });
    dialog.querySelector('[data-image-viewer-close]')?.addEventListener('click', close, { signal });
    dialog.addEventListener('click', event => {
      if (!(event.target as Element).closest('[data-image-viewer-image], [data-image-viewer-close]')) close();
    }, { signal });
    dialog.addEventListener('close', restore, { signal });
  }
  cleanup = () => {
    if (dialog?.open) { dialog.close(); restore(); }
    controller.abort();
  };
}

document.addEventListener('astro:before-swap', () => cleanup(), { signal: lifecycle.signal });
document.addEventListener('astro:page-load', initializeImages, { signal: lifecycle.signal });
initializeImages();
if (import.meta.hot) import.meta.hot.dispose(() => { cleanup(); lifecycle.abort(); });
