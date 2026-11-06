import { test, expect } from "@playwright/test";

for (const prefix of ["", "/pt"]) {
  test(`About aggregates verified experience and education ${prefix || "en"}`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/`);
    const about = page.locator("#about");
    await expect(about.locator(".about-copy > p:not(.post-meta)")).toHaveCount(
      1,
    );
    await expect(about.locator("#courses")).toContainText("FATEC Rio Preto");
    await expect(about.locator("#experience article")).toHaveCount(2);
    const fatecPreview = about.locator("#courses .education-more").first();
    await expect(fatecPreview.locator(".education-focus")).not.toBeVisible();
    await fatecPreview.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(fatecPreview.locator(".education-focus")).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(fatecPreview.locator(".education-focus")).not.toBeVisible();
    const educationPreview = about.locator("#courses .education-more").last();
    await expect(
      educationPreview.locator(".education-details"),
    ).not.toBeVisible();
    await educationPreview.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(educationPreview.locator(".education-project")).toBeVisible();
    const first = about.locator("#experience article").first();
    await expect(first).toContainText("Genesys Software");
    await expect(first.locator(".experience-details")).not.toBeVisible();
    await first.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(first.locator(".experience-details")).toBeVisible();
    await expect(first.locator(".experience-more")).toHaveAttribute("open", "");
    await about
      .locator(`.about-introduction a[href="${prefix}/about/"]`)
      .click();
    await expect(page).toHaveURL(`${prefix}/about/`);
    await expect(page.locator("#experience")).toContainText("Brasil Rural");
    await expect(
      page.locator("#experience .experience-details").first(),
    ).toBeVisible();
    await expect(page.locator("#about")).toContainText(
      prefix ? "Inglês C1" : "English C1",
    );
    await expect(page.locator("#courses")).toContainText(
      prefix
        ? "Tecnólogo em Informática para Negócios"
        : "Technology Degree in Business Informatics",
    );
    await expect(page.locator("#experience")).not.toContainText("Econolyze");
    const education = page.locator("#courses .education-entry");
    await expect(education).toHaveCount(2);
    await expect(education.first()).toContainText("FATEC Rio Preto");
    await expect(education.first()).toContainText(
      prefix ? "Julho de 2024 — Junho de 2026" : "July 2024 — June 2026",
    );
    await expect(education.first().locator(".education-focus")).toBeVisible();
    await expect(education.first().locator(".education-focus")).toContainText(
      prefix ? "FOCO ACADÊMICO" : "ACADEMIC FOCUS",
    );
    await expect(education.first().locator(".education-focus p")).toHaveCount(
      2,
    );
    await expect(education.first()).toContainText(
      prefix ? "Graduação tecnológica" : "Undergraduate technology program",
    );
    await expect(education.first()).not.toContainText("Bachelor");
    await expect(education.first().locator(".education-project")).toHaveCount(
      2,
    );
    await expect(education.last()).toContainText(
      "ETEC Philadelpho Gouvêa Netto",
    );
    await expect(education.last()).toContainText(
      prefix
        ? "Janeiro de 2017 — Dezembro de 2019"
        : "January 2017 — December 2019",
    );
    await expect(education.last()).toContainText(
      prefix
        ? "Formação Técnica em Informática"
        : "Technical Education in Information Technology",
    );
    await expect(education.last()).toContainText("C#");
    await expect(education.last()).toContainText("MySQL");
    await expect(education.last()).toContainText(
      prefix ? "livros usados" : "second-hand book",
    );
    await expect(education.last()).not.toContainText("Bachelor");
    await expect(page.locator("#training")).toHaveCount(0);
    await page.locator(".language-toggle").click();
    await expect(page).toHaveURL(prefix ? "/about/" : "/pt/about/");
    await expect(page.locator("#experience article")).toHaveCount(2);
  });
}

test("legacy education URLs and homepage anchors remain accessible without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  for (const prefix of ["", "/pt"]) {
    await page.goto(`${prefix}/courses/`);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("#courses")).toContainText("FATEC Rio Preto");
    await page.goto(`${prefix}/#courses`);
    await expect(page.locator("#about #courses")).toBeInViewport();
    const details = page.locator("#experience details").first();
    await details.locator("summary").click();
    await expect(details.locator(".experience-details")).toBeVisible();
  }
  await context.close();
});
