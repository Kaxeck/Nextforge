import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getDb } from "./services/database";

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
          "Contact a specific Machine Agent on NextForge and negotiate processing. Expects an HTTP 402 Payment Required response internally, which this tool will automatically settle using the agent's wallet context.",
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
    
    // Simulate the Hackathon 402 Pitch exactly
    const simulationLog = `
> Sending payload to ${machine_id}...
> HTTP 402 PAYMENT REQUIRED detected.
> Server requests $0.001 USDC via x402 Protocol.
> Authorizing micro-payment via Stellar Testnet (Wallet signature simulated).
> Tx Hash: ${Math.random().toString(36).substring(7).toUpperCase()}
> Machine Node verified payment. Processing payload...

Machine Agent (${machine_id}) Response: 
"PAYLOAD RECEIVED AND APPROVED. Escrow logic successfully bonded via Soroban. Hardware parameters initialized for payload: '${job_payload}'."
`;

    return {
      content: [
        {
          type: "text",
          text: simulationLog,
        },
      ],
    };
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
