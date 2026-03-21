# AI Governance Co-Pilot

## Overview

Full-stack AI governance intelligence dashboard for political leaders and administrators. Converts citizen complaints, documents, and public data into actionable insights through dashboards, AI models, and predictive alerts.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite, TailwindCSS, Recharts, React Leaflet
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── governance-copilot/ # React frontend dashboard
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
│   └── src/seed.ts         # Seeds 1000 mock complaints + booth data
```

## Features

1. **Dashboard** - Constituency Health Score, complaint metrics, charts, recent activity
2. **Heatmap** - Interactive Leaflet map with colored booth markers by urgency
3. **Complaints** - Full complaint management table with filters, submit new complaints
4. **Document Summarizer** - Paste government document text, get 5-point AI summary
5. **Speech Generator** - Generate data-driven political speeches by topic and audience
6. **Predictive Alerts** - Emerging issue detection based on complaint trend analysis

## API Endpoints

- `GET /api/dashboard/:constituencyId` — Dashboard metrics
- `GET /api/dashboard/heatmap` — Heatmap booth data
- `GET /api/dashboard/category-breakdown` — Category counts
- `GET /api/complaints` — List complaints (filterable)
- `POST /api/complaints/ingest` — Submit and auto-classify complaint
- `POST /api/files/summarize` — Summarize government document text
- `POST /api/speech/generate` — Generate political speech
- `GET /api/alerts` — Predictive issue alerts
- `GET /api/booth/:boothId/analytics` — Booth-level analytics

## Database Schema

- `complaints` — 1000+ seeded mock complaints with category, urgency, status
- `booth_metrics` — 12 booth locations with health/sentiment scores

## Running Locally

```bash
# Seed the database
pnpm --filter @workspace/scripts run seed

# Start API server
pnpm --filter @workspace/api-server run dev

# Start frontend
pnpm --filter @workspace/governance-copilot run dev
```
