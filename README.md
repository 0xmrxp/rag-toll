# 🧠 RAG-Toll

> **Turn any folder of private data into a paid RAG API — powered by x402.**

RAG-Toll lets you monetize your private datasets (CSV, TXT, MD) by serving them as a **vector-search API** protected by the **x402 payment protocol**. AI Agents pay **USDC per query** to access your data.

## ✨ Features

- 🧠 **RAG Engine** — Parse files → Embed → Vector Search (Cosine Similarity)
- 💰 **x402 Payment Gate** — HTTP 402 challenge → USDC payment → data access
- 🔌 **Multi-Provider Embedding** — Local (free), OpenAI, OpenRouter, Anthropic
- 📖 **OpenAPI 3.0** — Auto-generated spec for x402scan crawlers
- 🏪 **Bazaar Discovery** — Auto-register in x402 Bazaar marketplace
- 🐳 **Docker Ready** — `docker-compose up` and done

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- OR Docker + Docker Compose

### Option 1: Run with Node.js

~~~bash
# Clone & install
git clone https://github.com/yourusername/rag-toll
cd rag-toll
npm install

# Configure
cp .env.example .env
# Edit .env with your settings

# Run
npm start
~~~

### Option 2: Run with Docker

~~~bash
# Build & run
docker-compose up -d

# Check logs
docker-compose logs -f
~~~

---

## 🔧 Configuration

Edit `.env`:

~~~env
# Embedding Provider: 'local' (free), 'openai', 'openrouter', 'anthropic'
EMBEDDER_PROVIDER=local
EMBEDDER_API_KEY=
EMBEDDER_MODEL=

# x402 Payment Config
X402_PRICE=0.05
X402_WALLET=0xYourWalletAddress
X402_CHAIN=eip155:8453
X402_MOCK=true
~~~

### Embedding Providers

| Provider | Cost | Speed | Privacy |
|----------|------|-------|---------|
| `local` | 🆓 Free | Medium | 100% offline |
| `openai` | 💳 Paid | Fast | Data sent to OpenAI |
| `openrouter` | 💳 Paid | Fast | Via OpenRouter proxy |
| `anthropic` | 💳 Paid | Fast | Via OpenRouter/Cohere |

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/query` | POST | x402-protected RAG query |
| `/docs` | GET | Swagger UI |
| `/openapi.json` | GET | OpenAPI 3.0 spec |
| `/bazaar/metadata` | GET | x402 Bazaar discovery |

---

## 💰 Payment Flow

~~~
1. Client sends POST /query (no payment)
2. Server returns HTTP 402 with x402 challenge
3. Client pays USDC to specified wallet
4. Client resends query with PAYMENT-SIGNATURE header
5. Server verifies payment → returns RAG results
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

## 🏗️ Architecture

~~~
rag-toll/
├── bin/rag-toll.js          # CLI entry point (Commander.js)
├── src/
│   ├── core/server.js       # Fastify server + OpenAPI + Swagger UI
│   ├── rag/
│   │   ├── file-parser.js   # CSV/TXT/MD parser
│   │   ├── embedder.js      # Multi-provider embeddings (Local/OpenAI/etc)
│   │   └── vector-store.js  # Custom cosine similarity store
│   └── x402/
│       ├── challenge.js     # x402 v2 challenge generator
│       └── verifier.js      # Payment verification (mock/CDP)
├── test-data/               # Sample dataset
├── Dockerfile               # Multi-stage production build
├── docker-compose.yml       # One-command deployment
└── .env                     # Configuration
~~~

---

## 🛠️ CLI Usage

~~~bash
rag-toll serve <dataPath> [options]

Options:
  -p, --port <port>      Port to run the server on (default: 8080)
  --price <price>        USDC price per query (default: 0.05)
  --wallet <wallet>      Receiver wallet address
~~~

### Example

~~~bash
node bin/rag-toll.js serve ./my-private-data --port 3000 --price 0.10
~~~

---

## 🧪 Testing

### Test health check
~~~bash
curl http://localhost:8080/health
~~~

### Test Swagger UI
Open browser: `http://localhost:8080/docs`

### Test OpenAPI spec
~~~bash
curl http://localhost:8080/openapi.json
~~~

### Test Bazaar metadata
~~~bash
curl http://localhost:8080/bazaar/metadata
~~~

---

## 📦 Docker

### Build image
~~~bash
docker build -t rag-toll .
~~~

### Run with docker-compose
~~~bash
docker-compose up -d
docker-compose logs -f
docker-compose down
~~~

---

## 🎯 Use Cases

- **💼 Enterprise Data Monetization** — Sell access to internal reports, research, analytics
- **📊 Financial Data APIs** — Monetize proprietary market analysis, earnings reports
- **🏥 Healthcare RAG** — Paid access to medical research, clinical trial data
- **📚 Knowledge Bases** — Monetize curated datasets, training materials
- **🤖 AI Agent Marketplaces** — Register in x402 Bazaar for AI Agent discovery

---

## 🔐 Security Notes

- **Mock Mode**: Set `X402_MOCK=true` for development/testing (accepts any signature)
- **Production**: Set `X402_MOCK=false` and configure `CDP_API_KEY` for real Coinbase verification
- **Data Privacy**: Use `EMBEDDER_PROVIDER=local` for 100% offline embedding
- **Network**: Default chain is Base Mainnet (`eip155:8453`), configurable via `X402_CHAIN`

---

## 📝 License

MIT

---

## 🙏 Built With

- [Fastify](https://fastify.dev/) — Web framework
- [@xenova/transformers](https://github.com/xenova/transformers.js) — Local embeddings
- [OpenAI](https://openai.com/) — Cloud embeddings
- [Vectra](https://github.com/Stevenic/vectra) — Vector store reference
- [x402 Protocol](https://x402.org/) — Payment protocol by Coinbase
- [Base](https://base.org/) — L2 blockchain

---

**Made with 🔥 for the x402 Hackathon**
