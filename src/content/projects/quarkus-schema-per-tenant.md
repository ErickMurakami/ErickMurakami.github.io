---
title: "Schema per Tenant"
repo: "quarkus-schema-per-tenant"
description: "Customer API that selects a PostgreSQL schema from a JWT tenant claim, with Flyway migrations per tenant."
focus: "Tenant isolation & persistence"
stack: ["Java 25", "Quarkus", "Hibernate ORM", "PostgreSQL", "Flyway"]
order: 4
---

## Overview

This small REST API demonstrates schema-per-tenant multitenancy. As explained in its README, users share a login table in the `public` schema, while each tenant has its own customer table. The example deliberately limits the business scope to listing and creating customers so the persistence boundary stays visible.

Quarkus, Hibernate ORM, PostgreSQL, Flyway and JWT form the request path; unit tests and real-database integration tests explain what the example is intended to guarantee.

## Problem

In a shared-schema design, every customer query must preserve the tenant discriminator. This project explores an alternative: keep customer queries tenant-agnostic and let Hibernate route them to the schema selected from a signed JWT. The central question becomes whether each operation runs in the correct tenant context, rather than whether every query repeats the correct predicate.

## Architecture
Login reads shared users from `public.app_users`. Authenticated customer operations resolve a signed JWT tenant claim into an allowed schema. Customer repositories use tenant-agnostic JPQL.

```text
Login → public.app_users → signed JWT
HTTP + JWT → JwtTenantResolver → Hibernate ORM
                                    ├─ tenant_a.customers
                                    └─ tenant_b.customers
```

## Key technical decisions
`JwtTenantResolver` accepts only an explicit set of schemas. Anonymous requests resolve to `public`; authenticated principals must be JWTs with a supported tenant claim. Flyway creates the shared and tenant tables.

## Implementation details
The request-scoped resolver integrates with Hibernate through `@PersistenceUnitExtension`. Customer endpoints require authentication. The integration suite signs real tokens and tests reads and writes against PostgreSQL.

## Trade-offs
Schemas provide logical namespace isolation on one shared database, not separate physical infrastructure. Migrations and provisioning must be coordinated across schemas. The demo uses a fixed password and is not production-grade authentication; it does not implement PostgreSQL row-level security or dynamic tenant provisioning.

## Testing and quality
`TenantIsolationIT` checks that each user reads only their tenant's seed data and that a customer created in tenant A is invisible to tenant B. It also checks unauthenticated access returns 401. The repository supplies Testcontainers support and CI with PostgreSQL. These backend tests were inspected, not run for this portfolio.

## Improvements
Add tenant provisioning and migration lifecycle management before increasing the number of tenants. Replace demo authentication before deployment. Explicitly propagate tenant context into asynchronous work; that flow is outside the current implementation.

## Source evidence

- [pom.xml](https://github.com/ErickMurakami/quarkus-schema-per-tenant/blob/773e75e/pom.xml)
- [README.md](https://github.com/ErickMurakami/quarkus-schema-per-tenant/blob/773e75e/README.md)
- [src/main/java/dev/erick/multitenancy/tenancy/JwtTenantResolver.java](https://github.com/ErickMurakami/quarkus-schema-per-tenant/blob/773e75e/src/main/java/dev/erick/multitenancy/tenancy/JwtTenantResolver.java)
- [src/main/resources/db/migration/V1__initial_schema.sql](https://github.com/ErickMurakami/quarkus-schema-per-tenant/blob/773e75e/src/main/resources/db/migration/V1__initial_schema.sql)
- [src/test/java/dev/erick/multitenancy/integration/TenantIsolationIT.java](https://github.com/ErickMurakami/quarkus-schema-per-tenant/blob/773e75e/src/test/java/dev/erick/multitenancy/integration/TenantIsolationIT.java)
- [.github/workflows/ci.yml](https://github.com/ErickMurakami/quarkus-schema-per-tenant/blob/773e75e/.github/workflows/ci.yml)
