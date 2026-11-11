export interface CursorMotion {
  x: number; y: number; vx: number; vy: number;
  angle: number; turnRate: number;
}

export function createCursorMotion(x = 0, y = 0): CursorMotion {
  return { x, y, vx: 0, vy: 0, angle: 0, turnRate: 0 };
}

export function advanceCursorMotion(state: CursorMotion, x: number, y: number, steering: number, elapsed: number, maxTrail: number, drifting = true) {
  const dt = Math.min(32, Math.max(1, elapsed));
  const step = dt / (1000 / 60);
  const turn = ((steering - state.angle) % 360 + 540) % 360 - 180;
  state.turnRate = (state.turnRate + turn * .18 * step) * Math.pow(.62, step);
  state.angle += Math.max(-24, Math.min(24, state.turnRate * step));
  if (!drifting) {
    state.x = x; state.y = y; state.vx = 0; state.vy = 0;
    return;
  }
  // Steering turns the body; momentum keeps sliding along the previous path.
  state.vx += (x - state.x) * .0012 * dt;
  state.vy += (y - state.y) * .0012 * dt;
  const heading = (state.angle - 135) * Math.PI / 180;
  const cos = Math.cos(heading), sin = Math.sin(heading);
  const forward = (state.vx * cos + state.vy * sin) * Math.exp(-dt / 42);
  const sideways = (-state.vx * sin + state.vy * cos) * Math.exp(-dt / 85);
  state.vx = forward * cos - sideways * sin;
  state.vy = forward * sin + sideways * cos;
  state.x += state.vx * dt;
  state.y += state.vy * dt;
  const gap = Math.hypot(x - state.x, y - state.y);
  if (gap > maxTrail) {
    state.x = x - (x - state.x) * maxTrail / gap;
    state.y = y - (y - state.y) * maxTrail / gap;
  }
  if (gap < .08 && Math.hypot(state.vx, state.vy) < .005) {
    state.x = x; state.y = y; state.vx = 0; state.vy = 0;
  }
}
