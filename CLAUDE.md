# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with HMR at http://localhost:5173
npm run build        # Production build
npm run typecheck    # Run react-router typegen + tsc
npx eslint .         # Lint (no lint script in package.json — run eslint directly)
npx eslint --fix .   # Auto-fix (import sorting, etc.)

# Database (requires DATABASE_URL env var)
npm run db:generate  # Generate migration from schema changes
npm run db:migrate   # Apply pending migrations
npm run db:seed      # Seed the database

# Local Postgres via Docker
docker compose up -d  # Start Postgres on port 5433
```

Env vars are loaded from `.env` via `dotenv-cli` for database scripts. The dev server reads `.env` automatically via Vite.

## Architecture

**Stack:** React Router v7 (SSR, framework mode) · Drizzle ORM · PostgreSQL · TailwindCSS v4 · Zod · TypeScript

### Layer separation

```
database/        ← schema definitions and the db client
  schemas/       ← one file per pg schema namespace (app_user, trainer)
  schema.ts      ← re-exports all schemas (used by db.ts and drizzle-kit)
  db.ts          ← singleton Drizzle client (snake_case casing configured here)
  utils/         ← shared column helpers (timestamps, lower())

app/
  models/        ← data-access functions (queries/mutations), one file per domain
  utils/         ← shared utilities: form validation, response shaping, DB error parsing
  routes/        ← React Router route files (loader/action + default component)
  types.ts       ← shared TS types (FieldErrors, FormFields, ModelResult)
```

### Database schemas (Postgres namespaces)

The database uses Postgres schemas (not the same as Drizzle schema files):
- `app_user` — user accounts (`app_user.users`)
- `trainer` — trainer profiles, pokemon, PC boxes, teams

All tables include `createdAt`, `updatedAt`, `deletedAt` via the `timestamps` helper in `database/utils/columnHelpers.ts`. Drizzle is configured with `casing: "snake_case"`, so TypeScript uses camelCase (`userId`) and the DB columns use snake_case (`user_id`).

### Response shape convention

Two distinct layers with different shapes:

**Model → Action:** `ModelResult<T>` from `app/types.ts`
```ts
type ModelResult<T> = { ok: true; data: T } | { ok: false; message: string; constraint: string | null }
```
Model functions never import from `response-package`. They return `{ ok: true, data }` on success and `{ ok: false, message, constraint }` on failure. Single-row operations return `T` directly (not `T[]`).

**Action → Component:** `{ success, data?, errors? }` shape via helpers in `app/utils/response-package.ts`:
- `sendResponseData(data)` — success, wraps in React Router's `data()` with status 200
- `sendResponseError(errors)` — failure, wraps in React Router's `data()` with status 400

Actions interpret the model result and construct what the component needs. Each route defines its own errors type listing all possible error keys as optional fields:
```ts
type SignUpErrors = {
  email?: string;
  form?: string;
};
```

### Form validation pattern

Route actions use `validateForm()` from `app/utils/form-validation.ts`. The callback only runs if Zod validation passes; the action is responsible for interpreting the model result and building the component response:
```ts
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  return validateForm(formData, zodSchema, async ({ email }) => {
    const result = await someModelFunction(email);
    if (!result.ok) {
      const errors: RouteErrors = result.constraint === "some_constraint"
        ? { field: "Specific message" }
        : { form: result.message };
      return data({ success: false, data: { email }, errors }, { status: 400 });
    }
    return sendResponseData(result.data);
  });
}
```

Field names ending in `[]` are treated as multi-value arrays.

### DB error handling

`app/utils/dbErrorInterpreter.ts` exports `getDbErrorMessage(error)` which maps PostgreSQL error codes (23505 unique violation, 23503 FK violation, etc.) to a `{ message, constraint }` object. All model functions catch errors and call this — the `constraint` value (the Postgres index/constraint name) is returned in `ModelErr` so actions can map it to field-specific error messages.

### ESLint

ESLint is strict and includes: TypeScript type-checked rules, React/hooks, jsx-a11y, `simple-import-sort` (imports are auto-sorted and enforced), `eslint-plugin-drizzle` (warns on missing `.where()` in updates/deletes), and `eslint-plugin-better-tailwindcss`. `@typescript-eslint/no-unnecessary-type-assertion` is disabled to preserve intentional widening casts.

Run `npx eslint --fix .` after making changes to auto-sort imports.

### Adding a new route

1. Add the schema definition to `database/schemas/` if new tables are needed, export from `database/schema.ts`
2. Generate and apply a migration (`db:generate` then `db:migrate`)
3. Add query/mutation functions to `app/models/<domain>.ts`
4. Create `app/routes/<name>.tsx` with loader/action + default component
5. Register the route in `app/routes.ts`
