import { createCursorMotion, advanceCursorMotion } from './cursor-motion';

let cleanup = () => {};
const lifecycle = new AbortController();

function initializeCursor() {
  cleanup();
  const cursor = document.querySelector<HTMLElement>('[data-drift-cursor]');
  const shape = cursor?.querySelector<SVGPathElement>('[data-cursor-steering]');
  if (!cursor || !shape) return;
  const root = document.documentElement;
  const media = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const controller = new AbortController();
  const { signal } = controller;
  let frame = 0, lastFrame = 0;
  let active = false, pointerX = 0, pointerY = 0;
  let size = 28;
  let mode: 'arrow' | 'hand' | 'eye' = 'arrow';
  let motion = createCursorMotion();
  let density = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
  const paint = () => {
    const pixels = window.devicePixelRatio || 1;
    const anchor = size / 2;
    cursor.style.transform = `translate3d(${Math.round((pointerX - anchor) * pixels) / pixels}px, ${Math.round((pointerY - anchor) * pixels) / pixels}px, 0)`;
    shape.setAttribute('transform', `rotate(${motion.angle} 3 3)`);
  };
  const updateMode = () => {
    const target = document.elementFromPoint(pointerX, pointerY);
    const project = target?.closest('.project-card[data-project]');
    const external = target?.closest('a[target="_blank"]');
    const next = project && !external ? 'eye' : target?.closest('a, button, summary, [role="button"]') ? 'hand' : 'arrow';
    if (mode !== next) { mode = next; cursor.dataset.cursorMode = mode; }
  };
  const hide = () => {
    active = false;
    cancelAnimationFrame(frame);
    frame = 0;
    root.classList.remove('has-drift-cursor');
  };
  const render = (now: number) => {
    frame = 0;
    if (!active || !media.matches || document.hidden) { hide(); return; }
    const elapsed = Math.min(32, Math.max(1, now - lastFrame));
    lastFrame = now;
    updateMode();
    const direction = root.dataset.scrollDirection;
    const steering = mode !== 'arrow' ? 0 : direction === 'down' ? 225 : direction === 'up' ? 45 : 0;
    advanceCursorMotion(motion, steering, elapsed);
    paint();
    const turn = ((steering - motion.angle) % 360 + 540) % 360 - 180;
    if (direction || Math.abs(turn) > .1 || Math.abs(motion.turnRate) > .1)
      frame = requestAnimationFrame(render);
  };
  const start = () => {
    if (active && !frame) { lastFrame = performance.now(); frame = requestAnimationFrame(render); }
  };
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !media.matches || document.hidden || event.clientX < 0 || event.clientY < 0 || event.clientX >= innerWidth || event.clientY >= innerHeight) { hide(); return; }
    pointerX = event.clientX; pointerY = event.clientY;
    if (!active) {
      motion = createCursorMotion();
      active = true;
      root.classList.add('has-drift-cursor');
    }
    updateMode();
    paint();
    start();
  }, { signal, passive: true });
  window.addEventListener('scroll', () => { if (active) updateMode(); start(); }, { signal, passive: true });
  const configureSize = () => {
    size = screen.width >= 2400 ? 40 : screen.width >= 1600 ? 32 : 28;
    root.dataset.cursorSize = String(size);
    density.removeEventListener('change', configureSize);
    density = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    density.addEventListener('change', configureSize, { signal });
    start();
  };
  configureSize();
  window.addEventListener('resize', configureSize, { signal, passive: true });
  window.visualViewport?.addEventListener('resize', configureSize, { signal, passive: true });
  document.addEventListener('pointerout', event => {
    if (!event.relatedTarget && (event.clientX <= 0 || event.clientY <= 0 || event.clientX >= innerWidth || event.clientY >= innerHeight)) hide();
  }, { signal });
  document.addEventListener('cursor:refresh', () => { if (active) updateMode(); start(); }, { signal });
  window.addEventListener('blur', hide, { signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); }, { signal });
  media.addEventListener('change', hide, { signal });
  cleanup = () => { controller.abort(); hide(); };
}

document.addEventListener('astro:before-swap', () => cleanup(), { signal: lifecycle.signal });
document.addEventListener('astro:page-load', initializeCursor, { signal: lifecycle.signal });
initializeCursor();
if (import.meta.hot) import.meta.hot.dispose(() => { cleanup(); lifecycle.abort(); });
