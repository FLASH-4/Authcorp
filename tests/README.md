Test Scaffolding

- Unit tests target `src/lib` utilities (validation, security, caching).
- Prefer `vitest` or `jest`; add as devDeps when ready.
- Run checks in CI via `npm run lint`, `npm run type-check`, `npm run build`.
- Add tests under `tests/` or `src/lib/__tests__/` using your chosen runner.
- Mock environment variables for `SecurityManager` (`JWT_SECRET`, `ENCRYPTION_KEY`).