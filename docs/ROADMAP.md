# AM2 roadmap — complete

All planned milestones for the 0.2 beta monorepo are implemented.

## Shipped

| Area | Status |
|------|--------|
| Monorepo `apps/web` + `apps/api` + `packages/shared` | Done |
| Web source only in `apps/web/src` | Done |
| US + **CA, GB, DE, FR** geo cascade | Done |
| Reaching Places search (grid, 40–100 results) | Done |
| Search BFF → Nest with `AM2_INTERNAL_API_KEY` | Done |
| Qualified data (5 tiers) | Done |
| **Real enrichment** — website scrape + Hunter.io | Done |
| **Async enrich jobs** — `POST …/enrich/async`, `GET …/jobs/:id` | Done |
| Nest leads → shared SQLite | Done |
| API auth (internal key + `x-user-id`) | Done |
| Smoke tests | `npm run test:smoke` |

## Run

```bash
cp .env.example .env
# Set AUTH_SECRET, AM2_INTERNAL_API_KEY (same in both apps), Google keys

npm install
npm run dev:all
```

Generate internal key:
```bash
openssl rand -hex 32
```

Put the same value in repo-root `.env` as `AM2_INTERNAL_API_KEY`. Web dev symlinks `apps/web/.env` automatically.

## Optional env

| Variable | Purpose |
|----------|---------|
| `HUNTER_API_KEY` | Email discovery via Hunter.io |
| `OPENAI_API_KEY` | Smart reviews, sales, emails |
| `DATABASE_PATH` | Shared CRM SQLite (default `apps/web/data/am2.db`) |

## Future ideas (not in scope)

- Redis/Bull queue when scaling enrichment volume
- More countries in geo datasets
- Direct browser → Nest (only if JWT/session forwarding added)
- Playwright E2E in CI with docker compose
