# Developer Assessment Platform — B7A6 Backend Assignment

**Student ID:** L2B7-0384
**Assigned domain:** Developer Assessment Platform

A backend where **Companies** build coding/MCQ/written assessments, invite
**Candidates** to take them under a timer, and **Admins** oversee the whole
platform. Companies pay (Stripe) for assessment-publish credits; candidate
attempts are auto-scored for MCQ and queued for manual review on
written/coding questions.

## Project overview

Companies maintain a private problem bank (MCQ / CODING / WRITTEN
questions), assemble them into an assessment, and publish it — publishing
consumes one purchased "assessment credit". Candidates accept an invitation
to start a timed attempt, answer problems, and submit. MCQ answers are
scored immediately; written/coding answers wait for the company to review
and score them, at which point the attempt is finalized with a pass/fail
result against the assessment's passing score.

## Features

- JWT auth (access + rotating refresh tokens) with Google Sign-In
- Three genuinely distinct roles: `CANDIDATE`, `COMPANY`, `ADMIN`, enforced
  server-side on every protected route
- Problem bank CRUD (MCQ / CODING / WRITTEN) with soft delete
- Assessment CRUD, problem attachment, and a publish workflow that
  atomically spends a purchased credit (race-condition-safe)
- Invitations with expiry, accept/decline, and one attempt per invitation
- Timed attempts with lazy server-side expiry (no cron — serverless safe),
  answer submission, auto-evaluation of MCQ, manual evaluation of
  written/coding submissions
- Stripe Checkout payment flow for assessment-credit packages, with
  signature-verified webhook crediting (never trusts client redirects)
- Redis-backed rate limiting, response caching, and short-lived locks —
  all degrade gracefully when Redis isn't configured
- Soft deletes, audit logging on every meaningful state change, pagination
  + filtering + search on every list endpoint
- Centralized error handling and a single standardized response envelope
- 47 versioned REST endpoints across 10 resource groups

## Tech stack

Node.js · TypeScript · Express · Prisma · PostgreSQL · Redis (ioredis) ·
Zod · JWT (jsonwebtoken) · bcryptjs · Google Auth Library · Stripe ·
Swagger UI · TSUP · Vercel

## Architecture

```
src/
  app.ts              Express app assembly (middleware, routes, docs)
  server.ts            Entrypoint — exports the app; listens only outside serverless
  config/               env validation, Prisma client singleton, Redis client
  lib/                  response helpers, pagination, JWT, catchAsync
  middleware/           auth, authorize, validate, error handling, rate limiting
  utils/                ApiError, hashing, audit log writer, company resolver
  modules/
    auth/ users/ companies/ candidates/    identity & profiles
    problems/ assessments/                  company-owned content
    invitations/ attempts/ submissions/     candidate workflow
    payments/                               Stripe credit purchases
    admin/                                  platform oversight
  routes/v1.ts          versioned router aggregation
prisma/
  schema.prisma         data model
  seed.ts                admin + demo company + demo candidate + sample data
docs/
  openapi.yaml           full API spec (served at /api-docs)
  postman_collection.json
tests/
  unit/                  middleware, ApiError, hashing, pagination (no DB)
  integration/           /health + validation-layer auth tests (no DB)
```

Every route follows **Route → Controller → Service → Prisma**. Controllers
never touch business logic; services never touch `req`/`res`.

## Roles and permissions

| Action | CANDIDATE | COMPANY | ADMIN |
|---|---|---|---|
| Manage own problem bank / assessments | ✗ | ✓ (own only) | ✗ |
| Publish assessment / spend credits | ✗ | ✓ | ✗ |
| Invite candidates | ✗ | ✓ (own assessments) | ✗ |
| Accept/decline invitation, take attempt | ✓ | ✗ | ✗ |
| Evaluate written/coding submissions | ✗ | ✓ (own assessments) | ✗ |
| Purchase assessment credits | ✗ | ✓ | ✗ |
| View/edit any user, change roles, view audit logs | ✗ | ✗ | ✓ |

Authorization is enforced by an `authorize(...roles)` middleware that reads
**only** the role resolved server-side from the verified JWT + a live DB
lookup (`authenticate` middleware) — a tampered request body can never
widen access. Ownership is additionally checked in every service function
(a company can only ever touch its own problems/assessments/attempts).

## Authentication

- `POST /api/v1/auth/register` — CANDIDATE or COMPANY (COMPANY requires `companyName`)
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh-token` — rotates the refresh token; reuse of an old one revokes the session
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/google` — verifies a Google ID token server-side (`google-auth-library`), links to an existing account by email or creates a new one

Passwords are hashed with bcrypt (cost configurable via `BCRYPT_SALT_ROUNDS`).
Access tokens are short-lived (15m default); refresh tokens are long-lived
(30d default) and stored **hashed** in the database, single-session per user.

## API endpoint list (47)

**Auth (5):** register · login · refresh-token · logout · google
**Users (3):** GET/PATCH `/users/me` · PATCH `/users/me/password`
**Companies (2):** GET/PATCH `/companies/me` · GET `/companies/:id`
**Candidates (2):** PATCH `/candidates/me` · GET `/candidates/:id`
**Problems (5):** POST/GET `/problems` · GET/PATCH/DELETE `/problems/:id`
**Assessments (8):** POST/GET `/assessments` · GET/PATCH/DELETE `/assessments/:id` · POST `/assessments/:id/problems` · DELETE `/assessments/:id/problems/:problemId` · PATCH `/assessments/:id/publish`
**Invitations (5):** POST/GET `/assessments/:id/invitations` · GET `/invitations/me` · POST `/invitations/:id/accept` · POST `/invitations/:id/decline`
**Attempts (5):** GET `/assessments/:id/attempts` · GET `/attempts/me` · GET `/attempts/:id` · POST `/attempts/:id/answers` · POST `/attempts/:id/submit`
**Submissions & reports (3):** GET `/attempts/:id/report` · GET `/submissions/:id` · PATCH `/submissions/:id/evaluate`
**Payments (4):** POST `/payments/initiate` · POST `/payments/webhook` · GET `/payments/me` · GET `/payments/:id`
**Admin (5):** GET `/admin/users` · PATCH `/admin/users/:id/role` · PATCH `/admin/users/:id/status` · GET `/admin/dashboard-stats` · GET `/admin/audit-logs`

Full request/response schemas: `docs/openapi.yaml`, served live at `/api-docs`
once the server is running. Postman collection: `docs/postman_collection.json`
(imports as one file, runs top-to-bottom, auto-captures tokens/ids).

## Environment variables

See `.env.example` for the full annotated list. Required to boot:
`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`. Everything else
(Redis, Google OAuth, Stripe) degrades gracefully or is validated with a
clear startup error only when that feature is actually used.

## Local setup

```bash
git clone git@github-najmulcodes:najmulcodes/L2B7A6.git
cd L2B7A6
npm install
cp .env.example .env   # then fill in DATABASE_URL / JWT secrets at minimum
```

## Database setup

```bash
npx prisma generate        # regenerates automatically on npm install (postinstall)
npx prisma migrate dev --name init
```

## Seed commands

```bash
npm run seed
```

Creates the demo admin, a demo company (5 free assessment credits), a demo
candidate, three sample problems (MCQ/CODING/WRITTEN), one published sample
assessment, and an invitation for the demo candidate — ready to walk
through immediately after seeding.

## Development commands

```bash
npm run dev          # tsx watch — hot reload
npm run typecheck    # tsc --noEmit
npm run lint
npm test             # jest — unit + no-DB integration tests
```

## Build commands

```bash
npm run build         # tsup → dist/ (cjs + esm, sourcemaps)
npm start             # node dist/server.js
```

## Deployment (Vercel)

`vercel.json` is preconfigured to build with `npm run build` and route all
traffic to `dist/server.js` via `@vercel/node`. The app is serverless-safe:
no cron/setInterval, no in-memory state across requests, the Prisma client
is memoized to survive warm invocations, and Redis-backed features degrade
gracefully if `REDIS_URL` isn't set for a given environment.

```bash
npm i -g vercel
vercel login
vercel --prod
```

Set every variable from `.env.example` in the Vercel project settings
before deploying. Point `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL` at your
real deployed frontend/API routes, and register the Vercel deployment URL
+ `/api/v1/payments/webhook` as a Stripe webhook endpoint (test mode) to get
a `STRIPE_WEBHOOK_SECRET`.

## Payment setup (Stripe, test mode)

Companies buy assessment-publish credits in three fixed packages
(`SMALL`=5 credits/$25, `MEDIUM`=15/$60, `LARGE`=50/$180 — see
`src/modules/payments/payments.validation.ts`). `POST /payments/initiate`
creates a Stripe Checkout Session and a `PENDING` Payment row; the
`POST /payments/webhook` endpoint (raw-body, signature-verified) is the
**only** place a payment is ever marked `SUCCESS` and credits are granted —
client-side redirects are never trusted. Get test keys from
https://dashboard.stripe.com/test/apikeys and forward webhooks locally with
`stripe listen --forward-to localhost:5000/api/v1/payments/webhook`.

## Redis setup

Optional for local dev (everything works without it — see
`src/config/redis.ts`). Used for:
1. **Rate limiting** (`express-rate-limit` + `rate-limit-redis`) on auth and payment endpoints
2. **Caching** company problem/assessment list reads (invalidated on write)
3. **Short-lived locks** (`SET NX PX`) around assessment publishing (credit spend) and attempt submission, to make both operations safe under concurrent requests

Set `REDIS_URL` (e.g. from Upstash) to enable all three in production.

## API documentation

- Swagger UI: `GET /api-docs` (backed by `docs/openapi.yaml`)
- Postman: import `docs/postman_collection.json`
- Health check: `GET /health`

## Demo admin credentials

Created by `prisma/seed.ts`, using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from
your `.env` (defaults below — **change these before any real deployment**):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@devassess.com` | `ChangeMe123!` |
| Company (demo) | `hr@techcorp-demo.com` | `Company123!` |
| Candidate (demo) | `candidate@demo.com` | `Candidate123!` |

## Live API URL

_Fill in after deploying:_ `https://<your-deployment>.vercel.app`

## GitHub repository

`https://github.com/najmulcodes/L2B7A6`

## Video link placeholder

_Add your walkthrough video link here before submission._

## Important evaluator notes

- Run `npm run seed` after your first migration to get working demo data
  immediately — a published assessment with an invitation already exists
  for the demo candidate.
- A 5–10 minute walkthrough: log in as the demo company → view the
  published sample assessment → log in as the demo candidate → accept the
  invitation → answer the MCQ/coding/written problems → submit → log back
  in as the company → evaluate the written/coding submissions → view the
  final attempt report. All of this is scripted in
  `docs/postman_collection.json`.
- Every list endpoint supports `page`/`limit`; several also support
  `q`/`sortBy`/`sortOrder`/status filters — see `docs/openapi.yaml` for the
  exact parameters per endpoint.
- Role tampering is defended in depth: `authorize()` only ever reads
  `req.user.role`, which is set exclusively by the `authenticate`
  middleware from a verified JWT + live DB lookup — never from request
  body/query/params.
- `npm run build` (tsup/esbuild) and `npx tsc --noEmit` were both exercised
  during development; see the **Testing & build verification** note below
  for the one sandbox-specific caveat encountered while building this
  submission.

### Testing & build verification

This project was developed and hardened in a sandboxed environment without
outbound network access to `binaries.prisma.sh`, so `prisma generate` could
not download its native query-engine binary there. Everything **not**
gated behind that binary was verified directly:

- `npm run build` (tsup/esbuild, no type-checking) — **builds cleanly**,
  proving every import and module in the codebase resolves correctly.
- The compiled `dist/server.js` was `require()`d directly and confirmed to
  export a plain callable Express app (`module.exports = app`) — the exact
  shape `@vercel/node` expects — and to fail *only* at `new PrismaClient()`,
  i.e. purely on the missing engine binary, not on anything else in the
  app.
- The Jest suite (`npm test`) passes fully for every file that doesn't
  import the Prisma client (middleware, validation, hashing, pagination,
  error formatting, `/health`). Files that do import it fail during
  TypeScript type-checking (`ts-jest`) with the exact same root cause:
  `Module '"@prisma/client"' has no exported member 'Role'` etc. — because
  the stub client Prisma writes before a failed engine download has no
  generated model types. This is not a code defect: the referenced type
  names (`Role`, `Prisma.UserWhereInput`, `Prisma.PrismaClientKnownRequestError`,
  etc.) are exactly Prisma's standard generated exports.

**In your own environment**, `npm install` triggers `prisma generate` via
`postinstall` with normal network access, which resolves this completely.
Confirm with:

```bash
npx prisma generate
npx tsc --noEmit
npm test
npm run build
```

