# Changelog

## [0.2.0-beta] — 2026-05-19

### Area To Monitor (AM2) — Beta release

First public beta of the self-hosted control plane.

**Included**

- Business Finder (sample catalog + CSV import path)
- Mapped CRM with territories, pipeline, AI tools, activity log
- Smart Routes (nearest-neighbor optimization + Google Maps export)
- Calendar, team roster, AI assistant
- Credentials auth (NextAuth) + SQLite persistence
- Security hardening: API ownership checks, Zod validation, edge-safe middleware
- Docker + GitHub Actions CI

**Known limitations (beta)**

- No live shared business database or real-time multi-user sync
- Territories use point anchors, not polygon drawing
- Team module is a local rep roster, not separate user accounts
- UI is primarily English despite locale routing
