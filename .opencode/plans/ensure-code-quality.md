# Ensure Code Quality — Always Run Tests and Lint

## Summary

Before committing or presenting any JavaScript code changes, always run the project's test suite (Jest via `npm test`) and ESLint (`npx eslint **.js`). These are the primary quality gates for this project.

## Why

The combination of Jest unit tests and ESLint linting ensures that:
1. Existing functionality is not broken by new changes (regression protection)
2. New behavior is covered by new tests when applicable
3. Code follows established styling and avoids common mistakes (unused vars, etc.)

## When to Run

**Always** run these tools whenever JavaScript code is modified, regardless of the scope of change. This includes:

- Adding new features or components
- Refactoring existing code
- Fixing bugs
- Changing configuration that affects JS behavior
- Any commit involving `*.js` files in the project root

## How to Run

```bash
# 1. Run tests
npm test

# -OR- if only a subset needs verification (faster):
npx jest **/*.test.js --verbose

# 2. Lint all JavaScript
npx eslint **.js

# -OR- for targeted linting:
npx eslint game.js styles.css
```

## Acceptance Criteria

A code change is only acceptable when:

- [x] `npm test` exits with **all tests passing** (exit code 0, zero failures)
- [x] `npx eslint **.js` shows **zero errors** (warnings are noted but do not block)
- [ ] If a new feature is added, there should be corresponding tests for it

## What to Do on Failure

1. **If tests fail**: Fix the failing code — do not skip or disable tests
2. **If eslint errors appear**: Fix the lint violations before committing; do not silence ESLint (no `/* eslint-disable */` unless absolutely necessary and justified)
3. **If the failure is due to pre-existing issues** (not caused by your changes): Note them in the commit message or PR description, but address them in a follow-up

## Tool Configuration

- Test runner: Jest 29.x — configured via `package.json` scripts
- Linter: ESLint 10.x — flat config (`eslint.config.js`) with recommended rules + globals for browser/node/jest
- Rules enforced: `no-unused-vars` (strict), others from `@eslint/js` recommended
