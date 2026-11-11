import { test, expect } from '@playwright/test';
import { createCursorMotion, advanceCursorMotion } from '../../src/scripts/cursor-motion';

test('cursor momentum slides through a corner while steering changes, within a bounded trail', () => {
  const state = createCursorMotion(100, 200);
  let x = 100, y = 200;
  for (let i = 0; i < 25; i++) {
    x += 6;
    advanceCursorMotion(state, x, y, 135, 1000 / 60, 10);
  }
  let largestSlip = 0;
  const before = state.x;
  for (let i = 0; i < 12; i++) {
    y -= 6;
    advanceCursorMotion(state, x, y, 45, 1000 / 60, 10);
    const velocityHeading = Math.atan2(state.vy, state.vx) * 180 / Math.PI;
    largestSlip = Math.max(largestSlip, Math.abs(((velocityHeading - (state.angle - 135)) % 360 + 540) % 360 - 180));
    expect(Math.hypot(x - state.x, y - state.y)).toBeLessThanOrEqual(10.001);
    if (!i) expect(state.x).toBeGreaterThan(before);
  }
  expect(largestSlip).toBeGreaterThan(15);
  for (let i = 0; i < 180; i++) advanceCursorMotion(state, x, y, 0, 1000 / 60, 10);
  expect(Math.hypot(x - state.x, y - state.y)).toBeLessThan(.1);
  expect(Math.hypot(state.vx, state.vy)).toBeLessThan(.005);
});

test('interactive cursor modes stay aligned instead of inheriting the car slide', () => {
  const state = createCursorMotion(0, 0);
  advanceCursorMotion(state, 200, 100, 135, 16, 10);
  advanceCursorMotion(state, 300, 150, 0, 16, 10, false);
  expect([state.x, state.y, state.vx, state.vy]).toEqual([300, 150, 0, 0]);
});
