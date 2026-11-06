---
title: "Logistic"
repo: "Logistic"
description: "Regras do ciclo de pedidos, consultas em cache e eventos de envio coordenados com transações do banco."
focus: "Regras de domínio e entrega de eventos"
stack: ["Java 21", "Spring Boot", "PostgreSQL", "Redis", "RabbitMQ"]
order: 2
---

## Visão geral

O Logistic é uma API de pedidos de entrega feita com Spring Boot. Combina um modelo de domínio enxuto com persistência, integração de cache e publicação de eventos de envio.

## Problema

Atualizações de pedidos devem respeitar o ciclo de entrega. Um evento de envio não deve ser emitido antes do commit da transação no banco, e consultas em cache precisam ser invalidadas após alterações.

## Arquitetura

Controladores REST recebem DTOs e chamam `OrderService`. Repositórios JPA persistem entidades e Specifications implementam paginação filtrada. O Redis é configurado pelo Redisson; o RabbitMQ é a integração de saída para mensagens.

```text
Controlador → OrderService → JPA → PostgreSQL
                   ├─ consulta em cache → Redis
                   └─ evento interno → listener AFTER_COMMIT → RabbitMQ
```

## Decisões técnicas

A entidade valida as transições de estado. `updateOrder` publica um evento interno apenas quando o status solicitado é `SHIPPED`. `OrderEventPublisher` utiliza um listener transacional com `AFTER_COMMIT`, movendo a publicação externa para depois do commit. Anotações de cache cobrem consultas e alterações.

## Detalhes da implementação

`findAll` combina `OrderSpecification` com a paginação do Spring Data. O serviço mapeia entidades para DTOs de resposta. O build declara Spring Security, JWT, Bean Validation, Actuator e OpenAPI, além das dependências de banco e mensageria.

## Compromissos técnicos

A publicação após o commit evita enviar um evento de uma transação revertida, mas não torna atômicas a escrita no banco e a entrega ao broker. Uma falha do processo após o commit ainda pode perder a entrega. A invalidação de cache também exige testes de falha nas fronteiras transacionais.

## Testes e qualidade

O repositório inclui testes unitários de serviços e publicação, testes de integração de controlador e cache e testes de JWT. São observações do código: as suítes do backend não foram executadas durante a construção deste portfólio.

## Melhorias

Avaliar um transactional outbox e consumidores idempotentes caso a entrega durável se torne requisito. Testar indisponibilidade do broker, transições duplicadas e atualizações concorrentes antes de descrever a entrega como confiável ou exatamente uma vez.

## Evidências no código

- [pom.xml](https://github.com/ErickMurakami/Logistic/blob/5d63a16/pom.xml)
- [src/main/java/com/erickkamii/logistic/service/OrderService.java](https://github.com/ErickMurakami/Logistic/blob/5d63a16/src/main/java/com/erickkamii/logistic/service/OrderService.java)
- [src/main/java/com/erickkamii/logistic/service/OrderEventPublisher.java](https://github.com/ErickMurakami/Logistic/blob/5d63a16/src/main/java/com/erickkamii/logistic/service/OrderEventPublisher.java)
- [src/main/java/com/erickkamii/logistic/domain/entity/OrderEntity.java](https://github.com/ErickMurakami/Logistic/blob/5d63a16/src/main/java/com/erickkamii/logistic/domain/entity/OrderEntity.java)
- [src/test/java/com/erickkamii/logistic/service/OrderEventPublisherTest.java](https://github.com/ErickMurakami/Logistic/blob/5d63a16/src/test/java/com/erickkamii/logistic/service/OrderEventPublisherTest.java)
- [docker-compose.yml](https://github.com/ErickMurakami/Logistic/blob/5d63a16/docker-compose.yml)
