# Migrar para erickkami.dev

A migração **não foi executada**. O domínio de produção padrão continua sendo
`https://erickmurakami.github.io/`, com `base: "/"`. As rotas em inglês e português
permanecem iguais. Não há arquivo CNAME: este repositório usa publicação por Actions,
e o domínio é configurado nas definições do Pages.

## Estado observado em 6 de novembro de 2026

A consulta pública de `erickkami.dev` e `www.erickkami.dev` retornou endereços de borda
Cloudflare (`104.21.6.112`, `172.67.134.193` e IPv6 correspondentes). Isso não revela
os registros de origem, a configuração da zona ou quais serviços dependem deles.
A API de Pages retornou `cname: null`, HTTPS habilitado e a URL github.io atual.
Nenhum registro, serviço, configuração de Pages ou visibilidade foi alterado.

## Preparar e conferir sem migrar

```sh
PORTFOLIO_SITE_URL=https://erickkami.dev npm run build
PORTFOLIO_SITE_URL=https://erickkami.dev npm run validate:site
```

A variável aceita apenas uma origem HTTPS, sem caminho, credenciais, query ou
fragmento. Canonical, Open Graph (inclusive imagens), hreflang, sitemap e robots
usam essa origem; links e assets internos continuam relativos à raiz.
Para voltar ao build atual, execute `npm run build` sem a variável.
A variável é lida do ambiente do processo, não automaticamente de um arquivo .env.

## Ativação manual, somente quando decidir migrar

1. Exporte ou registre a zona DNS atual. Confira o que o domínio raiz serve hoje e
   como os subdomínios de API são apontados. Se algum serviço usa CNAME para o
   domínio raiz, resolva essa dependência antes de mudar o destino. Preserve os
   registros de API, email e demais serviços; não substitua a zona inteira.
2. Na conta GitHub, **Settings → Pages → Add a domain**, adicione `erickkami.dev`.
   Crie o TXT `_github-pages-challenge-ErickMurakami.erickkami.dev` com o valor
   fornecido pelo GitHub, conclua a verificação e mantenha esse TXT.
3. Neste repositório, **Settings → Pages → Custom domain**, informe `erickkami.dev`
   e salve **antes** de apontar o DNS. Mantenha a origem de build atual até a janela
   de migração. Não altere visibilidade nem as configurações de outros repositórios.
4. No provedor DNS, altere apenas os registros necessários do domínio raiz (`@`).
   Use ALIAS/ANAME para `erickmurakami.github.io` quando suportado ou os quatro A:
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
   Se publicar IPv6, use os quatro AAAA do GitHub:
   `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`,
   `2606:50c0:8003::153`. Remova destinos conflitantes **somente de @**.
   Na Cloudflare, use DNS only para esses registros durante a validação e emissão
   do certificado; qualquer decisão posterior de proxy deve ser avaliada à parte.
   Não crie wildcard e não modifique subdomínios de API.
5. Opcional: se `www` estiver livre e também for desejado, crie CNAME `www` para
   `erickmurakami.github.io`, sem caminho. Não substitua um serviço existente em
   `www`. O Pages redireciona a variante configurada para o domínio principal.
6. Aguarde o DNS check do Pages e o certificado. Verifique os A/AAAA com `dig`,
   confirme HTTPS e ative **Enforce HTTPS** quando disponível. A propagação pode
   levar até 24 horas. Se houver falha de certificado, revise DNS e CAA seguindo a
   documentação oficial antes de mudar qualquer política da zona.
7. No repositório, **Settings → Secrets and variables → Actions → Variables**, crie
   `PORTFOLIO_SITE_URL` = `https://erickkami.dev`. Execute manualmente **Publish
   portfolio** com a revisão aprovada. A variável existente
   `ENABLE_PAGES_DEPLOYMENT=true` continua sendo necessária; nenhum push publica.
8. Confira `/`, `/pt/`, os quatro projetos em ambos os idiomas, PDFs, logos, troca
   de idioma, canonical, hreflang, Open Graph, `/robots.txt` e `/sitemap.xml`.
   Confirme o redirecionamento do endereço github.io e a continuidade de cada
   serviço de API existente. Artigos locais e drafts devem continuar ausentes.

Para desistir antes do cutover, não altere DNS/Pages nem a variável. Para reverter
uma migração já feita, restaure apenas os registros envolvidos a partir do backup,
remova o domínio personalizado do Pages, remova a variável de origem e publique
manualmente novamente. Revalide os serviços que dependem do domínio raiz.

## Referências oficiais consultadas

- [Verificar propriedade do domínio](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
- [Configurar apex, DNS e www](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [HTTPS e emissão de certificado](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
