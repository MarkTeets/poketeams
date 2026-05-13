# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with HMR at http://localhost:5173
npm run build        # Production build
npm run typecheck    # Run react-router typegen + tsc
npm run clean        # Run eslint --fix then prettier --write across the repo
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

### Required env vars

The app fails fast at module load (`logger.fatal` + `throw`) if any of these are missing:

- `DATABASE_URL` — Postgres connection string
- `AUTH_COOKIE_SECRET` — signs the pre-login auth cookie ([app/cookies.ts](app/cookies.ts))
- `SESSION_COOKIE_SECRET` — signs the post-login session cookie ([app/cookies.ts](app/cookies.ts))
- `MAGIC_LINK_SECRET` — Cryptr key for magic link payload encryption ([app/magic-links.server.tsx](app/magic-links.server.tsx))
- `ORIGIN` — base URL used when constructing magic link URLs
- `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` — Mailgun credentials ([app/utils/emails.server.ts](app/utils/emails.server.ts)); only used when `NODE_ENV === "production"` — in dev, the magic link is logged instead of emailed
- `LOG_LEVEL` (optional) — overrides the default pino level of `info`

## Architecture

**Stack:** React Router v7 (SSR, framework mode) · Drizzle ORM · PostgreSQL · TailwindCSS v4 · Zod · TypeScript · pino · Mailgun · Cryptr

### Layer separation

```
database/        ← schema definitions and the db client
  schemas/       ← one file per pg schema namespace (app_user, trainer)
  schema.ts      ← re-exports all schemas (used by db.ts and drizzle-kit)
  db.ts          ← singleton Drizzle client (snake_case casing configured here)
  utils/         ← shared column helpers (timestamps, lower())

app/
  components/             ← shared React components
  models/                 ← data-access functions (queries/mutations), one file per domain
  routes/                 ← React Router route files (loader/action + default component)
  utils/                  ← shared utilities (see below)
  cookies.ts              ← createCookie config for the two cookie stores
  sessions.ts             ← createCookieSessionStorage for auth + post-login sessions
  magic-links.server.tsx  ← generate / validate / email signed magic links
  root.tsx                ← root layout, nav, ErrorBoundary
  routes.ts               ← route table
  types.ts                ← shared TS types (FieldErrors, FormFields, ModelResult)

app/utils/
  auth.server.ts          ← getCurrentUser(request)
  dbErrorInterpreter.ts   ← Postgres error code → { message, constraint }
  emails.server.ts        ← Mailgun client + sendEmail
  form-validation.ts      ← validateForm() — Zod + FormData glue
  logger.server.ts        ← pino singleton
  rate-limit.server.ts    ← in-memory IP + email rate limiters
  response-package.ts     ← sendData / sendResponseData / sendResponseError
```

### Database schemas (Postgres namespaces)

The database uses Postgres schemas (not the same as Drizzle schema files):

- `app_user` — user accounts (`app_user.users`)
- `trainer` — trainer profiles, pokemon, PC boxes, teams

All tables include `createdAt`, `updatedAt`, `deletedAt` via the `timestamps` helper in [database/utils/columnHelpers.ts](database/utils/columnHelpers.ts). Drizzle is configured with `casing: "snake_case"`, so TypeScript uses camelCase (`userId`) and the DB columns use snake_case (`user_id`). Email uniqueness is enforced case-insensitively via a `lower(email)` unique index.

### Auth flow

Auth uses two separate cookie-backed sessions, intentionally split so the pre-login state is destroyed once a user is established:

- **`poketeams__auth`** (pre-login) — stores `{ nonce, pendingEmail }`. Lives only during the magic link round-trip and the sign-up completion step.
- **`poketeams__session`** (post-login) — stores `{ userId }`. Created fresh after successful login or sign-up.

Both cookies are `httpOnly`, `secure`, `sameSite: strict`, with their own secrets ([app/cookies.ts](app/cookies.ts)). Storage factories live in [app/sessions.ts](app/sessions.ts):

```ts
import { getAuthSession, commitAuthSession, destroyAuthSession } from "~/sessions"; // pre-login
import { getSession, commitSession, destroySession } from "~/sessions";             // post-login
```

The magic link flow:

1. **[/login](app/routes/login.tsx)** — user submits email. The action rate-limits by IP and email ([app/utils/rate-limit.server.ts](app/utils/rate-limit.server.ts)), generates a UUID `nonce`, stores it in the **auth** session, encrypts `{ email, nonce, createdAt }` with Cryptr into a `?magic=` URL param, and emails it via Mailgun (or logs it in non-prod).
2. **[/validate-magic-link](app/routes/validate-magic-link.tsx)** — `validateMagicLink()` decrypts the payload, checks the 10-minute expiry, and compares the payload's nonce against the auth session nonce. Returns `{ ok, payload?, reason?, session }` — always returns the session so the caller can commit/destroy it. On success:
   - If the user exists → destroy auth session, create post-login session with `userId`, redirect to `/app`.
   - If the user doesn't exist → store `pendingEmail` in the auth session, unset the nonce, redirect to `/sign-up/complete`.
3. **[/sign-up/complete](app/routes/sign-up-complete.tsx)** — reads `pendingEmail` from the auth session, lets the user pick a username, creates the user, then performs the same session rotation as case 1 above (destroy auth session, commit post-login session).
4. **[/logout](app/routes/logout.tsx)** — destroys the post-login session.

`getCurrentUser(request)` in [app/utils/auth.server.ts](app/utils/auth.server.ts) reads the post-login session and resolves the `UserRecord` via `getUserById`. The root loader uses it to decide whether to show the Login or Logout nav link.

Session rotation (destroy auth + commit user) uses a `Headers` object with two `Set-Cookie` appends — both cookies need to be set on the same response.

### Response shape convention

Two distinct layers with different shapes:

**Model → Action:** `ModelResult<T>` from [app/types.ts](app/types.ts)

```ts
type ModelOk<T>  = { ok: true; data: T | null };
type ModelErr    = { ok: false; message: string; constraint: string | null };
type ModelResult<T> = ModelOk<T> | ModelErr;
```

Model functions never import from `response-package`. They return `{ ok: true, data }` on success (where `data` may be `null` for "not found") and `{ ok: false, message, constraint }` on failure. Single-row operations return `T | null` directly (not `T[]`).

**Action → Component:** `ActionResponsePackage<T>` shape via helpers in [app/utils/response-package.ts](app/utils/response-package.ts):

```ts
type ActionResponsePackage<T> = {
  success: boolean;
  data: T;
  errors: FieldErrors | undefined;
};
```

Helpers:

- `sendResponseData(info, status = 200)` — success shortcut: wraps `info` in `{ success: true, data: info, errors: undefined }` and returns React Router's `data()` with the given status.
- `sendResponseError(errors, status = 400)` — failure shortcut: wraps `errors` in `{ success: false, data: undefined, errors }`.
- `sendData(package, init?)` — lower-level escape hatch when you need to set headers (e.g., `Set-Cookie`) or pass a custom `data`/`errors` combo. Auth routes use this directly so they can attach session cookies to the response.

Actions interpret the model result and construct what the component needs. Each route defines its own errors type listing all possible error keys as optional fields.

### Form validation pattern

Route actions use `validateForm()` from [app/utils/form-validation.ts](app/utils/form-validation.ts). It accepts an optional 4th `errorFn` parameter so the action can build a custom error response (e.g., echoing back the submitted form values via `data`); without it, validation failures fall back to `sendResponseError(errors)`.

```ts
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  return validateForm(
    formData,
    zodSchema,
    async ({ email }) => {
      const result = await someModelFunction(email);
      if (!result.ok) {
        const errors: RouteErrors =
          result.constraint === "some_constraint"
            ? { field: "Specific message" }
            : { message: result.message };
        return sendData({ success: false, data: { email }, errors }, { status: 400 });
      }
      return sendResponseData(result.data);
    },
    (errors) => sendData({ success: false, data: { email: formData.get("email") }, errors }, { status: 400 }),
  );
}
```

Field names ending in `[]` are treated as multi-value arrays by `objectify()`.

### DB error handling

[app/utils/dbErrorInterpreter.ts](app/utils/dbErrorInterpreter.ts) exports `getDbErrorMessage(error)` which unwraps `DrizzleQueryError → DatabaseError` and maps PostgreSQL error codes (23505 unique violation, 23503 FK violation, 22P02 invalid format, 23514 check, 23502 not null, 42703 undefined column, 42601 syntax, 25000 transaction, 08006 connection, 42P01 missing table, 40001 serialization) to a `{ message, constraint }` object. All model functions catch errors and call this — the `constraint` value (the Postgres index/constraint name) is returned in `ModelErr` so actions can map it to field-specific error messages.

### Rate limiting

[app/utils/rate-limit.server.ts](app/utils/rate-limit.server.ts) is a simple in-memory fixed-window limiter (a single `Map<string, { count, resetAt }>`). It exposes `allowByIp` (5 per 10 min), `allowByEmail` (5 per 60s), and `getClientIp` (reads `x-forwarded-for`). Because state lives in memory, it's per-process — fine for single-instance deploys but not horizontally scalable. `getClientIp` requires being behind a trusted proxy to avoid spoofing.

### ESLint

ESLint is strict and includes: TypeScript type-checked rules, React/hooks, jsx-a11y, `simple-import-sort` (imports are auto-sorted and enforced), `eslint-plugin-drizzle` (warns on missing `.where()` in updates/deletes), and `eslint-plugin-better-tailwindcss`. `@typescript-eslint/no-unnecessary-type-assertion` is disabled to preserve intentional widening casts.

Run `npx eslint --fix .` (or `npm run clean`) after making changes to auto-sort imports.

### Logging

The app uses [pino](https://getpino.io/) via a singleton logger exported from [app/utils/logger.server.ts](app/utils/logger.server.ts). In non-production it pipes through `pino-pretty` with colorized output. Import it with:

```ts
import { logger } from "~/utils/logger.server";
```

**Log levels:** `logger.fatal` → `logger.error` → `logger.warn` → `logger.info` → `logger.debug` → `logger.trace`

- `fatal` — unrecoverable startup failures (missing required env vars, etc.) — always followed by `throw`
- `error` — unexpected failures that degrade behavior (decrypt errors, DB errors, invalid state)
- `warn` — expected-but-noteworthy conditions that don't fail the request (rate-limit hits, expired magic links, missing nonce, user not found)
- `info` — significant lifecycle events (server start, user login/logout)
- `debug`/`trace` — development diagnostics; not emitted in production at default log level

**Structured context:** Always pass a context object as the first argument when there's relevant data:

```ts
logger.error({ userId, magic }, "description of what went wrong");
```

**Catch clauses:** Always bind the error to `err`. In model functions, call `getDbErrorMessage(err)` first, then log with `logger.error` including `err`, `message`, `constraint`, and any relevant input parameters:

```ts
} catch (err) {
  const { message, constraint } = getDbErrorMessage(err);
  logger.error({ emailParam: email, err, message, constraint }, "Database call via <domain>.<functionName> failure");
  return { ok: false, message, constraint };
}
```

In non-model catch blocks (e.g. [app/magic-links.server.tsx](app/magic-links.server.tsx)), pass `err` and any relevant context directly to `logger.error` as the first line:

```ts
} catch (err) {
  logger.error({ magic, err }, "decrypt threw, invalid or tampered magic link");
  throw invalidMagicLink();
}
```

**What to log:** Model functions log errors in their catch blocks before returning `{ ok: false }`. Routes/actions log before returning an error response or at significant lifecycle points (login, signup, rate-limit hits).

### Adding a new route

1. Add the schema definition to [database/schemas/](database/schemas/) if new tables are needed, export from [database/schema.ts](database/schema.ts)
2. Generate and apply a migration (`db:generate` then `db:migrate`)
3. Add query/mutation functions to `app/models/<domain>.server.ts`
4. Create `app/routes/<name>.tsx` with loader/action + default component
5. Register the route in [app/routes.ts](app/routes.ts)
6. For protected routes, call `getCurrentUser(request)` from [app/utils/auth.server.ts](app/utils/auth.server.ts) in the loader and redirect to `/login` if it returns `null`
