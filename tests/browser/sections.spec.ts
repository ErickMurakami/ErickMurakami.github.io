import { test, expect } from "@playwright/test";

for (const prefix of ["", "/pt"]) {
  test(`header uses home anchors and standalone sections ${prefix || "en"}`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/`);
    for (const section of ["projects", "contact"]) {
      await expect(
        page.locator(`.primary-nav a[href="${prefix}/#${section}"]`),
      ).toHaveCount(1);
    }
    await page.locator(`.primary-nav a[href="${prefix}/about/"]`).click();
    await expect(page).toHaveURL(`${prefix}/about/`);
    await expect(page.locator("#about h1")).toBeInViewport();
    await expect(page.locator("#experience article")).toHaveCount(2);
    await expect(page.locator("#courses")).toContainText("FATEC Rio Preto");
    await page.goto(`${prefix}/projects/econolyze/`);
    for (const section of ["projects", "about", "contact"]) {
      const link = page.locator(`.primary-nav a[href="${prefix}/${section}/"]`);
      await expect(link).toHaveCount(1);
      await link.click();
      await expect(page).toHaveURL(`${prefix}/${section}/`);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(
        page.locator(`.primary-nav a[aria-current="page"]`),
      ).toHaveAttribute("href", `${prefix}/${section}/`);
    }
    await expect(
      page.locator('.primary-nav a[href*="certifications"]'),
    ).toHaveCount(0);
    await expect(page.locator('.primary-nav a[href*="blog"]')).toHaveCount(0);
    await page.goto(`${prefix}/projects/`);
    await expect(page.locator(".project-card")).toHaveCount(4);
    await page.locator(".language-toggle").click();
    await expect(page).toHaveURL(prefix ? "/projects/" : "/pt/projects/");
    await expect(page.locator(".project-card")).toHaveCount(4);
  });
}

test("Projects navigation scrolls progressively instead of jumping", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    const samples: number[] = [];
    (window as typeof window & { scrollSamples: number[] }).scrollSamples =
      samples;
    const start = performance.now();
    const sample = () => {
      samples.push(scrollY);
      if (performance.now() - start < 1300) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.locator('.primary-nav a[href="/#projects"]').click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(1000);
  await page.waitForTimeout(300);
  const samples = await page.evaluate(
    () => (window as typeof window & { scrollSamples: number[] }).scrollSamples,
  );
  const end = samples.at(-1)!;
  expect(
    new Set(samples.filter((y) => y > 0 && y < end - 5)).size,
  ).toBeGreaterThan(4);
  expect(
    Math.max(...samples.slice(1).map((y, i) => Math.abs(y - samples[i]))),
  ).toBeLessThan(end * 0.5);
  await expect(page.locator("#projects h2")).toBeInViewport();
  await page.goBack();
  await expect(page).toHaveURL("/");
});

test("header and footer use EM branding and a compact primary menu", async ({
  page,
}) => {
  for (const home of ["/", "/pt/"]) {
    await page.goto(home);
    for (const mark of await page.locator(".brand-symbol").all())
      await expect(mark).toHaveText("EM.");
    await expect(page.locator('.primary-nav a[href*="courses"]')).toHaveCount(
      0,
    );
    await expect(
      page.locator('.primary-nav a[href*="certifications"]'),
    ).toHaveCount(0);
    const labels = await page.locator(".primary-nav a").allTextContents();
    expect(labels.map((label) => label.trim())).toEqual(
      home === "/"
        ? ["Projects", "About", "Contact"]
        : ["Projetos", "Sobre", "Contato"],
    );
  }
});
