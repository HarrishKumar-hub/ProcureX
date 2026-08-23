# ProcureX: Autonomous Economic Control Plane for AI Agents

> **"Every team built a service that accepts x402 payments. ProcureX is the system that decides whether those payments should happen at all."**

ProcureX is an autonomous economic policy engine and governance control plane designed for AI agents operating in machine-to-machine micro-economies. Running live on **Algorand Testnet** via the **GoPlausible facilitator**, ProcureX ensures autonomous agents execute x402 payments safely, within strict policy boundaries, and with real-time risk evaluation.

---

## Live Deployments & Provenance

- **Live Web Application (Vercel):** [https://procure-x-mu.vercel.app](https://procure-x-mu.vercel.app)
- **Live Control Plane API (Render):** [https://procurex-backend-2xox.onrender.com](https://procurex-backend-2xox.onrender.com)
- **Verified Algorand Testnet Settlement (`ip_reputation`):** [https://lora.algokit.io/testnet/transaction/GUZH2KVDK25DZ2PWK7OE2ZRNXKZKMRNR7KJCTXDQ5WE2T3FECI4A](https://lora.algokit.io/testnet/transaction/GUZH2KVDK25DZ2PWK7OE2ZRNXKZKMRNR7KJCTXDQ5WE2T3FECI4A)
- **Verified Algorand Testnet Settlement (`threat_intelligence`):** [https://lora.algokit.io/testnet/transaction/AQFZHZFTPOWLO6LA5ZT55ATRF6ENZXHCELAX47U7FZKIQCKX55SA](https://lora.algokit.io/testnet/transaction/AQFZHZFTPOWLO6LA5ZT55ATRF6ENZXHCELAX47U7FZKIQCKX55SA)

---

## 1. Problem Statement

As AI agents transition from text-generating assistants into autonomous economic actors authorized to spend funds, a critical governance vacuum emerges:

- **Unchecked Financial Vulnerability:** HTTP 402 protocols enable agents to pay for API data instantly without human approval. However, agents lack inherent risk judgment.
- **Price Gouging Attacks:** Malicious API sellers can register endpoints charging 100x markups (e.g., $2.00 instead of $0.02 for micro-queries), instantly draining agent treasuries.
- **Runaway Loops & Untrusted Providers:** Buggy agent retry loops or low-reputation providers can exhaust corporate budgets within minutes with zero accountability or audit trails.

**The Economic Attack Surface of Agentic AI:** Until ProcureX, there was no pre-execution firewall or policy control plane protecting agent treasuries from machine-to-machine financial exploits.

---

## 2. Use of x402 Protocol

ProcureX implements the **x402 protocol specification** (`@x402/fetch`, `@x402/avm`, `@x402/hono`) to enable native, frictionless machine-to-machine payments without traditional checkout flows, credit card entry, or human sign-off:

- **Pre-Settlement Header Negotiation:** When `SecurityAgent-01` requests a paid security endpoint, the seller agent responds with standard `HTTP 402 Payment Required` headers containing price, network, and token specifications.
- **Client-Side Authorization Handshake:** `ProcureX` wraps standard `fetch()` requests (`wrapFetchWithPayment`), intercepting 402 challenges and evaluating policy compliance *before* generating or signing payment payloads.
- **Zero-Friction Machine Commerce:** Eliminates subscription sign-ups and API key provisioning, allowing agents to discover and consume paid micro-services on-demand in milliseconds.

---

## 3. Use of Algorand Blockchain

ProcureX leverages **Algorand Testnet** and the **GoPlausible Facilitator** (`ZMFK4MQIFV2JICX372U5VAY35R626W32G2W5H4J335552AA`) as its underlying financial settlement engine:

- **Instant Finality & Sub-Cent Fees:** Algorand’s 2.8-second block finality and $0.001 transaction fees enable high-frequency micro-payments (e.g., $0.01 USDC queries) that are economically infeasible on higher-fee chains.
- **Standardized Asset Settlement (USDC ASA `10458941`):** Payments settle natively in testnet USDC using Algorand Standard Asset (ASA) exact transfer schemes.
- **GoPlausible Facilitator Architecture:** Ensures atomic verification where buyer payment signatures and seller data release occur trustlessly with verifiable transaction proofs (`TxID`) indexed on Lora Explorer.

```mermaid
flowchart TD
    User([User / Intent Input]) -->|1. Submit Task| Planner[Agent Planner & Discovery]
    Planner -->|2. Rank Providers| Engine[Economic Policy Engine]
    
    subgraph Risk Evaluation [Pre-Execution Risk Breakdown]
        Engine --> Check1{Trust Score ≥ 90?}
        Check1 -- Yes --> Check2{Price Multiplier ≤ 5x?}
        Check2 -- Yes --> Check3{Velocity ≤ 10/min?}
        Check1 -- No (Block) --> Fallback[Circuit Breaker & Fallback]
        Check2 -- No (Block $2.00 Gouging) --> Fallback
        Check3 -- No (Block) --> Fallback
    end
    
    Fallback -->|Retry Next Candidate| Engine
    Check3 -- Pass (Approved) --> X402[x402 AVM Payment Client]
    
    subgraph Algorand Settlement [On-Chain Execution]
        X402 -->|4. HTTP 402 + Payment-Required| Fac[GoPlausible Facilitator]
        Fac -->|5. Sign & Settle USDC| Algo[(Algorand Testnet)]
        Algo -->|6. Payment Verified| Resource[x402 Resource Server]
    end
    
    Resource -->|7. Fetch Real Threat Data| ThreatAPIs[AbuseIPDB / VirusTotal]
    ThreatAPIs -->|8. Return Security Findings| UI[Dashboard & Event Log UI]
```

---

## 4. Execution & Provenance

ProcureX is not a mock concept or theoretical whitepaper; it is a **fully deployed, verified end-to-end system**:

- **Real Security APIs:** Integrated with live AbuseIPDB (API v2) and VirusTotal (API v3) endpoints.
- **On-Chain Proofs:** All approved payments generate real, publicly verifiable Algorand Testnet transaction hashes (e.g., `GUZH2KV...`, `AQFZHZF...`).
- **Live Interactive Dashboard:** Next.js App Router UI featuring real-time Algonode indexer wallet tracking, Pera Wallet integration, live risk score stat chips, an interactive 100x Price Gouging Attack Simulator, and a live Provider Registry Leaderboard.
- **Robust Test Coverage:** 27 unit & integration tests covering policy evaluation, circuit breaking, fallback routing, and risk breakdown math (`npm run test`).

---

## 5. Innovation & Technical Differentiators

- **Pre-Execution Economic Firewall:** While traditional web security acts post-execution or at the network layer, ProcureX acts *before money moves on-chain*, intercepting HTTP 402 challenges pre-signature.
- **Deterministic 5-Check Policy Engine:**
  1. *Budget Guard:* Validates remaining task budget ($0.02 ≤ $0.20).
  2. *Single Transaction Cap:* Enforces maximum per-tx limits ($0.02 ≤ $0.05).
  3. *Trust Score Gate:* Enforces minimum provider reputation (≥90/100).
  4. *Price Anomaly Detection:* Blocks prices exceeding 5x historical average multiplier (e.g., blocking 100x gouging).
  5. *Task Relevance:* Matches requested service category against original task intent.
- **Self-Healing Circuit Breaker & Fallback:** When a malicious provider gets blocked, ProcureX trips the circuit breaker ($0 moved on-chain), logs the exploit, and automatically reroutes to the next best trusted candidate provider without crashing or requiring human intervention.

---

## 6. Market Potential & Future Vision

As the agentic AI economy expands, millions of autonomous software agents will hold crypto wallets and transact machine-to-machine.

- **Infrastructure, Not Just an Endpoint:** While other solutions build single paid endpoints (weather, AI generation), ProcureX builds the **foundational financial operating system** that every enterprise AI agent requires before accessing funds.
- **Enterprise Governance & Auditability:** Provides corporate treasuries with granular spending controls, role-based approval limits, and immutable on-chain audit trails.
- **Cross-Chain Expansion:** The ProcureX control plane architecture is protocol-agnostic, designed to extend across AVM, EVM, and Solana agent ecosystems as machine economies scale globally.

---

## Multi-Agent Roles & Inter-Agent Communication

ProcureX operates as a multi-agent system where distinct autonomous agents interact, evaluate risk, and communicate over HTTP 402 and Algorand Testnet:

### 1. Agent Roles & Identities

- **SecurityAgent-01 (`4U63RU...RM7I`) — The Buyer Agent:**
  An autonomous incident response agent responsible for executing investigations. It holds the buyer treasury in USDC and requests security capabilities.
- **ProcureX Policy Engine Agent — The Supervisory Risk Agent:**
  Sitting in front of the buyer wallet, this agent acts as an autonomous financial auditor. It intercepts every payment request pre-execution and enforces budget, trust, price anomaly, and velocity constraints.
- **Autonomous Fallback Orchestrator — The Recovery Agent:**
  When a malicious provider attempts price gouging, this agent trips the circuit breaker ($0 moved on-chain) and dynamically selects the next best trusted candidate provider to complete the task seamlessly.
- **Provider Service Agents (`Q7WBPI...DXUY`) — The Seller Endpoint Agents:**
  Independent service agents (`provider-ip-reputation` and `provider-threatintel`) registered on the GoPlausible Bazaar that expose x402-protected capabilities and deliver threat data upon receiving verified USDC payments.

### 2. How Agents Communicate & Settle Payments

```
[User Goal] → SecurityAgent-01 (Planner)
                  │
                  ▼ (1. Payment Request)
       ProcureX Policy Engine Agent
         ├── Check 1: Budget Guard (PASS)
         ├── Check 2: Single Tx Cap (PASS)
         ├── Check 3: Trust Score Gate (PASS)
         └── Check 4: Price Anomaly Cap (PASS)
                  │
                  ▼ (2. Pre-Execution Approval)
     x402 AVM Client + GoPlausible Facilitator
                  │
                  ▼ (3. HTTP 402 + Payment Settlement)
   Algorand Testnet (USDC Transfer: 4U63...RM7I → Q7WB...DXUY)
                  │
                  ▼ (4. Verified On-Chain Tx Proof)
      Provider Service Agent (Data Release)
```

1. **Intent-to-Plan Handshake:** `SecurityAgent-01` decomposes high-level user intent into capability requests (`ip_reputation` → `threat_intelligence`).
2. **Policy Evaluation Protocol:** `SecurityAgent-01` submits payment proposals to the `ProcureX Policy Engine`. The Policy Engine returns an `APPROVE`, `BLOCK`, or `REVIEW` decision.
3. **x402 Pre-Settlement Negotiations:** Upon `APPROVE`, the x402 AVM client requests the target endpoint. The Provider Service Agent responds with `HTTP 402 Payment Required` detailing the exact USDC requirement.
4. **On-Chain Settlement Handshake:** `SecurityAgent-01` signs an Algorand Testnet transaction transferred to the GoPlausible facilitator (`ZMFK4...552AA`). Once verified on-chain, the Provider Service Agent unlocks and returns threat payload data.

---

## Technical Stack

- **Blockchain & Micro-Payments:** Algorand Testnet, USDC (Asset `10458941`), `@x402/avm`, `@x402/fetch`, GoPlausible Facilitator (`ZMFK...2AA`).
- **Backend Control Plane:** TypeScript, Node.js, Express, Hono, Vitest.
- **Frontend Dashboard:** Next.js (App Router), Tailwind CSS, Lucide React, Algonode Indexer API.
- **Real Security APIs:** AbuseIPDB API v2, VirusTotal API v3, Shodan Host API.

---

## Local Environment & Setup

### Prerequisites
- Node.js `v20.x` or higher
- `npm`

### 1. Installation & Setup
```bash
git clone https://github.com/HarrishKumar-hub/ProcureX.git
cd ProcureX
npm install
```

Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development
X402_ENABLED=true
X402_RESOURCE_URL=http://localhost:3000
X402_AVM_MNEMONIC=fluid solar tail just expire spin crop purse foil custom chef define bench skull grant own prize key recipe rib above differ coconut absorb fork
ABUSEIPDB_API_KEY=5701024e0e629d37a6fa4cdecf6623f3695f438d357beee8e322ae750e7635867ac8de09dbdb5f74
VIRUSTOTAL_API_KEY=d2abe2a28194acc69a8aa82d2a51b78302c6e3e2e162d125ab46aeb303a90e69
SHODAN_API_KEY=OioGihq4TtaqMbTB0rRcVfiUhrironaC
```

### 2. Unit & Integration Test Suite
```bash
npm run test
```
*Executes all 27 unit & integration tests across policy evaluation, fallback routing, and risk breakdown.*

### 3. Backend Control Plane Server
```bash
npm run dev
```

### 4. Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3001` in your browser.
