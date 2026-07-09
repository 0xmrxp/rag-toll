#!/usr/bin/env node
require('dotenv').config();

const { Command } = require('commander');
const { startServer } = require('../src/core/server');
const { parseFolder } = require('../src/rag/file-parser');
const { initEmbedder, embedChunks, embedText } = require('../src/rag/embedder');
const { initVectorStore, indexChunks } = require('../src/rag/vector-store');

const program = new Command();

program
  .name('rag-toll')
  .description('🧠 RAG-Toll: Monetize your private data via x402')
  .version('1.0.0');

program
  .command('serve <dataPath>')
  .description('Serve a data folder as an x402 protected API')
  .option('-p, --port <port>', 'Port to run the server on', '8080')
  .option('--price <price>', 'USDC price per query', '0.05')
  .option('--wallet <wallet>', 'Receiver wallet address')
  .action(async (dataPath, options) => {
    console.log(`\n🧠 RAG-Toll Engine Starting...\n`);
    console.log(`📂 Data path: ${dataPath}`);
    console.log(`💰 Price: $${options.price} USDC per query`);
    console.log(`🔗 Wallet: ${options.wallet || process.env.X402_WALLET || 'Not set'}\n`);

    console.log('━━━ Step 1/3: Parsing Files ━━━');
    const chunks = parseFolder(dataPath);

    console.log('\n━━━ Step 2/3: Generating Embeddings ━━━');
    const embedderConfig = {
      provider: process.env.EMBEDDER_PROVIDER || 'local',
      apiKey: process.env.EMBEDDER_API_KEY,
      model: process.env.EMBEDDER_MODEL
    };
    
    await initEmbedder(embedderConfig);
    const chunksWithVectors = await embedChunks(chunks);
    console.log(`✅ Generated ${chunksWithVectors.length} vectors`);

    console.log('\n━━━ Step 3/3: Building Custom Vector Store ━━━');
    await initVectorStore('./custom-vector-store.json');
    await indexChunks(chunksWithVectors);

    console.log('\n━━━ Launching x402 Protected API ━━━');
    const config = {
      port: parseInt(options.port, 10),
      price: options.price,
      wallet: options.wallet || process.env.X402_WALLET,
      chain: process.env.X402_CHAIN || 'eip155:8453',
      facilitator: process.env.X402_FACILITATOR || 'cdp'
    };

    await startServer(config, embedText);
  });

program.parse();
