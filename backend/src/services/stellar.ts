import { 
    rpc, 
    TransactionBuilder, 
    Networks, 
    Keypair, 
    Contract,
    xdr,
    scValToNative,
    nativeToScVal,
    Address
} from '@stellar/stellar-sdk';
import dotenv from 'dotenv';
import { getDb } from './database';

dotenv.config({ path: '../.env' }); // Adjust relative path as needed

const RPC_URL = process.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const CONTRACT_ID = process.env.SOROBAN_CONTRACT_ID || '';
const ADMIN_SECRET = process.env.DEPLOYER_SECRET_KEY || ''; // The AI uses this to sign

if (!CONTRACT_ID) {
    console.warn("⚠️ Warning: SOROBAN_CONTRACT_ID not set.");
}

const server = new rpc.Server(RPC_URL);

/**
 * Invokes verify_machine on the Smart Contract. 
 * This is called by the AI Broker if the machine looks legit.
 */
export async function verifyMachineOnChain(machineId: string) {
    if (!ADMIN_SECRET) throw new Error("AI Admin Secret key not configured");
    
    const adminKeypair = Keypair.fromSecret(ADMIN_SECRET);
    const contract = new Contract(CONTRACT_ID);

    try {
        console.log(`📡 Sending verify_machine(${machineId}) to Soroban...`);
        // We use the simpler Stellar SDK v13 syntax pattern, though full submission is complex, 
        // we map it out for the MVP.
        const sourceAccount = await server.getAccount(adminKeypair.publicKey());
        
        let tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: NETWORK_PASSPHRASE,
        })
        .addOperation(
            contract.call('verify_machine', ...[
                nativeToScVal(machineId, { type: 'string' })
            ])
        )
        .setTimeout(30)
        .build();

        tx.sign(adminKeypair);
        
        // Prepare, submit, wait logic ... (simplified for hackathon placeholder)
        const sendResult = await server.sendTransaction(tx);
        console.log("✅ Verification tx sent:", sendResult.hash);
        
        // Update local DB cache
        const db = getDb();
        db.prepare(`UPDATE machines_cache SET status = 'verified' WHERE id = ?`).run(machineId);
        
        return true;
    } catch (error) {
        console.error("❌ Failed to verify on chain:", error);
        return false;
    }
}

/**
 * Simulation of an event listener since native soroban events require 
 * polling getEvents or using a specialized indexer. 
 */
export async function pollContractEvents() {
    // In a real prod environment we use `server.getEvents` with a cursor.
    // Here we simulate detecting a new machine for demo purposes:
    console.log("👂 Listening for 'machine_registered' events from Soroban (Mock/Polling)...");
    
    // Simulating event detection from Soroban for the hackathon demo flow:
    /*
    const events = await server.getEvents({
        startLedger: ...,
        filters: [{ type: 'contract', contractIds: [CONTRACT_ID] }]
    });
    */
}

/**
 * Gets the current machines from the chain to populate cache.
 */
export async function syncMachinesFromChain() {
    // Queries list_machines
    // This is a placeholder for the read API
    console.log("🔄 Syncing machines from blockchain...");
}
