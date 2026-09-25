# ADR 002: Adapter-Based Error Normalization

- Status: Accepted
- Date: 2026-09-26
- Scope: External and library-specific error recognition

## Context

Database drivers, validation libraries, HTTP clients, and domain modules expose incompatible error shapes. Embedding every special case inside `errorMiddleware` makes the central transport boundary hard to test and forces package releases for application-specific errors.

## Decision

Use typed adapters with this contract:

```ts
type ErrorAdapter = (error: unknown) => ApiError | undefined;
```

An adapter returns an `ApiError` when it recognizes the value and `undefined` otherwise. Adapters do not mutate the response, log, or call Express `next`.

The target registration model supports both:

- middleware-local adapter arrays for simple applications
- an `ErrorAdapterRegistry` for reusable application configuration

Resolution order is deterministic:

1. Application-registered adapters
2. Built-in MongoDB duplicate-key adapter
3. Built-in Zod adapter
4. Generic internal-error fallback

The first matching adapter wins.

## Consequences

- New integrations do not require edits to the middleware coordinator.
- Adapters can be unit tested with plain values and do not need an Express server.
- Adapter ordering is part of the public behavior and must be tested.
- An adapter must never expose raw driver messages without considering the exposure policy.
- Built-in adapters must remain optional at runtime and must not force consumers to install unused libraries.

## Registration Example

```ts
const registry = new ErrorAdapterRegistry()
  .register(prismaAdapter)
  .register(domainAdapter);

app.use(errorMiddleware({ adapters: registry }));
```

## Rejected Alternatives

### Global mutable adapter registration

Rejected because global state leaks between tests and application instances.

### Adapter functions that write HTTP responses

Rejected because it couples recognition to Express and prevents alternate serializers or transports.
