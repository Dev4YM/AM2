# AM2 agent notes

Monorepo layout:

- `apps/web` — Next.js UI + SQLite CRM (`apps/web/src`)
- `apps/api` — NestJS API (search, places, qualified data, AI)
- `packages/shared` — shared types and Places/search logic

Run: `npm run dev:all` (web :3000, api :4000).

Search: browser → Next `/api/search` → Nest `/search`.

Do not recreate root `src/` or root `next.config.ts`.
