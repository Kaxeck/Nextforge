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

        CREATE TABLE IF NOT EXISTS x402_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            machine_id TEXT,
            payer TEXT,
            amount REAL,
            payment_type TEXT, -- cycle_execution, broker_evaluation, pricing_audit, material_listing
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
    `);
    
    console.log("NextForge SQLite Cache initialized (with x402 tables).");
}

export function getDb() {
    return db;
}
