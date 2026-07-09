const fastify = require('fastify')({ logger: true });
const { search } = require('../rag/vector-store');
const { generateChallenge } = require('../x402/challenge');
const { verifyPayment } = require('../x402/verifier');

let embedTextFn;

async function startServer(config, embedText) {
  embedTextFn = embedText;

  // === Register Swagger (OpenAPI 3.0) ===
  await fastify.register(require('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'RAG-Toll API',
        description: 'Monetized private RAG data via x402 protocol. Pay USDC per query to access vector-search results.',
        version: '1.0.0'
      },
      servers: [
        { url: 'http://localhost:' + config.port, description: 'Local' }
      ],
      components: {
        securitySchemes: {
          x402Payment: {
            type: 'apiKey',
            in: 'header',
            name: 'PAYMENT-SIGNATURE',
            description: 'x402 v2 payment signature (USDC). Send query without this header to receive 402 challenge with payment instructions.'
          }
        }
      },
      tags: [
        { name: 'Health', description: 'Server health check' },
        { name: 'Query', description: 'x402-protected RAG queries' }
      ]
    }
  });

  await fastify.register(require('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    }
  });

  // === Health Check ===
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
            version: { type: 'string' },
            config: { type: 'object' }
          }
        }
      }
    }
  }, async () => {
    return {
      status: 'OK',
      message: 'RAG-Toll Core is breathing!',
      version: '1.0.0',
      config: {
        chain: config.chain,
        price: config.price,
        wallet: config.wallet ? config.wallet.slice(0, 10) + '...' : 'Not set',
        mockMode: process.env.X402_MOCK === 'true'
      }
    };
  });

  // === Custom OpenAPI JSON endpoint (for x402scan crawlers) ===
  fastify.get('/openapi.json', async (request, reply) => {
    reply.type('application/json');
    return fastify.swagger();
  });

  // === Bazaar Discovery Endpoint ===
  fastify.get('/bazaar/metadata', async () => {
    return {
      name: 'RAG-Toll Private Data API',
      description: 'Monetized RAG vector search API. Pay USDC per query to access private datasets.',
      protocol: 'x402',
      version: '2.0',
      endpoints: [
        {
          path: '/query',
          method: 'POST',
          description: 'Semantic search over private vector database',
          price: '$' + config.price + ' USDC',
          chain: config.chain
        }
      ],
      payment: {
        scheme: 'exact',
        asset: 'USDC',
        amount: config.price,
        network: config.chain,
        payTo: config.wallet
      },
      capabilities: ['rag', 'vector-search', 'semantic-search'],
      documentation: '/docs',
      openapi: '/openapi.json'
    };
  });

  // === x402 Protected Query Endpoint ===
  fastify.post('/query', {
    schema: {
      tags: ['Query'],
      description: 'Query private RAG data. Requires x402 payment signature.',
      security: [{ x402Payment: [] }],
      body: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string' },
          topK: { type: 'integer', default: 3 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { query, topK } = request.body;

      if (!query) {
        return reply.status(400).send({ error: 'Missing "query" in request body' });
      }

      const paymentSignature = request.headers['payment-signature'];

      if (!paymentSignature) {
        console.log('💰 No payment signature → Sending x402 challenge');
        return reply.status(402).send(generateChallenge(config));
      }

      const verification = await verifyPayment(paymentSignature, config);

      if (!verification.valid) {
        console.log('❌ Invalid payment signature');
        return reply.status(401).send({ error: 'Invalid payment signature', details: verification.error });
      }

      console.log('✅ Payment verified! TX: ' + verification.txHash);

      const queryVector = await embedTextFn(query);
      const results = await search(queryVector, topK || 3);

      reply.header('PAYMENT-RESPONSE', JSON.stringify({
        success: true,
        txHash: verification.txHash,
        amount: verification.amount,
        asset: verification.asset
      }));

      return {
        query,
        results_count: results.length,
        context: results,
        payment: { verified: true, txHash: verification.txHash }
      };
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message });
    }
  });

  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log('\n🚀 RAG-Toll API is LIVE!');
    console.log('   📖 Swagger UI:  http://localhost:' + config.port + '/docs');
    console.log('   📋 OpenAPI:     http://localhost:' + config.port + '/openapi.json');
    console.log('   🏪 Bazaar Meta: http://localhost:' + config.port + '/bazaar/metadata');
    console.log('   💰 Price: $' + config.price + ' USDC per query');
    console.log('   🔗 Chain: ' + config.chain);
    console.log('   🎭 Mock Mode: ' + (process.env.X402_MOCK === 'true' ? 'ENABLED' : 'DISABLED') + '\n');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

module.exports = { startServer };
