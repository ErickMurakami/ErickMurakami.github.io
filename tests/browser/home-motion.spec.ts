import { test, expect } from '@playwright/test';

for (const { width, fallback } of [320, 360, 390, 768, 1440].map(width => ({ width, fallback: false })).concat([{ width: 390, fallback: true }])) {
  test(`language changes retain the hero size and music timeline ${width}px${fallback ? ' fallback' : ''}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    if (fallback) await page.addInitScript(() => Object.defineProperty(Element.prototype, 'moveBefore', { configurable: true, value: undefined }));
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const field = page.locator('.circuit-field');
    await expect(field).toHaveClass(/is-visible/);
    await page.evaluate(() => scrollTo({ top: 120, behavior: 'instant' }));
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(120);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const original = await field.boundingBox();
    const heroHeight = await page.locator('.hero').evaluate(el => el.getBoundingClientRect().height);
    await page.evaluate(() => {
      const field = document.querySelector('.circuit-field')!;
      const bar = field.querySelector('.circuit-wave path')!;
      bar.getAnimations()[0].currentTime = 1327;
      Object.assign(window, { retainedMusic: { field, bar } });
    });
    for (const path of ['/pt/', '/']) {
      const before = await field.locator('.circuit-wave path').first().evaluate(el => Number(el.getAnimations()[0].currentTime));
      const toggle = (await page.locator('.language-toggle').boundingBox())!;
      await page.mouse.click(toggle.x + toggle.width / 2, toggle.y + toggle.height / 2);
      await expect(page).toHaveURL(path);
      await expect(page.locator('html')).not.toHaveAttribute('data-astro-transition', /.+/);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => {
        const saved = (window as unknown as { retainedMusic: { field: Element; bar: Element } }).retainedMusic;
        return saved.field === document.querySelector('.circuit-field') && saved.bar === document.querySelector('.circuit-wave path');
      })).toBe(true);
      const box = (await field.boundingBox())!;
      expect(Math.abs(box.height - original!.height)).toBeLessThan(1);
      expect(Math.abs(box.width - original!.width)).toBeLessThan(1);
      expect(await page.locator('.hero').evaluate(el => el.getBoundingClientRect().height)).toBeCloseTo(heroHeight, 1);
      expect(await field.locator('.circuit-wave path').first().evaluate(el => Number(el.getAnimations()[0].currentTime))).toBeGreaterThanOrEqual(before);
      expect(await page.evaluate(() => scrollY)).toBe(120);
    }
  });
}

for (const prefix of ['', '/pt']) {
  test(`incoming sections grow while outgoing sections shrink in either scroll direction ${prefix || 'en'}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${prefix}/`);
    await page.evaluate(() => document.fonts.ready);
    const projects = page.locator('.home-band-projects > .shell');
    const expertise = page.locator('.home-band-expertise > .shell');
    const scale = (locator: typeof projects) => locator.evaluate(el => parseFloat(getComputedStyle(el).scale));
    const top = await page.locator('.home-band-projects').evaluate(el => el.getBoundingClientRect().top + scrollY);
    await page.evaluate(top => scrollTo({ top: top - 780, behavior: 'instant' }), top);
    await expect.poll(() => scale(projects)).toBeLessThan(.95);
    const incoming = await scale(projects), outgoing = await scale(expertise);
    await page.evaluate(top => scrollTo({ top: top - 315, behavior: 'instant' }), top);
    await expect.poll(() => scale(projects)).toBeGreaterThan(incoming + .02);
    await expect.poll(() => scale(expertise)).toBeLessThan(outgoing - .005);
    await page.evaluate(top => scrollTo({ top: top - 780, behavior: 'instant' }), top);
    await expect.poll(() => scale(projects)).toBeCloseTo(incoming, 3);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(projects).toHaveCSS('scale', 'none');
    await expect(expertise).toHaveCSS('scale', 'none');
  });
}

test('scroll start pulses the waveform without restarting its rhythm and reduced motion cancels the response', async ({ page }) => {
  await page.goto('/');
  const field = page.locator('.circuit-field');
  const wave = page.locator('.wave-scroll-response');
  await expect(field).toHaveClass(/is-visible/);
  await field.locator('.circuit-wave path').first().evaluate(el => { el.getAnimations()[0].currentTime = 1327; });
  await page.mouse.move(1000, 350);
  await page.mouse.wheel(0, 120);
  await expect.poll(() => wave.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m22), { intervals: [16, 32, 50] }).toBeGreaterThan(1.01);
  expect(await field.locator('.circuit-wave path').first().evaluate(el => Number(el.getAnimations()[0].currentTime))).toBeGreaterThan(1327);
  await expect.poll(() => wave.evaluate(el => el.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
  await page.mouse.wheel(0, -60);
  await expect.poll(() => wave.evaluate(el => el.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => wave.evaluate(el => el.getAnimations().length)).toBe(0);
  await expect(page.locator('.circuit-wave')).toHaveCSS('transform', 'none');
  await expect(page.locator('.hero-copy')).toHaveCSS('scale', 'none');
});

test('a scroll pulse keeps playing through a language change', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.circuit-field')).toHaveClass(/is-visible/);
  const wave = page.locator('.wave-scroll-response');
  await page.mouse.wheel(0, 120);
  await expect.poll(() => wave.evaluate(el => el.getAnimations().length)).toBe(1);
  const before = await wave.evaluate(el => {
    const animation = el.getAnimations()[0];
    Object.assign(window, { savedScrollPulse: animation });
    return Number(animation.currentTime);
  });
  const toggle = (await page.locator('.language-toggle').boundingBox())!;
  await page.mouse.click(toggle.x + toggle.width / 2, toggle.y + toggle.height / 2);
  await expect(page).toHaveURL('/pt/');
  const result = await page.evaluate(() => {
    const animation = (window as unknown as { savedScrollPulse: Animation }).savedScrollPulse;
    return {
      time: Number(animation.currentTime), state: animation.playState,
      sameElement: (animation.effect as KeyframeEffect).target === document.querySelector('.wave-scroll-response'),
    };
  });
  expect(result.sameElement).toBe(true);
  expect(result.state).not.toBe('idle');
  expect(result.time).toBeGreaterThanOrEqual(before);
});
