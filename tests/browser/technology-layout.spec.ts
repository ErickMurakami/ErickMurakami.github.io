import { test, expect } from '@playwright/test';

for (const width of [320, 390, 650, 700, 768, 980, 1440]) {
  test(`technology names and logos retain their size and position across languages at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const strip = page.locator('.specialty-strip');
    await strip.scrollIntoViewIfNeeded();
    const measure = () => strip.evaluate(el => {
      const bounds = el.getBoundingClientRect();
      return {
        top: bounds.top + scrollY,
        height: bounds.height,
        technologies: [...el.querySelectorAll('.tech-label')].map(label => {
          const box = label.getBoundingClientRect();
          const image = label.querySelector('img')!;
          const icon = image.getBoundingClientRect();
          const text = label.querySelector('span')!;
          const range = document.createRange();
          range.selectNodeContents(text);
          return {
            name: text.textContent, x: box.x - bounds.x, y: box.y - bounds.y, width: box.width, height: box.height,
            iconWidth: icon.width, iconHeight: icon.height, loaded: image.complete && image.naturalWidth > 0,
            textLines: range.getClientRects().length, fontSize: getComputedStyle(text).fontSize,
          };
        }),
      };
    });
    await expect.poll(async () => (await measure()).technologies.every(tech => tech.loaded)).toBe(true);
    const before = await measure();
    expect(before.technologies).toHaveLength(6);
    for (const path of ['/pt/', '/']) {
      const toggle = (await page.locator('.language-toggle').boundingBox())!;
      await page.mouse.click(toggle.x + toggle.width / 2, toggle.y + toggle.height / 2);
      await expect(page).toHaveURL(path);
      await expect(page.locator('html')).not.toHaveAttribute('data-astro-transition', /.+/);
      await page.evaluate(() => document.fonts.ready);
      await expect.poll(measure).toEqual(before);
    }
    const spring = before.technologies.find(tech => tech.name === 'Spring Boot')!;
    expect(spring.textLines).toBe(1);
    expect(spring.iconWidth).toBe(22);
    expect(spring.iconHeight).toBe(22);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
