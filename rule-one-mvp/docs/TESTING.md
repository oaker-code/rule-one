# Testing

Rule One desktop MVP uses `vitest` plus `@testing-library/react` for the current automated test baseline.

## Run All Tests

From `apps/desktop`:

```bash
npm test
```

## Run Unit Tests Only

```bash
npm run test:unit
```

## Run UI Tests Only

```bash
npm run test:ui
```

## Run One Test File

```bash
npx vitest run src/test/unit/pipeline.test.ts
```

Example UI file:

```bash
npx vitest run src/test/ui/dailyReview.test.tsx
```

## Current Test Structure

```text
src/test/
  fixtures/
  helpers/
  unit/
  ui/
```

## Smoke Tests

These are the minimum tests that should pass before demoing the app:

- `src/test/unit/repositories.test.ts`
- `src/test/unit/modelGateway.test.ts`
- `src/test/unit/pipeline.test.ts`
- `src/test/ui/dailyReview.test.tsx`
- `src/test/ui/resultPage.test.tsx`
- `src/test/ui/historyPage.test.tsx`

## Notes

- Pipeline tests use a mock LLM provider and do not depend on real network calls.
- UI tests mock business-layer modules and focus on page behavior.
- Repository service tests mock SQLite repositories so they stay fast and deterministic.
