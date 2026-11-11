---
title: "RoastMyTaste"
repo: "RoastMyTaste"
description: "Aplicação de humor musical em Java, Spring Boot e Spring AI que combina OAuth2 do Spotify, preferências musicais e roasts em quatro idiomas."
focus: "Integração OAuth2 e IA estruturada"
stack: ["Java 25", "Spring Boot", "Spring Security", "Spring AI", "Groq", "Spotify API"]
order: 5
---

## Visão geral

O RoastMyTaste conecta uma conta do Spotify, consulta as músicas e os artistas mais relevantes para o ouvinte e transforma essas preferências em um roast personalizado. O projeto nasceu para explorar OAuth2, APIs externas e respostas estruturadas de IA generativa em uma aplicação pequena, que pode ser executada localmente.

O repositório atual inclui uma interface Thymeleaf servida pelo Spring Boot, além de endpoints REST autenticados. As duas formas de acesso reutilizam o mesmo caso de uso do backend, sem um serviço de frontend separado. A stack usa Java 25, Spring Boot 4.0.6 e Spring AI 2.0.0-M6.

## Problema

Mesmo uma resposta bem-humorada depende de integrações bem definidas. O acesso ao Spotify exige sessão autenticada e um cliente autorizado; o LLM produz conteúdo variável que precisa respeitar um contrato de resposta previsível. O desafio foi conectar esses sistemas sem concentrar o tratamento de tokens, o mapeamento do Spotify e a composição de prompts em um único controller.

Os dados também impõem um limite: o ranking de músicas do Spotify não é um histórico de reprodução. Ele não informa quantas vezes uma faixa foi ouvida nem as datas das reproduções. A aplicação precisa fornecer contexto para piadas específicas sem apresentar estatísticas inventadas como fatos.

## Arquitetura

O código segue a separação de responsabilidades da Clean Architecture com ports de aplicação, records de domínio e adapters de infraestrutura. `AnalyzeMusicTasteService` implementa `AnalyzeMusicTasteUseCase`: consulta músicas e artistas por meio de `SpotifyProvider`, rejeita dados insuficientes, monta um `UserProfile` e delega a análise a `AiAnalyzisProvider`.

```text
Controllers web / REST → AnalyzeMusicTasteUseCase
                              ↓
                     AnalyzeMusicTasteService
                       ├─ SpotifyProvider → API do Spotify
                       └─ AiAnalyzisProvider
                            ├─ SpringAiAnalyzerProvider → Groq
                            └─ FakeAiAnalyzerProvider (local)
```

O Spring Security gerencia o fluxo OAuth2 Authorization Code do Spotify com o escopo `user-top-read`. Os controllers acessam o token mantido no servidor por meio de `OAuth2AuthorizedClient`; o navegador usa uma sessão, sem receber as credenciais do Spotify. O adapter do Spotify converte DTOs HTTP em records de domínio e consulta até 20 músicas e artistas do ranking de longo prazo.

## Decisões técnicas

**Isolar os detalhes dos provedores atrás de ports.** As chamadas HTTP do Spotify e os prompts de IA ficam em adapters separados. O serviço de aplicação depende das interfaces, permitindo testar a orquestração com mocks. Os records de domínio não dependem do Spring AI; o serviço de aplicação usa `@Service` do Spring para sua configuração.

**Retornar um record com campos definidos.** O `ChatClient` do Spring AI converte a resposta do modelo em `RoastAnalysis`: `title`, `musicalDiagnosis`, `roast`, `recommendation`, `chaosScore` e `personalityTags`. O construtor rejeita campos de texto obrigatórios nulos, limita a pontuação a 0–100 e copia a lista de tags. Assim, web e REST compartilham o mesmo contrato.

**Trocar a IA por meio de profiles.** O profile `local` seleciona `FakeAiAnalyzerProvider` e desabilita os clientes reais de IA. As respostas fixas contemplam os quatro idiomas sem exigir uma chave do Groq. Login e consulta de dados continuam dependendo de credenciais válidas do Spotify; a substituição se limita à inferência de IA.

## Detalhes da implementação

### Idiomas e personalidades do roast

`RoastLanguage` oferece inglês britânico (`en-GB`, padrão na web e no REST), inglês americano (`en-US`), português brasileiro (`pt-BR`) e espanhol (`es`). O idioma é escolhido independentemente do modelo. Instruções regionais no prompt ajustam grafia, expressões e humor, incluindo orientações para evitar traduções literais e gírias inventadas em português brasileiro.

O desenvolvedor configura `roast.intensity` por meio de `ROAST_INTENSITY`: `soft` traz brincadeiras leves, `mild` acrescenta sarcasmo moderado, `savage` adota críticas mais ácidas e `unhinged` amplia o exagero teatral. A configuração da aplicação usa `unhinged` como padrão. A intensidade altera o system prompt sem mudar o contrato de domínio; não é um parâmetro público da API nem um controle do usuário. O chaos score faz parte do resultado gerado e independe da intensidade.

### Configuração do modelo e falhas

O Spring AI usa o endpoint do Groq compatível com OpenAI, configurado como `https://api.groq.com/openai/v1`, com o modelo `openai/gpt-oss-120b` e temperatura `0.7`. O adapter encapsula falhas de geração e conversão em `AiAnalysisException`. Os handlers REST retornam códigos de erro estruturados; os handlers web orientam nova tentativa ou reconexão em casos de dados insuficientes, autenticação expirada e falhas dos provedores. Os formulários de geração e logout mantêm proteção CSRF, e os textos gerados são escapados na renderização.

## Compromissos técnicos

Os prompts orientam o modelo a preservar os metadados musicais recebidos, evitar fatos pessoais inventados e respeitar os limites dos rankings do Spotify. Essas instruções direcionam a geração, mas não validam a precisão factual de forma determinística nem garantem humor natural. A validação do record verifica parte da estrutura da resposta, sem comprovar que cada piada está fundamentada nos dados.

As APIs externas continuam sendo pontos de falha. O projeto trata erros de autenticação, limite de requisições e chamadas ao Spotify, mas não implementa uma política de retry para rate limits. A dependência de uma versão milestone do Spring AI também exige atenção nas atualizações.

## Testes e qualidade

O repositório contém testes de orquestração da aplicação, rejeição de dados insuficientes, respostas determinísticas do fake em todos os idiomas, falhas na conversão de respostas estruturadas e timeouts do provedor de IA. Os testes web verificam acesso OAuth2, CSRF, escape de conteúdo, seleção de idioma, tratamento de erros e compatibilidade REST.

O GitHub Actions configura Temurin 25 e executa `./gradlew clean build --no-daemon --console=plain` com os testes habilitados, sem credenciais de produção. Os testes do backend foram inspecionados, mas não executados nesta atualização do portfólio; sua existência não representa uma medição de cobertura nem comprova uma implantação.

## Resultados e aprendizados

O resultado é uma aplicação Spring Boot executável localmente, com orquestração compartilhada entre web e REST, autenticação do Spotify no servidor e adapters de IA intercambiáveis. O projeto demonstra decisões de integração backend, separação de responsabilidades e controle da estrutura e do tom das respostas de IA. O principal aprendizado é que estrutura, precisão factual e qualidade do idioma são problemas distintos: um record Java válido, sozinho, não comprova os três.

## Melhorias

Adicionar verificações determinísticas para conferir se as referências musicais geradas correspondem aos dados fornecidos e avaliar humor e naturalidade entre idiomas e intensidades. Ampliar os testes de falha do adapter do Spotify e definir a recuperação de rate limits antes de introduzir retries. Essas melhorias permanecem separadas das funcionalidades já implementadas.

## Capturas da aplicação

As capturas originais do repositório inspecionado mostram a página pública, a área autenticada e o resultado gerado. Selecione uma imagem para abri-la no tamanho original.

<figure class="project-screenshot">
  <img draggable="false" src="/projects/roast-my-taste/landing.png" alt="Página inicial do RoastMyTaste com login pelo Spotify e explicação das três etapas de geração do roast" width="1428" height="1770" loading="lazy" decoding="async" />
  <figcaption>Página pública: o login pelo Spotify inicia o fluxo OAuth2 gerenciado pelo servidor.</figcaption>
</figure>

<figure class="project-screenshot">
  <img draggable="false" src="/projects/roast-my-taste/roast-room.png" alt="Área autenticada com inglês britânico selecionado, botão de geração e cards das músicas e dos artistas do Spotify" width="1920" height="888" loading="lazy" decoding="async" />
  <figcaption>Área autenticada: escolha do idioma e consulta às músicas e aos artistas do ranking do Spotify antes da geração.</figcaption>
</figure>

<figure class="project-screenshot">
  <img draggable="false" src="/projects/roast-my-taste/roast.png" alt="Roast gerado com diagnóstico musical, texto de humor, chaos score, tags de personalidade e conselho musical ao lado das imagens do Spotify" width="1920" height="936" loading="lazy" decoding="async" />
  <figcaption>Resultado gerado: a resposta estruturada aparece como diagnóstico, roast, pontuação, tags de personalidade e conselho não solicitado.</figcaption>
</figure>

## Evidências no código

Código e capturas foram inspecionados na revisão `917bcfc`. O README orienta a execução local; não há indicação de uma demonstração hospedada neste estudo.

- [README do projeto](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/README.md)
- [Build e versões das dependências](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/build.gradle)
- [Configuração da aplicação](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/resources/application.yml)
- [Caso de uso e orquestração](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/java/dev/erick/roastmytaste/application/service/AnalyzeMusicTasteService.java)
- [Adapter do Spotify](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/java/dev/erick/roastmytaste/infrastructure/spotify/SpotifyProviderAdapter.java)
- [Configuração de segurança](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/java/dev/erick/roastmytaste/infrastructure/config/SecurityConfig.java)
- [Adapter de IA, prompts e personalidades](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/java/dev/erick/roastmytaste/infrastructure/ai/SpringAiAnalyzerProvider.java)
- [Provedor fake de IA para desenvolvimento local](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/java/dev/erick/roastmytaste/infrastructure/ai/FakeAiAnalyzerProvider.java)
- [Idiomas disponíveis](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/java/dev/erick/roastmytaste/domain/enums/RoastLanguage.java)
- [Record da resposta estruturada](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/java/dev/erick/roastmytaste/domain/model/RoastAnalysis.java)
- [Controller web e tratamento de falhas](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/src/main/java/dev/erick/roastmytaste/interfaces/web/RoastController.java)
- [Testes do backend](https://github.com/ErickMurakami/RoastMyTaste/tree/917bcfc/src/test/java/dev/erick/roastmytaste)
- [CI de build e testes](https://github.com/ErickMurakami/RoastMyTaste/blob/917bcfc/.github/workflows/ci.yml)
- [Capturas originais](https://github.com/ErickMurakami/RoastMyTaste/tree/917bcfc/docs/screenshots)
