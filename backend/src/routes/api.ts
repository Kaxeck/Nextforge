import { Router, Request, Response } from 'express';
import { getDb } from '../services/database';
import { handleNewRegistration } from '../services/broker';

const router = Router();

router.get('/machines', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const machines = db.prepare('SELECT * FROM machines_cache').all();
        res.json({ success: true, data: machines });
    } catch (error) {
        res.status(500).json({ success: false, error: "Database error" });
    }
});

router.get('/bounties', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const bounties = db.prepare('SELECT * FROM bounties WHERE status = "open"').all();
        res.json({ success: true, data: bounties });
    } catch (error) {
        res.status(500).json({ success: false, error: "Database error" });
    }
});

// A webhook hook or internal trigger used to simulate Soroban emitting an event for demo
router.post('/webhook/machine_registered', async (req: Request, res: Response) => {
    const { machine_id, machine_type, price, location, materials } = req.body;
    
    // We intentionally don't await this so the webhook responds immediately 
    // and the AI processes in the background like a true autonomous agent.
    handleNewRegistration(machine_id, machine_type, price, location, materials).catch(console.error);

    res.json({ success: true, message: "AI has started evaluating." });
});

export default router;
