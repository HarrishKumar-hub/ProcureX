# ProcureX Backend Architecture (MVP)

ProcureX is implemented as a modular TypeScript Node.js REST backend with in-memory repositories.

## Structure

- `src/domain/`: Core domain models and repository interfaces.
- `src/repositories/`: In-memory repository implementations (replaceable with PostgreSQL later).
- `src/services/`: Business logic
  - `economic-policy-engine.ts`: deterministic policy/risk decision engine
  - `task-relevance.ts`: deterministic relevance scorer with interface for future LLM scorer plug-in
  - `evaluation-service.ts`: orchestration across repositories + engine
  - `payment-executor.ts`: generic payment execution abstraction
  - `payment-orchestrator.ts`: policy-first execution coordinator
  - `x402-payment-executor.ts`: Algorand x402 adapter (config-gated)
- `src/api/`: HTTP routes/handlers (no embedded policy logic).
- `src/data/demo-data.ts`: hackathon demo seeds.
- `src/app-context.ts`: dependency wiring and seed loading.
- `src/app.ts` + `src/server.ts`: express app bootstrap.
- `tests/`: policy engine unit tests.

## Decision Flow

1. API receives payment evaluation or execute request.
2. Evaluation service loads task, agent, policy, provider, recent transaction history.
3. Economic policy engine computes risk signals:
   - budget risk
   - provider trust
   - price anomaly
   - transaction behavior
   - service-policy violations
   - task relevance
4. Engine emits `Decision` (`APPROVE|BLOCK|REVIEW`) + `RiskAssessment` with reasons.
5. Decision and payment request are recorded in-memory.
6. For `/payment-requests/execute`:
   - `BLOCK` / `REVIEW`: orchestrator returns `NOT_EXECUTED`, executor is never called.
   - `APPROVE`: orchestrator calls `PaymentExecutor`.
7. Task spending is updated only after successful payment settlement (`PAID`) in execute mode.

## Payment Layers

1. **ProcureX policy layer** (`EconomicPolicyEngine`): Determines if payment should be authorized.
2. **Payment orchestrator** (`PaymentOrchestrator`): Enforces policy-first sequencing.
3. **Payment executor abstraction** (`PaymentExecutor`): Interface for execution backends.
4. **x402 adapter** (`X402PaymentExecutor`): Integrates official Algorand x402 client flow.
5. **Algorand settlement boundary**: Real on-chain settlement is external to ProcureX and only invoked after policy `APPROVE`.

## Security Boundary

AI/LLM → **Recommendation**

ProcureX Policy Engine → **Authorization**

x402 Payment Executor → **Payment**

The LLM is never trusted to authorize money movement. Authorization remains deterministic and policy-governed.

## Replaceability

Repository interfaces isolate persistence concerns so in-memory stores can later be swapped with PostgreSQL-backed adapters without changing policy logic or HTTP API behavior.
