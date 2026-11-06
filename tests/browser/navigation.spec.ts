import { test, expect } from "@playwright/test";

async function markDocument(page: import("@playwright/test").Page) {
  await page.evaluate(() =>
    Object.assign(window, { navigationMarker: "same-document" }),
  );
}
async function expectSameDocument(page: import("@playwright/test").Page) {
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { navigationMarker?: string }).navigationMarker,
    ),
  ).toBe("same-document");
}

async function clickLanguage(page: import("@playwright/test").Page) {
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-astro-transition",
    /.+/,
  );
  const destination = await page
    .locator(".language-toggle")
    .evaluate((el) => (el as HTMLAnchorElement).href);
  // A visible sticky-header control needs no automatic scrollIntoView step.
  const box = await page.locator(".language-toggle").boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(page).toHaveURL(destination);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-astro-transition",
    /.+/,
  );
}

test("language navigation keeps the document, theme, showcase progress and history", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await markDocument(page);
  await page.locator(".theme").click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.locator("[data-expertise-showcase]").evaluate((el) => {
    const section = el as HTMLElement;
    const travel =
      section.offsetHeight -
      (section.querySelector(".showcase-sticky") as HTMLElement).offsetHeight;
    scrollTo({
      top:
        section.offsetTop -
        parseFloat(section.style.getPropertyValue("--showcase-top")) +
        travel * 0.65,
      behavior: "instant",
    });
  });
  await expect(page.locator("[data-expertise-showcase]")).toHaveAttribute(
    "data-active-card",
    "2",
  );
  const scroll = await page.evaluate(() => scrollY);
  await clickLanguage(page);
  await expect(page).toHaveURL(/\/pt\/$/);
  await expectSameDocument(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.locator("[data-expertise-showcase]")).toHaveAttribute(
    "data-active-card",
    "2",
  );
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(scroll, 0);
  await expect(page).toHaveTitle(/Engenheiro de Software/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /^Projetos backend/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://erickmurakami.github.io/pt/",
  );
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
    "href",
    "https://erickmurakami.github.io/",
  );
  await page.goBack();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expectSameDocument(page);
  await expect(page.locator("[data-expertise-showcase]")).toHaveAttribute(
    "data-active-card",
    "2",
  );
  await page.goForward();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expectSameDocument(page);
  await clickLanguage(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expectSameDocument(page);
  await page.locator(".theme").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(errors).toEqual([]);
});

test("translated project navigation keeps reading position and replaces SEO metadata", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/projects/logistic/");
  await markDocument(page);
  await page.evaluate(() => scrollTo({ top: 600, behavior: "instant" }));
  await expect(page.locator(".header")).toHaveClass(/is-compact/);
  await page
    .locator(".case-title")
    .evaluate((el) =>
      Promise.all(el.getAnimations().map((animation) => animation.finished)),
    );
  const readingY = await page.evaluate(() => scrollY);
  await clickLanguage(page);
  await expect(page).toHaveURL(/\/pt\/projects\/logistic\/$/);
  await expectSameDocument(page);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(readingY);
  await expect(page.locator(".header")).toHaveClass(/is-compact/);
  await expect(page.locator(".case-title")).toHaveText("Logistic");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /^API de entregas/,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://erickmurakami.github.io/pt/projects/logistic/",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://erickmurakami.github.io/pt/projects/logistic/",
  );
  await clickLanguage(page);
  await expect(page).toHaveURL(/\/projects\/logistic\/$/);
  await expectSameDocument(page);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(readingY);
  await page.locator(".brand").click();
  await expect(page).toHaveURL(/127\.0\.0\.1:4321\/$/);
  await expect(page.locator("[data-expertise-showcase]")).toHaveClass(
    /is-scroll-showcase/,
  );
  await expect(page.locator("#projects h2")).toBeInViewport();
  await expectSameDocument(page);
  expect(errors).toEqual([]);
});

test("repeated language swaps do not accumulate observers or window listeners", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const intersections = new Set<IntersectionObserver>();
    const resizes = new Set<ResizeObserver>();
    const NativeIntersection = window.IntersectionObserver;
    const NativeResize = window.ResizeObserver;
    window.IntersectionObserver = class extends NativeIntersection {
      observe(target: Element) {
        if (target.matches("[data-expertise-showcase]"))
          intersections.add(this);
        super.observe(target);
      }
      disconnect() {
        intersections.delete(this);
        super.disconnect();
      }
    };
    window.ResizeObserver = class extends NativeResize {
      observe(target: Element, options?: ResizeObserverOptions) {
        if (target.matches(".header")) resizes.add(this);
        super.observe(target, options);
      }
      disconnect() {
        resizes.delete(this);
        super.disconnect();
      }
    };
    const listeners: { type: string; signal?: AbortSignal }[] = [];
    const add = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (
      type,
      callback,
      options,
    ) {
      if (this === window && ["scroll", "resize", "hashchange"].includes(type))
        listeners.push({
          type,
          signal: typeof options === "object" ? options.signal : undefined,
        });
      return add.call(this, type, callback, options);
    };
    Object.assign(window, {
      observerSnapshot: () => ({
        intersections: intersections.size,
        resizes: resizes.size,
        listeners: listeners
          .filter((item) => !item.signal?.aborted)
          .map((item) => item.type)
          .sort(),
      }),
    });
  });
  await page.goto("/");
  await expect(page.locator("[data-expertise-showcase]")).toHaveClass(
    /is-scroll-showcase/,
  );
  const snapshot = () =>
    page.evaluate(() =>
      (
        window as unknown as { observerSnapshot: () => unknown }
      ).observerSnapshot(),
    );
  const baseline = await snapshot();
  expect(baseline).toMatchObject({ intersections: 1, resizes: 1 });
  for (let i = 0; i < 6; i++) {
    await clickLanguage(page);
    await expect(page.locator("html")).toHaveAttribute(
      "lang",
      i % 2 === 0 ? "pt-BR" : "en",
    );
    await expect(page.locator("[data-expertise-showcase]")).toHaveClass(
      /is-scroll-showcase/,
    );
    await expect.poll(snapshot).toEqual(baseline);
    await page.locator(".theme").click();
    await expect(page.locator("html")).toHaveClass(
      i % 2 === 0 ? /^(?!.*dark)/ : /dark/,
    );
  }
});

test("language links still work without JavaScript and reduced motion stays static", async ({
  browser,
}) => {
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJs.newPage();
  await staticPage.goto("/projects/econolyze/");
  await staticPage.locator(".language-toggle").click();
  await expect(staticPage).toHaveURL(/\/pt\/projects\/econolyze\/$/);
  await expect(staticPage.locator("html")).toHaveAttribute("lang", "pt-BR");
  await noJs.close();
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const page = await reduced.newPage();
  await page.goto("/");
  await markDocument(page);
  await clickLanguage(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expectSameDocument(page);
  await expect(page.locator("[data-expertise-showcase]")).not.toHaveClass(
    /is-scroll-showcase/,
  );
  for (const card of await page.locator(".expertise-card").all())
    await expect(card).toHaveCSS("opacity", "1");
  await reduced.close();
});

test("Projects header links skip the sticky sequence and language swaps keep the section", async ({
  page,
}) => {
  await page.goto("/");
  await markDocument(page);
  await page
    .locator(".primary-nav")
    .getByRole("link", { name: "Projects", exact: true })
    .click();
  await expect(page).toHaveURL(/\/#projects$/);
  const assertHeading = async () => {
    await expect
      .poll(async () => {
        const heading = await page.locator("#projects h2").boundingBox();
        const header = await page.locator(".header").boundingBox();
        return heading!.y - header!.height;
      })
      .toBeLessThan(60);
    await expect(
      page.locator("#projects .project-card h3 a").first(),
    ).toBeInViewport();
  };
  await assertHeading();
  await clickLanguage(page);
  await expect(page).toHaveURL(/\/pt\/#projects$/);
  await assertHeading();
  await expectSameDocument(page);
  await page.locator("#projects .project-card h3 a").first().click();
  await expect(page).toHaveURL(/\/pt\/projects\/econolyze\/$/);
  await page.locator(".case-back").click();
  await expect(page).toHaveURL(/\/pt\/projects\/$/);
  await expect(page.locator("h1")).toHaveText("Projetos");
});

test("a failed client fetch falls back to an ordinary document navigation", async ({
  page,
}) => {
  await page.goto("/");
  let intercepted = false;
  await page.route("**/pt/", (route) => {
    if (!intercepted && route.request().resourceType() === "fetch") {
      intercepted = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      });
    }
    return route.continue();
  });
  await page.locator(".language-toggle").click();
  await expect(page).toHaveURL(/\/pt\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  expect(intercepted).toBe(true);
});
