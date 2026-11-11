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
  let cursorTimer: ReturnType<typeof setTimeout> | undefined;
  let previousScrollY = scrollY;
  let inputDirection: 'up' | 'down' | undefined;
  let lastInputAt = 0;
  const resetScrollCursor = () => {
    clearTimeout(cursorTimer);
    delete document.documentElement.dataset.scrollDirection;
  };
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
    previousScrollY = scrollY;
    if (media.matches || document.hidden) {
      resetScrollCursor();
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
  }, { signal: controller.signal, passive: true });
  media.addEventListener('change', resetScrollCursor, { signal: controller.signal });
  const visibility = () => {
    document.documentElement.classList.toggle('page-hidden', document.hidden);
    if (document.hidden) resetScrollCursor();
  };
  document.addEventListener('visibilitychange', visibility, { signal: controller.signal });
  visibility();
  cleanup = () => { controller.abort(); observer.disconnect(); resetScrollCursor(); };
}
document.addEventListener('astro:before-swap', () => cleanup(), { signal: lifecycle.signal });
document.addEventListener('astro:page-load', initializeEnvironment, { signal: lifecycle.signal });
initializeEnvironment();
if (import.meta.hot) import.meta.hot.dispose(() => { cleanup(); lifecycle.abort(); });
