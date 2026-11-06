# Certificações

Certificações é uma subseção de About e só aparece quando houver conteúdo publicado no idioma correspondente. A página legada de certificações também é preservada nessas condições. Não há item próprio no menu principal. Nenhuma certificação foi adicionada como obtida.

Crie um arquivo Markdown em `src/content/certifications/` (inglês) ou `src/content/certifications-pt/` (português). Use o mesmo nome nos dois idiomas para organizar as traduções.

Exemplo de preenchimento para **depois de obter** AWS Certified Cloud Practitioner:

```yaml
---
title: "AWS Certified Cloud Practitioner"
issuer: "Amazon Web Services"
date: AAAA-MM-DD
credentialUrl: "URL_HTTPS_DA_CREDENCIAL_VERIFICAVEL"
status: earned
draft: true
localOnly: false
---
```

Substitua a data e a URL pelos dados reais. A URL deve usar HTTPS e apontar para a verificação da sua credencial, por exemplo na plataforma oficial do emissor. Não use a página geral do exame como prova de certificação.

Defina `draft: false` para publicar. O padrão é rascunho. `localOnly: true` permite visualizar apenas no servidor de desenvolvimento, sem incluir no build de produção. Publicações e traduções são independentes.

About apresenta todas as certificações publicadas, separando `status: earned` (obtidas) de `status: in-progress` (em andamento). Certificações obtidas exigem URL de verificação. Para uma certificação em andamento, a URL é opcional; o campo `date` indica o início da preparação e não é exibido como data de obtenção. Os exemplos `localOnly` aparecem em um grupo explicitamente identificado como prévia, sem alegar obtenção. As URLs legadas `/certifications/` e `/pt/certifications/` continuam disponíveis. Não é necessário serviço externo ou backend.

## Prévia local

Os arquivos locais `mock-aws-cloud-practitioner.md` nas duas pastas permitem visualizar um exemplo com `npm run dev`. Estão marcados com `localOnly: true` e ignorados pelo Git. O título identifica o exemplo como uma certificação não obtida; a data e a URL são fictícias. O build de produção não inclui esses exemplos.
