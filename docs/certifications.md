# Certificações

O menu, a seção na home e a página de certificações só aparecem quando houver uma credencial publicada no idioma correspondente. Nenhuma certificação foi adicionada como obtida.

Crie um arquivo Markdown em `src/content/certifications/` (inglês) ou `src/content/certifications-pt/` (português). Use o mesmo nome nos dois idiomas para organizar as traduções.

Exemplo de preenchimento para **depois de obter** AWS Certified Cloud Practitioner:

```yaml
---
title: "AWS Certified Cloud Practitioner"
issuer: "Amazon Web Services"
date: AAAA-MM-DD
credentialUrl: "URL_HTTPS_DA_CREDENCIAL_VERIFICAVEL"
draft: true
localOnly: false
---
```

Substitua a data e a URL pelos dados reais. A URL deve usar HTTPS e apontar para a verificação da sua credencial, por exemplo na plataforma oficial do emissor. Não use a página geral do exame como prova de certificação.

Defina `draft: false` para publicar. O padrão é rascunho. `localOnly: true` permite visualizar apenas no servidor de desenvolvimento, sem incluir no build de produção. Publicações e traduções são independentes.

A home apresenta as três certificações mais recentes, com link para a lista completa em `/certifications/` ou `/pt/certifications/`. Não é necessário serviço externo ou backend.

## Prévia local

Os arquivos locais `mock-aws-cloud-practitioner.md` nas duas pastas permitem visualizar um exemplo com `npm run dev`. Estão marcados com `localOnly: true` e ignorados pelo Git. O título identifica o exemplo como uma certificação não obtida; a data e a URL são fictícias. O build de produção não inclui esses exemplos.
