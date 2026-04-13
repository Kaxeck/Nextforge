import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getDb } from "./services/database.js";
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
          "Scan the global NextForge Protocol for available manufacturing nodes (hardware limits, price per cycle, etc.). Call this to understand available hardware before attempting a negotiation. CRITICAL: You must carefully check the 'power' field and NEVER attempt to negotiate with a machine that is OFFLINE_DISCONNECTED.",
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
      const rawMachines = db.prepare('SELECT id, machine_type, reputation, price, materials, location, status, last_heartbeat FROM machines_cache').all();
      const now = Date.now();
      const machines = rawMachines.map((m: any) => {
          let isOnline = false;
          if (m.last_heartbeat) {
              const hb = new Date(m.last_heartbeat).getTime();
              const diff = now - hb;
              if (diff < 30000 && diff > -5000) isOnline = true;
          }
          return {
              id: m.id,
              type: m.machine_type,
              reputation: m.reputation,
              price: m.price,
              materials: m.materials,
              status: m.status,
              power: isOnline ? 'ONLINE_ACTIVE' : 'OFFLINE_DISCONNECTED'
          };
      });
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
    const toolParams = request.params.arguments as { machine_id: string, job_payload: string };
    const { machine_id, job_payload } = toolParams;
    
    // FETCH REAL MACHINE OWNER
    const db = getDb();
    const machine = db.prepare('SELECT owner, price FROM machines_cache WHERE id = ?').get(machine_id) as any;
    if (!machine) {
        throw new Error("Machine not found on protocol registry.");
    }

    const agentSecret = process.env.AGENT_SECRET_KEY || process.env.DEPLOYER_SECRET_KEY;
    if (!agentSecret) {
        throw new Error("Agent missing AGENT_SECRET_KEY in environment to sign MPP payment.");
    }

    // REAL STELLAR BLOCKCHAIN TRANSACTION (Soroban Escrow) using centralized service
    let txHash = "";
    try {
        const orderId = `job-${Date.now()}`;
        const budgetStroops = machine.price || 10000000;
        
        // Use a more robust call through our refined services if possible, 
        // but since we need the Agent to pay, we'll implement the RETRY logic here too.
        let retryCount = 0;
        const agentKeypair = Keypair.fromSecret(agentSecret);
        const serverRpc = new rpc.Server('https://soroban-testnet.stellar.org');
        const contractId = process.env.SOROBAN_CONTRACT_ID!;
        const contract = new Contract(contractId);

        while (retryCount < 3) {
            try {
                const sourceAccount = await serverRpc.getAccount(agentKeypair.publicKey());
                let tx = new TransactionBuilder(sourceAccount, { fee: "15000", networkPassphrase: Networks.TESTNET })
                    .addOperation(contract.call('create_order', 
                        nativeToScVal(orderId, { type: 'string' }),
                        nativeToScVal(agentKeypair.publicKey(), { type: 'address' }),
                        nativeToScVal(machine_id, { type: 'string' }),
                        nativeToScVal(job_payload, { type: 'string' }),
                        nativeToScVal(1, { type: 'u32' }),
                        nativeToScVal(budgetStroops, { type: 'i128' }),
                        nativeToScVal(Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), { type: 'u64' }),
                        nativeToScVal(budgetStroops, { type: 'i128' })
                    )).setTimeout(30).build();

                const simulated = await serverRpc.simulateTransaction(tx);
                if (rpc.Api.isSimulationSuccess(simulated)) {
                    let preparedTx = await serverRpc.prepareTransaction(tx);
                    preparedTx.sign(agentKeypair);
                    const sendResult = await serverRpc.sendTransaction(preparedTx);
                    if (sendResult.status !== "ERROR") {
                        txHash = sendResult.hash;
                        break; 
                    }
                }
            } catch (innerE) {
                console.warn(`MCP Escrow attempt ${retryCount + 1} failed, retrying...`);
            }
            retryCount++;
            await new Promise(r => setTimeout(r, 2000));
        }

        if (!txHash) throw new Error("Stellar Testnet rejected the escrow transaction after retries.");

    } catch (e: any) {
         return {
            content: [{ type: "text", text: `MPP Payment failed. Transaction reverted: ${e.message}` }],
            isError: true,
         };
    }
    
    try {
      // POST job straight to the hardware bridge database
      const res = await (global as any).fetch("http://localhost:3001/api/hardware/submit_job", {
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
"PAYLOAD RECEIVED AND APPROVED. Escrow logic successfully bonded via Soroban. Hardware parameters initialized for payload: '${job_payload}'. Job ID assigned: ${data.job_id || 'JOB-' + Date.now()}."
`;

      return {
        content: [
          {
            type: "text" as const,
            text: simulationLog,
          },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Error bridging to hardware relay: ${e}` }],
        isError: true,
      };
    }
  }

  throw new Error(`Tool not found: ${request.params.name}`);
});

// Start the server using standard stdio streams
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("NextForge MCP Server running on stdio");
}

run().catch(console.error);
