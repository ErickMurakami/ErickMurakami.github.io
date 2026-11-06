import { existsSync } from "node:fs";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const routes = [
  "/",
  "/projects/econolyze/",
  "/projects/logistic/",
  "/projects/quarkus-rate-limiter/",
  "/projects/quarkus-schema-per-tenant/",
  "/404.html",
];
const allRoutes = [
  ...routes,
  ...routes.map((route) =>
    route === "/404.html" ? "/pt/404/" : `/pt${route}`,
  ),
];
for (const theme of ["dark", "light"]) {
  test(`${theme} theme: routes, accessibility and responsive layout`, async ({
    page,
  }) => {
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of allRoutes) {
        const response = await page.goto(route);
        expect(
          response?.ok() ||
            (route === "/404.html" && response?.status() === 404),
          route,
        ).toBeTruthy();
        await expect(page.locator("h1")).toHaveCount(1);
        const bodyText = page.locator(".intro").first();
        if (await bodyText.count())
          await expect(bodyText).toHaveCSS(
            "color",
            theme === "dark" ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)",
          );
        await expect(page.locator("html")).toHaveAttribute(
          "lang",
          route.startsWith("/pt/") ? "pt-BR" : "en",
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
          `${route} at ${width}px overflows`,
        ).toBeTruthy();
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(
          result.violations,
          `${theme} ${route} ${width}: ${JSON.stringify(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))}`,
        ).toEqual([]);
      }
    }
  });
}
test("keyboard skip link, focus, theme persistence and active navigation", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByText("Skip to content", { exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Projects", exact: true })
    .click();
  await expect(
    page
      .getByRole("navigation")
      .getByRole("link", { name: "Projects", exact: true }),
  ).toHaveAttribute("aria-current", "location");
  await expect(
    page.getByRole("button", { name: "Switch to dark theme" }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("content works without JavaScript and reduced motion is honored", async ({
  browser,
  page,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto("/#projects");
  await expect(
    staticPage
      .locator(".project-card")
      .getByRole("link", { name: "Read case study" }),
  ).toHaveCount(4);
  await staticPage
    .getByRole("link", { name: "Econolyze", exact: true })
    .first()
    .click();
  await expect(
    staticPage.getByRole("heading", { name: "Architecture", exact: true }),
  ).toBeVisible();
  await context.close();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page
      .locator("html")
      .evaluate((el) => getComputedStyle(el).scrollBehavior),
  ).toBe("auto");
});
test("small-screen navigation remains usable at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "About", exact: true })
    .click();
  await expect(page).toHaveURL(/#about$/);
  await expect(page.locator("#about")).toBeInViewport();
});

test("language switch preserves case-study route and resume language", async ({
  page,
}) => {
  await page.goto("/projects/econolyze/");
  await page
    .getByRole("link", {
      name: "Language: English. Switch to Portuguese",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/pt\/projects\/econolyze\/$/);
  await expect(
    page.getByRole("heading", { name: "Decisões técnicas", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", {
      name: "Idioma: português. Mudar para inglês",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/projects\/econolyze\/$/);
  await page.goto("/pt/");
  await expect(
    page.getByRole("link", { name: "Baixar currículo", exact: false }),
  ).toHaveAttribute("href", "/resume/erick-murakami-curriculo-pt.pdf");
  await page
    .getByRole("link", {
      name: "Idioma: português. Mudar para inglês",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("link", { name: "Download resume", exact: false }),
  ).toHaveAttribute("href", "/resume/erick-murakami-resume-en.pdf");
});

for (const locale of ["en", "pt"]) {
  for (const width of [390, 1440]) {
    test(`sticky project title and return link: ${locale} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const prefix = locale === "pt" ? "/pt" : "";
      await page.goto(`${prefix}/projects/econolyze/`);
      const heading = page.locator(".case-title");
      await expect(heading).toHaveText("Econolyze");
      const before = await heading.evaluate((el) =>
        parseFloat(getComputedStyle(el).fontSize),
      );
      await page.evaluate(() => window.scrollTo(0, 650));
      await expect(page.locator(".header")).toHaveClass(/is-compact/);
      await expect
        .poll(() =>
          heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
        )
        .toBeLessThan(before);
      await expect(heading).toBeInViewport();
      const back = page.locator(".case-back");
      await expect(back).toBeInViewport();
      await back.click();
      await expect(page).toHaveURL(new RegExp(`${prefix}/#projects$`));
      await expect(page.locator("#projects")).toBeInViewport();
    });
  }
}
test("technology logos are local, loaded and paired with visible names", async ({
  page,
}) => {
  await page.goto("/");
  const strip = page.locator(".specialty-strip");
  await strip.scrollIntoViewIfNeeded();
  await expect(strip.locator("img")).toHaveCount(6);
  for (const img of await strip.locator("img").all()) {
    await expect(img).toHaveAttribute("src", /^\/technologies\//);
    await expect
      .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
});

test("current language flag swaps between UK and Brazil while preserving sections", async ({
  page,
}) => {
  await page.goto("/#projects");
  const toggle = page.locator(".language-toggle");
  await expect(toggle.locator("img")).toHaveCount(1);
  await expect(toggle.locator("img")).toHaveAttribute(
    "src",
    "/flags/united-kingdom.svg",
  );
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/pt\/#projects$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.locator(".language-toggle img")).toHaveAttribute(
    "src",
    "/flags/brazil.svg",
  );
  await page.locator(".language-toggle").click();
  await expect(page).toHaveURL(/\/#projects$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".language-toggle img")).toHaveAttribute(
    "src",
    "/flags/united-kingdom.svg",
  );
});

test("blog stays hidden unless that language has published articles", async ({
  page,
}) => {
  for (const [home, file] of [
    ["/", "dist/blog/index.html"],
    ["/pt/", "dist/pt/blog/index.html"],
  ]) {
    const published = existsSync(file);
    await page.goto(home);
    await expect(page.locator("#blog")).toHaveCount(published ? 1 : 0);
    await expect(
      page
        .locator(".primary-nav")
        .getByRole("link", { name: "Blog", exact: true }),
    ).toHaveCount(published ? 1 : 0);
    if (published) {
      await page
        .locator(".primary-nav")
        .getByRole("link", { name: "Blog", exact: true })
        .click();
      await expect(page.locator("h1")).toHaveCount(1);
    }
  }
});

test("homepage hero stays compact and primary actions stay aligned", async ({
  browser,
}) => {
  for (const theme of ["dark", "light"]) {
    const context = await browser.newContext();
    await context.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    const page = await context.newPage();
    for (const [width, height] of [
      [1920, 1080],
      [1440, 900],
      [768, 1024],
      [390, 844],
      [320, 844],
    ]) {
      await page.setViewportSize({ width, height });
      for (const route of ["/", "/pt/"]) {
        await page.goto(route);
        await page.evaluate(() => document.fonts.ready);
        const metrics = await page.evaluate(() => {
          const role = document.querySelector<HTMLElement>(".hero .role")!;
          const actions = [...document.querySelectorAll(".hero .actions a")];
          return {
            lines:
              role.getBoundingClientRect().height /
              parseFloat(getComputedStyle(role).lineHeight),
            rows: new Set(
              actions.map((a) => Math.round(a.getBoundingClientRect().top)),
            ).size,
            overflow: document.documentElement.scrollWidth > innerWidth,
          };
        });
        expect(metrics.lines, `${theme} ${route} ${width}`).toBeLessThanOrEqual(
          2.1,
        );
        expect(metrics.rows).toBe(1);
        expect(metrics.overflow).toBe(false);
        await expect(page.locator(".hero-resume[download]")).toHaveCount(1);
      }
    }
    await context.close();
  }
});

test("expertise cards replace one another in place and reverse with native scrolling", async ({
  page,
}) => {
  for (const [width, height] of [
    [1920, 1080],
    [1440, 900],
    [1366, 768],
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of ["/", "/pt/"])
      for (const theme of ["dark", "light"]) {
        await page.addInitScript(
          (value) => localStorage.setItem("theme", value),
          theme,
        );
        await page.goto(route);
        // A document reload can restore the preceding iteration's scroll position.
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        const section = page.locator("[data-expertise-showcase]");
        await expect(section).toHaveClass(/is-scroll-showcase/);
        await page.evaluate(() => document.fonts.ready);
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
        await expect(page.locator(".specialty-strip")).toHaveCount(1);
        await expect(page.locator(".specialty-strip")).toContainText(
          "LangChain4j",
        );
        await expect(page.locator(".specialty-strip")).toBeInViewport();
        const stripAnchor = await page
          .locator(".specialty-strip")
          .boundingBox();
        const heroAnchor = await page.locator(".hero").boundingBox();
        const introAnchor = await page.locator(".hero-copy").boundingBox();
        expect(stripAnchor!.y + stripAnchor!.height).toBeLessThanOrEqual(
          height,
        );
        expect(
          Math.abs(stripAnchor!.y - (heroAnchor!.y + heroAnchor!.height)),
        ).toBeLessThan(2);
        let anchor: {
          x: number;
          y: number;
          width: number;
          height: number;
        } | null = null;
        for (const index of [0, 1, 2, 3, 2, 1, 0]) {
          await page.evaluate(
            ({ y }) => window.scrollTo({ top: y, behavior: "instant" }),
            {
              y:
                geometry.start +
                geometry.travel * (index === 3 ? 0.94 : index / 3),
            },
          );
          await expect(section).toHaveAttribute(
            "data-active-card",
            String(index),
          );
          await expect(page.locator(".expertise-card.is-active")).toHaveCount(
            1,
          );
          await expect(page.locator(".expertise-card.is-active")).toHaveCSS(
            "opacity",
            "1",
          );
          const position = await page
            .locator(".expertise-card.is-active")
            .boundingBox();
          if (!anchor) anchor = position;
          expect(Math.abs(position!.y - anchor!.y)).toBeLessThan(2);
          const intro = await page.locator(".hero-copy").boundingBox();
          expect(intro!.y).toBeGreaterThanOrEqual(0);
          expect(Math.abs(intro!.y - introAnchor!.y)).toBeLessThan(2);
          const strip = await page.locator(".specialty-strip").boundingBox();
          expect(Math.abs(strip!.y - stripAnchor!.y)).toBeLessThan(2);
          expect(strip!.y + strip!.height).toBeLessThanOrEqual(height);
          await expect(page.locator(".specialty-strip")).toHaveCSS(
            "opacity",
            "1",
          );
          if (index === 3) {
            const heading = page.locator("#projects h2");
            await expect(heading).toBeInViewport();
            const box = await heading.boundingBox();
            expect(box!.y + box!.height).toBeLessThanOrEqual(height);
          }
        }
        await page.locator(".project-continuation").scrollIntoViewIfNeeded();
        await expect(
          page.locator(".project-continuation .project-card").first(),
        ).toBeInViewport();
        const leadBottom = await page
          .locator("#projects .project-card")
          .last()
          .evaluate((el) => el.getBoundingClientRect().bottom);
        const continuationTop = await page
          .locator(".project-continuation .project-card")
          .first()
          .evaluate((el) => el.getBoundingClientRect().top);
        expect(continuationTop).toBeGreaterThanOrEqual(leadBottom - 1);
        const hero = await page.locator(".hero").boundingBox();
        expect(hero!.y).toBeLessThan(0);
      }
  }
});

test("expertise has static short-screen, reduced-motion and no-JavaScript fallbacks", async ({
  browser,
}) => {
  for (const options of [
    { viewport: { width: 390, height: 400 } },
    {
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce" as const,
    },
    { viewport: { width: 1440, height: 900 }, javaScriptEnabled: false },
    { viewport: { width: 1440, height: 400 } },
  ]) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    for (const route of ["/", "/pt/"]) {
      await page.goto(route);
      await expect(page.locator("[data-expertise-showcase]")).not.toHaveClass(
        /is-scroll-showcase/,
      );
      await expect(page.locator(".showcase-sticky")).not.toHaveCSS(
        "position",
        "sticky",
      );
      await expect(page.locator(".specialty-strip")).toHaveCount(1);
      for (const card of await page.locator(".expertise-card").all()) {
        await expect(card).toHaveCSS("opacity", "1");
        await expect(card).toHaveCSS("transform", "none");
      }
      const boxes = await page
        .locator(".expertise-card")
        .evaluateAll((cards) =>
          cards.map((c) => c.getBoundingClientRect().top),
        );
      expect(new Set(boxes).size).toBeGreaterThan(1);
    }
    await context.close();
  }
});

test("Projects is visible and unobscured at scroll zero, directly below technologies", async ({
  browser,
}) => {
  for (const theme of ["dark", "light"]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    await context.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    const page = await context.newPage();
    for (const route of ["/", "/pt/"]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("[data-expertise-showcase]")).toHaveClass(
        /is-scroll-showcase/,
      );
      expect(await page.evaluate(() => scrollY)).toBe(0);
      await expect(page.locator(".expertise-card.is-active")).toHaveCount(1);
      const heading = page.locator("#projects h2");
      await expect(heading).toBeInViewport();
      const geometry = await heading.evaluate((el) => {
        const box = el.getBoundingClientRect();
        const hit = document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        );
        const projects = document
          .querySelector("#projects")!
          .getBoundingClientRect();
        const strip = document
          .querySelector(".specialty-strip")!
          .getBoundingClientRect();
        return {
          unobscured: !!hit && el.contains(hit),
          bottom: box.bottom,
          gap: projects.top - strip.bottom,
        };
      });
      expect(geometry.unobscured).toBe(true);
      expect(geometry.bottom).toBeLessThan(900);
      expect(geometry.gap).toBe(0);
      await expect(
        page.locator("#projects .project-card").first(),
      ).toBeInViewport();
      await expect(
        page.locator("#projects .project-card h3 a").first(),
      ).toBeInViewport();
      await expect(page.locator(".project-card")).toHaveCount(4);
      const parrot = page.locator(
        '.specialty-strip img[src="/technologies/langchain4j.svg"]',
      );
      await expect(parrot).toHaveCount(1);
      await expect
        .poll(() =>
          parrot.evaluate((el) => (el as HTMLImageElement).naturalWidth),
        )
        .toBeGreaterThan(0);
    }
    await context.close();
  }
});

test("project cards share dimensions across both gallery groups without clipping", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  for (const width of [
    1440, 1366, 1001, 900, 768, 700, 651, 650, 390, 360, 320,
  ]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/pt/"]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const sizes = await page.locator(".project-card").evaluateAll((cards) =>
        cards.map((card) => {
          const rect = card.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            clipped: card.scrollHeight > card.clientHeight + 1,
          };
        }),
      );
      expect(
        Math.max(...sizes.map((s) => s.height)) -
          Math.min(...sizes.map((s) => s.height)),
        `${route} ${width}px heights`,
      ).toBeLessThan(1);
      expect(
        Math.max(...sizes.map((s) => s.width)) -
          Math.min(...sizes.map((s) => s.width)),
      ).toBeLessThan(1);
      expect(sizes.some((s) => s.clipped)).toBe(false);
    }
  }
  await context.close();
});
