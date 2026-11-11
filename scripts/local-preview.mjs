import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { dirname } from "node:path";

const fixtures = [];
const add = (path, data, body = "") => fixtures.push({
  path,
  content: `---\n${Object.entries({ ...data, draft: false, localOnly: true }).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n")}\n---\n\n${body}\n`,
});
for (const locale of ["en", "pt"]) {
  const pt = locale === "pt";
  const suffix = pt ? "-pt" : "";
  const topics = pt
    ? ["Contratos em integrações com APIs", "Limites entre domínio e infraestrutura", "Respostas estruturadas de IA"]
    : ["Contracts for external API integrations", "Boundaries between domain and infrastructure", "Structured AI responses"];
  topics.forEach((topic, index) => add(`src/content/notes${suffix}/local-preview-${index + 1}.md`, {
    title: `${pt ? "Exemplo local" : "Local preview"} · ${topic}`,
    description: pt ? "Conteúdo fictício para visualizar os cards de artigos. Excluído do build de produção." : "Sample content for previewing article cards. Excluded from production builds.",
    date: `2026-11-${11 - index}`,
    category: ["Java", "Architecture", "AI"][index],
  }, pt ? `## Exemplo de artigo\n\nEste é um conteúdo local para conferir o layout de artigos. Não representa uma publicação real.\n\n## Exemplo técnico\n\nUma integração backend mantém contratos explícitos entre o caso de uso e os adapters externos.` : `## Article preview\n\nThis local content previews the article layout. It is not a published article.\n\n## Technical example\n\nA backend integration keeps explicit contracts between the use case and external adapters.`));
  for (const [index, name] of ["Java backend", "AI integration"].entries()) {
    add(`src/content/certifications${suffix}/local-preview-${index + 1}.md`, {
      title: `${pt ? "Exemplo local" : "Local preview"} · ${name}`,
      issuer: pt ? "Emissor fictício — prévia do layout" : "Sample issuer — layout preview",
      status: "in-progress",
      date: "2026-11-11",
    });
    add(`src/content/learning/local-preview-course-${locale}-${index + 1}.md`, {
      locale,
      kind: "course",
      title: `${pt ? "Exemplo local" : "Local preview"} · ${name}`,
      institution: pt ? "Instituição fictícia — prévia do layout" : "Sample institution — layout preview",
      area: index === 0 ? "Backend" : "AI",
      status: index === 0 ? "completed" : "in-progress",
      ...(index === 0 ? { completionDate: "2026-11-11" } : {}),
      approved: true,
      order: index + 1,
    });
  }
}

const clear = process.argv.includes("--clear");
for (const { path, content } of fixtures) {
  if (clear) {
    if (await readFile(path, "utf8").catch(() => null) === content) await unlink(path);
  } else {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, { flag: "wx" }).catch((error) => { if (error.code !== "EEXIST") throw error; });
  }
}
console.log(clear ? "Unmodified local preview fixtures removed." : "Local article, certification and training previews are ready in both languages. Run npm run dev; production builds exclude these files.");
