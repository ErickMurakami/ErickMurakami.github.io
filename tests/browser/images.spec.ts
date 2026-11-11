import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const prefix of ['', '/pt']) {
  for (const width of [390, 1440]) {
    test(`image preview preserves the page, focus and scroll ${prefix || 'en'} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${prefix}/projects/roast-my-taste/`);
      const button = page.locator('[data-image-zoom]').first();
      await expect(page.locator('[data-image-zoom]')).toHaveCount(3);
      // Hover first so automation has finished positioning the tall image;
      // the following physical click must not scroll it into a different view.
      await button.hover();
      const original = { url: page.url(), scroll: await page.evaluate(() => scrollY), history: await page.evaluate(() => history.length) };
      const viewer = page.locator('[data-image-viewer]');
      // Record the exact pre-open position, after any browser focus/scroll work.
      await page.evaluate(() => document.addEventListener('click', () => {
        document.documentElement.dataset.imagePreviewScroll = String(scrollY);
      }, { capture: true, once: true }));
      await page.mouse.down();
      await page.mouse.up();
      original.scroll = await page.evaluate(() => {
        const value = Number(document.documentElement.dataset.imagePreviewScroll);
        delete document.documentElement.dataset.imagePreviewScroll;
        return value;
      });
      await expect(viewer).toBeVisible();
      await expect(viewer.locator('[data-image-viewer-close]')).toBeInViewport();
      const image = viewer.locator('img');
      await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      expect(page.url()).toBe(original.url);
      expect(await page.evaluate(() => history.length)).toBe(original.history);
      expect(await page.evaluate(() => [...document.images].every(img => !img.draggable))).toBe(true);
      const box = (await image.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.y + box.height).toBeLessThanOrEqual(900);
      await image.click();
      await expect(viewer).toBeVisible();
      await page.mouse.wheel(0, 400);
      expect(await page.evaluate(() => scrollY)).toBe(original.scroll);
      await page.mouse.click(5, 5);
      await expect(viewer).toBeHidden();
      await expect(button).toBeFocused();
      expect(await page.evaluate(() => scrollY)).toBe(original.scroll);
      await button.press('Enter');
      await expect(viewer).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(viewer).toBeHidden();
      await expect(button).toBeFocused();
      await button.click();
      await viewer.locator('[data-image-viewer-close]').click();
      await expect(viewer).toBeHidden();
    });
  }
}

test('image dialog remains accessible in both themes and keeps the custom cursor in its top layer', async ({ page }) => {
  await page.goto('/projects/roast-my-taste/');
  for (const theme of ['dark', 'light']) {
    if (await page.locator('html').getAttribute('data-theme') !== theme) await page.locator('.theme').click();
    await page.locator('[data-image-zoom]').last().click();
    const viewer = page.locator('[data-image-viewer]');
    await expect(viewer.locator('[data-drift-cursor]')).toHaveCount(1);
    const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations;
    expect(violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(page.locator('body > [data-drift-cursor]')).toHaveCount(1);
  }
});

test('static images remain visible and non-draggable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('/projects/roast-my-taste/');
    await expect(page.locator('.project-screenshot img')).toHaveCount(3);
    expect(await page.evaluate(() => [...document.images].every(img => !img.draggable))).toBe(true);
    await expect(page.locator('.project-screenshot a')).toHaveCount(0);
  } finally { await context.close(); }
});
