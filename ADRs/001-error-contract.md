# ADR 001: Stable Error Contract

- Status: Accepted
- Date: 2026-09-26
- Scope: Public error objects and HTTP response envelopes

## Context

Express applications throw many different values: domain errors, validation failures, database errors, and ordinary `Error` instances. Consumers need predictable status codes and machine-readable error codes without exposing implementation details in production.

The package already exposes `ApiError`, predefined error classes, `createError`, and a legacy JSON response envelope. Those names and fields are consumed by application code and should not change casually.

## Decision

Use `ApiError` as the normalized application contract:

- `message`: human-readable detail subject to exposure policy
- `statusCode`: HTTP status code
- `code`: optional stable machine-readable identifier
- `isOperational`: indicates an expected application failure

The default response remains:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Resource not found",
  "error": "NotFoundError",
  "code": "NOT_FOUND"
}
```

The package may additionally provide an RFC 9457-style problem-details response, but it must be opt-in. The legacy response is the compatibility baseline until a major version changes it.

## Exposure Rules

- 4xx messages may be exposed by default.
- 5xx messages are replaced with `Internal Server Error` in production by default.
- Stack traces are never serialized in production.
- Applications may provide an explicit exposure policy or serializer.

## Consequences

- Consumers can assert on `statusCode` and `code` without depending on database or validation libraries.
- Error normalization and response serialization can evolve independently.
- Adding a response field is a compatibility decision because clients may perform strict object comparisons.
- Every public response change requires fixture updates and a compatibility note.

## Rejected Alternatives

### Pass through arbitrary thrown values

Rejected because it leaks inconsistent status codes, messages, and library internals.

### Use class names as the machine-readable contract

Rejected because class names can change during refactoring or bundling. `code` is the stable identifier; class names are descriptive metadata.
