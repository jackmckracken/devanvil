# DevAnvil MCP Server

The DevAnvil MCP server lets Cursor agents (and other MCP clients) query intake items, update statuses, link branches, and generate copy-ready `/feature_build` prompts — without opening the DevAnvil queue UI.

**V1 is local-only.** The server uses stdio transport and is started by Cursor on your machine. Do not expose it publicly.

## Prerequisites

1. DevAnvil database running (`docker compose up -d` or your own Postgres)
2. Migrations applied (`npm run db:migrate`)
3. Environment variables configured (see below)

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DEVANVIL_MCP_TOKEN` | Yes | Must be set to start the server (local gate) |
| `OPENAI_API_KEY` | Optional | Enables LLM classification on `create_item` |

Copy `.env.example` to `.env` and set values:

```bash
cp .env.example .env
```

Generate a token:

```bash
openssl rand -hex 32
```

Set `DEVANVIL_MCP_TOKEN` in `.env` to that value.

## Run Locally

```bash
npm run mcp
```

The server speaks MCP over stdio. When run directly it waits for a client connection; Cursor launches it automatically when configured.

## Configure Cursor

Add to your Cursor MCP settings (`~/.cursor/mcp.json` or project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "devanvil": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/absolute/path/to/devanvil",
      "env": {
        "DATABASE_URL": "postgresql://devanvil:devanvil@localhost:5434/devanvil",
        "DEVANVIL_MCP_TOKEN": "your-secret-token-here"
      }
    }
  }
}
```

Replace `/absolute/path/to/devanvil` with your actual repo path.

**Security note:** `DEVANVIL_MCP_TOKEN` is checked at server startup. Because stdio MCP does not support request-level auth headers, protection relies on:

- Cursor only starting the server with your configured env
- The server binding to stdio (not a network port)
- Keeping the token secret and the server local-only

Restart Cursor after saving MCP config. The `devanvil` server should appear in MCP tools.

## Available Tools

Tools appear in Cursor as `devanvil.<tool_name>`.

### `devanvil.search_items`

Search intake items.

| Input | Type | Description |
|-------|------|-------------|
| `query` | string? | Search title, raw text, summary |
| `projectSlug` | string? | e.g. `studioops`, `levrops`, `heirloom` |
| `status` | string? | `captured`, `triaged`, `approved`, `in_build`, `shipped`, `duplicate`, `rejected`, `archived` |
| `itemType` | string? | `feature`, `bug`, `regression`, etc. |
| `priority` | string? | `unset`, `low`, `medium`, `high`, `urgent` |
| `limit` | number? | Max results (default 25, max 100) |

**Returns:** item id, title, project, item type, status, priority, summary, created date, suggested branch, suggested command.

### `devanvil.get_item`

Fetch one item by ID.

| Input | Type | Description |
|-------|------|-------------|
| `itemId` | string | DevAnvil item ID |

**Returns:** full item, project, raw text, normalized summary, matches, artifacts, activity, builds, suggested branch, suggested command.

### `devanvil.update_item_status`

Update item status and log activity.

| Input | Type | Description |
|-------|------|-------------|
| `itemId` | string | DevAnvil item ID |
| `status` | string | New status |
| `note` | string? | Activity log note |

### `devanvil.link_branch`

Link a git branch to an item (stored in `dev_builds` + activity log).

| Input | Type | Description |
|-------|------|-------------|
| `itemId` | string | DevAnvil item ID |
| `repo` | string | Repository name |
| `branchName` | string | Git branch |
| `note` | string? | Activity log note |
| `planDocPath` | string? | Forge/feature plan doc path |
| `contractReportPath` | string? | Contract impact report path |
| `commandUsed` | string? | Slash command used (e.g. `/forge_ship`) |

### `devanvil.generate_feature_prompt`

Generate a copy-ready `/feature_build` prompt.

| Input | Type | Description |
|-------|------|-------------|
| `itemId` | string | DevAnvil item ID |
| `repo` | string? | Target repo (defaults to project slug) |
| `projectSlug` | string? | Override project for instructions |
| `includeContext` | boolean? | Include activity, builds, project description (default true) |

**Returns:** `{ "prompt": "..." }` — paste into Cursor or use as agent instructions.

Project-specific instructions are included automatically:

- **StudioOps** — Forge Command Flow (`/forge_pick` … `/forge_ship`) and Agent Session Bootstrap Rule
- **LevrOps** — `feature_build.sh` / contracts workflow conventions
- **Heirloom** — generic feature-build format

### `devanvil.create_item`

Create an item via the intake pipeline (classification + dedupe).

| Input | Type | Description |
|-------|------|-------------|
| `text` | string | Raw idea text |
| `projectHint` | string? | Project slug hint |
| `sourceType` | string? | `note`, `voice`, `text`, `link`, `manual` |
| `itemType` | string? | Override classified type |
| `status` | string? | Override initial status |

### `devanvil.search_initiatives`

Search initiatives by project, status, priority, and strategic value.

| Input | Type | Description |
|-------|------|-------------|
| `projectSlug` | string? | e.g. `studioops` |
| `status` | string? | `proposed`, `active`, `next`, `paused`, `completed`, `archived` |
| `strategicValue` | string? | `beta_critical`, `launch_critical`, `growth`, etc. |
| `priority` | string? | `low`, `medium`, `high`, `critical` |
| `limit` | number? | Max results (default 25) |

**Returns:** initiative id, title, status, priority, strategic value, score, linked item count.

### `devanvil.get_initiative`

Fetch initiative detail.

| Input | Type | Description |
|-------|------|-------------|
| `initiativeId` | string | DevAnvil initiative ID |

**Returns:** metadata, linked items, score, blockers, dependencies, item counts by status, ready/shipped counts.

### `devanvil.get_ready_items`

**Primary Forge pick tool.** Returns ranked ready-for-build items.

| Input | Type | Description |
|-------|------|-------------|
| `projectSlug` | string | e.g. `studioops` |
| `activeOnly` | boolean? | When true, only items in active/next initiatives |
| `limit` | number? | Max results (default 25) |

**Ready criteria:** `status === approved` OR `priority` in `high`, `urgent`.

**Ranking:** active initiative → next initiative → backlog; then initiative score (overrides win), strategic value, item readiness.

**Returns:** item id, title, initiative, score, priority, strategic value, suggested branch/command, `rankingReasons`, `rankingExplanation`, blocked flag.

### `devanvil.link_item_to_initiative`

Link an item to an initiative.

| Input | Type | Description |
|-------|------|-------------|
| `itemId` | string | DevAnvil item ID |
| `initiativeId` | string | DevAnvil initiative ID |
| `note` | string? | Activity log note |

### `devanvil.portfolio_focus`

Portfolio execution plan for Forge.

| Input | Type | Description |
|-------|------|-------------|
| `projectSlug` | string | e.g. `studioops` |

**Returns:** top 3 initiatives, top 10 ready items, blockers, portfolio warnings, `recommendedNextItem`, `recommendedAction`.

## StudioOps Forge Integration

Recommended `/forge_pick` flow in StudioOps:

```
1. devanvil.portfolio_focus({ projectSlug: "studioops" })
2. devanvil.get_ready_items({ projectSlug: "studioops", limit: 25 })
3. User selects item → confirm → update_item_status in_build
4. /forge_plan → /forge_review → /forge_build → /forge_audit → /forge_ship
```

Initiative score overrides always win in ranking. Completed/archived initiatives are excluded from focus.

## Example Prompts

Use these in Cursor chat after the MCP server is connected:

**Forge pick (initiative-aware):**

> Run devanvil.portfolio_focus for studioops, then devanvil.get_ready_items for studioops, then /forge_pick in StudioOps

**Start building an item:**

> Get item `<itemId>` from DevAnvil, generate a feature prompt for repo levrops, then mark it in_build with note "Starting implementation"

**Capture a new idea from another repo:**

> Create a DevAnvil item: "Add export to CSV on the reports page" with projectHint levrops

**Link your branch after checkout:**

> Link branch feature/export-csv on repo levrops to DevAnvil item `<itemId>`

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Server won't start | Ensure `DEVANVIL_MCP_TOKEN` and `DATABASE_URL` are set |
| `Item not found` | Verify item ID from queue UI or search_items |
| Empty search results | Check filters; try without status/projectSlug |
| Classification is basic | Set `OPENAI_API_KEY` for LLM classification |
| Cursor doesn't see tools | Restart Cursor; verify `cwd` path is absolute |

## Out of Scope (V1)

- Project sync
- Slack / Jira / Linear integrations
- DevAnvil roadmaps
- Network-exposed MCP transport
