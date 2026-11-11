let cleanup = () => {};
const lifecycle = new AbortController();

function initializeCursor() {
  cleanup();
  const cursor = document.querySelector<HTMLElement>('[data-drift-cursor]');
  if (!cursor || !CSS.supports('selector(:has(a:hover))')) return;
  const root = document.documentElement;
  const media = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const controller = new AbortController();
  const { signal } = controller;
  let frame = 0;
  let active = false;
  let x = 0, y = 0, targetX = 0, targetY = 0;
  let angle = 0, angularVelocity = 0, mouseAngle = 0;
  let lastMove = 0, lastFrame = 0;

  const hide = () => {
    active = false;
    cancelAnimationFrame(frame);
    frame = 0;
    root.classList.remove('has-drift-cursor');
  };
  const render = (now: number) => {
    frame = 0;
    if (!active || !media.matches || document.hidden) { hide(); return; }
    const elapsed = Math.min(32, Math.max(8, now - lastFrame));
    lastFrame = now;
    const step = elapsed / (1000 / 60);
    const positionEase = 1 - Math.exp(-elapsed / 35);
    x += (targetX - x) * positionEase;
    y += (targetY - y) * positionEase;
    const trail = Math.hypot(targetX - x, targetY - y);
    if (trail > 10) {
      x = targetX - (targetX - x) * 10 / trail;
      y = targetY - (targetY - y) * 10 / trail;
    }
    const direction = root.dataset.scrollDirection;
    const targetAngle = direction === 'down' ? 225 : direction === 'up' ? 45 : now - lastMove < 180 ? mouseAngle : 0;
    // Take the shortest turn, with a small amount of inertia before settling.
    const turn = ((targetAngle - angle) % 360 + 540) % 360 - 180;
    angularVelocity = (angularVelocity + turn * .14 * step) * Math.pow(.68, step);
    angle += angularVelocity * step;
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    cursor.style.setProperty('--cursor-angle', `${angle}deg`);
    if (direction || now - lastMove < 180 || Math.abs(turn) > .1 || Math.abs(angularVelocity) > .1 || Math.abs(targetX - x) + Math.abs(targetY - y) > .1)
      frame = requestAnimationFrame(render);
  };
  const start = () => {
    if (active && !frame) { lastFrame = performance.now(); frame = requestAnimationFrame(render); }
  };
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !media.matches || document.hidden) { hide(); return; }
    const nextX = event.clientX - 3, nextY = event.clientY - 3;
    const dx = nextX - targetX, dy = nextY - targetY;
    if (!active) {
      x = nextX; y = nextY; angle = 0; angularVelocity = 0; mouseAngle = 0;
      active = true;
      root.classList.add('has-drift-cursor');
    } else if (Math.hypot(dx, dy) > 2) {
      mouseAngle = Math.atan2(dy, dx) * 180 / Math.PI + 135;
    }
    targetX = nextX; targetY = nextY;
    lastMove = performance.now();
    start();
  }, { signal, passive: true });
  // Scroll keeps animating even when the mouse stays still.
  window.addEventListener('scroll', start, { signal, passive: true });
  document.addEventListener('pointerout', event => {
    if (!event.relatedTarget && (event.clientX <= 0 || event.clientY <= 0 || event.clientX >= innerWidth || event.clientY >= innerHeight)) hide();
  }, { signal });
  window.addEventListener('blur', hide, { signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); }, { signal });
  media.addEventListener('change', hide, { signal });
  cleanup = () => { controller.abort(); hide(); };
}

document.addEventListener('astro:before-swap', () => cleanup(), { signal: lifecycle.signal });
document.addEventListener('astro:page-load', initializeCursor, { signal: lifecycle.signal });
initializeCursor();
if (import.meta.hot) import.meta.hot.dispose(() => { cleanup(); lifecycle.abort(); });
