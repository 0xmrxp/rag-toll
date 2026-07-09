const OpenAI = require('openai');
const { pipeline } = require('@xenova/transformers');

let provider = 'local';
let openaiClient = null;
let localExtractor = null;
let modelName = 'Xenova/all-MiniLM-L6-v2';

async function initEmbedder(config) {
  provider = config.provider || 'local';
  const apiKey = config.apiKey;
  
  if (provider === 'local') {
    console.log('⏳ Initializing LOCAL embedding model (Xenova/all-MiniLM-L6-v2)...');
    console.log('   (Downloading ~80MB model. 100% Free & Offline)');
    localExtractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Local Embedding ready!');
  } 
  else if (provider === 'openai') {
    console.log('🔌 Initializing OPENAI embeddings...');
    openaiClient = new OpenAI({ apiKey });
    modelName = config.model || 'text-embedding-3-small';
  } 
  else if (provider === 'openrouter') {
    console.log('🔌 Initializing OPENROUTER embeddings...');
    openaiClient = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey });
    modelName = config.model || 'openai/text-embedding-3-small';
  }
  else if (provider === 'anthropic') {
    console.log('🔌 Initializing ANTHROPIC/Claude environment...');
    console.log('   (Smart Route: Claude uses OpenRouter/Voyage for embeddings)');
    openaiClient = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey });
    modelName = config.model || 'cohere/embed-multilingual-v3.0';
  }
  else {
    throw new Error(`Unknown embedder provider: ${provider}`);
  }
}

async function embedText(text) {
  if (provider === 'local') {
    const output = await localExtractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } else {
    const response = await openaiClient.embeddings.create({ model: modelName, input: text });
    return response.data[0].embedding;
  }
}

async function embedChunks(chunks) {
  if (provider === 'local') {
    const results = [];
    for (let i = 0; i < chunks.length; i++) {
      const vector = await embedText(chunks[i].text);
      results.push({ ...chunks[i], vector });
      if ((i + 1) % 5 === 0 || i === chunks.length - 1) {
        process.stdout.write(`\r🧠 Local embedding progress: ${i + 1}/${chunks.length}   `);
      }
    }
    console.log('\n✅ Local embeddings generated!');
    return results;
  } else {
    const texts = chunks.map(c => c.text);
    const response = await openaiClient.embeddings.create({ model: modelName, input: texts });
    return response.data.map((item, index) => ({ ...chunks[index], vector: item.embedding }));
  }
}

module.exports = { initEmbedder, embedText, embedChunks };
