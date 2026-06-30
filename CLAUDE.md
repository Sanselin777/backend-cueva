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

## Architecture: choosing the right approach

**Default:** simple layered — `Controller → Service → Prisma`. Start here every time.
Escalate only when a concrete signal demands it; never escalate by anticipation.

### Signals that justify escalating beyond the default

- **Rich domain invariants** that must hold regardless of transport or persistence layer.
- **DB-free unit testing** of business logic is required (service tests that cannot import Prisma).
- **Multiple data sources or external integrations** must be orchestrated inside one use case.
- **Read model diverges** significantly from the write model (shape, aggregation, or source).
- **Longevity & blast radius:** a throwaway interview task vs. a long-lived production service changes the calculus.

> **Rule of thumb:** YAGNI by default. Add a layer only when one of the signals above is
> concretely present — not in anticipation of a future need.

### Architecture options

| Approach | Pros | Cons | Use when |
|---|---|---|---|
| **Simple layered** (Controller → Service → Prisma) | Fastest; least boilerplate; fits CRUD perfectly | Business logic couples to Prisma; harder to isolate as the service grows | **Default.** CRUD, interview tasks, thin domains. |
| **Layered + Repository interface** | Mockable data access; cleaner service tests; swappable storage | Extra boilerplate; YAGNI for simple CRUD | Query logic gets complex, or you need to mock the DB cleanly in unit tests. |
| **Clean / Hexagonal** (ports & adapters) | Framework- and DB-independent domain; use cases are highly testable in isolation | Heavy boilerplate; overkill for CRUD | Rich domain + long-lived service where framework independence pays off. |
| **DDD tactical** (aggregates, value objects, domain events) | Models complex invariants explicitly; fully encapsulates domain rules | Steep; over-engineering for simple apps | Genuinely complex business rules with strong invariants (e.g. financial, compliance). |
| **CQRS / event-driven** (`@nestjs/cqrs`) | Scales divergent read/write paths; clear command/query split | Added complexity; eventual-consistency overhead | Read and write models diverge enough that a single model causes friction. |

### Tools to use when making the architecture decision

Before writing any code for a non-trivial feature, invoke one of these explicitly:

| When | Use |
|---|---|
| Architecture intent is fuzzy — explore options before committing to one | `superpowers:brainstorming` skill |
| Want a concrete NestJS architecture proposal or a review of a proposed design | `nestjs-code-architect` agent |
| Want to weigh trade-offs or ask "is this over-engineering?" | `software-architecture-mentor` agent |
| Applying Clean / Hexagonal / Onion boundaries and the Dependency Rule | `clean-architecture` skill |
| Picking a backend pattern (Clean / Hexagonal / DDD) for a service | `architecture-patterns` skill |
| Grounding the design in SOLID and clean boundaries | `solid` skill |
| Choosing a concrete design pattern (Strategy, Factory, Observer…) inside the chosen architecture | `design-patterns-mentor` agent |

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

## Skills, agents & commands

Invoke these before starting any substantial task — never wait until after writing code.

| When | Use |
|---|---|
| Starting a substantial feature (>~500 LOC / cross-cutting / ambiguous) | `spec-driven-implementation` skill — write PRODUCT.md/TECH.md first |
| Before any creative/feature work — explore intent & design | `superpowers:brainstorming` skill |
| Writing, reviewing, or refactoring NestJS modules, services, controllers, guards | `nestjs-best-practices` skill and/or `nestjs-code-architect` agent |
| Node.js/TS backend patterns (layering, error handling, interceptors) | `nodejs-backend-patterns` skill |
| Advanced TypeScript (generics, conditional types, DTOs, utility types) | `typescript-advanced-types` skill |
| Architecture or SOLID decisions for the service layer | `clean-architecture` / `architecture-patterns` / `solid` skills |
| Domain/business logic that should be test-first | `superpowers:test-driven-development` skill |
| Debugging a non-obvious bug | `superpowers:systematic-debugging` skill |
| Reviewing the current diff for bugs | `/code-review` command |
| Cleanup: reuse / simplify / efficiency on changed code | `/simplify` command |
| Confirm a change works by running the app | `/verify` or `/run` command |
| Need current library/framework docs (NestJS, Prisma, class-validator…) | `find-docs` skill or `ctx7 docs <library-id>` |
