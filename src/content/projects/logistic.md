---
title: "Logistic"
repo: "Logistic"
description: "Order lifecycle rules, cached reads and shipment events coordinated with database transactions."
focus: "Domain rules & event delivery"
stack: ["Java 21", "Spring Boot", "PostgreSQL", "Redis", "RabbitMQ"]
order: 2
---

## Overview

Logistic is a proof-of-concept delivery management system. Its README presents a Spring Boot REST API consumed by a separate React/Vite frontend, with an order lifecycle from creation through processing, shipment and delivery. PostgreSQL stores orders, Redis supports caching and request limits, and RabbitMQ receives shipment events.

The case study focuses on how lifecycle rules, persistence, cached reads and event publication fit together.

## Problem

A delivery order follows a business lifecycle: `CREATED → PROCESSING → SHIPPED → DELIVERED`. The backend needs to reject invalid transitions, provide filtered and paginated access, and notify other components when an order ships. Database state, cached reads and outbound messages must be coordinated without claiming stronger delivery guarantees than the implementation provides.

## Architecture
REST controllers accept request DTOs and call `OrderService`. JPA repositories persist entities and Specifications implement filtered pagination. Redis is configured through Redisson; RabbitMQ is the outbound messaging integration.

```text
Controller → OrderService → JPA → PostgreSQL
                  ├─ cached lookup → Redis
                  └─ internal event → AFTER_COMMIT listener → RabbitMQ
```

## Key technical decisions
The entity owns transition validation. `updateOrder` publishes an internal event only when the requested status is `SHIPPED`. `OrderEventPublisher` uses a transactional event listener with `AFTER_COMMIT`, moving external publication after the database commit. Cache annotations cover lookup and mutation paths.

## Implementation details
`findAll` combines `OrderSpecification` with Spring Data pagination. The service maps entities to response DTOs. The build declares Spring Security, JWT, Bean Validation, Actuator and OpenAPI alongside database and messaging dependencies.

## Trade-offs
After-commit publication avoids sending an event for a rolled-back transaction, but does not make database writes and broker delivery atomic. A process failure after commit can still lose delivery. Cache invalidation also needs failure testing across transaction boundaries.

## Testing and quality
The repository includes service and publisher unit tests, controller integration tests, cache integration tests and JWT tests. These are source-level observations; the backend suites were not executed as part of building this portfolio.

## Improvements
Evaluate a transactional outbox and idempotent consumers if durable delivery becomes a requirement. Test broker downtime, duplicate transitions and concurrent updates before describing delivery as reliable or exactly-once.

## Source evidence

- [pom.xml](https://github.com/ErickMurakami/Logistic/blob/5d63a16/pom.xml)
- [src/main/java/com/erickkamii/logistic/service/OrderService.java](https://github.com/ErickMurakami/Logistic/blob/5d63a16/src/main/java/com/erickkamii/logistic/service/OrderService.java)
- [src/main/java/com/erickkamii/logistic/service/OrderEventPublisher.java](https://github.com/ErickMurakami/Logistic/blob/5d63a16/src/main/java/com/erickkamii/logistic/service/OrderEventPublisher.java)
- [src/main/java/com/erickkamii/logistic/domain/entity/OrderEntity.java](https://github.com/ErickMurakami/Logistic/blob/5d63a16/src/main/java/com/erickkamii/logistic/domain/entity/OrderEntity.java)
- [src/test/java/com/erickkamii/logistic/service/OrderEventPublisherTest.java](https://github.com/ErickMurakami/Logistic/blob/5d63a16/src/test/java/com/erickkamii/logistic/service/OrderEventPublisherTest.java)
- [docker-compose.yml](https://github.com/ErickMurakami/Logistic/blob/5d63a16/docker-compose.yml)

- [Project README](https://github.com/ErickMurakami/Logistic/blob/5d63a16/README.md)
