import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('engineering layouts preserve content, accessibility and native scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
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
        await expect(page.locator('.project-card')).toHaveCount(5);
        await expect(page.locator('.showcase-sticky')).not.toHaveCSS('position', 'sticky');
        expect(await page.locator('.home-band-expertise').evaluate(el => !!el.previousElementSibling?.classList.contains('specialty-strip'))).toBe(true);
        await expect(page.locator('.specialty-strip img').first()).toHaveCSS('filter', 'none');
        const hero = await page.locator('.hero').boundingBox();
        const circuit = await page.locator('.circuit-field').boundingBox();
        expect(Math.abs(hero!.width - circuit!.width)).toBeLessThan(2);
        expect(Math.abs(hero!.height - circuit!.height)).toBeLessThan(2);
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
  await expect(page.locator('.circuit-wave rect').first()).toHaveCSS('animation-play-state', 'running');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.locator('.circuit-field')).not.toHaveClass(/is-visible/);
  await expect(page.locator('.circuit-wave rect').first()).toHaveCSS('animation-play-state', 'paused');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/pt/');
  await expect(page.locator('.circuit-signals')).toHaveCSS('display', 'none');
  await expect(page.locator('.circuit-wave rect').first()).toHaveCSS('animation-name', 'none');
  for (const card of await page.locator('.project-card, .expertise-card').all()) {
    await expect(card).toHaveCSS('opacity', '1');
  }
});

test('project continuity, translated button sizes and brand colors stay consistent', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const dimensions = () => page.locator('.hero .actions .button').evaluateAll(elements => elements.map(el => {
      const { width, height } = el.getBoundingClientRect();
      return { width, height };
    }));
    const english = await dimensions();
    await page.locator('.language-toggle').click();
    await expect(page).toHaveURL('/pt/');
    await page.evaluate(() => document.fonts.ready);
    expect(await dimensions()).toEqual(english);
    await expect(page.locator('#projects .project-grid')).toHaveCount(1);
    await expect(page.locator('#projects .project-grid > .project-card')).toHaveCount(5);
    await expect(page.locator('.project-continuation')).toHaveCount(0);
    await expect(page.locator('.specialty-strip img[src="/technologies/langchain4j.png"]')).toHaveCount(1);
    await expect(page.locator('#projects [data-project="quarkus-schema-per-tenant"] img[src="/technologies/flyway.svg"]')).toHaveCount(1);
    const brand = page.locator('.header .brand-symbol');
    const foreground = await page.locator('body').evaluate(el => getComputedStyle(el).color);
    await expect(brand).toHaveCSS('color', foreground);
    await expect(brand.locator('span')).not.toHaveCSS('color', foreground);
  }
  await page.goto('/projects/quarkus-schema-per-tenant/');
  await expect(page.locator('.case-header img[src="/technologies/flyway.svg"]')).toHaveCount(1);
});
