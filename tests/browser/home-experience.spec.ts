import { test, expect } from "@playwright/test";

for (const prefix of ["", "/pt"]) {
  test(`home section navigation keeps URLs clean and survives language switching ${prefix || "en"}`, async ({ page }) => {
    await page.goto(`${prefix}/`);
    for (const section of ["projects", "contact"]) {
      await page.locator(`.primary-nav a[href="${prefix}/#${section}"]`).click();
      await expect(page).toHaveURL(`${prefix}/`);
      await expect(page.locator(`#${section} h2`).first()).toBeInViewport();
      await expect(page.locator(`.primary-nav a[href="${prefix}/#${section}"]`)).toHaveAttribute("aria-current", "location");
    }
    const toggle = (await page.locator('.language-toggle').boundingBox())!;
    await page.mouse.click(toggle.x + toggle.width / 2, toggle.y + toggle.height / 2);
    await expect(page).toHaveURL(prefix ? "/" : "/pt/");
    await expect(page.locator('#contact h2')).toBeInViewport();
  });
}

test("light mode stays selected after refresh, language switches and project navigation", async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('theme')) localStorage.setItem('theme', 'light'); });
  await page.goto('/');
  const light = async () => {
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(245, 241, 232)');
    await expect(page.locator('.theme-icon-moon')).toBeVisible();
  };
  await light();
  await page.reload();
  await light();
  await page.locator('.language-toggle').click();
  await light();
  await page.locator('[data-project="RoastMyTaste"] .project-title-link').click();
  await expect(page).toHaveURL('/pt/projects/roast-my-taste/');
  await light();
  await page.locator('.theme').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(13, 15, 20)');
  await expect(page.locator('.theme-icon-sun')).toBeVisible();
  await page.locator('.theme').click();
  await light();
});

test("project hover cue follows an actual card link and leaves GitHub controls independent", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const card = page.locator('[data-project="RoastMyTaste"]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveCSS('opacity', '1');
  const box = (await card.boundingBox())!;
  const point = { x: box.x + box.width * .75, y: box.y + 60 };
  await page.mouse.move(point.x, point.y);
  await expect(page.locator('[data-project-cursor]')).toHaveClass(/is-visible/);
  expect((await page.locator('[data-project-cursor]').boundingBox())!.width).toBeLessThanOrEqual(24);
  await expect(page.locator('[data-project-cursor] svg')).toHaveCount(1);
  await expect(page.locator('body')).toHaveCSS('cursor', /arrow-dark\.svg/);
  const beforeScroll = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 30);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(beforeScroll);
  await expect(page.locator('[data-project-cursor]')).toHaveClass(/is-visible/);
  await expect(card).toHaveClass(/has-view-cursor/);
  await card.locator('a[target="_blank"]').hover();
  await expect(page.locator('[data-project-cursor]')).not.toHaveClass(/is-visible/);
  await page.mouse.move(point.x, point.y);
  await page.mouse.wheel(0, 1200);
  await expect(page.locator('[data-project-cursor]')).not.toHaveClass(/is-visible/);
  await card.scrollIntoViewIfNeeded();
  const returned = (await card.boundingBox())!;
  await page.mouse.click(returned.x + returned.width * .75, returned.y + 60);
  await expect(page).toHaveURL('/projects/roast-my-taste/');
  await page.goto('/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('[data-project="RoastMyTaste"]').hover();
  await expect(page.locator('[data-project-cursor]')).toBeHidden();
});

test("scroll reveals finish with readable content and respect a changed motion preference", async ({ page }) => {
  await page.goto('/');
  const card = page.locator('[data-project="RoastMyTaste"]');
  await expect(card).toHaveCSS('opacity', '0');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveCSS('opacity', '1');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const entry of await page.locator('.reveal').all()) await expect(entry).toHaveCSS('opacity', '1');
});
