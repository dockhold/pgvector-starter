const { Pool } = require("pg");
const { DIM } = require("./embed");

// Dockhold injects DATABASE_URL (and VECTOR_STORE_URL, the same database) when
// the managed database add-on is enabled. Read it — never hardcode it.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDb() {
  // Dockhold's managed database ships with pgvector and pre-creates the
  // extension, so this is usually a no-op. We attempt it anyway for portability
  // to other Postgres; if the role lacks permission, it's already installed.
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
  } catch (err) {
    console.warn("CREATE EXTENSION vector skipped (already installed by the platform?):", err.message);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      embedding vector(${DIM}) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

module.exports = { pool, initDb };
