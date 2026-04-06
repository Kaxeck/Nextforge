import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from the root .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Main handler for the agent's offline calculations.
// For the hackathon, this largely acts as a pass-through to the Soroban RPC,
// but it's where we'll implement the proprietary machine-scouting ML in the future.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', msg: 'Backend is fully operational' });
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
