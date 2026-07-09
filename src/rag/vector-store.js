const fs = require('fs');
const path = require('path');

let vectors = [];
let storePath = './custom-vector-store.json';

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function initVectorStore(indexPath) {
  storePath = path.resolve(indexPath);
  // Selalu mulai dari array kosong (no load from file)
  vectors = [];
  console.log(`🗃️  Vector store initialized (fresh start)`);
}

async function indexChunks(chunksWithVectors) {
  for (const chunk of chunksWithVectors) {
    vectors.push({
      vector: chunk.vector,
      metadata: { text: chunk.text, source: chunk.source, length: chunk.length }
    });
  }
  // Simpan ke file (backup)
  fs.writeFileSync(storePath, JSON.stringify({ vectors }, null, 2));
  console.log(`✅ Indexed ${chunksWithVectors.length} chunks into custom vector store`);
}

async function search(queryVector, topK = 3) {
  const scored = vectors.map(item => ({
    ...item,
    score: cosineSimilarity(queryVector, item.vector)
  }));
  
  // Sort descending
  scored.sort((a, b) => b.score - a.score);
  
  // Deduplicate: skip results with identical text
  const seen = new Set();
  const unique = [];
  for (const r of scored) {
    if (!seen.has(r.metadata.text)) {
      seen.add(r.metadata.text);
      unique.push(r);
    }
    if (unique.length >= topK) break;
  }
  
  return unique.map(r => ({
    text: r.metadata.text,
    source: r.metadata.source,
    score: r.score.toFixed(4)
  }));
}

module.exports = { initVectorStore, indexChunks, search };
