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
 * This is called by the Local Machine Agent if the machine looks legit.
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
            fee: "10000",
            networkPassphrase: NETWORK_PASSPHRASE,
        })
        .addOperation(
            contract.call('verify_machine',
                nativeToScVal(machineId, { type: 'string' })
            )
        )
        .setTimeout(30)
        .build();

        // 1. Simulate the transaction to compute resources/footprint
        const simulated = await server.simulateTransaction(tx);
        
        // Ensure simulation was successful
        if (!rpc.Api.isSimulationSuccess(simulated)) {
            const errMessage = (simulated as any).error || (simulated as any).result?.error || "Unknown Soroban panic";
            throw new Error(`Contract Simulation Failed: ${errMessage}`);
        }

        // 2. Prepare transaction with the simulation footprint
        let preparedTx = await server.prepareTransaction(tx);

        // 3. Sign the fully prepared transaction
        preparedTx.sign(adminKeypair);
        
        // 4. Submit to Soroban
        const sendResult = await server.sendTransaction(preparedTx);
        
        if (sendResult.status === "ERROR") {
            throw new Error(`Submission failed. Soroban Error.`);
        }
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
 * Event listener fetching native soroban events utilizing polling getEvents.
 */
export async function pollContractEvents() {
    if (!CONTRACT_ID) return;
    console.log("👂 Synchronizing event listener with Soroban network...");
    
    let lastCursor: string | undefined = undefined;

    setInterval(async () => {
        try {
            // Conditionally build request to satisfy strict SDK Typescript rules
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
                    
                    // Decode topic array to read event signals (e.g. ("machine", "reg"))
                    try {
                         const topic0 = scValToNative(event.topic[0]);
                         console.log(`   - Primary Topic: ${topic0}`);
                         
                         if (event.topic.length > 1) {
                             const topic1 = scValToNative(event.topic[1]);
                             console.log(`   - Sub Action: ${topic1}`);
                         }
                    } catch(e) {
                         // Fallback logging
                         console.log("   - Emitted opaque payload");
                    }
                    
                    // In stellar-sdk Soroban RPC, the cursor is the event id
                    lastCursor = (event as any).id;
                }
            }
        } catch (e) {
            // Silently absorb polling errors to avoid console flood on timeout
        }
    }, 5000); // Poll every 5 seconds
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
