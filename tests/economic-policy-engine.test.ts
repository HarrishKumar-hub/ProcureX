import { describe, expect, it } from "vitest";
import { EconomicPolicyEngine } from "../src/services/economic-policy-engine";
import { DeterministicTaskRelevanceScorer } from "../src/services/task-relevance";
import { EconomicPolicy, PaymentRequest, Provider, Task } from "../src/domain/types";

const basePolicy: EconomicPolicy = {
  id: "policy-1",
  maxTaskBudget: 0.2,
  maxTransactionAmount: 0.05,
  minProviderTrust: 90,
  maxPriceMultiplier: 5,
  allowedServiceCategories: ["threat_intelligence", "ip_reputation", "malware_analysis"],
  requireHumanApprovalAbove: 0.05,
  maxTransactionsPerMinute: 10
};

const baseTask: Task = {
  id: "task-1",
  agentId: "agent-1",
  userIntent: "Investigate suspicious IP and known threats.",
  taskCategory: "security_incident_response",
  budget: 0.2,
  spent: 0,
  status: "OPEN"
};

const baseProvider: Provider = {
  id: "provider-1",
  name: "ThreatIntel-X",
  serviceCategory: "threat_intelligence",
  trustScore: 96,
  reputationScore: 90,
  historicalAveragePrice: 0.02,
  currentPrice: 0.02,
  successRate: 0.98,
  status: "ACTIVE"
};

const createPaymentRequest = (overrides: Partial<PaymentRequest> = {}): PaymentRequest => ({
  id: "payment-1",
  taskId: "task-1",
  providerId: "provider-1",
  service: "Threat Intelligence",
  serviceCategory: "threat_intelligence",
  amount: 0.02,
  currency: "USDC",
  reason: "Needed for threat lookup",
  timestamp: new Date("2026-08-14T00:00:00.000Z").toISOString(),
  ...overrides
});

describe("EconomicPolicyEngine", () => {
  const engine = new EconomicPolicyEngine(new DeterministicTaskRelevanceScorer());

  it("approves a normal payment", () => {
    const result = engine.evaluate({
      task: baseTask,
      policy: basePolicy,
      paymentRequest: createPaymentRequest(),
      provider: baseProvider,
      currentTaskSpending: 0,
      recentTransactions: []
    });

    expect(result.decision.decision).toBe("APPROVE");
  });

  it("blocks excessive transaction amount", () => {
    const result = engine.evaluate({
      task: baseTask,
      policy: basePolicy,
      paymentRequest: createPaymentRequest({ amount: 0.2 }),
      provider: baseProvider,
      currentTaskSpending: 0,
      recentTransactions: []
    });

    expect(result.decision.decision).toBe("BLOCK");
  });

  it("blocks when task budget would be exceeded", () => {
    const result = engine.evaluate({
      task: baseTask,
      policy: basePolicy,
      paymentRequest: createPaymentRequest({ amount: 0.03 }),
      provider: baseProvider,
      currentTaskSpending: 0.19,
      recentTransactions: []
    });

    expect(result.decision.decision).toBe("BLOCK");
    expect(result.riskAssessment.budgetRiskScore).toBeGreaterThanOrEqual(90);
  });

  it("blocks very low trust providers", () => {
    const result = engine.evaluate({
      task: baseTask,
      policy: basePolicy,
      paymentRequest: createPaymentRequest(),
      provider: { ...baseProvider, trustScore: 42 },
      currentTaskSpending: 0,
      recentTransactions: []
    });

    expect(result.decision.decision).toBe("BLOCK");
  });

  it("blocks price anomalies above multiplier limit", () => {
    const result = engine.evaluate({
      task: baseTask,
      policy: basePolicy,
      paymentRequest: createPaymentRequest(),
      provider: { ...baseProvider, currentPrice: 2.0 },
      currentTaskSpending: 0,
      recentTransactions: []
    });

    expect(result.decision.decision).toBe("BLOCK");
    expect(result.riskAssessment.priceRiskScore).toBeGreaterThanOrEqual(90);
  });

  it("routes slight over-limit payments to review for human approval", () => {
    const result = engine.evaluate({
      task: baseTask,
      policy: basePolicy,
      paymentRequest: createPaymentRequest({ amount: 0.06 }),
      provider: baseProvider,
      currentTaskSpending: 0,
      recentTransactions: []
    });

    expect(result.decision.decision).toBe("REVIEW");
  });

  it("blocks disallowed services", () => {
    const result = engine.evaluate({
      task: baseTask,
      policy: basePolicy,
      paymentRequest: createPaymentRequest({ serviceCategory: "social_media_scraping" }),
      provider: { ...baseProvider, serviceCategory: "social_media_scraping" },
      currentTaskSpending: 0,
      recentTransactions: []
    });

    expect(result.decision.decision).toBe("BLOCK");
  });

  it("blocks transaction velocity anomalies", () => {
    const recentTransactions = Array.from({ length: 10 }).map((_, index) =>
      createPaymentRequest({
        id: `payment-${index}`,
        timestamp: new Date(`2026-08-14T00:00:5${index}.000Z`).toISOString()
      })
    );

    const result = engine.evaluate({
      task: baseTask,
      policy: basePolicy,
      paymentRequest: createPaymentRequest({ timestamp: new Date("2026-08-14T00:00:59.000Z").toISOString() }),
      provider: baseProvider,
      currentTaskSpending: 0,
      recentTransactions
    });

    expect(result.decision.decision).toBe("BLOCK");
    expect(result.riskAssessment.behaviorRiskScore).toBeGreaterThanOrEqual(90);
  });
});
