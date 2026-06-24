# DevAnvil

Capture ideas before they are lost. Classify them, check for duplicates, and triage toward execution.

DevAnvil sits **before** project management — it is not Jira, Linear, or Slack.

## V1 Features

- **Intake API** — `POST /api/dev-intake` with Bearer token (iOS Shortcuts compatible)
- **Classification** — project + item type (OpenAI-compatible, with heuristic fallback)
- **Duplicate detection** — title/summary/keyword similarity
- **Queue UI** — `/queue` with filters and triage workflow
- **Item detail** — raw text, matches, suggested branch/command, activity log

## Quick Start

### 1. Start Postgres

```bash
docker compose up -d
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set secrets:

- `DEVANVIL_INGEST_TOKEN` — for iOS Shortcuts / intake API
- `DEVANVIL_UI_PASSWORD` — for web UI login
- `DEVANVIL_SESSION_SECRET` — random 32+ char string

### 3. Install and migrate

```bash
npm install
npm run db:setup
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000/queue](http://localhost:3000/queue) and sign in with `DEVANVIL_UI_PASSWORD`.

## Intake API

```bash
curl -X POST http://localhost:3000/api/dev-intake \
  -H "Authorization: Bearer $DEVANVIL_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Add practice coach handoff flow to StudioOps",
    "sourceType": "note",
    "projectHint": "studioops"
  }'
```

### iOS Shortcuts

Use a **Get Contents of URL** action:

- **URL:** `https://your-devanvil-host/api/dev-intake`
- **Method:** POST
- **Headers:** `Authorization: Bearer <DEVANVIL_INGEST_TOKEN>`
- **Request Body:** JSON with `text`, `sourceType`, and optional `projectHint`

Works with text shares, note shares, and voice memo transcription payloads.

## Seed Projects

- StudioOps (`studioops`)
- LevrOps (`levrops`)
- Heirloom (`heirloom`)
- Hewn Ventures (`hewn-ventures`)

Projects are stored in the database and configurable via Prisma/admin.

## Optional: LLM Classification

Set `OPENAI_API_KEY` (and optionally `OPENAI_BASE_URL`, `OPENAI_MODEL`) for richer classification. Without it, DevAnvil uses fast keyword heuristics.

## Stack

- Next.js 16 (App Router)
- PostgreSQL + Prisma
- Tailwind CSS
- Bearer token + cookie session auth
