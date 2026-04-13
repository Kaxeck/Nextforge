<p align="center">
  <img src="icon.png" alt="NextForge Icon" width="100" />
  <br/>
  <img src="logo_text.svg" alt="NextForge" width="220" />
</p>

> **Stellar Hacks: Agents on Stellar — Machine Payments Protocol (MPP) Hackathon Submission**

**A decentralized protocol where AI agents autonomously discover, negotiate, and pay physical machines for manufacturing services — powered by Stellar's Machine Payments Protocol (MPP) + Soroban smart contracts.**

NextForge connects cloud-based AI agents directly to real physical hardware (3D printers, CNCs, laser cutters) through a trustless economic layer. Using the **Machine Payments Protocol (MPP)** and **Soroban smart contracts** on Stellar, machines become autonomous economic actors: they list capabilities, set prices, evaluate incoming jobs with onboard AI, and get paid in stablecoin — all without human intervention. No external facilitator required — payments settle natively via Soroban SAC.

Agents pay agents. Machines earn revenue. Humans set the rules and collect the profits.

---

## How It Works

### The Problem
AI agents can reason, plan, and act — right up until they need to pay. Today, if an agent needs something physically manufactured, a human must manually find a vendor, negotiate pricing, arrange payment, and monitor production. This bottleneck breaks the promise of autonomous AI.

### The Solution: A Dual-Agent Architecture
NextForge relies on a symmetric AI architecture negotiating trustlessly via **MPP on Stellar**:

1. **The Buyer Agent (e.g. Claude via MCP):** Searches the NextForge network for machines that match a manufacturing request (material, capability, location, price).
2. **The 402 Barrier:** The protocol presents an HTTP `402 Payment Required` barrier. The Buyer Agent must construct a Soroban SAC micro-payment ($0.001 USDC) to access the hardware.
3. **The AI Verification Infiltration Shield:** When a vendor registers a new machine on the blockchain, the central NextForge relay triggers a Webhook. An onboard Gemini 2.5 Flash agent autonomously audits the newly registered machine profile (materials, price, hardware type, location). If it detects a legitimate industrial machine, it sets a baseline reputation. If it detects a scam configuration, it flags the machine and warns the network.
4. **The Machine Agent:** Acts as the hardware's internal brain. It autonomously reads incoming job payloads, evaluates physics/safety limits based on market data, and rejects or approves the job.
5. **The Escrow Lock:** If approved, the full payment is locked in a Soroban escrow contract, and the job payload is dispatched directly to the physical machine over USB/Serial.
6. **Streaming Settlement:** As the machine executes, it natively releases the escrowed funds to the hardware owner's wallet via per-cycle MPP log streaming with a 1% protocol fee.

All of this happens without a single human click.

---

## Architecture

```
┌─────────────────┐     MPP Payment       ┌──────────────────┐
│  Buyer AI Agent  │ ──────────────────▶   │  NextForge Node  │
│  (Claude / MCP)  │ ◀────────────────── │  (Protocol Router) │
└─────────────────┘     Job Approved       └────────┬─────────┘
                                                    │
                                           ┌────────▼─────────┐
                                           │   Stellar Soroban │
                                           │  (Escrow + Verify │
                                           │   + Reputation)   │
                                           └────────┬─────────┘
                                                    │
                                           ┌────────▼─────────┐
                                           │  Hardware Agent   │
                                           │  (Python/PySerial)│
                                           │       ▼           │
                                           │  Physical Machine │
                                           │  (USB/Serial)     │
                                           └──────────────────┘
```

### Components

- **Frontend (React + Vite):** Dashboard for machine owners to register hardware using Freighter wallet signatures, monitor fleet status, view on-chain reviews, and visualize network economics. MPP payments settled directly via Soroban SAC + Freighter signing.
- **Backend (Express + SQLite):** Protocol relay that routes agent requests, enforces MPP payment gates via `@stellar/mpp` with **fail-closed security** (no faciltiator dependency), and coordinates Gemini-powered machine audits. Polls Soroban events natively via `server.getEvents()`.
- **Smart Contracts (Soroban/Rust):** Full escrow lifecycle (`create_order` → `start_order` → `complete_cycle`), machine registration & verification, on-chain reputation system, and autonomous maintenance triggers.
- **Hardware Agent (Python):** Standalone script using `pyserial`. Runs on the machine owner's hardware. Polls for paid jobs and sends G-Code commands directly to the printer via Serial.
- **MCP Server:** Model Context Protocol integration. Any compatible LLM agent can natively call `nextforge_discover_machines` and `nextforge_negotiate_and_pay` as built-in tools. Payments route through the Soroban escrow contract.

---

## Stellar Integration

NextForge interacts with Stellar Testnet in several real, verifiable ways:

| Feature | How Stellar is used |
|---|---|
| **Machine Registration** | Owner signs a Soroban `register_machine` contract call via Freighter. Real on-chain transaction. |
| **Machine Verification** | Backend invokes `verify_machine` on Soroban using `simulateTransaction` + `prepareTransaction` for correct footprint computation. |
| **MPP Payment Gates** | Protected API endpoints return HTTP 402 with MPP challenge JSON. Clients build Soroban SAC transfers, sign via Freighter, and retry. No external facilitator — payments settle natively on Soroban. |
| **Escrow Payments (MCP)** | When an LLM agent calls `nextforge_negotiate_and_pay`, the MCP server invokes `create_order` on the Soroban contract, locking funds in escrow with per-cycle release and protocol fee. |
| **Event Polling** | Backend polls `server.getEvents()` every 5 seconds, filtering by contract ID, decoding event topics via `scValToNative`. |
| **Chain Sync** | On startup, `syncMachinesFromChain()` reads the full machine registry from Soroban via `list_machines` simulation. |
| **On-Chain Reviews** | Backend exposes `GET /api/machine/:id/reviews` which queries `get_reviews` directly from Soroban state. Frontend renders real reviews with fallback placeholders. |
| **Frontend Settlement** | `settleMppPayment()` builds Soroban SAC `token.transfer` via Freighter, signs, and retries with `X-MPP-Credential` header. Fully standards-compliant MPP flow. |

---

## What's Real vs. What's Simplified

Being transparent about the current state of the project:

| Component | Status |
|---|---|
| Freighter wallet signing | ✅ Real — opens Freighter, signs XDR, submits to Testnet |
| Soroban contract calls (register/verify/escrow) | ✅ Real — deployed on Testnet with `simulateTransaction` + `prepareTransaction` |
| AI Hardware Verification Webhooks | ✅ Real — Gemini natively audits new machines upon registration via Webhooks |
| MPP middleware on endpoints | ✅ Real — `@stellar/mpp` native Soroban SAC — no facilitator needed |
| MPP frontend settlement via Freighter | ✅ Real — Soroban SAC `token.transfer` + Freighter signing |
| MCP agent-to-Soroban escrow | ✅ Real — invokes `create_order` on the smart contract |
| Soroban event polling | ✅ Real — native `server.getEvents()` with cursor tracking |
| Machine list sync from chain | ✅ Real — reads `list_machines` from Soroban on startup |
| On-chain reviews | ✅ Real — `get_reviews` queried from contract state |
| Hardware USB/Serial bridge | ✅ Real — `pyserial` detects ports and sends G-Code |
| Contract tests | ✅ 2/2 passing — `test_register_machine` + `test_create_and_start_order` |
| Analytics dashboard | ✅ Real — charts use real API data, volume, and machine counts |
| Multi-Wallet Order History | 🚧 Strategic Mockup — Global protocol feed is live; per-wallet persistence planned for v2 |
| AI Self-Management (Pricing, Maintenance, Resources) | 🚧 Partial — Backend evaluators & Smart Contracts are fully built, but hardware sensor-loop trigger is planned for v2 |
| Bounties System | 🚧 Mocked (UI only) — Full on-chain bounty claiming planned for v2 |

---

## Soroban Smart Contract

The contract (`contracts/nextforge/src/lib.rs`) implements:

- **Machine Module:** `register_machine`, `get_machine`, `list_machines`, `verify_machine`, `update_price`, `set_availability`
- **Escrow Module:** `create_order`, `start_order`, `complete_cycle`, `open_dispute`, `get_order` — full lifecycle with precise **SLA Timelocks** (jobs expire automatically to refund buyers), **Maximum Spend Limits** (to protect AI budgets), 50% deposit release, per-cycle payouts, and automated completion.
- **Reputation Module:** `add_review`, `get_reviews` — on-chain review storage with rating, reviewer address, and comment hash.
- **Maintenance Module:** `set_maintenance_config`, `complete_maintenance` — autonomous repair triggers when reputation falls below threshold.

---

## Getting Started

```bash
# Clone
git clone https://github.com/your-org/nextforge.git
cd nextforge

# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev

# Hardware Agent (new terminal, requires physical printer via USB)
cd scripts && pip install requests pyserial
python3 hardware_agent.py YOUR_MACHINE_ID
```

### Environment Variables

Create a `.env` file in the project root:

```env
AGENT_SECRET_KEY=S...       # Stellar Testnet secret key (admin/AI signer)
SOROBAN_CONTRACT_ID=C...       # Deployed contract address
GEMINI_API_KEY=...             # Google Gemini API key for machine audits
```

### Running Contract Tests

```bash
cd contracts/nextforge && cargo test
```

---

## Testing the Autonomous Workflow

NextForge includes two separate AI agent paradigms you can test:

### 1. Claude Desktop (MCP Server)
NextForge includes an MCP (Model Context Protocol) server so Claude can act as your autonomous buyer.
1. Build the MCP Server: `cd backend && npm run build`
2. Add the following to your Claude Desktop config (usually at `~/.config/Claude/claude_desktop_config.json` on Mac/Linux or `%APPDATA%\Stellar\claude_desktop_config.json` on Windows):

> [!IMPORTANT]
> Change `/absolute/path/to/` to the real path on your machine and provide your testnet credentials.

```json
{
  "mcpServers": {
    "nextforge": {
      "command": "node",
      "args": ["/absolute/path/to/nextforge/backend/dist/mcp.js"],
      "env": {
        "AGENT_SECRET_KEY": "YOUR_TESTNET_SECRET_KEY",
        "SOROBAN_CONTRACT_ID": "CCUWOGEF3ZL56YNY4O35LNJWH67FNKJUAFLO5NUMKNTMKEJOIV6RVTF7",
        "VITE_STELLAR_RPC_URL": "https://soroban-testnet.stellar.org"
      }
    }
  }
}
```
      }
    }
  }
}
```
3. Restart Claude Desktop. You can now prompt Claude: *"I need to find 3D printers on NextForge and negotiate a print job for 50 cycles."* Claude will discover machines and lock the escrow natively via Soroban.

---

## 🛠️ Advanced: Production Testing (Render)

If you are testing against the live deployed version at `nextforge.onrender.com`:

1. **Agent Account Faucet:** Use this one-liner to generate a new sovereign agent account with Testnet funds and USDC trustlines already configured:
   ```bash
   cd backend && node -e "const {Keypair} = require('@stellar/stellar-sdk'); const kp = Keypair.random(); console.log('NEW AGENT KEYPAIR\nPublic:', kp.publicKey(), '\nSecret:', kp.secret());"
   ```
2. **Production MCP:** Use `dist/mcp_production.js`. This script is optimized to talk to the Render API and the Soroban testnet simultaneously.
3. **Hardware Agent:** Connect your local physical machine to the production protocol:
   ```bash
   NEXTFORGE_URL=https://nextforge.onrender.com python3 scripts/hardware_agent.py M-XXXX
   ```

---

## 🏗️ Architecture details



## Security

- **SLA Timelocks & Max Spend:** AI Agents operate on strict budgets. NextForge Escrows enforce `timelock_deadline` (time limit for the machine to finish before forced refund) and `max_spend_limit` directly at the Soroban tier to prevent malicious machines from price-gouging agents.
- **No Facilitator Dependency:** NextForge's MPP implementation settles payments natively via Soroban SAC — no external facilitator service that can go offline. The HTTP 402 challenge evaluates purely on-chain state.
- **Fail-Closed Policy:** If MPP credential verification fails, protected endpoints block access. No free bypass is possible.
- **Soroban Simulation:** All contract invocations use `simulateTransaction` + `prepareTransaction` to compute correct footprints before submission.

---

## License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.

---

## Roadmap

- [ ] **Phase 2: Decentralized Fleet Management** — Transition the `Orders` view to a fully authenticated multi-wallet dashboard, allowing owners and buyers to track their specific on-chain history across multiple sessions. Currently, the dashboard provides a global **Protocol Preview** of real-time network activity.
- [ ] **Bring Your Own Agent (BYOA)** — Allow hardware owners to easily plug in their own custom fine-tuned LLMs (e.g., local Llama 3) for the Machine Agent, ensuring total privacy of proprietary G-Code and local decision independence.
- [ ] **Zero-Knowledge (ZK) Hardware Proofs** — Transition from API-based execution verification to cryptographic hardware proofs. Machines will generate a ZK-Proof directly from the ESP32 demonstrating that the servos and temperature sensors consumed the exact electrical wattage required for the G-Code, making fraudulent completion claims physically and mathematically impossible on-chain.
- [ ] **High-Frequency State Channels** — For complex multi-day CNC/printing jobs, implement Stellar payment channels allowing the Buyer and Machine to sign micro-transactions off-chain every few seconds, only settling the final aggregated state to the Soroban contract at the very end to maximize relay throughput.
- [ ] **Yield-Bearing Escrow (Opt-In)** — While a $15,000 USD manufacturing job takes 5 days to print, the locked Soroban escrow can optionally route funds into low-risk Stellar DeFi lending protocols. The generated interest can be used to subsidize (reduce to 0%) the protocol network fees for the buyer, creating an incredibly aggressive competitive edge against traditional Web2 manufacturing facilitators without locking user capital in risky assets.
- [ ] **Autonomous Supply Chain & Maintenance** — Empower the Machine Agent to use its earned Soroban USDC to autonomously purchase raw materials (e.g., ordering new PLA spools) and negotiate repair jobs with local technicians when its sensors detect hardware degradation, creating a 100% self-sustaining intelligent factory.
- [ ] **Production database** — Migrate from SQLite to PostgreSQL/Supabase for concurrent multi-agent access, proper indexing, and production-grade reliability. SQLite works for single-node demos but cannot handle multiple hardware agents writing simultaneously.
- [ ] **Microcontroller support** — Replace Python scripts with native ESP32 firmware so machines can connect without a full computer attached.
- [ ] **Visual verification** — Add webcam-based defect detection so machine agents can autonomously halt failed prints and trigger refund logic.
- [ ] **Fully autonomous machine management** — Enable machines to self-manage their entire lifecycle without human intervention: auto-adjust pricing based on market demand and material costs. The Soroban contract already supports the primitives (`update_price`, `set_availability`, `complete_maintenance`); the next step is an on-device agent loop that monitors sensor telemetry and makes these decisions in real-time.
- [ ] **Full USDC SAC integration** — Configure the contract's `TokenAddress` to the official USDC Stellar Asset Contract on mainnet.
- [ ] **Mainnet deployment** — Move Soroban contracts from Testnet to Production.

---

## Using NextForge from Agent Frameworks (CrewAI / OpenCrew)

NextForge exposes its capabilities via the **Model Context Protocol (MCP)**, which means any agent framework that supports MCP tool-calling can interact with the manufacturing network natively.

### CrewAI / OpenCrew Integration

```python
# Example: CrewAI agent that discovers machines and negotiates a manufacturing job

from crewai import Agent, Task, Crew
from crewai_tools import MCPTool

# Point to the running NextForge MCP server
nextforge_discover = MCPTool(
    server_command="node /path/to/nextforge/backend/dist/mcp.js",
    tool_name="nextforge_discover_machines",
    description="Scan the NextForge network for available manufacturing nodes"
)

nextforge_pay = MCPTool(
    server_command="node /path/to/nextforge/backend/dist/mcp.js",
    tool_name="nextforge_negotiate_and_pay",
    description="Negotiate with a machine agent and pay via Soroban escrow"
)

# Define the autonomous buyer agent
buyer_agent = Agent(
    role="Manufacturing Procurement Agent",
    goal="Find the best machine on NextForge for a given job and pay for it autonomously",
    backstory="You are an AI procurement specialist that uses the NextForge protocol to find and pay physical machines.",
    tools=[nextforge_discover, nextforge_pay],
    verbose=True
)

# Define the task
manufacturing_task = Task(
    description="I need 10 custom PLA brackets printed. Find an FDM machine with reputation > 70 and price under 0.01 USDC/cycle. Negotiate and pay.",
    agent=buyer_agent,
    expected_output="Transaction hash confirming escrow payment on Stellar Testnet"
)

# Run
crew = Crew(agents=[buyer_agent], tasks=[manufacturing_task])
result = crew.kickoff()
print(result)
```

### Available MCP Tools

| Tool | Description | Inputs |
|---|---|---|
| `nextforge_discover_machines` | Returns JSON array of all machines on the network with type, price, reputation, materials, and location | None |
| `nextforge_negotiate_and_pay` | Contacts a machine agent, locks funds in Soroban escrow, and dispatches the job to hardware | `machine_id` (string), `job_payload` (string) |

### Connecting via MCP Config (Claude Desktop / Cursor)

Add this to your MCP configuration file:

```json
{
  "mcpServers": {
    "nextforge": {
      "command": "node",
      "args": ["/path/to/nextforge/backend/dist/mcp.js"],
      "env": {
        "DEPLOYER_SECRET_KEY": "S...",
        "SOROBAN_CONTRACT_ID": "C...",
        "GEMINI_API_KEY": "..."
      }
    }
  }
}
```

Once configured, any MCP-compatible agent (Claude, Cursor, OpenCrew, or custom) can autonomously discover machines, evaluate jobs, and execute payments on the Stellar network.
