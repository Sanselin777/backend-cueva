# CLAUDE.md — backend-cueva

NestJS 11 + TypeScript backend template for technical interviews (Cueva Tech context:
fintech / prop-trading / EdTech domain). Uses **Prisma** as ORM. Part of a two-repo
setup (`fronted-cueva` is the companion frontend). **All code and comments in English.**

## Commands

```bash
npm run start:dev      # watch mode — hot reload
npm run build          # tsc compile → dist/
npm test               # unit tests (*.spec.ts under src/)
npm run test:watch     # unit tests in watch mode
npm run test:e2e       # end-to-end with Supertest (test/*.e2e-spec.ts)
npm run lint           # eslint (report only)
npm run lint:fix       # eslint --fix (auto-fix)
npx prisma generate    # regenerate Prisma Client after schema changes
npx prisma migrate dev --name <name>   # create + apply a migration
npx prisma studio      # open visual DB browser (port 5555)
npx prisma db push     # push schema without a migration file (prototyping only)
```

> **Database:** PostgreSQL `cueva_backend` on `localhost:5432` (user `postgres`, no password).
> `DATABASE_URL` is set in `.env`. Prisma 7 reads it via `prisma.config.ts`.
> Prisma Client is generated to `generated/prisma/` — import from there, not from `@prisma/client`.
>
> `main.ts` already has `ValidationPipe` (whitelist + forbidNonWhitelisted + transform),
> CORS for the frontend dev server, and Swagger at `/api-docs`. Do not reconfigure these.

## After every code change

Run `npm run lint:fix` to auto-fix style issues, then verify `npm run build` passes
with zero errors before reporting a task as complete.

## Project conventions

- **Feature modules** under `src/modules/<feature>/` (`entities/`, `dto/`,
  `interfaces/`, service, controller, module). Cross-cutting code under `src/common/`.
- **Thin controllers** (HTTP only) → **services** (business logic) → **Prisma** for
  data access. Extract a repository layer only when query logic becomes genuinely
  complex (YAGNI).
- **Exported interfaces/types in `*.interface.ts`** under an `interfaces/` folder —
  never declared inline inside a service or controller. Transversal (≥ 2 modules) →
  `src/common/interfaces/`; module-owned → `modules/<m>/interfaces/`. Local,
  non-exported types may stay inline.
- **Money = integer cents.** Store `amountCents: number`; format to display units
  only at the presentation layer. Never use floats for money.
- **Database schema changes go only through Prisma migrations** — never edit the DB
  directly. Commit `prisma/schema.prisma` and the generated migration files together.
- **Validation:** every request body and query param is validated by a `class-validator`
  DTO. The global `ValidationPipe` is already in `main.ts`; e2e tests must register
  the same pipe manually (AppModule alone does not register it).
- **Paginated responses** return `{ data, meta }` where
  `meta = { total, page, limit, totalPages, hasNextPage }`.
- **Response shape:** return entities directly when they hold no sensitive fields; use
  response DTOs / `@Exclude` (e.g. `passwordHash`) where they do.
- **Security:** rate limiting (`ThrottlerModule`), `ValidationPipe` (whitelist),
  centralized exception filters, and logging live in `main.ts` and `src/common/`.

## TypeScript coding guidelines

### Naming

- **Classes / Interfaces / Types / Enums** (name and keys): `UpperCamelCase`.
- **Variables / functions / methods**: `camelCase`; functions use verb-based names.
- **Module-level constants**: `UPPER_SNAKE_CASE`.
- **Booleans** (vars/methods): start with `is`, `has`, `can`, or `should`.
- **Event handlers**: start with `on` or `handle`.

### Class structure

- Every class member has an **explicit access modifier** (`public`/`private`). Default
  to `private`. Use the `private` keyword — **never** underscore prefixes.
- Every method has an **explicit return type**.
- **Public members before private.** High-level methods first; a called method sits
  below its caller.
- Use `readonly` for immutable properties.

### Type safety

- All function parameters have explicit types. Return typed `Promise<T>`.
- **Avoid `any`** — use a specific type, `unknown`, or a union. Never `any` without
  justification.
- Strict equality (`===`, `!==`) only.
- Wrap magic strings/numbers in constants or enums; prefer `const` assertions for
  literal types.

### Self-documenting code

- Descriptive names over comments. **Avoid JSDoc.** Keep only short `//` notes for
  non-obvious *why* (a gotcha, an external constraint) — never to restate *what* a
  well-named symbol already says.
- No `console.log` used for temporary debugging in committed code.
- No dead code: remove unused methods, variables, and imports after any refactor.

### Async

- `async/await` over promise chains. Handle errors with `try/catch`. Use custom error
  classes for domain errors with meaningful, contextual messages.

### Function design

- Keep functions pure where possible. Single responsibility.
- Max 3–4 parameters; use an options object beyond that.
- Return early to reduce nesting. Avoid `else` after an early return.

## NestJS guidelines

- **Do not re-import global modules.** `ConfigModule.forRoot({ isGlobal: true })` is
  available app-wide; never import it again in feature modules.
- **No dead code.** Remove unused providers, imports, and anything orphaned by a refactor.

## Testing

- **TDD for domain/business logic**: test-first, pure functions with no framework imports.
- Unit tests mock the Prisma service with `jest.fn()` or a fake in-memory store.
- E2e tests (Supertest) run against the real app; register `ValidationPipe` manually.
- Keep test output pristine (no stray warnings); assertions must be non-vacuous.
