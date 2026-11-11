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
  const fieldObserver = new IntersectionObserver(entries => {
    field?.classList.toggle('is-visible', entries[0].isIntersecting);
  });
  if (field) fieldObserver.observe(field);
  const visibility = () => document.documentElement.classList.toggle('page-hidden', document.hidden);
  document.addEventListener('visibilitychange', visibility, { signal: controller.signal });
  visibility();
  const cursor = document.querySelector<HTMLElement>('[data-project-cursor]');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let hoveredCard: HTMLElement | null = null;
  const hideCursor = () => {
    cursor?.classList.remove('is-visible');
    hoveredCard?.classList.remove('has-view-cursor');
    hoveredCard = null;
  };
  if (cursor) {
    document.addEventListener('pointermove', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const card = target?.closest<HTMLElement>('.portfolio-home .project-card[data-project]') ?? null;
      if (!finePointer.matches || media.matches || !card || target?.closest('a[target="_blank"]')) {
        hideCursor();
        return;
      }
      if (hoveredCard !== card) {
        hideCursor();
        hoveredCard = card;
        card.classList.add('has-view-cursor');
      }
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
      cursor.classList.add('is-visible');
    }, { signal: controller.signal, passive: true });
    document.addEventListener('pointerout', (event) => { if (!event.relatedTarget) hideCursor(); }, { signal: controller.signal });
    document.addEventListener('keydown', hideCursor, { signal: controller.signal });
    window.addEventListener('scroll', hideCursor, { signal: controller.signal, passive: true });
    media.addEventListener('change', hideCursor, { signal: controller.signal });
    finePointer.addEventListener('change', hideCursor, { signal: controller.signal });
  }
  cleanup = () => { controller.abort(); observer.disconnect(); fieldObserver.disconnect(); hideCursor(); };
}
document.addEventListener('astro:before-swap', () => cleanup(), { signal: lifecycle.signal });
document.addEventListener('astro:page-load', initializeEnvironment, { signal: lifecycle.signal });
initializeEnvironment();
if (import.meta.hot) import.meta.hot.dispose(() => { cleanup(); lifecycle.abort(); });
