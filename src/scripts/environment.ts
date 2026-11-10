let cleanup = () => {};
function initializeEnvironment() {
  cleanup();
  const controller = new AbortController();
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const targets = document.querySelectorAll<HTMLElement>('.project-card, .expertise-card, .about-introduction, .about-subsection, .education-entry');
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
  cleanup = () => { controller.abort(); observer.disconnect(); fieldObserver.disconnect(); };
}
document.addEventListener('astro:before-swap', () => cleanup());
document.addEventListener('astro:page-load', initializeEnvironment);
initializeEnvironment();
