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

for (const route of ['/', '/projects/', '/pt/projects/']) {
  test(`native eye cursor persists while scrolling and leaves clickable controls independent ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(route);
    const card = page.locator('[data-project="RoastMyTaste"]');
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveCSS('opacity', '1');
    // Leave room to scroll the last card on the shorter standalone listings.
    await card.evaluate(el => window.scrollBy({
      top: el.getBoundingClientRect().top - (innerHeight - 200), behavior: 'instant',
    }));
    const box = (await card.boundingBox())!;
    const point = { x: box.x + box.width * .75, y: box.y + 60 };
    const cursorAtPointer = () => page.evaluate(({ x, y }) => {
      const target = document.elementFromPoint(x, y);
      return target ? getComputedStyle(target).cursor : '';
    }, point);
    await page.mouse.move(point.x, point.y);
    await expect.poll(cursorAtPointer).toMatch(/view-dark\.svg/);
    await expect(page.locator('[data-drift-cursor]')).toBeHidden();
    for (const distance of [25, 30, 25]) {
      const beforeScroll = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, distance);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(beforeScroll);
      await expect.poll(cursorAtPointer).toMatch(/view-dark\.svg/);
    }
    await page.evaluate(({ x, y }) => {
      document.elementFromPoint(x, y)?.dispatchEvent(new PointerEvent('pointerout', {
        bubbles: true, relatedTarget: null, clientX: x, clientY: y,
      }));
    }, point);
    await expect.poll(cursorAtPointer).toMatch(/view-dark\.svg/);
    await card.locator('a[target="_blank"]').hover();
    await expect(card.locator('a[target="_blank"]')).toHaveCSS('cursor', /hand-dark\.svg/);
    await page.mouse.move(point.x, point.y);
    await page.mouse.wheel(0, 1200);
    await expect.poll(cursorAtPointer).not.toMatch(/view-dark\.svg/);
    await card.scrollIntoViewIfNeeded();
    const returned = (await card.boundingBox())!;
    await page.mouse.click(returned.x + returned.width * .75, returned.y + 60);
    await expect(page).toHaveURL(`${route.startsWith('/pt/') ? '/pt' : ''}/projects/roast-my-taste/`);
    await page.goto(route);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('[data-project="RoastMyTaste"]').hover();
    await expect(page.locator('[data-project="RoastMyTaste"]')).not.toHaveCSS('cursor', /view-dark\.svg/);
  });
}

test("waveform slightly accentuates on scroll, settles, and respects reduced motion", async ({ page }) => {
  await page.goto('/');
  const wave = page.locator('.circuit-wave');
  const scale = () => wave.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m22);
  await page.mouse.move(1000, 350);
  await page.mouse.wheel(0, 120);
  await expect.poll(scale).toBeGreaterThan(1.005);
  expect(await scale()).toBeLessThanOrEqual(1.15);
  await expect.poll(scale).toBeCloseTo(1, 2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.mouse.wheel(0, -60);
  await expect(wave).toHaveCSS('transform', 'none');
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

for (const theme of ['dark', 'light']) {
  for (const route of ['/', '/projects/roast-my-taste/']) {
    test(`scroll cursor follows page movement and resets ${theme} ${route}`, async ({ page }) => {
      await page.addInitScript(value => localStorage.setItem('theme', value), theme);
      await page.goto(route);
      await page.mouse.move(20, 400);
      const root = page.locator('html');
      const body = page.locator('body');
      const cursor = page.locator('[data-drift-cursor]');
      const turnFrom = (target: number) => cursor.evaluate((el, target) => {
        const matrix = el.querySelector('path')!.getCTM()!;
        const angle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
        return Math.abs(((angle - target) % 360 + 540) % 360 - 180);
      }, target);
      for (const [distance, direction] of [[120, 'down'], [-80, 'up']] as const) {
        await page.mouse.wheel(0, distance);
        await expect(root).toHaveAttribute('data-scroll-direction', direction);
        await expect(cursor).toBeVisible();
        await expect.poll(() => turnFrom(direction === 'down' ? 225 : 45), { intervals: [16, 32, 50] }).toBeLessThan(20);
        await expect(root).not.toHaveAttribute('data-scroll-direction', /.+/);
        await expect.poll(() => turnFrom(0)).toBeLessThan(3);
      }
      await page.keyboard.press('PageDown');
      await expect(root).toHaveAttribute('data-scroll-direction', 'down');
      await expect.poll(() => turnFrom(225), { intervals: [16, 32, 50] }).toBeLessThan(20);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(root).not.toHaveAttribute('data-scroll-direction', /.+/);
      await expect(cursor).toBeHidden();
      await page.mouse.wheel(0, 40);
      await expect(body).not.toHaveCSS('cursor', /scroll-.*\.svg/);
    });
  }
}

test('arrow drifts with mouse direction, settles and gives way to the native project eye', async ({ page }) => {
  await page.goto('/');
  const cursor = page.locator('[data-drift-cursor]');
  await page.mouse.move(80, 300);
  await page.mouse.move(240, 300, { steps: 8 });
  await expect(cursor).toBeVisible();
  const heading = () => cursor.evaluate(el => {
    const matrix = el.querySelector('path')!.getCTM()!;
    return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
  });
  await expect.poll(heading, { intervals: [16, 32, 50] }).toBeGreaterThan(90);
  await expect.poll(async () => Math.abs(await heading())).toBeLessThan(3);
  const tip = await cursor.evaluate(el => {
    const matrix = el.querySelector('path')!.getScreenCTM()!;
    return { x: matrix.a * 3 + matrix.c * 3 + matrix.e, y: matrix.b * 3 + matrix.d * 3 + matrix.f };
  });
  expect(Math.hypot(tip.x - 240, tip.y - 300)).toBeLessThan(1);
  const card = page.locator('[data-project="RoastMyTaste"]');
  await card.hover();
  await expect(cursor).toBeHidden();
  await expect(card).toHaveCSS('cursor', /view-dark\.svg/);
  await page.mouse.wheel(0, 30);
  await expect(cursor).toBeHidden();
  await expect(card).toHaveCSS('cursor', /view-dark\.svg/);
});

for (const [screenWidth, density, size] of [[1440, 1, 28], [1920, 1.5, 32], [2560, 2, 40]]) {
  test(`cursor size follows the monitor at ${screenWidth}px and ${density}x density`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, screen: { width: screenWidth, height: 1440 }, deviceScaleFactor: density });
    try {
      const page = await context.newPage();
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-cursor-size', String(size));
      const suffix = size === 28 ? '' : `-${size}`;
      // CI may deliver a pointer event before navigation finishes; validate the
      // configured fallback without assuming the floating arrow is still inactive.
      await expect(page.locator('html')).toHaveCSS('--cursor-arrow-dark', new RegExp(`arrow-dark${suffix}\\.svg`));
      await page.mouse.move(100, 300);
      const cursor = page.locator('[data-drift-cursor]');
      await expect(cursor).toBeVisible();
      await expect(page.locator('body')).toHaveCSS('cursor', 'none');
      await expect(cursor).toHaveCSS('width', `${size}px`);
      await expect.poll(async () => (await cursor.boundingBox())!.x).toBeGreaterThan(80);
      const box = (await cursor.boundingBox())!;
      expect(Math.abs(box.x * density - Math.round(box.x * density))).toBeLessThan(.01);
      const card = page.locator('[data-project="RoastMyTaste"]');
      await card.hover();
      await expect(card).toHaveCSS('cursor', new RegExp(`view-dark${suffix}\\.svg`));
      await expect(cursor).toBeHidden();
      const response = await page.request.get(`/cursors/view-dark${suffix}.svg`);
      expect(response.ok()).toBe(true);
      expect(await response.text()).toContain(`width="${size}" height="${size}"`);
      await page.evaluate(() => {
        Object.defineProperty(screen, 'width', { configurable: true, value: 2560 });
        window.dispatchEvent(new Event('resize'));
      });
      await expect(page.locator('html')).toHaveAttribute('data-cursor-size', '40');
      await expect(card).toHaveCSS('cursor', /view-dark-40\.svg/);
    } finally { await context.close(); }
  });
}
