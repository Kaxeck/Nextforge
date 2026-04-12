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
import { getDb } from './database.js';

dotenv.config({ path: '../.env' }); // Adjust relative path as needed

const RPC_URL = process.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const CONTRACT_ID = process.env.SOROBAN_CONTRACT_ID || '';
const ADMIN_SECRET = process.env.DEPLOYER_SECRET_KEY || ''; // The AI uses this to sign

if (!CONTRACT_ID) {
    console.warn("⚠️ Warning: SOROBAN_CONTRACT_ID not set.");
}

const server = new rpc.Server(RPC_URL);
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Invokes verify_machine on the Smart Contract. 
 * This is called by the Local Machine Agent if the machine looks legit.
 * Includes a retry mechanism to handle race conditions with on-chain registration.
 */
export async function verifyMachineOnChain(machineId: string) {
    if (!ADMIN_SECRET) throw new Error("AI Admin Secret key not configured");
    
    const adminKeypair = Keypair.fromSecret(ADMIN_SECRET);
    const contract = new Contract(CONTRACT_ID);
    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            console.log(`📡 [Attempt ${attempt}/${MAX_ATTEMPTS}] Sending verify_machine(${machineId}) to Soroban...`);
            
            const sourceAccount = await server.getAccount(adminKeypair.publicKey());
            
            let tx = new TransactionBuilder(sourceAccount, {
                fee: "15000",
                networkPassphrase: NETWORK_PASSPHRASE,
            })
            .addOperation(
                contract.call('verify_machine',
                    nativeToScVal(machineId, { type: 'string' })
                )
            )
            .setTimeout(30)
            .build();

            // 1. Simulate the transaction
            const simulated = await server.simulateTransaction(tx);
            
            if (!rpc.Api.isSimulationSuccess(simulated)) {
                const errMessage = (simulated as any).error || (simulated as any).result?.error || "Unknown Soroban panic";
                throw new Error(`Contract Simulation Failed: ${errMessage}`);
            }

            // 2. Prepare transaction
            let preparedTx = await server.prepareTransaction(tx);

            // 3. Sign
            preparedTx.sign(adminKeypair);
            
            // 4. Submit
            const sendResult = await server.sendTransaction(preparedTx);
            
            if (sendResult.status === "ERROR") {
                throw new Error(`Submission failed. Soroban Error.`);
            }
            console.log("✅ Verification tx sent:", sendResult.hash);
            
            // Success: Update local DB cache as verified
            try {
                const db = getDb();
                db.prepare(`UPDATE machines_cache SET status = 'verified' WHERE id = ?`).run(machineId);
            } catch (dbErr) {
                console.warn(`⚠️ Blockchain verification succeeded, but local cache update failed: ${(dbErr as any).message}`);
                // We return true because the on-chain goal was achieved
            }
            return true;

        } catch (error) {
            console.warn(`⚠️ Attempt ${attempt} failed for ${machineId}:`, (error as any).message);
            
            if (attempt < MAX_ATTEMPTS) {
                console.log(`⏳ Waiting 10 seconds for Soroban to sync before next attempt...`);
                await sleep(10000);
            } else {
                console.error("❌ All on-chain verification attempts failed. Machine will remain unverified until chain syncs.");
                return false;
            }
        }
    }
    return false;
}

/**
 * Event listener fetching native soroban events utilizing polling getEvents.
 */
export async function pollContractEvents() {
    if (!CONTRACT_ID) return;
    console.log("👂 Synchronizing event listener with Soroban network...");
    
    let lastCursor: string | undefined = undefined;

    async function poll() {
        try {
            let requestArgs: any = {
                limit: 10,
                filters: [{ type: 'contract', contractIds: [CONTRACT_ID] }]
            };
            
            if (lastCursor) {
                requestArgs.cursor = lastCursor;
            } else {
                const health = await server.getLatestLedger();
                requestArgs.startLedger = health.sequence;
            }

            const response = await server.getEvents(requestArgs);

            if (response.events && response.events.length > 0) {
                for (const event of response.events) {
                    console.log(`\n⚡ [SOROBAN EVENT DETECTED]`);
                    try {
                         const topic0 = scValToNative(event.topic[0]);
                         console.log(`   - Primary Topic: ${topic0}`);
                    } catch(e) {}
                    lastCursor = (event as any).id;
                }
            }
        } catch (e) {
            // Silence RPC timeouts
        }
        // Schedule next poll ONLY after this one finishes
        setTimeout(poll, 10000); 
    }

    poll(); // Start initial poll
}

/**
 * Gets the current machines from the chain to populate cache.
 */
export async function syncMachinesFromChain() {
    if (!CONTRACT_ID || !ADMIN_SECRET) return;
    console.log("🔄 Syncing machines from blockchain...");

    try {
        const adminKeypair = Keypair.fromSecret(ADMIN_SECRET);
        const sourceAccount = await server.getAccount(adminKeypair.publicKey());
        const contract = new Contract(CONTRACT_ID);

        // Build a read-only transaction using 'list_machines'
        let tx = new TransactionBuilder(sourceAccount, {
            fee: "1000",
            networkPassphrase: NETWORK_PASSPHRASE,
        })
        .addOperation(contract.call('list_machines'))
        .setTimeout(30)
        .build();

        // Simulate to read data
        const simulated = await server.simulateTransaction(tx);
        
        if (rpc.Api.isSimulationSuccess(simulated) && simulated.result) {
            const machineIds = scValToNative(simulated.result.retval);
            if (Array.isArray(machineIds)) {
                console.log(`✅ Synced ${machineIds.length} machines from the on-chain registry:`, machineIds);
                // Here we could update the local SQLite database if any were missing from cache
                // Currently cache is built mostly on-demand, but this serves as a startup check.
            }
        } else {
             console.log(`🤔 Contract returned empty or simulation failed reading machines.`);
        }
    } catch (e) {
        console.warn("⚠️ Failed to sync machines from chain:", (e as any).message);
    }
}

/**
 * Reads reviews for a specific machine directly from Soroban state.
 */
export async function getReviewsFromChain(machine_id: string): Promise<any[]> {
    if (!CONTRACT_ID || !ADMIN_SECRET) return [];
    try {
        const adminKeypair = Keypair.fromSecret(ADMIN_SECRET);
        const sourceAccount = await server.getAccount(adminKeypair.publicKey());
        const contract = new Contract(CONTRACT_ID);

        let tx = new TransactionBuilder(sourceAccount, {
            fee: "1000",
            networkPassphrase: NETWORK_PASSPHRASE,
        })
        .addOperation(contract.call('get_reviews', nativeToScVal(machine_id, { type: 'string' })))
        .setTimeout(30)
        .build();

        const simulated = await server.simulateTransaction(tx);
        
        if (rpc.Api.isSimulationSuccess(simulated) && simulated.result) {
            const reviews = scValToNative(simulated.result.retval);
            if (Array.isArray(reviews)) {
                return reviews;
            }
        }
    } catch (e) {
        console.warn("⚠️ Failed to sync reviews from chain for machine", machine_id, ":", (e as any).message);
    }
    return [];
}

/**
 * Invokes start_order on the Smart Contract.
 */
export async function startOrderOnChain(orderId: string) {
    if (!ADMIN_SECRET) throw new Error("AI Admin Secret key not configured");
    const adminKeypair = Keypair.fromSecret(ADMIN_SECRET);
    const contract = new Contract(CONTRACT_ID);

    try {
    let retryCount = 0;
    while (retryCount < 3) {
        try {
            console.log(`📡 Sending start_order(${orderId}) to Soroban (Attempt ${retryCount + 1})...`);
            const sourceAccount = await server.getAccount(adminKeypair.publicKey());
            let tx = new TransactionBuilder(sourceAccount, { fee: "15000", networkPassphrase: NETWORK_PASSPHRASE })
                .addOperation(contract.call('start_order', nativeToScVal(orderId, { type: 'string' })))
                .setTimeout(30).build();

            const simulated = await server.simulateTransaction(tx);
            if (rpc.Api.isSimulationSuccess(simulated)) {
                let preparedTx = await server.prepareTransaction(tx);
                preparedTx.sign(adminKeypair);
                const sendResult = await server.sendTransaction(preparedTx);
                
                if (sendResult.status === "ERROR") throw new Error(`Submission failed.`);
                return true;
            }
        } catch (innerE) {
            console.warn(`⚠️ Simulation attempt ${retryCount + 1} failed, retrying in 2s...`);
        }
        
        retryCount++;
        await new Promise(r => setTimeout(r, 2000)); // Wait for propagation
    }
    
    throw new Error(`Start Order Simulation Failed after retries`);
    } catch (e) {
        console.error("❌ Failed to start_order on chain:", e);
        return false;
    }
}

/**
 * Invokes complete_cycle on the Smart Contract.
 */
export async function completeCycleOnChain(orderId: string) {
    if (!ADMIN_SECRET) throw new Error("AI Admin Secret key not configured");
    const adminKeypair = Keypair.fromSecret(ADMIN_SECRET);
    const contract = new Contract(CONTRACT_ID);

    try {
        console.log(`📡 Sending complete_cycle(${orderId}) to Soroban...`);
        const sourceAccount = await server.getAccount(adminKeypair.publicKey());
        let tx = new TransactionBuilder(sourceAccount, { fee: "15000", networkPassphrase: NETWORK_PASSPHRASE })
            .addOperation(contract.call('complete_cycle', nativeToScVal(orderId, { type: 'string' })))
            .setTimeout(30).build();

        const simulated = await server.simulateTransaction(tx);
        if (!rpc.Api.isSimulationSuccess(simulated)) {
            throw new Error(`Complete Cycle Simulation Failed`);
        }

        let preparedTx = await server.prepareTransaction(tx);
        preparedTx.sign(adminKeypair);
        const sendResult = await server.sendTransaction(preparedTx);
        
        if (sendResult.status === "ERROR") throw new Error(`Submission failed.`);
        return true;
    } catch (e) {
        console.error("❌ Failed to complete_cycle on chain:", e);
        return false;
    }
}

