# Monorepo layout

| Path | Package | Role |
|------|---------|------|
| `apps/web` | `@am2/web` | Next.js 16 — UI, NextAuth, SQLite CRM, `/api/*` BFF routes |
| `apps/api` | `@am2/api` | NestJS 10 — Places, reaching search, geo, qualified data, AI |
| `packages/shared` | `@am2/shared` | Shared types, geo data, Google Places + search logic |
| `packages/config` | `@am2/config` | Shared tsconfig / eslint baseline |

**Web source lives only in `apps/web/src`** (no root `src/`).

## Commands

```bash
npm install
npm run dev          # Next.js @ :3000
npm run dev:api      # NestJS @ :4000
npm run dev:all      # both (Turbo)
npm run build        # all workspaces
```

## Search flow

Browser → `GET /api/search` (Next, session auth) → proxies to Nest `GET /search` → `@am2/shared` reaching Places logic.

Requires `npm run dev:api` (or `AM2_API_URL` in `.env.local`).

## Data

- CRM SQLite: `apps/web/data/am2.db` (or `DATABASE_PATH`)
- Qualified cache: `apps/api` SQLite (`QUALIFIED_DATA_CACHE_PATH` optional)

## Docker

```bash
docker compose up --build
```

Uses `apps/web/Dockerfile` and `apps/api/Dockerfile` only (no root Dockerfile).
