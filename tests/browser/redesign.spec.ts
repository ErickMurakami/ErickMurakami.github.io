import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('engineering layouts preserve content, accessibility and native scrolling', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/pt/', '/projects/', '/pt/about/', '/courses/', '/projects/econolyze/']) {
      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1);
      if (route === '/' && [390, 768, 1440].includes(width)) await page.screenshot({ path: `/tmp/portfolio-${width}.png`, fullPage: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} at ${width}`).toBe(true);
      const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations;
      expect(violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
      if (route === '/' || route === '/pt/') {
        await expect(page.locator('.project-card')).toHaveCount(4);
        await expect(page.locator('.showcase-sticky')).not.toHaveCSS('position', 'sticky');
        await page.locator('.primary-nav a[href*="#projects"]').click();
        await expect(page.locator('#projects h2')).toBeInViewport();
        await page.locator('.project-card').last().scrollIntoViewIfNeeded();
        await expect(page.locator('.project-card').last()).toHaveCSS('opacity', '1');
      }
    }
  }
});

test('circuit motion pauses offscreen and reduced motion exposes all content', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.circuit-field')).toHaveClass(/is-visible/);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.locator('.circuit-field')).not.toHaveClass(/is-visible/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/pt/');
  await expect(page.locator('.circuit-signals')).toHaveCSS('display', 'none');
  for (const card of await page.locator('.project-card, .expertise-card').all()) {
    await expect(card).toHaveCSS('opacity', '1');
  }
});
