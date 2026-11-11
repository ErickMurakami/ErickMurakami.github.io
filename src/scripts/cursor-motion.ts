export interface CursorMotion {
  angle: number; turnRate: number;
}

export function createCursorMotion(): CursorMotion {
  return { angle: 0, turnRate: 0 };
}

export function advanceCursorMotion(state: CursorMotion, steering: number, elapsed: number) {
  const dt = Math.min(32, Math.max(1, elapsed));
  const step = dt / (1000 / 60);
  const turn = ((steering - state.angle) % 360 + 540) % 360 - 180;
  state.turnRate = (state.turnRate + turn * .18 * step) * Math.pow(.62, step);
  state.angle += Math.max(-24, Math.min(24, state.turnRate * step));
}
