# Area To Monitor (AM2)

**Version: 0.2.0-beta**

Open-source, self-hosted B2B sales workspace: business discovery (sample catalog), mapped CRM, AI-assisted outreach, routes, calendar, and territories.

## Important limitation

**AM2 does not include real-time sync or a live shared business database.** Search uses a bundled catalog (`src/data/business-catalog.json`, ~174 sample businesses) plus CSV import. All CRM data is stored in **SQLite on your server** — not a multi-tenant cloud.

## Features

| Module | Description |
|--------|-------------|
| **Business Finder** | Search catalog by location/category; import to CRM |
| **Mapped CRM** | Map, pipeline status, notes, territories, AI tools, activity log |
| **Territories** | Named zones with map anchors; assign leads |
| **Smart Routes** | Greedy nearest-neighbor ordering + Google Maps export |
| **Calendar** | Local events linked to leads |
| **Team** | Local rep roster (not separate logins) |
| **AI Assistant** | OpenAI when configured; deterministic fallback otherwise |
| **Settings** | Profile, AI context, CSV import/export |

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind 4 · shadcn/ui · NextAuth (credentials) · SQLite (better-sqlite3) · Drizzle · Leaflet · optional OpenAI

## Quick start

```bash
cp .env.example .env.local
# Set AUTH_SECRET (openssl rand -base64 32)

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Launch control plane** → register.

### Docker

```bash
echo "AUTH_SECRET=$(openssl rand -base64 32)" > .env
docker compose up --build
```

### Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes | Session signing |
| `NEXTAUTH_URL` | Production | Public app URL |
| `OPENAI_API_KEY` | No | Real AI output |
| `DATABASE_PATH` | No | Default `./data/am2.db` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |

## API overview

Authenticated JSON APIs under `/api/*` — leads, search, territories, calendar, team, routes (incl. `/api/routes/optimize`), activities, stats, settings, assistant, contact.

## Extending

- Replace or grow `src/data/business-catalog.json`
- Add external search providers in `/api/search`
- Wire email sending for Smart Emails drafts
- Add polygon GeoJSON drawing for territories

## License

MIT — see [LICENSE](LICENSE).

## Repository

[github.com/Dev4YM/AM2](https://github.com/Dev4YM/AM2)
