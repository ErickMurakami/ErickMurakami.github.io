import { test, expect } from "@playwright/test";

for (const viewport of [
  { width: 360, height: 780 },
  { width: 384, height: 832 },
  { width: 390, height: 844 },
]) {
  test(`phone showcase stays readable and reverses at ${viewport.width}px`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    for (const route of ["/", "/pt/"])
      for (const theme of ["dark", "light"]) {
        await page.addInitScript(
          (value) => localStorage.setItem("theme", value),
          theme,
        );
        await page.goto(route);
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        const section = page.locator("[data-expertise-showcase]");
        await expect(section).toHaveClass(/is-scroll-showcase/);
        const geometry = await section.evaluate((el) => ({
          start:
            el.getBoundingClientRect().top +
            scrollY -
            parseFloat(
              (el as HTMLElement).style.getPropertyValue("--showcase-top"),
            ),
          travel:
            (el as HTMLElement).offsetHeight -
            (el.querySelector(".showcase-sticky") as HTMLElement).offsetHeight,
        }));
        const strip = await page.locator(".specialty-strip").boundingBox();
        expect(strip!.y + strip!.height).toBeLessThanOrEqual(viewport.height);
        for (const index of [0, 1, 2, 3, 2, 1, 0]) {
          await page.evaluate(
            (y) => scrollTo({ top: y, behavior: "instant" }),
            geometry.start + geometry.travel * (index === 3 ? 0.94 : index / 3),
          );
          await expect(section).toHaveAttribute(
            "data-active-card",
            String(index),
          );
          await expect(page.locator(".expertise-card.is-active")).toHaveCSS(
            "opacity",
            "1",
          );
          const current = await page.locator(".specialty-strip").boundingBox();
          expect(Math.abs(current!.y - strip!.y)).toBeLessThan(2);
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
          const card = page.locator(".expertise-card.is-active");
          expect(
            await card.evaluate((el) => el.scrollHeight <= el.clientHeight),
          ).toBe(true);
        }
        await page.locator('.primary-nav a[href*="#projects"]').click();
        await expect(page.locator("#projects h2")).toBeInViewport();
      }
    await context.close();
  });
}

test("phone header keeps links and touch controls usable on home and case studies", async ({
  page,
}) => {
  for (const width of [320, 360, 384, 412]) {
    await page.setViewportSize({ width, height: 832 });
    for (const route of [
      "/",
      "/pt/",
      "/projects/econolyze/",
      "/pt/projects/econolyze/",
    ]) {
      await page.goto(route);
      for (const selector of [
        ".brand",
        ".language-toggle",
        ".theme",
        ".primary-nav a",
      ]) {
        for (const control of await page.locator(selector).all()) {
          await expect(control).toBeInViewport();
          const box = (await control.boundingBox())!;
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width);
        }
      }
      const toggle = page.locator(".theme");
      const before = await toggle.getAttribute("aria-pressed");
      await toggle.click();
      await expect(toggle).not.toHaveAttribute("aria-pressed", before!);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});
