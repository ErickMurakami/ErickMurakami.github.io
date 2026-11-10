import { existsSync } from "node:fs";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const routes = [
  "/",
  "/projects/",
  "/about/",
  "/courses/",
  "/contact/",
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
            await bodyText.evaluate(el => {
              const probe = document.createElement("span");
              probe.style.color = el.closest(".hero") ? "var(--muted-foreground)" : "var(--foreground)";
              el.append(probe);
              const color = getComputedStyle(probe).color;
              probe.remove();
              return color;
            }),
          );
        await expect(page.locator("html")).toHaveAttribute(
          "lang",
          route.startsWith("/pt/") ? "pt-BR" : "en-GB",
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
  await expect(page).toHaveURL(/\/about\/$/);
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
    page.getByRole("link", { name: "Ver currículo", exact: false }),
  ).toHaveAttribute("href", "/resume/erick-murakami-curriculo-pt.pdf");
  await page
    .getByRole("link", {
      name: "Idioma: português. Mudar para inglês",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("link", { name: "View CV", exact: false }),
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
      await expect(page).toHaveURL(new RegExp(`${prefix}/projects/$`));
      await expect(page.locator("h1")).toBeInViewport();
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
  await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");
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
      page.locator(".primary-nav").getByRole("link", {
        name: home === "/pt/" ? "Artigos" : "Writing",
        exact: true,
      }),
    ).toHaveCount(published ? 1 : 0);
    if (published) {
      await page
        .locator(".primary-nav")
        .getByRole("link", {
          name: home === "/pt/" ? "Artigos" : "Writing",
          exact: true,
        })
        .click();
      await expect(page.locator("h1")).toHaveCount(1);
    }
  }
});
