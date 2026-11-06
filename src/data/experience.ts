// Source: professional-experience sections of the owner-supplied PT/EN PDFs in public/resume.
// Work arrangement is unspecified in both resumes; null values are never rendered.
interface Experience {
  company: string;
  location: { en: string; pt: string };
  role: { en: string; pt: string };
  period: { en: string; pt: string };
  workArrangement: string | null;
  responsibilities: { en: string[]; pt: string[] };
  technologies: string[];
}
export const experience: Experience[] = [
  {
    company: "Genesys Software",
    location: {
      en: "São José do Rio Preto, SP, Brazil",
      pt: "São José do Rio Preto, SP, Brasil",
    },
    role: { en: "Java Backend Developer", pt: "Desenvolvedor Backend Java" },
    period: { en: "June 2025 — Present", pt: "Junho de 2025 — Atual" },
    workArrangement: null,
    responsibilities: {
      en: [
        "Develop and maintain backend integrations for an enterprise platform, working on REST API contracts with frontend engineers.",
        "Implement multi-tenant authorization and granular access control across organizations.",
        "Lead the migration from a shared database schema to schema-per-tenant isolation.",
        "Use Spring Application Events to advance sales orders when production orders are completed.",
      ],
      pt: [
        "Desenvolvimento e manutenção de integrações backend para uma plataforma corporativa e definição de contratos de APIs REST com o frontend.",
        "Implementação de autorização multi-tenant e controle de acesso granular entre organizações.",
        "Liderança na migração de um schema compartilhado para isolamento com schema por tenant.",
        "Uso de eventos do Spring para avançar pedidos de venda após a conclusão das ordens de produção.",
      ],
    },
    technologies: [
      "Java",
      "Spring Boot",
      "REST APIs",
      "Spring Application Events",
    ],
  },
  {
    company: "Brasil Rural",
    location: {
      en: "São José do Rio Preto, SP, Brazil",
      pt: "São José do Rio Preto, SP, Brasil",
    },
    role: { en: "IT Intern", pt: "Estagiário de TI" },
    period: {
      en: "March 2024 — April 2025",
      pt: "Março de 2024 — Abril de 2025",
    },
    workArrangement: null,
    responsibilities: {
      en: [
        "Acted as the main IT point of contact, translating requirements from company directors into software, integrations and automation.",
        "Migrated legacy PHP API integrations to automated n8n workflows.",
        "Modernized a legacy desktop monolith into a Java and Angular web application, from requirements and architecture to implementation and delivery.",
      ],
      pt: [
        "Atuação como principal ponto de contato de TI, traduzindo requisitos da diretoria em software, integrações e automações.",
        "Migração de integrações legadas de APIs em PHP para fluxos automatizados no n8n.",
        "Modernização de um monólito desktop para uma aplicação web em Java e Angular, do levantamento de requisitos e arquitetura à implementação e entrega.",
      ],
    },
    technologies: ["Java", "Angular", "PHP", "n8n"],
  },
];
