# About: conteúdo e evidências

O menu About / Sobre sempre abre o perfil completo, incluindo apresentação, experiência profissional, formação e certificações. A home conserva `#about`, `#experience`, `#courses` e, quando há conteúdo publicado, `#certifications`. A apresentação da home usa uma síntese editorial do conteúdo completo em um único parágrafo com link “Mais detalhes” para o perfil completo. Na home, responsabilidades e tecnologias de cada emprego ficam em um `<details>` fechado; Uma seta no canto do cargo abre os detalhes com teclado e sem JavaScript; o controle mantém um nome acessível e gira ao abrir. O perfil completo exibe as responsabilidades diretamente.

## Experiência profissional

`src/data/experience.ts` contém os dois empregos descritos nos PDFs fornecidos pelo proprietário em `public/resume/`:

- Genesys Software, Desenvolvedor Backend Java, junho de 2025–atual, São José do Rio Preto. Integrações, contratos REST, autorização multitenant, migração para schema por tenant e eventos do Spring para atualizar pedidos de venda.
- Brasil Rural, Estagiário de TI, março de 2024–abril de 2025, São José do Rio Preto. Levantamento de requisitos com a diretoria, integrações PHP migradas para n8n e modernização de aplicação desktop para Java/Angular.

As responsabilidades foram resumidas da seção “Experiência profissional” do currículo PT e “Professional Experience” do currículo EN. A referência editorial do proprietário também confirma Java/Spring Boot em aplicações empresariais. Não foram usados projetos pessoais como empregos. Não foram incluídas métricas, promoções ou afirmações de implantação em cloud.

Dados para revisão futura: os currículos não especificam trabalho remoto/híbrido/presencial. `workArrangement: null` sinaliza essa lacuna no módulo de dados e não produz texto público. “Atual” reflete os currículos fornecidos; atualize o período quando houver mudança. Nenhuma informação ausente exige uma empresa ou data fictícia na página.

## Formação, certificações e rotas

Os arquivos existentes de formação foram preservados. Credenciais continuam em suas coleções, com rascunhos e exemplos locais excluídos do build. Não há certificações genuínas publicadas no momento. Não foi criada uma certificação em andamento em nome do proprietário.

As páginas legadas de formação e certificações e seus metadados são mantidos para preservar favoritos; certificações continuam condicionais por idioma. O menu primário não contém esses itens. As traduções de About mantêm `lang`, canonical e hreflang correspondentes. As URLs de artigos não mudaram.
