# RAG-Toll: The x402 Gateway for Private AI Data

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![x402 Protocol](https://img.shields.io/badge/x402-v2-blue.svg)](https://x402.org)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com)
[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![Base Network](https://img.shields.io/badge/Base-Mainnet-blue.svg)](https://base.org)
[![Multi-Chain](https://img.shields.io/badge/Multi--Chain-Base%20%7C%20Polygon%20%7C%20Solana-purple.svg)](#)
[![Hackathon](https://img.shields.io/badge/Brainwave-2026-orange.svg)](#)

> Turn any local dataset into a monetized, globally discoverable API for AI Agents. Zero backend required.

**Tracks:** AI Applications | Agentic Commerce Infrastructure | Open Innovation
**Protocol:** x402 v2 | Multi-Chain | Multi-Facilitator | Bazaar & x402scan Ready

---

## 1. Executive Summary

Every company building RAG (Retrieval-Augmented Generation) AI systems is starving for high-quality, private data. Meanwhile, data owners (researchers, enterprises, creators) have no easy way to monetize their datasets without building complex backends, managing API keys, and chasing invoices. Traditional API gateways don't support autonomous machine-to-machine micropayments.

**RAG-Toll** is a headless, enterprise-grade CLI & Docker tool that, with a single command, transforms any local folder (CSV, TXT, MD) into a public, x402-protected Vector API.

- AI Agents discover your data globally via the x402 Bazaar and x402scan.
- Agents query your data and pay you USDC per request via x402 v2.
- Enterprise-ready with Custom Domain & Auto-SSL (HTTPS) support out-of-the-box.

### Core Value Proposition

- **One-Command Launch:** `npx rag-toll serve ./my-data --price 0.05 --wallet 0x...`
- **Auto-SSL & Edge:** Instantly exposes local data to the web with Let's Encrypt Auto-SSL via Caddy, or secure Cloudflare Tunnels.
- **Triple Discovery Layer:** Auto-registers to x402 Bazaar, generates OpenAPI 3.0 for x402scan, and prepares for MCP.
- **Multi-Chain & Multi-Facilitator:** Accept payments on Base, Polygon, Solana, and more. Use Coinbase CDP, Dexter, PayAI, or self-host.

---

## 2. System Architecture

~~~
┌────────────────────────────────────────────────────────────────────┐
│                 DATA OWNER (VPS / Local Machine)                   │
│                                                                    │
│  ┌────────────┐   ┌─────────────┐   ┌────────────────────────┐    │
│  │ File Parser│ → │  Embedder   │ → │  Local Vector Store    │    │
│  │(CSV/TXT/MD)│   │(OpenAI/HF)  │   │  (Custom Cosine Sim)   │    │
│  └────────────┘   └─────────────┘   └───────────┬────────────┘    │
│                                                  │                 │
│  ┌───────────────────────────────────────────────┼──────────────┐  │
│  │             RAG-TOLL CORE (Fastify)           ▼              │  │
│  │  1. Receive Query → 2. Check PAYMENT-SIGNATURE               │  │
│  │  3. Verify via Facilitator (CDP/Dexter/PayAI)                │  │
│  │  4. Search Vector Store → 5. Return Chunks + Receipt         │  │
│  └───────────────────────────────┬──────────────────────────────┘  │
│                                  │                                 │
│  ┌───────────────────────────────┴──────────────────────────────┐  │
│  │           EDGE LAYER (Custom Domain + Auto-SSL)              │  │
│  │  • Caddy (Let's Encrypt) OR Cloudflare Tunnel                │  │
│  │  • Exposes: /query, /docs, /openapi.json                     │  │
│  └───────────────────────────────┬──────────────────────────────┘  │
└──────────────────────────────────┼─────────────────────────────────┘
                                   │ (HTTPS / Secure)
                             PUBLIC INTERNET
                                   │
┌──────────────────────────────────┴─────────────────────────────────┐
│               AI AGENTS & DISCOVERY LAYERS                         │
│                                                                    │
│  Discovery:    x402 Bazaar (Semantic) + x402scan (OpenAPI crawl)   │
│  Transaction:  POST /query → HTTP 402 → Sign USDC → 200 OK        │
└────────────────────────────────────────────────────────────────────┘
~~~

---

## 3. Multi-Facilitator & Multi-Chain Support

RAG-Toll is **facilitator-agnostic** and **chain-agnostic**. Configure via CLI flags or Environment Variables.

| Facilitator | Flag / Env Var | Endpoint | Supported Chains | Bazaar/Scan? |
|-------------|----------------|----------|------------------|--------------|
| **Coinbase CDP** (Default) | `cdp` | `api.cdp.coinbase.com/.../x402` | Base, Polygon, Arbitrum, Solana | Yes |
| **Dexter** | `dexter` | `facilitator.dexter.network/x402` | Base, Polygon, Solana + EVM | Yes |
| **PayAI** | `payai` | `facilitator.payai.network/x402` | Base, EVM Chains | Yes |
| **x402.org** (Testnet) | `testnet` | `x402.org/facilitator` | Base Sepolia, Solana Devnet | No |
| **Self-Hosted** | Custom URL | Your own VPS (Rust/Node) | Any (via custom RPC) | No |

### Supported Networks (CAIP-2 Standard)

| Chain | CAIP-2 Identifier | Default Asset |
|-------|-------------------|---------------|
| Base Mainnet | `eip155:8453` | USDC |
| Polygon | `eip155:137` | USDC |
| Arbitrum One | `eip155:42161` | USDC |
| Solana Mainnet | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` | USDC (SPL) |

---

## 4. Installation & Quick Start

### Option A: For Developers (via NPM)

~~~bash
# 1. Install globally
npm install -g rag-toll

# 2. Serve data with CDP Facilitator on Base Mainnet
rag-toll serve ./private-dataset \
  --price 0.05 \
  --wallet 0xYourBaseWallet... \
  --facilitator cdp \
  --chain eip155:8453 \
  --embedder openai \
  --embedder-key sk-... \
  --list-on-bazaar
~~~

### Option B: For Enterprise / VPS (via Docker Compose + Auto-SSL)

This setup uses **Caddy** to automatically provision Let's Encrypt SSL certificates for your custom domain. AI Agents require HTTPS to securely transmit x402 payment signatures.

**1. Create `docker-compose.yml`:**

~~~yaml
version: '3.8'
services:
  # Edge Layer: Auto-SSL & Reverse Proxy
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - rag-toll

  # Core Layer: RAG-Toll Engine
  rag-toll:
    build: .
    restart: unless-stopped
    environment:
      - PORT=8080
      - PRICE=0.05
      - WALLET=0xYourBaseWallet...
      - FACILITATOR=cdp
      - CHAIN=eip155:8453
      - EMBEDDER=openai
      - EMBEDDER_API_KEY=sk-...
      - PUBLIC_URL=https://api.yourdomain.com
      - LIST_ON_BAZAAR=true
    volumes:
      - ./private-dataset:/data:ro

volumes:
  caddy_data:
~~~

**2. Create `Caddyfile`:**

~~~text
api.yourdomain.com {
    reverse_proxy rag-toll:8080
}
~~~

**3. Launch:**

~~~bash
# Point your domain's A-Record to your VPS IP, then run:
docker-compose up -d
~~~

Your private data is now live at `https://api.yourdomain.com/query` with enterprise-grade SSL.

---

## 5. Core Implementation Highlights

### 5.1 x402 v2 Challenge & Verification (Fastify)

~~~javascript
// src/core/server.js
app.post('/query', async (request, reply) => {
  const paymentSig = request.headers['payment-signature']; // x402 v2 Header

  if (!paymentSig) {
    // 1. Throw 402 Challenge (CAIP-2 format)
    return reply.status(402).send({
      x402Version: 2,
      error: "RAG-Toll: Payment required to query this vector database",
      accepts: [{
        scheme: "exact",
        network: config.chain, // e.g., eip155:8453
        maxAmountRequired: config.price,
        asset: "USDC",
        payTo: config.wallet
      }]
    });
  }

  // 2. Verify via Configured Facilitator (CDP / Dexter / Self-Hosted)
  const isValid = await verifyWithFacilitator(paymentSig, config);
  if (!isValid) return reply.status(401).send({ error: "Invalid signature" });

  // 3. Search Vector Store & Return
  const chunks = await vectorStore.search(request.body.query);

  // 4. Attach Receipt
  reply.header('PAYMENT-RESPONSE', JSON.stringify({ success: true }));
  return { context: chunks };
});
~~~

### 5.2 Auto-OpenAPI Generation (For x402scan Crawlers)

RAG-Toll automatically generates an OpenAPI 3.0 specification, making it instantly indexable by x402scan.

~~~javascript
// Exposes /openapi.json and /docs (Swagger UI)
await fastify.register(require('@fastify/swagger'), {
  openapi: {
    info: { title: 'RAG-Toll API', version: '1.0.0' },
    components: {
      securitySchemes: {
        x402Payment: {
          type: 'apiKey',
          in: 'header',
          name: 'PAYMENT-SIGNATURE',
          description: 'x402 v2 payment signature'
        }
      }
    }
  }
});
~~~

---

## 6. Triple Discovery Layer

RAG-Toll ensures your API is never hidden. It supports three distinct discovery mechanisms for AI Agents:

1. **x402 Bazaar (Semantic):** Auto-registers metadata to CDP/Dexter Bazaar. Agents search by intent (e.g., "Q3 Financial Data").
2. **x402scan (Technical):** Exposes `/openapi.json`. x402scan crawlers verify the 402 schema and list your API as a "Verified x402 Endpoint".
3. **MCP (Model Context Protocol):** *(Roadmap Phase 2)* Native integration for Claude Desktop and Cursor IDE.

---

## 7. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/query` | POST | x402-protected RAG query |
| `/docs` | GET | Swagger UI |
| `/openapi.json` | GET | OpenAPI 3.0 spec |
| `/bazaar/metadata` | GET | x402 Bazaar discovery |

---

## 8. Payment Flow

~~~
┌─────────────┐                    ┌─────────────┐
│  AI Agent   │                    │  RAG-Toll   │
│   (Client)  │                    │   (Server)  │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │  POST /query {query: "..."}      │
       │ ────────────────────────────────> │
       │                                  │
       │  402: x402 Challenge             │
       │  {payTo, amount, USDC, Base}     │
       │ <──────────────────────────────── │
       │                                  │
       │  Pays $0.05 USDC on Base         │
       │ ────────> (Blockchain)           │
       │                                  │
       │  POST /query + PAYMENT-SIG       │
       │ ────────────────────────────────> │
       │                                  │
       │  200: RAG Results + Receipt      │
       │  {context, scores, txHash}       │
       │ <──────────────────────────────── │
~~~

### Example: Query without payment (get 402 challenge)

~~~bash
curl -X POST http://localhost:8080/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the Q3 revenue?"}'

# Response: HTTP 402
{
  "x402Version": 2,
  "error": "RAG-Toll: Payment required...",
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:8453",
    "maxAmountRequired": "0.05",
    "asset": "USDC",
    "payTo": "0x..."
  }]
}
~~~

### Example: Query with payment

~~~bash
curl -X POST http://localhost:8080/query \
  -H "Content-Type: application/json" \
  -H "PAYMENT-SIGNATURE: <signed-payment-payload>" \
  -d '{"query": "What is the Q3 revenue?"}'

# Response: HTTP 200
{
  "query": "What is the Q3 revenue?",
  "results_count": 3,
  "context": [
    {
      "text": "Total Revenue: $4.2 Million USD...",
      "source": "financial-report-q3.txt",
      "score": "0.7078"
    }
  ],
  "payment": {
    "verified": true,
    "txHash": "0xbb090f2d"
  }
}
~~~

---

## 9. Project Structure

~~~
rag-toll/
├── bin/rag-toll.js              # CLI entry (Commander.js)
├── src/
│   ├── core/
│   │   ├── server.js            # Fastify x402 Proxy + Swagger
│   │   ├── config-loader.js     # Env/JSON/CLI flag resolver
│   │   └── tunnel.js            # Cloudflare / Localtunnel wrapper
│   ├── rag/
│   │   ├── embedder.js          # OpenAI / HuggingFace embeddings
│   │   └── vector-store.js      # Custom cosine similarity store
│   ├── x402/
│   │   ├── challenge.js         # 402 Response generator
│   │   └── verifier.js          # Multi-facilitator signature checker
│   └── bazaar/
│       └── registry.js          # CDP/Dexter Bazaar auto-listing
├── Caddyfile                    # Auto-SSL config for Docker
├── docker-compose.yml           # 1-click Enterprise VPS deploy
├── Dockerfile                   # Node 22 slim image
├── package.json                 # NPM dependencies
└── README.md                    # You are here
~~~

---

## 10. Future Roadmap

- **Phase 1: Web Dashboard** (Q4 2026) - Next.js UI querying the core `/admin/stats` REST API for visual analytics, revenue tracking, and config management.
- **Phase 2: MCP Server Mode** (Q1 2027) - Package RAG-Toll as a Model Context Protocol (MCP) server for native Claude Desktop / Cursor IDE integration.
- **Phase 3: Batch Settlement** (Q2 2027) - Implement x402 batch-settlement scheme for high-frequency agent queries to optimize gas costs.
- **Phase 4: x402scan Premium** (Q3 2027) - Analytics integration to track which AI Agents found the API via x402scan vs Bazaar.

---

## 11. Hackathon Submission Checklist

- [x] Paying User Identified: AI Agents, RAG Developers, Data Brokers.
- [x] Pay-per-call Model: Configurable USDC pricing per vector query.
- [x] Complete x402 v2 Flow: PAYMENT-SIGNATURE, PAYMENT-RESPONSE, CAIP-2.
- [x] Ecosystem Integration: Auto-registers to x402 Bazaar & x402scan (OpenAPI).
- [x] Multi-Chain/Facilitator: Base, Polygon, Solana | CDP, Dexter, PayAI.
- [x] Enterprise Security: Custom Domain + Auto-SSL (HTTPS) via Caddy.
- [x] Working MVP: Fully functional headless CLI + Docker Compose.

---

## Built With

- [Fastify](https://fastify.dev/) - Web framework
- [@xenova/transformers](https://github.com/xenova/transformers.js) - Local embeddings
- [OpenAI](https://openai.com/) - Cloud embeddings
- [x402 Protocol](https://x402.org/) - Payment protocol by Coinbase
- [Base](https://base.org/) - L2 blockchain
- [Caddy](https://caddyserver.com/) - Auto-SSL reverse proxy

---

## Security Notes

- **Mock Mode**: Set `X402_MOCK=true` for development/testing (accepts any signature)
- **Production**: Set `X402_MOCK=false` and configure `CDP_API_KEY` for real Coinbase verification
- **Data Privacy**: Use `EMBEDDER_PROVIDER=local` for 100% offline embedding
- **Network**: Default chain is Base Mainnet (`eip155:8453`), configurable via `X402_CHAIN`

---

Built with care for **Brainwave 2026**.
Powered by x402 Protocol | Multi-Chain | Bazaar & x402scan Ready

---

## License

MIT

Copyright (c) 2026 RAG-Toll

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
