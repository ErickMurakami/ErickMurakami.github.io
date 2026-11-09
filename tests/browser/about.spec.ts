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
    await expect(fatecPreview.locator(".education-focus p")).toHaveCount(1);
    await expect(fatecPreview.locator(".education-focus")).toContainText(
      prefix ? "necessidades organizacionais" : "business needs",
    );
    await page.keyboard.press("Enter");
    await expect(fatecPreview.locator(".education-focus")).not.toBeVisible();
    const educationPreview = about.locator("#courses .education-more").last();
    await expect(
      educationPreview.locator(".education-details"),
    ).not.toBeVisible();
    await educationPreview.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(
      educationPreview.locator(".education-project").first(),
    ).toBeVisible();
    await expect(
      educationPreview.locator(".education-foundation p"),
    ).toHaveCount(1);
    await expect(
      educationPreview.locator(".education-foundation"),
    ).toContainText(prefix ? "livros usados" : "second-hand book");
    const first = about.locator("#experience article").first();
    await expect(first).toContainText("Genesys Software");
    await expect(first.locator(".experience-details")).not.toBeVisible();
    await first.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(first.locator(".experience-details")).toBeVisible();
    await expect(first.locator(".experience-more")).toHaveAttribute("open", "");
    const homeIntroduction = await about
      .locator(".about-copy > p:not(.post-meta)")
      .textContent();
    await about
      .locator(`.about-introduction a[href="${prefix}/about/"]`)
      .click();
    await expect(page).toHaveURL(`${prefix}/about/`);
    const fullIntroduction = page.locator(".about-copy > p:not(.post-meta)");
    await expect(fullIntroduction).toHaveCount(3);
    expect(await fullIntroduction.first().textContent()).not.toBe(
      homeIntroduction,
    );
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
      prefix ? "Graduação tecnológica" : "Undergraduate technology programme",
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
    await expect(
      education.last().locator(".education-foundation p"),
    ).toHaveText(
      prefix
        ? [
            "Formação técnica com foco em fundamentos de programação, desenvolvimento de software e bancos de dados relacionais.",
            "Durante o curso, tive contato com tecnologias como Java, C#, C++, JavaScript, PHP, HTML, CSS e MySQL, além de desenvolvimento de aplicações utilizando Android Studio.",
            "Como projeto de conclusão, desenvolvi uma aplicação para compra e venda de livros usados, utilizando C# e MySQL, aplicando conceitos de lógica de programação, desenvolvimento de aplicações e persistência de dados.",
          ]
        : [
            "Technical education focused on programming fundamentals, software development, and relational databases.",
            "During the programme, I gained hands-on experience with technologies including Java, C#, C++, JavaScript, PHP, HTML, CSS, and MySQL, as well as application development using Android Studio.",
            "For my final academic project, I developed a second-hand book marketplace application using C# and MySQL, applying programming fundamentals, application development concepts, and relational data persistence.",
          ],
    );
    await expect(education.last().locator(".small-label")).toHaveText(
      prefix ? "Formação Técnica" : "Academic Foundation",
    );
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
