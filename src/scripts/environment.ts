let cleanup = () => {};
const lifecycle = new AbortController();
function initializeEnvironment() {
  cleanup();
  const controller = new AbortController();
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const targets = document.querySelectorAll<HTMLElement>('.project-card, .expertise-card, .about-introduction, .about-subsection, .education-entry, .home-section-intro');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.06 });
  if (!media.matches) targets.forEach(target => { target.classList.add('reveal'); observer.observe(target); });
  const revealAll = () => targets.forEach(target => target.classList.add('is-revealed'));
  media.addEventListener('change', revealAll, { signal: controller.signal });
  const field = document.querySelector<HTMLElement>('.circuit-field');
  let waveTimer: ReturnType<typeof setTimeout> | undefined;
  let cursorTimer: ReturnType<typeof setTimeout> | undefined;
  let previousScrollY = scrollY;
  let previousScrollTime = performance.now();
  let inputDirection: 'up' | 'down' | undefined;
  let lastInputAt = 0;
  const resetScrollCursor = () => {
    clearTimeout(cursorTimer);
    delete document.documentElement.dataset.scrollDirection;
  };
  const resetWaveAccent = () => {
    clearTimeout(waveTimer);
    field?.style.removeProperty('--wave-boost');
  };
  const fieldObserver = new IntersectionObserver(entries => {
    field?.classList.toggle('is-visible', entries[0].isIntersecting);
    if (!entries[0].isIntersecting) resetWaveAccent();
  });
  if (field) {
    fieldObserver.observe(field);
    media.addEventListener('change', resetWaveAccent, { signal: controller.signal });
  }
  window.addEventListener('wheel', event => {
    if (!event.deltaY || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    inputDirection = event.deltaY > 0 ? 'down' : 'up';
    lastInputAt = performance.now();
  }, { signal: controller.signal, passive: true });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || (event.target as Element | null)?.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (['ArrowDown', 'PageDown', 'End', ' '].includes(event.key)) inputDirection = event.key === ' ' && event.shiftKey ? 'up' : 'down';
    else if (['ArrowUp', 'PageUp', 'Home'].includes(event.key)) inputDirection = 'up';
    else return;
    lastInputAt = performance.now();
  }, { signal: controller.signal });
  window.addEventListener('scroll', () => {
    const now = performance.now();
    const distance = scrollY - previousScrollY;
    const speed = Math.abs(distance) / Math.min(120, Math.max(16, now - previousScrollTime));
    previousScrollY = scrollY;
    previousScrollTime = now;
    if (media.matches || document.hidden) {
      resetScrollCursor();
      resetWaveAccent();
      return;
    }
    if (Math.abs(distance) > .5) {
      // Header compaction can briefly adjust scrollY against the user's movement.
      const direction = inputDirection && now - lastInputAt < 400 ? inputDirection : distance > 0 ? 'down' : 'up';
      if (document.documentElement.dataset.scrollDirection !== direction)
        document.documentElement.dataset.scrollDirection = direction;
      clearTimeout(cursorTimer);
      cursorTimer = setTimeout(resetScrollCursor, 280);
    }
    if (!field?.classList.contains('is-visible')) {
      resetWaveAccent();
      return;
    }
    field.style.setProperty('--wave-boost', (1 + Math.min(speed / 3, 1) * .14).toFixed(3));
    clearTimeout(waveTimer);
    waveTimer = setTimeout(resetWaveAccent, 200);
  }, { signal: controller.signal, passive: true });
  media.addEventListener('change', resetScrollCursor, { signal: controller.signal });
  const visibility = () => {
    document.documentElement.classList.toggle('page-hidden', document.hidden);
    if (document.hidden) { resetWaveAccent(); resetScrollCursor(); }
  };
  document.addEventListener('visibilitychange', visibility, { signal: controller.signal });
  visibility();
  cleanup = () => { controller.abort(); observer.disconnect(); fieldObserver.disconnect(); resetWaveAccent(); resetScrollCursor(); };
}
document.addEventListener('astro:before-swap', () => cleanup(), { signal: lifecycle.signal });
document.addEventListener('astro:page-load', initializeEnvironment, { signal: lifecycle.signal });
initializeEnvironment();
if (import.meta.hot) import.meta.hot.dispose(() => { cleanup(); lifecycle.abort(); });
