const express = require("express");
const rateLimit = require("express-rate-limit");
const { pool, initDb } = require("./db");
const { embed, toVectorLiteral } = require("./embed");

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "10kb" }));

const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

app.get("/", (_req, res) =>
  res.json({
    message: "pgvector starter — semantic search on the managed database.",
    routes: ["GET /api/documents", "POST /api/documents", "GET /api/search?q=...&k=5"],
    docs: "https://dockhold.eu/docs/recipes/deploy-a-vector-database",
  })
);
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// List stored documents.
app.get("/api/documents", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, content, created_at FROM documents ORDER BY created_at DESC LIMIT 200");
    res.json(rows);
  } catch (err) {
    console.error("list failed", err);
    res.status(500).json({ error: "could not read documents" });
  }
});

// Add a document: embed its text and store the vector alongside it.
app.post("/api/documents", writeLimiter, async (req, res) => {
  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  if (!content) return res.status(400).json({ error: "content is required" });
  if (content.length > 4000) return res.status(400).json({ error: "content too long (max 4000)" });
  try {
    const vec = toVectorLiteral(embed(content));
    const { rows } = await pool.query(
      "INSERT INTO documents (content, embedding) VALUES ($1, $2::vector) RETURNING id, content, created_at",
      [content, vec]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("insert failed", err);
    res.status(500).json({ error: "could not save document" });
  }
});

// Semantic search: embed the query and return the nearest documents by vector
// distance (pgvector's <-> operator).
app.get("/api/search", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q) return res.status(400).json({ error: "query ?q= is required" });
  const k = Math.min(Math.max(Number(req.query.k) || 5, 1), 50);
  try {
    const vec = toVectorLiteral(embed(q));
    const { rows } = await pool.query(
      `SELECT id, content, (embedding <-> $1::vector) AS distance
       FROM documents
       ORDER BY embedding <-> $1::vector
       LIMIT $2`,
      [vec, k]
    );
    res.json(rows);
  } catch (err) {
    console.error("search failed", err);
    res.status(500).json({ error: "could not search" });
  }
});

const port = process.env.PORT || 3000;
initDb()
  .then(() => app.listen(port, "0.0.0.0", () => console.log(`listening on ${port}`)))
  .catch((err) => {
    console.error("db init failed", err);
    process.exit(1);
  });
