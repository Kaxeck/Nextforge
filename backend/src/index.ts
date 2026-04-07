import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './services/database';
import { pollContractEvents } from './services/stellar';
import apiRoutes from './routes/api';

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

// Add AI API routes
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'NextForge AI Broker' });
});

app.listen(port, () => {
  console.log(`🤖 NextForge AI Broker Layer running on http://localhost:${port}`);
  console.log(`🔑 Connected to Soroban Contract: ${process.env.SOROBAN_CONTRACT_ID || 'PENDING'}`);
});
