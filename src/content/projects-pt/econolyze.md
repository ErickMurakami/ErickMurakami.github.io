---
title: "Econolyze"
repo: "Econolyze"
description: "Transações, pagamentos e saldos de contas implementados com serviços de aplicação reativos."
focus: "Fluxos financeiros reativos"
stack: ["Java 21", "Quarkus", "PostgreSQL", "Mutiny"]
order: 1
---

## Visão geral

O Econolyze é uma aplicação de finanças pessoais com módulos separados de autenticação, gateway, finanças e IA. Este estudo se concentra no serviço financeiro, onde as evidências de implementação são mais fortes.

## Problema

Uma transação e seus pagamentos representam conceitos relacionados, mas distintos. Registrar um pagamento também altera o saldo de uma conta; as atualizações precisam preservar as regras de domínio e uma fronteira consistente de persistência.

## Arquitetura

O módulo financeiro separa serviços de aplicação e mapeamento de DTOs, entidades e enums de domínio e repositórios de infraestrutura. Utiliza Quarkus REST, Hibernate Reactive Panache, Mutiny e PostgreSQL. É uma implementação em camadas; os nomes dos pacotes, sozinhos, não comprovam inversão estrita de dependências.

```text
Recurso REST → serviço de aplicação → repositório → PostgreSQL
                       ↓
                entidade + mapper de DTO
```

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
