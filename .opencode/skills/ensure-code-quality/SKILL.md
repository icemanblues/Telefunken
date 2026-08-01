# Ensure Code Quality — Always Run All Four Gates

## Summary

Before committing or presenting any code changes, always run all four quality gates: tests (`pnpm test`), type checking (`pnpm typecheck`). These are required gates.

## Why

Each gate protects against a different class of defects:
1. **Tests** verify existing functionality is not broken and new behavior is covered
2. **Type checks** catch structural/type errors that tests miss, enforced at compile time
3. **Linting** enforces code style, catches anti-patterns, ensures consistency across the team
4. **Build** verifies the project compiles cleanly for production with zero warnings

## When to Run

Run all four gates whenever code is modified or configuration changes that affect code output:

- Adding new features or components
- Refactoring existing code
- Fixing bugs
- Changing TypeScript types, interfaces, or generics
- Updating build configuration (vite.config.ts, tsconfig.json)
- Removing or renaming exported members

## How to Run

Run all four gates in sequence. If any gate fails, stop — fix the issue and re-run from that point:

```bash
# 1. Tests
pnpm test

# 2. Type checking (zero errors allowed)
pnpm typecheck

# 3. Linting (zero warnings, zero errors allowed)
pnpm lint

# 4. Production build (zero issues in bundle)
pnpm build
```

## Acceptance Criteria

All gates must pass with zero errors and zero warnings:

- [x] `pnpm test` — **exit code 0**, all tests passing, no skipped/failing tests
- [x] `pnpm typecheck` — **zero** type errors
- [x] `pnpm lint` — **zero** warnings or errors
- [ ] If new features are added, corresponding tests must be written

## What to Do on Failure

1. **Tests fail**: Fix the failing code — do not skip, mask, or disable tests
2. **Type check fails**: Fix the type errors and import/export issues. No `any` types should be used unless unavoidable (use `unknown` first)
3. **Lint fails**: Fix the violations before committing; do not silence ESLint rules permanently without justification
