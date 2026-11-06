---
title: "Quarkus Rate Limiter"
repo: "quarkus-rate-limiter"
description: "Fixed and sliding request windows evaluated atomically in Redis, with HTTP enforcement."
focus: "Atomic rate limiting"
stack: ["Java 21", "Quarkus", "Redis", "Lua", "OpenTelemetry"]
order: 3
---

## Overview
A focused Quarkus experiment comparing fixed-window and sliding-window request limiting with a shared Redis store.

## Problem
Per-instance counters diverge when an API has multiple replicas. A read followed by a separate write also allows concurrent requests to race against a limit.

## Architecture
A JAX-RS request filter builds an IP key and calls `RateLimiterService`. Configuration selects one of two Redis stores. Each store executes its decision as one Lua script.

```text
HTTP → RateLimitFilter → RateLimiterService → Redis EVAL
                              ├─ fixed window: INCR + EXPIRE
                              └─ sliding window: sorted set + PEXPIRE
```

## Key technical decisions
The fixed-window key includes the current window number. Its script increments the counter and sets an expiry on first use. The sliding-window script removes old timestamps, counts the remaining entries and conditionally records a request. Script execution keeps those operations together inside Redis.

## Implementation details
The filter stores the decision on the request context so the response filter does not query Redis again. Rejected requests receive HTTP 429 and rate-limit headers. The service records an OpenTelemetry span with the algorithm and decision.

## Trade-offs
Fixed windows use less state but permit bursts around window boundaries. Sliding logs retain more request entries. The current filter trusts forwarded IP headers and falls back to a shared `unknown` key; deployment behind a trusted proxy needs an explicit policy. Redis failure behavior and application-clock skew remain operational concerns.

## Testing and quality
Unit tests cover rate-limit keys, and integration profiles exercise each window algorithm. The Maven configuration defaults to skipping integration tests; their existence is not evidence that every build runs them. No load-test result or benchmark is claimed.

## Improvements
Test concurrent callers and clock-boundary behavior, configure trusted proxy handling, define fail-open versus fail-closed behavior and avoid high-cardinality trace attributes for sensitive client identifiers.

## Source evidence

- [pom.xml](https://github.com/ErickMurakami/quarkus-rate-limiter/blob/5834889/pom.xml)
- [src/main/java/dev/erickkamii/ratelimiter/infra/FixedWindowStore.java](https://github.com/ErickMurakami/quarkus-rate-limiter/blob/5834889/src/main/java/dev/erickkamii/ratelimiter/infra/FixedWindowStore.java)
- [src/main/java/dev/erickkamii/ratelimiter/infra/SlidingWindowStore.java](https://github.com/ErickMurakami/quarkus-rate-limiter/blob/5834889/src/main/java/dev/erickkamii/ratelimiter/infra/SlidingWindowStore.java)
- [src/main/java/dev/erickkamii/ratelimiter/filter/RateLimitFilter.java](https://github.com/ErickMurakami/quarkus-rate-limiter/blob/5834889/src/main/java/dev/erickkamii/ratelimiter/filter/RateLimitFilter.java)
- [src/main/java/dev/erickkamii/ratelimiter/service/RateLimiterService.java](https://github.com/ErickMurakami/quarkus-rate-limiter/blob/5834889/src/main/java/dev/erickkamii/ratelimiter/service/RateLimiterService.java)
- [src/test/java/dev/erickkamii/ratelimiter/integration/SlidingWindowIT.java](https://github.com/ErickMurakami/quarkus-rate-limiter/blob/5834889/src/test/java/dev/erickkamii/ratelimiter/integration/SlidingWindowIT.java)
