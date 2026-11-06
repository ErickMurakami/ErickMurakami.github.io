# Formação e cursos

Os dados ficam em `src/content/learning/*.md`. A seção aparece na home e nas páginas `/courses/` e `/pt/courses/`. O menu usa âncoras na home e abre a página correspondente nas outras rotas.

A formação inicial foi transcrita dos currículos locais fornecidos pelo proprietário:

- `public/resume/erick-murakami-curriculo-pt.pdf`, seção “Formação acadêmica”.
- `public/resume/erick-murakami-resume-en.pdf`, seção “Education”.

Ambos listam FATEC Rio Preto, Informática para Negócios / Business Informatics, em São José do Rio Preto, com data de junho de 2026. A data é exibida como consta no currículo, sem acrescentar período de início ou outra qualificação. Não há cursos complementares listados nos arquivos; nenhum foi inventado. A palestra Java Day não foi classificada como curso ou formação.

Para adicionar um curso real, crie um Markdown com estes campos preenchidos:

```yaml
---
locale: pt
kind: course
title: "Nome real do curso"
institution: "Instituição responsável"
period: "Período conforme o comprovante"
order: 2
draft: true
---
```

Use `kind: education` para formação acadêmica. `location` é opcional. Defina `draft: false` para exibir. Crie outro arquivo com `locale: en` para a tradução; mantenha os mesmos dados verificáveis. Não inclua instruções ou dados fictícios como cursos publicados.
