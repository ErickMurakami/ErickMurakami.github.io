---
title: "Schema por Tenant"
repo: "quarkus-schema-per-tenant"
description: "Resolução de tenant por JWT direciona operações de clientes para schemas PostgreSQL separados."
focus: "Isolamento entre tenants e persistência"
stack: ["Java 25", "Quarkus", "Hibernate ORM", "PostgreSQL", "Flyway"]
order: 4
---

## Visão geral

Uma demonstração de multitenancy com escopo deliberadamente limitado, usando Quarkus, Hibernate ORM, PostgreSQL, Flyway e autenticação JWT.

## Problema

Dados de clientes precisam permanecer isolados entre tenants sem repetir um predicado de tenant em toda consulta do repositório. O desafio passa a ser selecionar o contexto correto de persistência.

## Arquitetura

O login lê usuários compartilhados em `public.app_users`. Operações autenticadas de clientes resolvem a claim de tenant de um JWT assinado para um schema permitido. Repositórios de clientes utilizam JPQL sem predicados de tenant.

```text
Login → public.app_users → JWT assinado
HTTP + JWT → JwtTenantResolver → Hibernate ORM
                                    ├─ tenant_a.customers
                                    └─ tenant_b.customers
```

## Decisões técnicas

`JwtTenantResolver` aceita apenas um conjunto explícito de schemas. Requisições anônimas usam `public`; usuários autenticados precisam ter um JWT com claim de tenant suportada. O Flyway cria as tabelas compartilhadas e as tabelas de cada tenant.

## Detalhes da implementação

O resolver com escopo de requisição se integra ao Hibernate por `@PersistenceUnitExtension`. Endpoints de clientes exigem autenticação. A suíte de integração assina tokens reais e testa leituras e escritas no PostgreSQL.

## Compromissos técnicos

Schemas fornecem isolamento lógico de namespaces em um banco compartilhado, não infraestrutura física separada. Migrações e provisionamento precisam ser coordenados entre schemas. A demonstração usa uma senha fixa e não oferece autenticação de produção; não implementa row-level security do PostgreSQL nem provisionamento dinâmico de tenants.

## Testes e qualidade

`TenantIsolationIT` verifica que cada usuário lê apenas os dados iniciais de seu tenant e que um cliente criado no tenant A é invisível ao tenant B. Também verifica HTTP 401 para acesso sem autenticação. O repositório fornece suporte a Testcontainers e CI com PostgreSQL. Esses testes foram inspecionados, não executados neste portfólio.

## Melhorias

Adicionar provisionamento de tenants e gestão do ciclo de migrações antes de aumentar sua quantidade. Substituir a autenticação demonstrativa antes de implantar. Propagar explicitamente o contexto de tenant para tarefas assíncronas; esse fluxo está fora da implementação atual.

## Evidências no código

- [pom.xml](https://github.com/ErickMurakami/quarkus-schema-per-tenant/blob/773e75e/pom.xml)
- [README.md](https://github.com/ErickMurakami/quarkus-schema-per-tenant/blob/773e75e/README.md)
- [src/main/java/dev/erick/multitenancy/tenancy/JwtTenantResolver.java](https://github.com/ErickMurakami/quarkus-schema-per-tenant/blob/773e75e/src/main/java/dev/erick/multitenancy/tenancy/JwtTenantResolver.java)
- [src/main/resources/db/migration/V1__initial_schema.sql](https://github.com/ErickMurakami/quarkus-schema-per-tenant/blob/773e75e/src/main/resources/db/migration/V1__initial_schema.sql)
- [src/test/java/dev/erick/multitenancy/integration/TenantIsolationIT.java](https://github.com/ErickMurakami/quarkus-schema-per-tenant/blob/773e75e/src/test/java/dev/erick/multitenancy/integration/TenantIsolationIT.java)
- [.github/workflows/ci.yml](https://github.com/ErickMurakami/quarkus-schema-per-tenant/blob/773e75e/.github/workflows/ci.yml)
