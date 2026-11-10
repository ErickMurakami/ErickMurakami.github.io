import { test, expect } from "@playwright/test";

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
