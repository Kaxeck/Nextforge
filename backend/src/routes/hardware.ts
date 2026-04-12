import { Router, Request, Response } from 'express';
import { getDb } from '../services/database.js';

const router = Router();

// 1. Python script connects to this to announce it is online/offline or just heartbeats
router.post('/heartbeat', (req: Request, res: Response) => {
    try {
        const { machine_id, status } = req.body;
        if (!machine_id) {
            return res.status(400).json({ error: "Missing machine_id" });
        }
        
        const db = getDb();
        const now = new Date().toISOString(); 
        
        if (status === 'offline') {
            // Explicitly mark as offline by clearing heartbeat
            db.prepare('UPDATE machines_cache SET last_heartbeat = NULL, ping_pending = 0 WHERE id = ?').run(machine_id);
            console.log(`🔌 Machine ${machine_id} explicitly set to OFFLINE.`);
        } else {
            // Update heartbeat and clear any pending ping since we just heard from it
            db.prepare('UPDATE machines_cache SET last_heartbeat = ?, ping_pending = 0 WHERE id = ?').run(now, machine_id);
            console.log(`📡 HB Sync: Machine ${machine_id} updated at ${now}.`);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error("Hardware heartbeat error:", error);
        res.status(500).json({ success: false });
    }
});

// 2. Python script loops this to see if there is a job OR if a ping is needed
router.get('/poll', (req: Request, res: Response) => {
    try {
        const machine_id = req.query.machine_id;
        if (!machine_id) {
            return res.status(400).json({ error: "Missing machine_id" });
        }
        
        const db = getDb();
        const now = new Date().toISOString();

        // Update heartbeat on every poll to keep the machine 'LIVE' in the UI
        db.prepare('UPDATE machines_cache SET last_heartbeat = ? WHERE id = ?').run(now, machine_id);
        
        // Check if a ping is requested for this machine
        const machine = db.prepare('SELECT ping_pending FROM machines_cache WHERE id = ?').get(machine_id) as any;
        const pingRequired = machine?.ping_pending === 1;

        const pendingJob = db.prepare("SELECT * FROM hardware_jobs WHERE machine_id = ? AND status = 'pending' ORDER BY created_at ASC LIMIT 1").get(machine_id) as any;
        
        if (pendingJob) {
            db.prepare('UPDATE hardware_jobs SET status = "executing" WHERE id = ?').run(pendingJob.id);
            return res.json({ success: true, has_job: true, job: pendingJob, ping_required: pingRequired });
        }
        
        res.json({ success: true, has_job: false, ping_required: pingRequired });
    } catch (error) {
        console.error("Hardware poll error:", error);
        res.status(500).json({ success: false });
    }
});

// 2.5. Frontend calls this to trigger a ping
router.get('/trigger_ping', (req: Request, res: Response) => {
    try {
        const { machine_id } = req.query;
        if (!machine_id) return res.status(400).json({ error: "Missing machine_id" });
        
        const db = getDb();
        db.prepare('UPDATE machines_cache SET ping_pending = 1 WHERE id = ?').run(machine_id);
        res.json({ success: true, message: "Ping requested" });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// 3. MCP / Website posts a job here when payment succeeds
router.post('/submit_job', (req: Request, res: Response) => {
    try {
        const { machine_id, payload } = req.body;
        if (!machine_id || !payload) {
            return res.status(400).json({ error: "Missing data" });
        }

        const db = getDb();
        
        // Double check machine exists
        const machine = db.prepare('SELECT id FROM machines_cache WHERE id = ?').get(machine_id);
        if(!machine) {
            return res.status(404).json({ error: "Machine not found" });
        }

        const result = db.prepare('INSERT INTO hardware_jobs (machine_id, payload) VALUES (?, ?)').run(machine_id, payload);
        const newJobId = result.lastInsertRowid;
        
        res.json({ success: true, job_id: newJobId });
    } catch (error) {
        console.error("Job submission error:", error);
        res.status(500).json({ success: false });
    }
});

// 4. Python scripts posts here when it finishes printing
router.post('/complete', (req: Request, res: Response) => {
    try {
        const { job_id } = req.body;
        if (!job_id) {
            return res.status(400).json({ error: "Missing job_id" });
        }
        
        const db = getDb();
        db.prepare('UPDATE hardware_jobs SET status = "completed" WHERE id = ?').run(job_id);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// 5. Frontend polls this to see if the hardware finished
router.get('/status_check', (req: Request, res: Response) => {
    try {
        const job_id = req.query.job_id;
        if (!job_id) return res.status(400).json({ error: "Missing job_id" });
        
        const db = getDb();
        const job = db.prepare('SELECT status FROM hardware_jobs WHERE id = ?').get(job_id) as any;
        
        if (job) {
            return res.json({ success: true, status: job.status });
        }
        res.json({ success: false, error: "Job not found" });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// 6. Python agent posts status updates (e.g. "executing")
router.post('/status_update', (req: Request, res: Response) => {
    try {
        const { job_id, status } = req.body;
        if (!job_id || !status) return res.status(400).json({ error: "Missing fields" });
        
        const db = getDb();
        db.prepare('UPDATE hardware_jobs SET status = ? WHERE id = ?').run(status, job_id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

export default router;
