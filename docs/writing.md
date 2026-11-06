# Publicar um artigo

O blog fica oculto enquanto não houver artigos publicados. Isso vale para a seção na inicial, o menu, a listagem e o sitemap. Arquivos com `draft: true` não entram no site.

## Criar o arquivo

Use Markdown em uma destas pastas:

- Português: `src/content/notes-pt/`
- Inglês: `src/content/notes/`

Por exemplo, crie `src/content/notes-pt/meu-artigo.md`. O nome do arquivo vira a URL: `/pt/blog/meu-artigo/`.

Comece com estes campos:

```yaml
---
title: "Título do seu artigo"
description: "Um resumo curto do que você vai explicar."
date: 2026-11-06
category: Java
draft: true
---
```

Escreva abaixo do segundo `---`. Use `##` para os títulos das seções: o título principal já vem do campo `title`. Blocos de código, listas, tabelas e links usam Markdown normal. Para destacar código Java, abra o bloco com três crases seguidas de `java`.

## Revisar e publicar

1. Escreva com `draft: true` enquanto o artigo estiver em preparação.
2. Quando quiser vê-lo no site local, altere para `draft: false` e execute `npm run dev`.
3. Confira a listagem em `/pt/blog/` ou `/blog/` e abra o artigo.
4. Execute `npm run verify` e `npm run test:browser`.
5. Faça commit, envie ao GitHub e execute a Action **Publish portfolio** para atualizar o site público.

A data organiza os artigos, mas não agenda publicação: quem controla a visibilidade é `draft`. Sem esse campo, o artigo é considerado publicado. Um artigo só aparece após um novo build/deploy.

## Idiomas

Você pode publicar só em português ou só em inglês. Não precisa traduzir para começar. O link Blog aparece apenas nos idiomas que já têm artigos publicados.

Se quiser uma tradução, use o mesmo nome de arquivo na outra pasta. O controle de idioma então liga as duas versões. Sem tradução, ele leva à inicial do outro idioma, sem criar um link para uma página inexistente.

Os textos são escritos manualmente. A sincronização do GitHub não cria nem altera artigos.
