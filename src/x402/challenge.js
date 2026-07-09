/**
 * Generate x402 v2 Challenge Response (HTTP 402)
 * This tells the AI Agent: "Pay me USDC to access this data"
 */
function generateChallenge(config) {
  return {
    x402Version: 2,
    error: "RAG-Toll: Payment required to query this private vector database",
    accepts: [
      {
        scheme: "exact",
        network: config.chain, // e.g., "eip155:8453" (Base Mainnet)
        maxAmountRequired: config.price, // e.g., "0.05" USDC
        asset: "USDC",
        payTo: config.wallet, // Receiver wallet address
        description: `Pay $${config.price} USDC to query RAG-Toll private data`,
        mimeType: "application/json",
        maxTimeoutSeconds: 60
      }
    ]
  };
}

module.exports = { generateChallenge };
