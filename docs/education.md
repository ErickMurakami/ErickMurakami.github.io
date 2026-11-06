# Formação e cursos

Na home, cada formação aparece resumida e uma seta abre seus detalhes com teclado ou clique, inclusive sem JavaScript. Os detalhes da home usam um resumo editorial de um parágrafo (`summary`), sem cortar automaticamente o primeiro parágrafo. A página Sobre exibe o conteúdo completo.

Os dados ficam em `src/content/learning/*.md`. About reúne experiência, formação, certificações e, somente quando houver conteúdo aprovado, Cursos e Capacitação. As páginas legadas `/courses/` e `/pt/courses/` e a âncora `#courses` continuam funcionando.

## Formação e fontes

A formação está ordenada do mais recente para o mais antigo pelo campo `order`:

1. FATEC Rio Preto: Informática para Negócios / Business Informatics, São José do Rio Preto, São Paulo, julho de 2024 a junho de 2026. O nome do curso e o término constam nos PDFs PT/EN em `public/resume/`. O período completo e o texto de foco acadêmico foram fornecidos posteriormente pelo proprietário. A classificação permanece graduação tecnológica, sem declarar bacharelado ou alterar a situação de conclusão.
2. ETEC Philadelpho Gouvêa Netto: janeiro de 2017 a dezembro de 2019. Fonte: informações fornecidas diretamente pelo proprietário em 6 de novembro de 2026. Não há diploma ou documento com o título oficial da habilitação nos materiais disponíveis; por isso usamos “Formação Técnica em Informática” / “Technical Education in Information Technology”, sem classificá-la como graduação.

A ETEC inclui a base acadêmica informada: Java, C#, C++, JavaScript, PHP, HTML/CSS, MySQL e Android Studio. Não se trata de uma lista de especializações profissionais atuais. O projeto de conclusão foi uma aplicação para compra e venda de livros usados, com C# e MySQL; não foram acrescentadas funcionalidades, métricas, arquitetura ou implantação.

Para adicionar formação, use `kind: education`, `title`, `institution`, `period`, `locale` e `order` (mais recente primeiro). `summary`, `location`, `background`, `academicFocus` (lista de parágrafos) e `finalProject` são opcionais. O foco acadêmico da FATEC não é apresentado como projeto de conclusão. Faça uma versão por idioma com informações equivalentes.

## Cursos e Capacitação

O campo `kind: course` usa a mesma coleção, com renderização separada da formação e das certificações. A subseção aparece depois de Certificações. Nenhum curso real foi adicionado porque não foram fornecidos cursos verificáveis.

Modelo para preencher com dados reais, inicialmente oculto:

```yaml
---
locale: pt
kind: course
title: "Nome real do curso"
institution: "Instituição responsável"
area: "Área técnica relevante"
status: in-progress
approved: false
draft: true
order: 1
---
```

Campos suportados:

- `status`: `completed` ou `in-progress`; o padrão é `in-progress`.
- `completionDate`: data ISO opcional, apenas se a conclusão for verificável. Só aparece para cursos concluídos.
- `certificateUrl`: URL HTTPS opcional do certificado, aberta em nova aba. Não invente URLs.
- `approved`: padrão `false`. Defina `true` somente após conferir os dados e a relevância profissional.
- `draft`: use `false` para publicar, juntamente com `approved: true`.

Priorize Java avançado, Spring Boot/Quarkus, arquitetura, DDD, cloud/AWS, sistemas distribuídos, bancos de dados, performance backend e engenharia de IA. Não existe importação automática de currículos ou LinkedIn. A aprovação é uma curadoria manual; o sistema não valida a autenticidade do certificado em serviços externos. Sem cursos aprovados, não há seção vazia nem placeholder.

Crie uma versão com `locale: en` para a tradução. A palestra Java Day não foi classificada como curso ou formação.

## Prévia local de cursos

Os arquivos `src/content/learning/mock-course-*.md` são exemplos fictícios em PT/EN, com um curso concluído e outro em andamento. `localOnly: true` os exclui do build de produção; também são ignorados pelo Git. Use `npm run dev` para visualizá-los em About. A instituição e os títulos identificam a prévia como fictícia. Não representam cursos ou certificados reais.
