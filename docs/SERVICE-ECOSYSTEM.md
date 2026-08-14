# ProcureX Service Ecosystem (Phase 3)

## 1. ProcureX as buyer

ProcureX evaluates whether a payment should be authorized (`APPROVE | BLOCK | REVIEW`) before any payment execution path is invoked.

## 2. Providers as sellers

This phase introduces local demonstration sellers that expose paid-service style endpoints:

- `GET /services/ip-reputation`
- `GET /services/threat-intelligence`
- `GET /services/malware-analysis`

These providers are deterministic mock services and do not claim real-world security intelligence.

## 3. Provider discovery

Provider discovery is handled by [ProviderDiscoveryService](/Users/harrishkumar/hackathon/src/services/provider-discovery-service.ts), not HTTP routes.

Responsibilities:

- list providers
- filter by category
- rank providers with simple compatibility heuristics

## 4. Provider metadata

Each provider implements [PaidServiceProvider](/Users/harrishkumar/hackathon/src/providers/provider-types.ts) and exposes metadata compatible with the existing `Provider` domain model:

- `id`
- `name`
- `serviceCategory`
- `trustScore`
- `historicalAveragePrice`
- `currentPrice`
- `price`
- `currency`
- `endpoint`
- `description`

## 5. Pricing

- IP Reputation: `0.01 USDC`
- Threat Intelligence: `0.02 USDC`
- Malware Analysis: `0.03 USDC`

## 6. Trust score

Legitimate providers are configured with high trust scores for normal-path demos.

## 7. Suspicious provider

`provider-suspicious-threatintel` is intentionally abnormal:

- `trustScore: 42`
- `historicalAveragePrice: 0.02`
- `currentPrice: 2.00` (100x multiplier)

This provider is included for ProcureX risk/attack simulation and is kept separate from legitimate providers.

## 8. Path to x402 resource servers (Phase 4)

Current endpoints are local deterministic providers. In Phase 4, each provider route can be wrapped with official x402 server middleware (per Algorand docs stack using `@x402/hono`, `@x402/core/server`, and `@x402/avm` exact scheme) so each route returns `402 Payment Required` until paid.

That future change should preserve:

- policy-first authorization in ProcureX
- separated payment execution layer
- explicit distinction between authorization and settlement
