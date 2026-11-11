import { test, expect } from '@playwright/test';
import { createCursorMotion, advanceCursorMotion } from '../../src/scripts/cursor-motion';

test('scroll direction changes turn smoothly toward the requested heading', () => {
  const state = createCursorMotion();
  for (const heading of [225, 45]) {
    const before = state.angle;
    advanceCursorMotion(state, heading, 1000 / 60);
    expect(Math.abs(state.angle - before)).toBeGreaterThan(0);
    expect(Math.abs(state.angle - before)).toBeLessThan(30);
    for (let i = 0; i < 120; i++) advanceCursorMotion(state, heading, 1000 / 60);
    expect(Math.abs(((state.angle - heading) % 360 + 540) % 360 - 180)).toBeLessThan(.1);
  }
});

test('the arrow returns to its normal orientation after scrolling stops', () => {
  const state = createCursorMotion();
  for (let i = 0; i < 30; i++) advanceCursorMotion(state, 225, 16);
  for (let i = 0; i < 180; i++) advanceCursorMotion(state, 0, 16);
  expect(Math.abs(state.angle)).toBeLessThan(.1);
  expect(Math.abs(state.turnRate)).toBeLessThan(.1);
});
