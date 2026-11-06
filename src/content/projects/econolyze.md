---
title: "Econolyze"
repo: "Econolyze"
description: "Financial transactions, payments and account balances implemented through reactive application services."
focus: "Reactive financial workflows"
stack: ["Java 21", "Quarkus", "PostgreSQL", "Mutiny"]
order: 1
---

## Overview

Econolyze is a personal finance platform for bringing accounts, transactions, payments, recurring expenses and financial goals into one application. Its README also describes investment analysis and a financial AI assistant. The repository includes a Next.js web interface and Quarkus backend services.

This case study follows the product context first, then examines the financial service: the transaction/payment model, reactive persistence and balance updates.

## Problem

Personal finance is more than a list of income and expenses: balances, partial payments, recurring commitments and goals need to agree. The engineering challenge is to represent those relationships while keeping API access and persistence responsibilities clear. A payment changes both transaction status and an account balance, so those operations need a consistent transaction boundary.

## Architecture

The README describes a gateway that connects the web interface to authentication, financial and AI services. PostgreSQL provides relational persistence; the documented AI module also uses pgvector.

```text
Next.js interface → Quarkus gateway
                         ├─ authentication service
                         ├─ financial service → PostgreSQL
                         └─ AI service → PostgreSQL / pgvector
```

Inside the financial service, application services and DTO mapping sit alongside domain entities and infrastructure repositories. Quarkus REST, Hibernate Reactive Panache and Mutiny support the reactive flow. The discussion below focuses on that implemented financial path.

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

- [Project README](https://github.com/ErickMurakami/Econolyze/blob/f849783/README.md)
