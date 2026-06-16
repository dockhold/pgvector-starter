// A tiny, dependency-free, deterministic embedding so this starter works with
// no API key: it hashes words into a fixed-size, L2-normalized vector. Documents
// that share words land near each other — enough to demonstrate vector search.
//
// For real semantic search, replace embed() with your LLM provider's embeddings
// API (e.g. a 1536-dim model) and set DIM to match. The managed database's
// built-in agent_memory table already uses vector(1536).
const DIM = 64;

function embed(text) {
  const v = new Array(DIM).fill(0);
  const tokens = String(text).toLowerCase().match(/[a-z0-9]+/g) || [];
  for (const tok of tokens) {
    let h = 0;
    for (let i = 0; i < tok.length; i++) h = (h * 31 + tok.charCodeAt(i)) >>> 0;
    v[h % DIM] += 1;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

// pgvector accepts a "[1,2,3]" string cast to ::vector.
function toVectorLiteral(v) {
  return `[${v.join(",")}]`;
}

module.exports = { DIM, embed, toVectorLiteral };
