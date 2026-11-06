---
title: "Econolyze"
repo: "Econolyze"
description: "Financial transactions, payments and account balances implemented through reactive application services."
focus: "Reactive financial workflows"
stack: ["Java 21", "Quarkus", "PostgreSQL", "Mutiny"]
order: 1
---

## Overview
Econolyze is a personal finance application with separate authentication, gateway, financial and AI service modules. This study focuses on the financial service, where the implementation evidence is strongest.

## Problem
A transaction and its payments represent related but different concepts. Recording a payment also changes an account balance; updates need to preserve domain rules and a consistent persistence boundary.

## Architecture
The financial module separates application services and DTO mapping, domain entities and enums, and infrastructure repositories. It uses Quarkus REST, Hibernate Reactive Panache, Mutiny and PostgreSQL. This is a layered implementation; package names alone do not establish strict dependency inversion.

```text
REST resource → application service → repository → PostgreSQL
                      ↓
               entity + DTO mapper
```

## Key technical decisions
`TransactionService.saveTransaction` builds a payment, attaches it to the transaction, recalculates status and chains persistence with an account balance update under `@WithTransaction`. `BigDecimal` represents monetary amounts. Listing first retrieves a filtered page, then hydrates payments by transaction IDs and counts the matching records.

## Implementation details
`AccountService` scopes account update, delete and lookup queries by the authenticated user. Transaction updates reject ownership mismatches and prevent changing the amount of a paid transaction. The reactive return type is `Uni`, including error propagation through the pipeline.

## Trade-offs
Reactive composition requires careful session and transaction management. Separate services create more deployment and failure boundaries than a single application. No throughput or latency claim is made here. Ownership checks observed in some methods do not prove complete authorization coverage: direct transaction lookup and account balance mutation deserve further audit.

## Testing and quality
The inspected financial service has a starter greeting test, rather than evidence of comprehensive financial invariant tests. Its deployment workflow packages with tests skipped. Source inspection does not establish a successful production deployment.

## Improvements
Add tests for payment rollback, concurrent balance changes and resource ownership on every path. Document service-to-service failure behavior. Validate the need for each deployment boundary before expanding the system.

## Source evidence

- [services/financial-service/pom.xml](https://github.com/ErickMurakami/Econolyze/blob/f849783/services/financial-service/pom.xml)
- [services/financial-service/src/main/java/dev/econolyze/application/services/TransactionService.java](https://github.com/ErickMurakami/Econolyze/blob/f849783/services/financial-service/src/main/java/dev/econolyze/application/services/TransactionService.java)
- [services/financial-service/src/main/java/dev/econolyze/application/services/AccountService.java](https://github.com/ErickMurakami/Econolyze/blob/f849783/services/financial-service/src/main/java/dev/econolyze/application/services/AccountService.java)
- [services/financial-service/src/test/java/dev/econolyze/GreetingResourceTest.java](https://github.com/ErickMurakami/Econolyze/blob/f849783/services/financial-service/src/test/java/dev/econolyze/GreetingResourceTest.java)
- [.github/workflows/deploy-backend.yml](https://github.com/ErickMurakami/Econolyze/blob/f849783/.github/workflows/deploy-backend.yml)
