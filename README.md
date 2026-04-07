# NextForge 🏭🤖

**A decentralized protocol where AI agents autonomously discover, negotiate, and pay physical machines for manufacturing services — powered by x402 micropayments on Stellar.**

NextForge connects cloud-based AI agents directly to real physical hardware (3D printers, CNCs, laser cutters) through a trustless economic layer. Using Stellar's **x402 protocol** and **Soroban smart contracts**, machines become autonomous economic actors: they list capabilities, set prices, evaluate incoming jobs with onboard AI, and get paid in stablecoin — all without human intervention.

Agents pay agents. Machines earn revenue. Humans set the rules and collect the profits.

---

## How It Works

### The Problem
AI agents can reason, plan, and act — right up until they need to pay. Today, if an agent needs something physically manufactured, a human must manually find a vendor, negotiate pricing, arrange payment, and monitor production. This bottleneck breaks the promise of autonomous AI.

### The Solution
NextForge removes the human from the loop using **x402 on Stellar**:

1. **A buyer's AI agent** searches the NextForge network for machines that match a manufacturing request (material, capability, location, price).
2. **The protocol** presents an HTTP `402 Payment Required` barrier — the agent must pay a micro-fee ($0.001 USDC via Stellar) to access the machine's evaluation endpoint.
3. **The machine's onboard AI agent** (powered by Gemini) evaluates whether the job is physically feasible and safe for its hardware.
4. **If approved**, the payment is settled on-chain via Soroban, and the job payload is dispatched directly to the physical machine over USB/Serial.
5. **The machine executes**, reports completion, and the escrowed funds are released to the hardware owner's wallet.

All of this happens without a single human click.

---

## Architecture

```
┌─────────────────┐     x402 Payment      ┌──────────────────┐
│  Buyer AI Agent  │ ──────────────────▶   │  NextForge Node  │
│  (Claude / MCP)  │ ◀────────────────── │  (Protocol Router) │
└─────────────────┘     Job Approved       └────────┬─────────┘
                                                    │
                                           ┌────────▼─────────┐
                                           │   Stellar Soroban │
                                           │   (Smart Contract) │
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

- **Frontend:** React + Vite. Dashboard for machine owners to register hardware using Freighter wallet signatures, monitor fleet status, and visualize network economics.
- **Backend:** Express + SQLite. Protocol relay that routes agent requests, enforces x402 payment gates via `@x402/express`, and coordinates Gemini-powered machine audits.
- **Hardware Agent:** Standalone Python script using `pyserial`. Runs on the machine owner's hardware. Polls for paid jobs and sends G-Code commands directly to the printer via Serial.
- **MCP Server:** Model Context Protocol integration. Any compatible LLM agent can natively call `nextforge_discover_machines` and `nextforge_negotiate_and_pay` as built-in tools.

---

## Stellar Integration

NextForge interacts with Stellar Testnet in several real, verifiable ways:

| Feature | How Stellar is used |
|---|---|
| **Machine Registration** | Owner signs a Soroban `register_machine` contract call via Freighter. Real on-chain transaction. |
| **Machine Verification** | Backend invokes `verify_machine` on Soroban using the admin keypair from `DEPLOYER_SECRET_KEY`. |
| **x402 Payment Gates** | Protected API endpoints return HTTP 402 and require USDC micropayment settlement through the x402 facilitator before granting access. |
| **Agent Micropayments (MCP)** | When an LLM agent calls `nextforge_negotiate_and_pay`, the MCP server builds, signs, and submits a real XLM payment to the machine owner's address using `@stellar/stellar-sdk`. |

---

## What's Real vs. What's Mocked

Being transparent about the current state of the project:

| Component | Status |
|---|---|
| Freighter wallet signing | ✅ Real — opens Freighter, signs XDR, submits to Testnet |
| Soroban contract calls (register/verify) | ✅ Real — deployed on Testnet |
| x402 middleware on endpoints | ✅ Real — `@x402/express` enforces payment barriers |
| MCP agent-to-Stellar payment | ✅ Real — `@stellar/stellar-sdk` builds and submits transactions |
| Hardware USB/Serial bridge | ✅ Real — `pyserial` detects ports and sends G-Code |
| Soroban escrow release on job completion | 🔶 Simplified — completion is tracked in SQLite; full escrow/release contract logic is a next step |
| Soroban event indexing | 🔶 Placeholder — uses polling pattern, not a full indexer |

---

## Getting Started

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev

# Hardware Agent (new terminal, requires physical printer via USB)
cd scripts && pip install requests pyserial
python3 hardware_agent.py YOUR_MACHINE_ID
```

Requires a `.env` file in root with `DEPLOYER_SECRET_KEY`, `SOROBAN_CONTRACT_ID`, and `GEMINI_API_KEY`.

---

## Roadmap

- [ ] **Microcontroller support** — Replace Python scripts with native ESP32 firmware so machines can connect without a full computer attached.
- [ ] **Full Soroban escrow contracts** — On-chain escrow lock/release tied directly to hardware job completion signals.
- [ ] **Visual verification** — Add webcam-based defect detection so machine agents can autonomously halt failed prints and trigger refund logic.
- [ ] **Mainnet deployment** — Move Soroban contracts from Testnet to Production.
