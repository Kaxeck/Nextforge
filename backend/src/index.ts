import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './services/database';
import { pollContractEvents } from './services/stellar';
import apiRoutes from './routes/api';

// x402 Agentic Payments (loaded via require for CJS compatibility)
// @ts-ignore - x402 types only resolve under ESM moduleResolution
const { paymentMiddlewareFromConfig } = require('@x402/express');
// @ts-ignore
const { HTTPFacilitatorClient } = require('@x402/core/server');
// @ts-ignore
const { ExactStellarScheme } = require('@x402/stellar/exact/server');

dotenv.config({ path: '../.env' }); // Load .env from root

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite Cache
initDatabase();

// Start Stellar Event Listener
pollContractEvents().catch(console.error);

// ===== x402 AGENTIC PAYMENTS LAYER =====
const FACILITATOR_URL = 'https://www.x402.org/facilitator';
const PLATFORM_WALLET = process.env.DEPLOYER_SECRET_KEY 
  ? (() => { 
      try { 
        const { Keypair } = require('@stellar/stellar-sdk');
        return Keypair.fromSecret(process.env.DEPLOYER_SECRET_KEY).publicKey();
      } catch { return 'GABC123'; }
    })()
  : 'GABC123';
const X402_NETWORK = 'stellar:testnet';

console.log(`x402 Platform Wallet: ${PLATFORM_WALLET}`);

try {
  app.use(paymentMiddlewareFromConfig(
    {
      // Buyer Agent pays Machine Agent node to evaluate job viability
      'GET /api/relay/machine_agent/evaluate_job': {
        accepts: { scheme: 'exact', price: '$0.001', network: X402_NETWORK, payTo: PLATFORM_WALLET }
      },
      // Seller pays Protocol Relay to audit pricing changes
      'POST /api/machine/evaluate_pricing': {
        accepts: { scheme: 'exact', price: '$0.0005', network: X402_NETWORK, payTo: PLATFORM_WALLET }
      },
      // Material Supplier pays to list inventory
      'POST /api/materials/publish': {
        accepts: { scheme: 'exact', price: '$0.0005', network: X402_NETWORK, payTo: PLATFORM_WALLET }
      }
    },
    new HTTPFacilitatorClient({ url: FACILITATOR_URL }),
    [{ network: X402_NETWORK, server: new ExactStellarScheme() }]
  ));
  console.log('x402 payment middleware ACTIVE on protected endpoints');
} catch (e) {
  console.warn('x402 middleware failed to initialize (facilitator may be offline):', (e as any).message);
}

// Add AI API routes
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'NextForge Protocol Router' });
});

app.listen(port, () => {
  console.log(`🤖 NextForge Protocol Router Layer running on http://localhost:${port}`);
  console.log(`🔑 Connected to Soroban Contract: ${process.env.SOROBAN_CONTRACT_ID || 'PENDING'}`);
});
