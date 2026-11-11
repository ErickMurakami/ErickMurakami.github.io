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
  let previousScrollY = scrollY;
  let previousScrollTime = performance.now();
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
    window.addEventListener('scroll', () => {
      const now = performance.now();
      const speed = Math.abs(scrollY - previousScrollY) / Math.min(120, Math.max(16, now - previousScrollTime));
      previousScrollY = scrollY;
      previousScrollTime = now;
      if (media.matches || document.hidden || !field.classList.contains('is-visible')) {
        resetWaveAccent();
        return;
      }
      field.style.setProperty('--wave-boost', (1 + Math.min(speed / 3, 1) * .14).toFixed(3));
      clearTimeout(waveTimer);
      waveTimer = setTimeout(resetWaveAccent, 200);
    }, { signal: controller.signal, passive: true });
    media.addEventListener('change', resetWaveAccent, { signal: controller.signal });
  }
  const visibility = () => {
    document.documentElement.classList.toggle('page-hidden', document.hidden);
    if (document.hidden) resetWaveAccent();
  };
  document.addEventListener('visibilitychange', visibility, { signal: controller.signal });
  visibility();
  cleanup = () => { controller.abort(); observer.disconnect(); fieldObserver.disconnect(); resetWaveAccent(); };
}
document.addEventListener('astro:before-swap', () => cleanup(), { signal: lifecycle.signal });
document.addEventListener('astro:page-load', initializeEnvironment, { signal: lifecycle.signal });
initializeEnvironment();
if (import.meta.hot) import.meta.hot.dispose(() => { cleanup(); lifecycle.abort(); });
