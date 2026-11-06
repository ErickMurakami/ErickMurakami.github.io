---
title: "Econolyze"
repo: "Econolyze"
description: "Backend de finanças pessoais que registra pagamentos e atualiza saldos em uma transação reativa."
focus: "Fluxos financeiros reativos"
stack: ["Java 21", "Quarkus", "PostgreSQL", "Mutiny"]
order: 1
---

## Visão geral

O Econolyze é uma plataforma de finanças pessoais que reúne contas, transações, pagamentos, despesas recorrentes e metas financeiras. Seu README também descreve análise de investimentos e um assistente financeiro com IA. O repositório inclui uma interface Next.js e serviços backend Quarkus.

Este estudo parte do contexto do produto e aprofunda o serviço financeiro: o modelo de transações e pagamentos, a persistência reativa e a atualização de saldos.

## Problema

Organizar finanças vai além de listar receitas e despesas: saldos, pagamentos parciais, compromissos recorrentes e metas precisam ser coerentes entre si. O desafio de engenharia é representar essas relações mantendo claras as responsabilidades da API e da persistência. Um pagamento altera tanto o status da transação quanto o saldo de uma conta; essas operações precisam de uma fronteira transacional consistente.

## Arquitetura

O README apresenta um gateway que conecta a interface web aos serviços de autenticação, finanças e IA. O PostgreSQL fornece persistência relacional; o módulo de IA documentado também usa pgvector.

```text
Interface Next.js → gateway Quarkus
                          ├─ serviço de autenticação
                          ├─ serviço financeiro → PostgreSQL
                          └─ serviço de IA → PostgreSQL / pgvector
```

No serviço financeiro, serviços de aplicação e mapeamento de DTOs se articulam com entidades de domínio e repositórios de infraestrutura. Quarkus REST, Hibernate Reactive Panache e Mutiny sustentam o fluxo reativo. Os detalhes a seguir se concentram nesse caminho financeiro implementado.

## Decisões técnicas

`TransactionService.saveTransaction` cria um pagamento, associa-o à transação, recalcula o status e encadeia a persistência com uma atualização do saldo sob `@WithTransaction`. Valores monetários usam `BigDecimal`. A listagem primeiro busca uma página filtrada, depois carrega os pagamentos pelos IDs das transações e conta os registros correspondentes.

## Detalhes da implementação

`AccountService` restringe consultas de alteração, exclusão e busca de contas ao usuário autenticado. Atualizações de transações rejeitam divergências de proprietário e impedem a alteração do valor de uma transação paga. O retorno reativo é `Uni`, incluindo a propagação de erros pelo fluxo.

## Compromissos técnicos

A composição reativa exige cuidado com sessões e transações. Serviços separados criam mais fronteiras de implantação e falha que uma única aplicação. Não há afirmações de vazão ou latência neste estudo. As verificações de propriedade observadas em alguns métodos não comprovam cobertura completa de autorização: a busca direta de transações e a alteração de saldos merecem auditoria adicional.

## Testes e qualidade

O serviço financeiro inspecionado contém um teste inicial de saudação, sem evidências de testes abrangentes dos invariantes financeiros. Seu workflow de implantação empacota os serviços com os testes desativados. A inspeção do código não comprova uma implantação bem-sucedida em produção.

## Melhorias

Adicionar testes de rollback de pagamentos, alterações concorrentes de saldo e propriedade de recursos em todos os caminhos. Documentar falhas entre serviços. Validar a necessidade de cada fronteira de implantação antes de expandir o sistema.

## Evidências no código

- [services/financial-service/pom.xml](https://github.com/ErickMurakami/Econolyze/blob/f849783/services/financial-service/pom.xml)
- [services/financial-service/src/main/java/dev/econolyze/application/services/TransactionService.java](https://github.com/ErickMurakami/Econolyze/blob/f849783/services/financial-service/src/main/java/dev/econolyze/application/services/TransactionService.java)
- [services/financial-service/src/main/java/dev/econolyze/application/services/AccountService.java](https://github.com/ErickMurakami/Econolyze/blob/f849783/services/financial-service/src/main/java/dev/econolyze/application/services/AccountService.java)
- [services/financial-service/src/test/java/dev/econolyze/GreetingResourceTest.java](https://github.com/ErickMurakami/Econolyze/blob/f849783/services/financial-service/src/test/java/dev/econolyze/GreetingResourceTest.java)
- [.github/workflows/deploy-backend.yml](https://github.com/ErickMurakami/Econolyze/blob/f849783/.github/workflows/deploy-backend.yml)

- [README do projeto](https://github.com/ErickMurakami/Econolyze/blob/f849783/README.md)
