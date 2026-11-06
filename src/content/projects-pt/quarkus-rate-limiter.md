---
title: "Quarkus Rate Limiter"
repo: "quarkus-rate-limiter"
description: "Janelas fixas e deslizantes avaliadas atomicamente no Redis, com controle de requisições HTTP."
focus: "Limitação atômica de requisições"
stack: ["Java 21", "Quarkus", "Redis", "Lua", "OpenTelemetry"]
order: 3
---

## Visão geral

O README apresenta este projeto como uma investigação de como a limitação de requisições funciona por dentro. Uma API HTTP Quarkus expõe um endpoint rápido de ping e outro que simula uma operação lenta, com algoritmos configuráveis de janela fixa e deslizante apoiados pelo Redis.

O objetivo é tornar concreta a diferença entre as estratégias de contagem: o estado armazenado, o comportamento nas fronteiras das janelas e o motivo de executar suas decisões em Lua dentro do Redis.

## Problema

Uma API precisa decidir se um cliente pode fazer outra requisição dentro de uma janela de tempo. Com múltiplas instâncias, contadores locais não fornecem uma visão compartilhada. Ler e atualizar um contador em operações separadas também introduz disputas concorrentes. A implementação explora contadores compartilhados e registros de timestamps, documentando os picos permitidos pela janela fixa.

## Arquitetura

Um filtro JAX-RS cria uma chave por IP e chama `RateLimiterService`. A configuração seleciona um de dois armazenamentos Redis. Cada um executa sua decisão em um único script Lua.

```text
HTTP → RateLimitFilter → RateLimiterService → Redis EVAL
                              ├─ janela fixa: INCR + EXPIRE
                              └─ janela deslizante: sorted set + PEXPIRE
```

## Decisões técnicas

A chave da janela fixa inclui o número da janela atual. O script incrementa o contador e define sua expiração no primeiro uso. O script deslizante remove timestamps antigos, conta as entradas restantes e registra uma requisição quando há capacidade. A execução do script mantém essas operações juntas dentro do Redis.

## Detalhes da implementação

O filtro guarda a decisão no contexto da requisição para que o filtro de resposta não consulte o Redis novamente. Requisições rejeitadas recebem HTTP 429 e cabeçalhos de limite. O serviço registra um span OpenTelemetry com o algoritmo e a decisão.

## Compromissos técnicos

Janelas fixas usam menos estado, mas permitem picos nas fronteiras entre janelas. Logs deslizantes guardam mais entradas de requisições. O filtro atual confia nos cabeçalhos de IP encaminhados e usa a chave compartilhada `unknown` como alternativa; uma implantação atrás de proxy confiável precisa de política explícita. Falhas do Redis e diferenças no relógio da aplicação continuam sendo preocupações operacionais.

## Testes e qualidade

Testes unitários cobrem as chaves de limitação, e perfis de integração exercitam cada algoritmo. A configuração Maven desativa testes de integração por padrão; a existência deles não comprova sua execução em todos os builds. Não há resultados de carga ou benchmarks declarados.

## Melhorias

Testar chamadas concorrentes e fronteiras de tempo, configurar proxies confiáveis, definir se falhas permitem ou bloqueiam requisições e evitar atributos de tracing com alta cardinalidade para identificadores sensíveis de clientes.

## Evidências no código

- [pom.xml](https://github.com/ErickMurakami/quarkus-rate-limiter/blob/5834889/pom.xml)
- [src/main/java/dev/erickkamii/ratelimiter/infra/FixedWindowStore.java](https://github.com/ErickMurakami/quarkus-rate-limiter/blob/5834889/src/main/java/dev/erickkamii/ratelimiter/infra/FixedWindowStore.java)
- [src/main/java/dev/erickkamii/ratelimiter/infra/SlidingWindowStore.java](https://github.com/ErickMurakami/quarkus-rate-limiter/blob/5834889/src/main/java/dev/erickkamii/ratelimiter/infra/SlidingWindowStore.java)
- [src/main/java/dev/erickkamii/ratelimiter/filter/RateLimitFilter.java](https://github.com/ErickMurakami/quarkus-rate-limiter/blob/5834889/src/main/java/dev/erickkamii/ratelimiter/filter/RateLimitFilter.java)
- [src/main/java/dev/erickkamii/ratelimiter/service/RateLimiterService.java](https://github.com/ErickMurakami/quarkus-rate-limiter/blob/5834889/src/main/java/dev/erickkamii/ratelimiter/service/RateLimiterService.java)
- [src/test/java/dev/erickkamii/ratelimiter/integration/SlidingWindowIT.java](https://github.com/ErickMurakami/quarkus-rate-limiter/blob/5834889/src/test/java/dev/erickkamii/ratelimiter/integration/SlidingWindowIT.java)

- [README do projeto](https://github.com/ErickMurakami/quarkus-rate-limiter/blob/5834889/README.md)
