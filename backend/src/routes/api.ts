import { Router, Request, Response } from 'express';
import { getDb } from '../services/database';
import { handleNewRegistration, evaluatePriceUpdate, evaluateJobFeasibility, autonomousMachineSearch } from '../services/agent_relay';
import { getReviewsFromChain } from '../services/stellar';

const router = Router();

router.get('/machines', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const owner = req.query.owner as string | undefined;
        let machines;
        
        if (owner) {
            machines = db.prepare('SELECT * FROM machines_cache WHERE owner = ?').all(owner);
        } else {
            machines = db.prepare('SELECT * FROM machines_cache').all();
        }
        res.json({ success: true, data: machines });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Database error" });
    }
});

router.get('/machine/:id/reviews', async (req: Request, res: Response) => {
    try {
        const reviews = await getReviewsFromChain(req.params.id as string);
        res.json({ success: true, data: reviews });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Chain query error" });
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
    const { machine_id, owner, machine_type, price, location, materials } = req.body;
    
    // We intentionally don't await this so the webhook responds immediately 
    // and the AI processes in the background like a true autonomous agent.
    handleNewRegistration(machine_id, owner, machine_type, price, location, materials).catch(console.error);

    res.json({ success: true, message: "AI has started evaluating." });
});

router.post('/machine/evaluate_pricing', async (req: Request, res: Response) => {
    try {
        const { machine_id, machine_type, new_price } = req.body;
        if (!machine_id || !machine_type || new_price === undefined) {
            return res.status(400).json({ success: false, error: "Missing parameters" });
        }

        const result = await evaluatePriceUpdate(machine_id, machine_type, new_price);
        
        if (result.success) {
            // Update local cache internally immediately since we simulate contract signing
            const db = getDb();
            db.prepare('UPDATE machines_cache SET price = ? WHERE id = ?').run(new_price, machine_id);
            res.json({ success: true, ai_notes: result.reason });
        } else {
            res.status(400).json({ success: false, error: result.reason });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: "AI Evaluation system dropped the request." });
    }
});

// ===== FREE: Autonomous Agent Search (No x402 charge for purely searching) =====
router.post('/relay/buyer_agent/search', async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ success: false, error: "Missing prompt" });
        }
        
        // Fetch full machine directory
        const db = getDb();
        const machines = db.prepare('SELECT * FROM machines_cache').all();
        
        // Let the AI Agent find the best match
        const result = await autonomousMachineSearch(prompt, machines);
        
        if (result.machineId) {
            res.json({ success: true, ...result });
        } else {
            res.status(404).json({ success: false, error: "Buyer Agent could not find a suitable machine on the network." });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: "Buyer Agent malfunctioned." });
    }
});

// ===== x402-GATED: Buyer AI pays $0.001 to evaluate job viability =====
router.get('/relay/machine_agent/evaluate_job', async (req: Request, res: Response) => {
    try {
        const { machine_id, job_description } = req.query;
        if (!machine_id) {
            return res.status(400).json({ success: false, error: "Missing machine_id" });
        }
        const db = getDb();
        const machine = db.prepare('SELECT * FROM machines_cache WHERE id = ?').get(machine_id as string) as any;
        if (!machine) {
            return res.status(404).json({ success: false, error: "Machine not found" });
        }
        // x402 already collected $0.001 USDC before reaching here
        const jobResult = await evaluateJobFeasibility(machine, job_description as string);

        res.json({
            success: true,
            x402_payment: 'settled',
            evaluation: {
                machine_id: machine.id,
                machine_type: machine.machine_type,
                status: machine.status,
                reputation: machine.reputation,
                price_per_cycle: machine.price,
                location: machine.location,
                materials: machine.materials,
                ai_verdict: machine.reputation >= 50 ? 'RECOMMENDED' : 'CAUTION_LOW_REPUTATION',
                job_feasibility: jobResult.success ? 'APPROVED' : 'REJECTED',
                ai_reasoning: jobResult.reason
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: "Relay evaluation failed" });
    }
});

// ===== x402-GATED: Buyer pays per-cycle to execute manufacturing =====
router.post('/machine/execute', async (req: Request, res: Response) => {
    try {
        const { machine_id, cycle_number, job_description } = req.body;
        if (!machine_id) {
            return res.status(400).json({ success: false, error: "Missing machine_id" });
        }
        const db = getDb();
        const machine = db.prepare('SELECT * FROM machines_cache WHERE id = ?').get(machine_id) as any;
        if (!machine) {
            return res.status(404).json({ success: false, error: "Machine not found" });
        }
        // x402 already collected the cycle micropayment before reaching here
        // The payment went to the machine owner's wallet dynamically
        db.prepare('UPDATE machines_cache SET reputation = MIN(100, reputation + 1) WHERE id = ?')
          .run(machine_id);

        // Log the x402 payment
        db.prepare(`
            INSERT INTO x402_payments (machine_id, payer, amount, payment_type)
            VALUES (?, ?, ?, ?)
        `).run(machine_id, 'x402_buyer', machine.price, 'cycle_execution');

        res.json({
            success: true,
            x402_payment: 'settled',
            cycle: cycle_number || 1,
            machine_id,
            owner_received: `${(machine.price / 10000000).toFixed(4)} USDC`,
            status: 'cycle_complete'
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: "Cycle execution failed" });
    }
});

// ===== FREE: Bounty board (anyone can view) =====
router.get('/bounties/:id', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const bounty = db.prepare('SELECT * FROM bounties WHERE id = ?').get(req.params.id);
        if (!bounty) {
            return res.status(404).json({ success: false, error: "Bounty not found" });
        }
        res.json({ success: true, data: bounty });
    } catch (e) {
        res.status(500).json({ success: false, error: "Database error" });
    }
});

// ===== x402-GATED: Material supplier pays to publish inventory =====
router.post('/materials/publish', async (req: Request, res: Response) => {
    try {
        const { supplier_wallet, material_type, quantity, price_per_unit, location } = req.body;
        if (!supplier_wallet || !material_type) {
            return res.status(400).json({ success: false, error: "Missing parameters" });
        }
        const db = getDb();
        db.prepare(`
            INSERT INTO materials_inventory (supplier_wallet, material_type, quantity, price_per_unit, location)
            VALUES (?, ?, ?, ?, ?)
        `).run(supplier_wallet, material_type, quantity || 0, price_per_unit || 0, location || 'Unknown');

        res.json({
            success: true,
            x402_payment: 'settled',
            message: `Material ${material_type} listed on NextForge marketplace`
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: "Failed to publish material" });
    }
});

// ===== x402 Payment Log (public transparency) =====
router.get('/x402/payments', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const payments = db.prepare('SELECT * FROM x402_payments ORDER BY created_at DESC LIMIT 50').all();
        res.json({ success: true, data: payments });
    } catch (e) {
        res.status(500).json({ success: false, error: "Database error" });
    }
});

export default router;
