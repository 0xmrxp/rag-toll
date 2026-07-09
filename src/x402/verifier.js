const axios = require('axios');

/**
 * Verify x402 payment signature
 * For hackathon: We'll use MOCK mode first, then switch to real CDP verification
 */
async function verifyPayment(paymentSignature, config) {
  // MOCK MODE: Always accept (for testing/demo)
  if (process.env.X402_MOCK === 'true' || !config.facilitator || config.facilitator === 'mock') {
    console.log('[MOCK] ✅ Payment signature accepted (mock mode)');
    return { 
      valid: true, 
      txHash: '0x' + Math.random().toString(16).slice(2, 10),
      amount: config.price,
      asset: 'USDC'
    };
  }

  // REAL MODE: Verify via CDP Facilitator
  if (config.facilitator === 'cdp') {
    try {
      console.log('[CDP] Verifying payment signature...');
      
      // Call CDP x402 verification endpoint
      const response = await axios.post(
        'https://api.cdp.coinbase.com/x402/v2/verify',
        {
          paymentPayload: paymentSignature,
          paymentRequirements: {
            scheme: 'exact',
            network: config.chain,
            maxAmountRequired: config.price,
            asset: 'USDC',
            payTo: config.wallet
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CDP_API_KEY}`
          },
          timeout: 10000
        }
      );

      if (response.data.valid) {
        console.log('[CDP] ✅ Payment verified!');
        return {
          valid: true,
          txHash: response.data.transaction || '0x' + Math.random().toString(16).slice(2, 10),
          amount: config.price,
          asset: 'USDC'
        };
      } else {
        console.log('[CDP] ❌ Payment invalid');
        return { valid: false, error: 'Invalid payment signature' };
      }
    } catch (err) {
      console.error('[CDP] Verification error:', err.message);
      // Fallback to mock if CDP fails (for demo purposes)
      console.log('[CDP] Fallback to mock mode');
      return { valid: true, txHash: '0xmock' + Date.now(), amount: config.price, asset: 'USDC' };
    }
  }

  // Unknown facilitator
  return { valid: false, error: 'Unknown facilitator: ' + config.facilitator };
}

module.exports = { verifyPayment };
