type MusicFrame = { element: Element; animation: CSSAnimation; name: string; time: number; running: boolean; rate: number };
type MusicContinuity = { field: HTMLElement; at: number; frames: MusicFrame[]; pulseTime?: number };

let cleanup = (_keepMusic = false) => {};
let continuity: MusicContinuity | undefined;
let pulse: Animation | undefined;
let boostUntil = 0;
let lastScrollAt = -Infinity;
const lifecycle = new AbortController();
const pulseDuration = 650;

function kickWave(field: HTMLElement, time = 0) {
  const wave = field.querySelector('.wave-scroll-response');
  if (!wave || time >= pulseDuration) return;
  pulse?.cancel();
  pulse = wave.animate([
    { transform: 'scaleY(1)', filter: 'brightness(1)' },
    { transform: 'scaleY(1.08)', filter: 'brightness(1.15)', offset: .35 },
    { transform: 'scaleY(1)', filter: 'brightness(1)' },
  ], { duration: pulseDuration, easing: 'cubic-bezier(.2,.7,.2,1)' });
  pulse.currentTime = time;
}

function synchronizeDepth() {
  const home = document.querySelector<HTMLElement>('.portfolio-home');
  if (!home) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  home.classList.toggle('has-scroll-chapters', !reduced);
  const top = document.querySelector('.header')?.getBoundingClientRect().bottom ?? 0;
  const space = Math.max(1, innerHeight - top);
  const visibility = (element: Element) => {
    const rect = element.getBoundingClientRect();
    const visible = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, top));
    const ratio = Math.min(1, visible / Math.max(1, Math.min(rect.height, space)));
    return ratio * ratio * (3 - 2 * ratio);
  };
  const bands = [...home.querySelectorAll<HTMLElement>('.home-band')].map(band => ({
    content: band.querySelector<HTMLElement>(':scope > .shell'), scale: .94 + .06 * visibility(band),
    origin: band.getBoundingClientRect().top >= top ? 'top' : 'bottom',
  }));
  const hero = home.querySelector<HTMLElement>('.hero');
  const heroScale = hero ? .96 + .04 * visibility(hero) : 1;
  for (const { content, scale, origin } of bands) {
    if (reduced) { content?.style.removeProperty('--chapter-scale'); content?.style.removeProperty('--chapter-origin'); }
    else { content?.style.setProperty('--chapter-scale', scale.toFixed(4)); content?.style.setProperty('--chapter-origin', origin); }
  }
  if (reduced) hero?.style.removeProperty('--hero-scale');
  else hero?.style.setProperty('--hero-scale', heroScale.toFixed(4));
}

function initializeHomeMotion() {
  const field = document.querySelector<HTMLElement>('.circuit-field');
  const retained = continuity?.field === field;
  cleanup(retained);
  cleanup = () => {};
  continuity = undefined;
  const home = document.querySelector<HTMLElement>('.portfolio-home');
  if (!home) return;
  const controller = new AbortController();
  const { signal } = controller;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let boostTimer: ReturnType<typeof setTimeout> | undefined;
  let previousY = scrollY, previousTime = performance.now();
  const scheduleDepth = () => {
    if (!signal.aborted && !frame) frame = requestAnimationFrame(() => { frame = 0; synchronizeDepth(); });
  };
  const resetBoost = () => {
    clearTimeout(boostTimer);
    field?.style.removeProperty('--wave-boost');
    boostUntil = 0;
  };
  const stopWaveResponse = () => { resetBoost(); pulse?.cancel(); pulse = undefined; };
  const fieldObserver = new IntersectionObserver(entries => {
    if (signal.aborted) return;
    const visible = entries[0].isIntersecting;
    field?.classList.toggle('is-visible', visible);
    if (!visible) stopWaveResponse();
  });
  if (field) fieldObserver.observe(field);
  const sizeObserver = new ResizeObserver(scheduleDepth);
  home.querySelectorAll('.hero, .home-band').forEach(element => sizeObserver.observe(element));
  window.addEventListener('scroll', () => {
    scheduleDepth();
    const now = performance.now();
    const distance = Math.abs(scrollY - previousY);
    const speed = distance / Math.min(120, Math.max(16, now - previousTime));
    previousY = scrollY; previousTime = now;
    if (media.matches || document.hidden || !field?.classList.contains('is-visible')) { stopWaveResponse(); return; }
    if (distance <= .5) return;
    if (now - lastScrollAt > 350) kickWave(field);
    lastScrollAt = now;
    field.style.setProperty('--wave-boost', (1 + Math.min(speed / 3, 1) * .14).toFixed(3));
    boostUntil = now + 200;
    clearTimeout(boostTimer);
    boostTimer = setTimeout(resetBoost, 200);
  }, { signal, passive: true });
  window.addEventListener('resize', scheduleDepth, { signal, passive: true });
  media.addEventListener('change', () => { stopWaveResponse(); synchronizeDepth(); }, { signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopWaveResponse(); }, { signal });
  if (retained && boostUntil > performance.now()) boostTimer = setTimeout(resetBoost, boostUntil - performance.now());
  else resetBoost();
  if (media.matches || document.hidden) stopWaveResponse();
  synchronizeDepth();
  document.fonts.ready.then(() => { if (!signal.aborted) scheduleDepth(); });
  cleanup = (keepMusic = false) => {
    controller.abort(); fieldObserver.disconnect(); sizeObserver.disconnect();
    cancelAnimationFrame(frame); clearTimeout(boostTimer);
    if (!keepMusic) { stopWaveResponse(); lastScrollAt = -Infinity; home.classList.remove('has-scroll-chapters'); }
  };
}

document.addEventListener('astro:before-swap', event => {
  const homes = ['/', '/pt/'];
  const field = document.querySelector<HTMLElement>('.circuit-field');
  continuity = undefined;
  if (field && homes.includes(event.from.pathname) && homes.includes(event.to.pathname)) {
    const frames: MusicFrame[] = [];
    field.querySelectorAll('.circuit-wave path, .circuit-signals path').forEach(element => {
      for (const animation of element.getAnimations()) {
        if (animation instanceof CSSAnimation && typeof animation.currentTime === 'number')
          frames.push({ element, animation, name: animation.animationName, time: animation.currentTime, running: animation.playState === 'running', rate: animation.playbackRate });
      }
    });
    continuity = { field, frames, at: performance.now(), pulseTime: pulse?.playState === 'running' && typeof pulse.currentTime === 'number' ? pulse.currentTime : undefined };
  }
  cleanup(Boolean(continuity));
}, { signal: lifecycle.signal });

document.addEventListener('astro:after-swap', () => {
  if (continuity?.field.isConnected && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const elapsed = performance.now() - continuity.at;
    // Persist keeps the node; restore playback time too on browsers that detach it during a move.
    for (const saved of continuity.frames) {
      const animation = saved.element.getAnimations().find(item => item instanceof CSSAnimation && item.animationName === saved.name);
      if (!animation) continue;
      const expected = saved.time + (saved.running ? elapsed * saved.rate : 0);
      if (animation !== saved.animation || typeof animation.currentTime !== 'number' || Math.abs(animation.currentTime - expected) > 50) animation.currentTime = expected;
    }
    if (continuity.pulseTime !== undefined && (!pulse || pulse.playState === 'idle')) kickWave(continuity.field, continuity.pulseTime + elapsed);
  }
  synchronizeDepth();
}, { signal: lifecycle.signal });
document.addEventListener('astro:page-load', initializeHomeMotion, { signal: lifecycle.signal });
initializeHomeMotion();
if (import.meta.hot) import.meta.hot.dispose(() => { cleanup(); lifecycle.abort(); });
