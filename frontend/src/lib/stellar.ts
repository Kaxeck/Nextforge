import { isAllowed, requestAccess, signTransaction } from '@stellar/freighter-api';
// @ts-ignore
import { Contract, rpc, TransactionBuilder, Networks, nativeToScVal, Address, scValToNative } from '@stellar/stellar-sdk';

const CONTRACT_ID = "CAYKQHTZHHWHHTSDOP6LJCUNDJOADSX2BOAJACL74IBGGXMEEDHWBLFB"; 
const RPC_URL = "https://soroban-testnet.stellar.org";
const server = new rpc.Server(RPC_URL);

/**
 * Ensures the user has Freighter installed and connects their wallet.
 */
export async function connectFreighter() {
    try {
        const hasWallet = await isAllowed();
        if (!hasWallet) {
            await requestAccess();
        }
        
        const access = await requestAccess();
        return access.address; // The G... pubkey
    } catch (e) {
        console.error("Freighter connection failed:", e);
        return null;
    }
}

/**
 * Builds the XDR, asks Freighter to sign it, and submits it to Soroban Testnet.
 * THIS IS A REAL ON-CHAIN TRANSACTION.
 */
export async function registerMachineOnChain(
    machineId: string,
    ownerAddress: string,
    machineType: string,
    price: number,
    location: string,
    materials: string,
    autoRepair: boolean
) {
    console.log(`📡 Sending register_machine(${machineId}) to Soroban via Freighter...`);

    // 1. Get Source Account
    const account = await server.getAccount(ownerAddress);

        // 2. Build the contract operation
        const contract = new Contract(CONTRACT_ID);
        const tx = new TransactionBuilder(account, { 
            fee: "10000", 
            networkPassphrase: "Test SDF Network ; September 2015" // Explicit to avoid Bundler issues
        })
        .addOperation(contract.call("register_machine",
            nativeToScVal(machineId, { type: "string" }),
            new Address(ownerAddress).toScVal(), // owner
            new Address(ownerAddress).toScVal(), // payout wallet
            new Address(ownerAddress).toScVal(), // machine wallet
            nativeToScVal(autoRepair, { type: "bool" }), // auto_repair
            nativeToScVal(machineType, { type: "symbol" }),
            nativeToScVal(price, { type: "i128" }),
            nativeToScVal(location, { type: "string" }),
            nativeToScVal(materials, { type: "string" })
        ))
        .setTimeout(60)
        .build();

        // 3. Simulate the transaction (Soroban requirement to compute Auth and Footprints)
        console.log("Simulating transaction for footprint authorization...");
        const simulated = await server.simulateTransaction(tx);
        
        // Use strictly typed internal SDK checks to avoid 'e.switch' crashes downstream
        if (!rpc.Api.isSimulationSuccess(simulated)) {
            // Extract the actual error from the Soroban node
            const errorMessage = (simulated as any).error || (simulated as any).result?.error || "Contract Panicked or ID already exists";
            console.error("Simulation failed:", errorMessage);
            throw new Error(`Contract Simulation Failed: ${errorMessage}`);
        }

        // Prepare transaction with simulation footprint
        let preparedTx = await server.prepareTransaction(tx);

        // 4. Request Freighter Signature
        console.log("Awaiting Freighter user signature...");
        const freighterResponse = await signTransaction(preparedTx.toXDR(), { 
            networkPassphrase: "Test SDF Network ; September 2015"
        });
        
        // @ts-ignore (Handle API version differences: sometimes it returns string directly, usually an object in v6+)
        const finalXdr = typeof freighterResponse === "string" ? freighterResponse : freighterResponse.signedTxXdr;
        
        if (!finalXdr) throw new Error("User canceled signature or Freighter failed");

        // 5. Submit to Stellar Blockchain
        const signedTransaction = TransactionBuilder.fromXDR(finalXdr, "Test SDF Network ; September 2015");
        console.log("Submitting to blockchain...");
        
        const response = await server.sendTransaction(signedTransaction);
        
        if (response.status === "ERROR") {
            throw new Error(`Submission failed. Soroban Error.`);
        }

        console.log(`✅ Transaction submitted! Hash: ${response.hash}`);
        return response.hash;
}
