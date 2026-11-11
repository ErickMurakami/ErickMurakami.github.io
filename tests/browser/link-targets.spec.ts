import { test, expect } from "@playwright/test";

test("external and document links use new tabs while internal navigation stays in place", async ({
  page,
}) => {
  for (const route of [
    "/",
    "/pt/",
    "/about/",
    "/pt/about/",
    "/projects/econolyze/",
    "/pt/projects/econolyze/",
    "/projects/roast-my-taste/",
    "/pt/projects/roast-my-taste/",
  ]) {
    await page.goto(route);
    const links = await page.locator("a[href]").evaluateAll((anchors) =>
      anchors.map((node) => {
        const link = node as HTMLAnchorElement;
        return {
          href: link.getAttribute("href")!,
          target: link.target,
          rel: link.rel,
          download: link.hasAttribute("download"),
        };
      }),
    );
    for (const link of links) {
      const url = new URL(link.href, page.url());
      if (
        url.origin !== new URL(page.url()).origin ||
        /\.pdf(?:[?#]|$)/i.test(link.href)
      ) {
        expect(link.target, link.href).toBe("_blank");
        expect(link.rel.split(/\s+/)).toEqual(
          expect.arrayContaining(["noopener", "noreferrer"]),
        );
        expect(link.download).toBe(false);
      } else expect(link.target, link.href).not.toBe("_blank");
    }
  }
  await expect(page.locator('.prose a[target="_blank"]').first()).toBeVisible();
});

test("native links keep the portfolio open, including without JavaScript", async ({
  browser,
}) => {
  for (const javaScriptEnabled of [true, false]) {
    const context = await browser.newContext({ javaScriptEnabled });
    // Intercept external destinations and stub PDF rendering: never contact production.
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.hostname !== "127.0.0.1" || url.pathname.endsWith(".pdf"))
        return route.fulfill({
          contentType: "text/html",
          body: "<title>Intercepted link target</title>",
        });
      return route.continue();
    });
    const page = await context.newPage();
    await page.goto("/pt/");
    for (const selector of [
      '.hero a[href="https://github.com/ErickMurakami"]',
      ".hero-resume",
    ]) {
      const link = page.locator(selector);
      const expected = await link.getAttribute("href");
      const opened = page.waitForEvent("popup");
      await link.click();
      const popup = await opened;
      await popup.waitForLoadState();
      await expect(popup).toHaveURL(new URL(expected!, page.url()).href);
      await expect(page).toHaveURL("/pt/");
      await popup.close();
    }
    await context.close();
  }
});
