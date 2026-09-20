# pgvector starter

Semantic vector search on [Dockhold](https://dockhold.eu)'s managed Postgres.
The managed database ships with **pgvector** enabled, so you store embeddings and
query nearest neighbors with no extra setup. This starter works out of the box
with a tiny built-in embedding, and shows where to drop in a real model.

[![Deploy on Dockhold](https://dockhold.eu/button.svg)](https://app.dockhold.eu/new?repo=https://github.com/dockhold/pgvector-starter&name=pgvector-starter&ref=button)

## Deploy it

1. Click **Use this template** (or fork this repo).
2. [Deploy it](https://app.dockhold.eu/new?repo=https://github.com/dockhold/pgvector-starter),
   and **check "Add a managed database"** so `DATABASE_URL` is injected.
3. It goes live at `https://<your-app>.dockhold.app`.

## Deploy with your AI tool

Install the Dockhold plugin or MCP server in your AI coding tool
([setup guide](https://dockhold.eu/docs/recipes/deploy-from-your-ai-tool)), then
say "put this online" in a folder with this template. The tool signs you in
through the browser once and reports the URL when the app is live.

Or from a terminal: `npx dockhold login`, then `npx dockhold deploy --db` (the `--db` adds the managed database this template needs).

## Try it

```bash
APP=https://<your-app>.dockhold.app
curl -X POST $APP/api/documents -H 'Content-Type: application/json' -d '{"content":"the cat sat on the mat"}'
curl -X POST $APP/api/documents -H 'Content-Type: application/json' -d '{"content":"a dog ran in the park"}'
curl "$APP/api/search?q=where%20did%20the%20cat%20sit"
# → the cat document ranks first (smallest distance)
```

| Route | Description |
|-------|-------------|
| `POST /api/documents` | Embed and store — body `{ "content": "..." }` |
| `GET /api/search?q=...&k=5` | Nearest documents by vector distance |
| `GET /api/documents` | List stored documents |

## How it works

- The managed database has pgvector pre-installed; the app creates a
  `documents` table with a `vector` column ([`db.js`](db.js)).
- `embed()` ([`embed.js`](embed.js)) turns text into a vector. It's a tiny
  dependency-free placeholder so the demo runs with **no API key** —
  **replace it with your LLM provider's embeddings API** for real semantic
  search (and set `DIM` to match, e.g. 1536).
- Search uses pgvector's `<->` distance operator with a parameterized query.
- Writes are rate-limited; bodies capped at 10 kB; inputs validated. Endpoints
  are public by default — see
  [making an app private](https://dockhold.eu/docs/recipes/deploy-a-full-stack-app#lock-the-api-down-to-your-app)
  to require a token.

Dockhold builds the included [`Dockerfile`](Dockerfile). There's nothing to
change in it, and it deploys on any plan.

## Run it locally

Needs a Postgres with pgvector (e.g. the `pgvector/pgvector:pg16` image):

```bash
npm install
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres PORT=3000 npm start
```

## Full walkthrough

[Deploy a vector database (pgvector)](https://dockhold.eu/docs/recipes/deploy-a-vector-database)
— the step-by-step recipe.
