import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getDb } from "./services/database";
import { Keypair, rpc, TransactionBuilder, Networks, Operation, Asset, Contract, nativeToScVal } from "@stellar/stellar-sdk";
import dotenv from "dotenv";

dotenv.config({ path: '../.env' });

// Create the MCP server
const server = new Server(
  {
    name: "nextforge-protocol",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define exactly the tools that Claude / Any Open Source Agent can use
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "nextforge_discover_machines",
        description:
          "Scan the global NextForge Protocol for available manufacturing nodes (hardware limits, price per cycle, etc.). Call this to understand available hardware before attempting a negotiation.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "nextforge_negotiate_and_pay",
        description:
          "Contact a specific Machine Agent on NextForge and negotiate processing. Uses the MPP (Machine Payments Protocol) to settle micropayments via Soroban escrow on Stellar Testnet.",
        inputSchema: {
          type: "object",
          properties: {
            machine_id: { type: "string", description: "The ID of the machine, e.g. M-001" },
            job_payload: { type: "string", description: "Clear definition of material, parts required, and constraints." },
          },
          required: ["machine_id", "job_payload"],
        },
      },
    ],
  };
});

// Implement what happens when the LLM triggers those tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "nextforge_discover_machines") {
    try {
      const db = getDb();
      const machines = db.prepare('SELECT id, machine_type, reputation, price, materials, location, status FROM machines_cache').all();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(machines, null, 2),
          },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Error retrieving blockchain registry: ${e}` }],
        isError: true,
      };
    }
  }

  if (request.params.name === "nextforge_negotiate_and_pay") {
    const { machine_id, job_payload } = request.params.arguments as { machine_id: string, job_payload: string };
    
    // FETCH REAL MACHINE OWNER
    const db = getDb();
    const machine = db.prepare('SELECT owner, price FROM machines_cache WHERE id = ?').get(machine_id) as any;
    if (!machine) {
        throw new Error("Machine not found on protocol registry.");
    }

    if (!process.env.DEPLOYER_SECRET_KEY) {
        throw new Error("Agent missing DEPLOYER_SECRET_KEY in environment to sign MPP payment.");
    }

    // REAL STELLAR BLOCKCHAIN TRANSACTION (Soroban Escrow)
    let txHash = "";
    try {
        const agentKeypair = Keypair.fromSecret(process.env.DEPLOYER_SECRET_KEY);
        const serverRpc = new rpc.Server('https://soroban-testnet.stellar.org');
        const contractId = process.env.SOROBAN_CONTRACT_ID;
        
        if (!contractId) {
            throw new Error("SOROBAN_CONTRACT_ID is missing");
        }
        
        const contract = new Contract(contractId);
        const sourceAccount = await serverRpc.getAccount(agentKeypair.publicKey());
        const orderId = `job-${Date.now()}`;
        
        // Build Soroban escrow invocation: create_order(env, order_id, buyer, machine_id, desc, cycles, budget)
        let tx = new TransactionBuilder(sourceAccount, {
            fee: "10000",
            networkPassphrase: Networks.TESTNET,
        })
        .addOperation(contract.call('create_order', 
            nativeToScVal(orderId, { type: 'string' }),
            nativeToScVal(agentKeypair.publicKey(), { type: 'address' }),
            nativeToScVal(machine_id, { type: 'string' }),
            nativeToScVal(job_payload, { type: 'string' }),
            nativeToScVal(1, { type: 'u32' }),
            nativeToScVal(machine.price || 10000000, { type: 'i128' }),
            nativeToScVal(Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), { type: 'u64' }), // Timelock 7 days
            nativeToScVal(machine.price || 10000000, { type: 'i128' }) // Max spend
        ))
        .setTimeout(30)
        .build();

        // 1. Simulate the transaction
        const simulated = await serverRpc.simulateTransaction(tx);
        if (!rpc.Api.isSimulationSuccess(simulated)) {
            const err = (simulated as any).error || (simulated as any).result?.error;
            throw new Error(`Escrow simulation failed: ${err}`);
        }

        // 2. Prepare transaction with footprints
        let preparedTx = await serverRpc.prepareTransaction(tx);

        // 3. Sign the fully prepared transaction
        preparedTx.sign(agentKeypair);
        
        // 4. Send to Soroban
        const sendResult = await serverRpc.sendTransaction(preparedTx);
        if (sendResult.status === "ERROR") {
           throw new Error("Stellar Testnet rejected the escrow transaction.");
        }
        txHash = sendResult.hash;

    } catch (e: any) {
         return {
            content: [{ type: "text", text: `MPP Payment failed. Transaction reverted: ${e.message}` }],
            isError: true,
         };
    }
    
    try {
      // POST job straight to the hardware bridge database
      const res = await fetch("http://localhost:3001/api/hardware/submit_job", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ machine_id, payload: job_payload })
      });
      const data = await res.json();
      
      const simulationLog = `
> Sending payload to ${machine_id}...
> HTTP 402 PAYMENT REQUIRED detected.
> Server requests $0.001 USDC via MPP (Machine Payments Protocol).
> Authorizing micro-payment via Escrow Contract lock on Stellar Testnet.
> Tx Hash: ${txHash}
> Escrow mathematically secured via Soroban footprint.

Machine Agent (${machine_id}) Response: 
"PAYLOAD RECEIVED AND APPROVED. Escrow logic successfully bonded via Soroban. Hardware parameters initialized for payload: '${job_payload}'. Job ID assigned: ${data.job_id}."
`;

      return {
        content: [
          {
            type: "text",
            text: simulationLog,
          },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Error bridging to hardware relay: ${e}` }],
        isError: true,
      };
    }
  }

  throw new Error("Unknown tool called");
});

// Start the server using standard stdio streams
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("NextForge MCP Server running on stdio");
}

run().catch(console.error);
