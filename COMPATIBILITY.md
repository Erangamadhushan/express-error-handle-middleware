# Compatibility

## Runtime Matrix

| Component | Supported baseline | Verification |
| --- | --- | --- |
| Node.js | 18.18 or newer | CI matrix and package `engines` |
| Express | 4.18 and 5.x | Peer dependency and integration tests |
| TypeScript | Strict consumers supported | Declaration build and `tsc --noEmit` |
| Module systems | CommonJS and ESM | Packed-package consumer smoke test |
| Zod | Optional Zod 4 adapter input | Adapter contract tests |

## Public Compatibility Rules

- Legacy response fields remain available until a major version.
- `ApiError` status and code semantics are additive-only in minor releases.
- New adapters, serializers, and policy options are additive features.
- Removing or renaming a public export requires a major release.
- Changing default message exposure or response format requires a migration note.

## Verification Matrix

Every public package change should run:

```text
npm ci
npm run typecheck
npm run test:ci
npm run build
npm run smoke:package
```

The package-quality metadata and production-feature implementation are integrated into this branch. Keep `package.json`, generated declarations, conditional exports, peer dependencies, request context, adapters, and serializers aligned with these documents.

## Compatibility Note Template

```md
### Compatibility

- Public surface changed: [yes/no]
- Affected exports/options: `...`
- Runtime behavior changed: [description]
- Migration required: [yes/no]
- Fixture or consumer test updated: [path]
```
