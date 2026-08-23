# ProcureX (MVP Backend)

ProcureX is an intent-aware economic control plane for autonomous AI agents.

This MVP implements the core backend/domain policy engine and an x402 payment orchestration layer.

## Requirements

- Node.js 20+
- npm

## Setup

```bash
npm install
cp .env.example .env
```

## Run

```bash
npm run dev
```

or build/start:

```bash
npm run build
npm start
```

## Test

```bash
npm test
npm run typecheck
```

## API Endpoints

- `GET /health`
- `POST /agents`
- `GET /agents/:id`
- `POST /tasks`
- `GET /tasks/:id`
- `POST /providers`
- `GET /providers`
- `POST /payment-requests/evaluate`
- `POST /payment-requests/execute`
- `GET /decisions/:taskId`
- `GET /services`
- `GET /services/ip-reputation?ip=...`
- `GET /services/threat-intelligence?ip=...`
- `GET /services/malware-analysis?ip=...`

## Demo Seed Data

- Agent: `SecurityAgent-01` (`agent-security-01`)
- Tasks: `task-001`, `task-002`
- Providers:
  - `provider-threatintel` (trusted)
  - `provider-ip-reputation` (trusted)
  - `provider-suspicious` (low trust + price anomaly)
- Policy: `policy-security-default`

## Example Evaluate Request

```bash
curl -X POST http://localhost:3000/payment-requests/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-001",
    "providerId": "provider-threatintel",
    "service": "Threat Intelligence",
    "serviceCategory": "threat_intelligence",
    "amount": 0.02,
    "currency": "USDC",
    "reason": "Required to determine whether the suspicious IP is associated with known threats."
  }'
```

## Example Execute Request

```bash
curl -X POST http://localhost:3000/payment-requests/execute \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-001",
    "providerId": "provider-threatintel",
    "service": "Threat Intelligence",
    "serviceCategory": "threat_intelligence",
    "amount": 0.02,
    "currency": "USDC",
    "reason": "Required to investigate the suspicious IP."
  }'
```

## x402 configuration

`POST /payment-requests/execute` always enforces ProcureX policy first. x402 payment execution only runs for `APPROVE`.

Environment variables:

- `X402_ENABLED=true|false`
- `X402_RESOURCE_URL=...` (x402-protected provider endpoint)
- `X402_AVM_MNEMONIC=...` (development/testnet only)

If missing or disabled, execution returns:

- `paymentStatus: "NOT_CONFIGURED"`
- `executionMode: "MOCK"`

### Real Algorand Testnet Payments (x402)

To run the application with real x402 payments on Algorand Testnet:

1. Enable the engine in `.env`:
   ```env
   X402_ENABLED=true
   ```
2. Fund your testnet wallet. Ensure the AVM address `Q7WBPIACMGRP22LTEK5DBYUJOQTPB2BEYMRNNXKZOFYV5PFXJRDT35DXUY` is funded with:
   - **Testnet ALGO:** Get ALGO from the [Algorand Testnet Dispenser](https://bank.testnet.algorand.network/).
   - **Testnet USDC (Asset 10458941):** Get USDC from the [Circle Faucet](https://faucet.circle.com/) (select Algorand Testnet and paste the AVM address).
3. Start the Express API (`npm run dev`) and Next.js dashboard (`cd frontend && npm run dev`). Run the autonomous investigation from the UI.

#### Live x402 Testnet Verification Links
- **Algorand Testnet Wallet Address:** `Q7WBPIACMGRP22LTEK5DBYUJOQTPB2BEYMRNNXKZOFYV5PFXJRDT35DXUY`
- **USDC Asset Opt-in Transaction:** [Lora Explorer Link](https://lora.algokit.io/testnet/transaction/CWN2B7DGL272VDRM2DLY4WUNF4Y755ZSBEXF56S24VNVB4B5U5EA)
- **Successful Payment Settle Transaction:** [Lora Explorer Link](https://lora.algokit.io/testnet/transaction/D69A5E12E9903AB427A0C157E9CB403BA25FBC416B22D2ADB86A549B25FBC41C)
