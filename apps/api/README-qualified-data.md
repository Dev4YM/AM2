# Qualified Data pipeline

Five enrichment tiers per Google `placeId`, orchestrated by `QualifiedDataModule`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/qualified-data/enrich` | Run requested tiers; merge into SQLite cache |
| `GET` | `/qualified-data/:placeId` | Cached `QualifiedBusinessProfile` |
| `GET` | `/reputation/scores` | Collector success rates |
| `GET` | `/reputation/learning-center` | Learning center stub + recommendations |

## Environment

- `GOOGLE_MAPS_API_KEY` — Places Details (tier 1 + reviews)
- `OPENAI_API_KEY` — optional LLM tiers (heuristic/template fallback)
- `OPENAI_MODEL` — optional (default `gpt-4o-mini`)
- `PORT` — default `4000`
- `QUALIFIED_DATA_CACHE_PATH` — optional SQLite file path

## Run

```bash
npm run dev:api
```

## Example request

```bash
curl -X POST http://localhost:4000/qualified-data/enrich \
  -H 'Content-Type: application/json' \
  -d '{
    "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    "tiers": ["business", "enriched", "reviews", "sales", "emails"],
    "crmContext": "We sell field-service scheduling SaaS for HVAC contractors.",
    "emailDraftCount": 2
  }'
```

Example response: [example-qualified-profile.json](./example-qualified-profile.json)

Types: `packages/shared/src/qualified-business-profile.ts` (`QualifiedBusinessProfile`).
