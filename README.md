# ProcureX: Autonomous Economic Control Plane for AI Agents

> **"Every team built a service that accepts x402 payments. ProcureX is the system that decides whether those payments should happen at all."**

ProcureX is an autonomous economic policy engine and governance control plane designed for AI agents operating in machine-to-machine micro-economies. Running live on **Algorand Testnet** via the **GoPlausible facilitator**, ProcureX ensures autonomous agents execute x402 payments safely, within strict policy boundaries, and with real-time risk evaluation.

---

## 🚀 Live Deployments & Provenance

- 🌐 **Live Web Application (Vercel):** [https://procure-x-mu.vercel.app](https://procure-x-mu.vercel.app)
- ⚙️ **Live Control Plane API (Render):** [https://procurex-backend-2xox.onrender.com](https://procurex-backend-2xox.onrender.com)
- 🔗 **Verified Algorand Testnet Settlement (`ip_reputation`):** [https://lora.algokit.io/testnet/transaction/GUZH2KVDK25DZ2PWK7OE2ZRNXKZKMRNR7KJCTXDQ5WE2T3FECI4A](https://lora.algokit.io/testnet/transaction/GUZH2KVDK25DZ2PWK7OE2ZRNXKZKMRNR7KJCTXDQ5WE2T3FECI4A)
- 🔗 **Verified Algorand Testnet Settlement (`threat_intelligence`):** [https://lora.algokit.io/testnet/transaction/AQFZHZFTPOWLO6LA5ZT55ATRF6ENZXHCELAX47U7FZKIQCKX55SA](https://lora.algokit.io/testnet/transaction/AQFZHZFTPOWLO6LA5ZT55ATRF6ENZXHCELAX47U7FZKIQCKX55SA)

---

## 💡 Problem & Core Concept

As AI agents become autonomous economic actors authorized to spend funds, they face critical financial risks:
- **Price Gouging Attacks:** Malicious API providers charging 100x markups for micro-services.
- **Runaway Agent Loops:** Unchecked agent retries exhausting balances within minutes.
- **Untrusted Providers:** Low-reputation data sources draining agent treasuries without delivering value.

ProcureX solves this by introducing a **Pre-Execution Economic Control Plane**:

1. **Intent Parser & Planner:** Translates human intents (e.g. *"Investigate suspicious IP 185.220.101.1"*) into structured multi-step procurement plans (`ip_reputation` → `threat_intelligence`).
2. **Economic Policy Engine & Risk Breakdown:** Evaluates candidates against strict risk bounds *before* initiating any payment or network request:
   - **Trust Score Gate:** Provider trust score must exceed threshold (e.g. `≥90/100`).
   - **Price Anomaly Cap:** Current price cannot exceed historical average multiplier (e.g. `≤5x`).
   - **Velocity Limit:** Maximum request frequency (e.g. `≤10 tx/min`).
3. **Circuit Breaker & Autonomous Fallback:** If a provider fails policy evaluation (e.g., a $2.00 price-gouging attack), ProcureX blocks payment pre-execution and automatically fallback-routes to the next best trusted provider.
4. **Agent-to-Agent Reasoning Layer:** Once payment settles over x402, a secondary autonomous **ThreatIntel Analyst Agent (`threat-intel-analyst-v1`)** independently evaluates the raw security indicators and produces a confidence-scored assessment & recommendation (`ESCALATE`, `MONITOR`, `IGNORE`) — establishing a genuine autonomous agent-to-agent transaction over the x402 payment rail.

---

## 🏗️ Architecture & Policy Evaluation Flow

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

## 🛠️ Tech Stack

- **Blockchain & Micro-Payments:** Algorand Testnet, USDC (Asset `10458941`), `@x402/avm`, `@x402/fetch`, GoPlausible Facilitator (`ZMFK...2AA`).
- **Backend Service:** TypeScript, Node.js, Express, Hono, Vitest.
- **Frontend Dashboard:** Next.js (App Router), Tailwind CSS, Lucide React, Algonode Indexer API.
- **Real Security APIs:** AbuseIPDB API v2, VirusTotal API v3, Shodan Host API.

---

## 💻 Local Setup & Testing

### Prerequisites
- Node.js `v20.x` or higher
- `npm`

### 1. Installation & Environment
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

### 2. Run Test Suite
```bash
npm run test
```
*Executes all 27 unit & integration tests across policy evaluation, fallback routing, and risk breakdown.*

### 3. Run Local Development Server
```bash
npm run dev
```
The backend and x402 resource server will start unified on `http://localhost:3000`.

### 4. Run Frontend Dashboard Locally
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3001` in your browser.
