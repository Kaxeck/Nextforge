import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../nextforge.sqlite');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS machines_cache (
            id TEXT PRIMARY KEY,
            owner TEXT,
            machine_type TEXT,
            price REAL,
            materials TEXT,
            status TEXT DEFAULT 'pending_verification', -- pending_verification, verified, pending_physical_verify
            location TEXT,
            reputation INTEGER DEFAULT 50,
            ai_notes TEXT,
            last_heartbeat DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS negotiation_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT,
            machine_id TEXT,
            ai_reasoning TEXT,
            budget INTEGER,
            agreed_price INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(machine_id) REFERENCES machines_cache(id)
        );

        CREATE TABLE IF NOT EXISTS bounties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            machine_id TEXT,
            reason TEXT,
            cost INTEGER,
            status TEXT DEFAULT 'open', -- open, assigned, closed
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(machine_id) REFERENCES machines_cache(id)
        );

        CREATE TABLE IF NOT EXISTS mpp_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            machine_id TEXT,
            payer TEXT,
            amount REAL,
            payment_type TEXT, -- mpp_gate_payment, cycle_execution, broker_evaluation, pricing_audit, material_listing
            tx_hash TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS materials_inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            supplier_wallet TEXT,
            material_type TEXT,
            quantity REAL DEFAULT 0,
            price_per_unit REAL DEFAULT 0,
            location TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS hardware_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            machine_id TEXT,
            payload TEXT,
            status TEXT DEFAULT 'pending', -- pending, executing, completed, failed
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(machine_id) REFERENCES machines_cache(id)
        );
    `);

    // Migration: rename legacy x402_payments table if it exists
    try {
        const hasLegacy = db.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='x402_payments'"
        ).get();
        if (hasLegacy) {
            // Copy any existing data from legacy table to new table
            db.exec(`
                INSERT OR IGNORE INTO mpp_payments (id, machine_id, payer, amount, payment_type, created_at)
                SELECT id, machine_id, payer, amount, payment_type, created_at FROM x402_payments;
            `);
            db.exec(`DROP TABLE IF EXISTS x402_payments;`);
            console.log('📦 Migrated x402_payments → mpp_payments');
        }
    } catch {
        // Migration already completed or table doesn't exist
    }
    
    // DEMO DATA: Seed 2 failed/offline machines if DB is empty so the live-registered machine is the only good one
    try {
        const result = db.prepare("SELECT count(*) as count FROM machines_cache").get() as { count: number };
        if (result.count === 0) {
            db.exec(`
                INSERT OR IGNORE INTO machines_cache (id, owner, machine_type, price, materials, status, location, reputation, ai_notes)
                VALUES 
                ('M-DEAD1', 'GATX...', 'Layer Extruder', 0.50, 'PLA', 'pending_maintenance', 'Berlin, DE', 35, 'Agent auto-flagged hardware wear. Rejecting jobs.'),
                ('M-OFF2', 'GBCY...', 'CNC Mill', 0.25, 'Aluminum', 'offline', 'Tokyo, JP', 20, 'Hardware isolated. Did not send MPP heartbeat within 72hrs.');
            `);
            console.log("🌱 Demo seeded: Added 2 'broken/offline' machines for contrast.");
        }
    } catch(e) {
        console.error("Demo seed failed", e);
    }
    
    console.log("NextForge SQLite Cache initialized (with MPP payment tables).");
}

export function getDb() {
    return db;
}
