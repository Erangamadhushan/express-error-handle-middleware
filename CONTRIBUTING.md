# Contributing

## Development Setup

git clone https://github.com/Erangamadhushan/express-advanced-error-kit
npm install
npm test

## Branch Naming

feature/add-custom-errors
fix/mongo-parser

## Commit Convention

feat:
fix:
docs:
refactor:
test:
chore:

## Pull Request Process

1. Fork repository
2. Create branch
3. Write tests
4. Submit PR

## AI-Assisted Development Workflow

AI-assisted changes follow the same engineering bar as manually authored changes. Every behavior change must include:

1. A failing behavior test that demonstrates the requested change.
2. A small implementation change focused on the owning abstraction.
3. Typecheck, unit tests, build, and package smoke-test results.
4. A compatibility note when a public export, option, response field, error code, or runtime support range changes.

Use the repository documents as the source of truth:

- [Architecture](ARCHITECTURE.md)
- [Error contract ADR](ADRs/001-error-contract.md)
- [Adapter system ADR](ADRs/002-adapter-system.md)
- [Compatibility matrix](COMPATIBILITY.md)

Preferred validation sequence:

```bash
npm ci
npm test -- --runInBand
npx tsc --noEmit
npm run build
npm run smoke:package
```

Contract fixtures belong under `__tests__/fixtures`, with executable contract tests under `__tests__/contract`. Update both when a public response contract changes.

## Code Style

- TypeScript strict mode
- ESLint
- Prettier