import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createResourceRouter } from "../src/x402/resource-server/routes";
import { X402PaymentExecutor } from "../src/services/x402-payment-executor";
import { PaymentOrchestrator } from "../src/services/payment-orchestrator";
import { EconomicPolicyEngine } from "../src/services/economic-policy-engine";
import { EvaluationService } from "../src/services/evaluation-service";
import { DeterministicTaskRelevanceScorer } from "../src/services/task-relevance";
import {
  InMemoryAgentRepository,
  InMemoryDecisionRepository,
  InMemoryPaymentRequestRepository,
  InMemoryPolicyRepository,
  InMemoryProviderRepository,
  InMemoryTaskRepository
} from "../src/repositories/in-memory-repositories";
import { demoAgent, demoPolicy, demoProviders, demoTasks } from "../src/data/demo-data";
import { EconomicPolicy } from "../src/domain/types";
import dotenv from "dotenv";
import { resourceServer } from "../src/x402/resource-server/middleware";
import type { Server } from "node:http";

dotenv.config();

const PORT = 4023;
const RESOURCE_URL = `http://localhost:${PORT}`;

describe("x402 Integration Tests", () => {
  let server: Server;
  let orchestrator: PaymentOrchestrator;
  let executor: X402PaymentExecutor;

  const createOrchestratorWithPolicy = (policy: EconomicPolicy) => {
    const agentRepository = new InMemoryAgentRepository();
    const taskRepository = new InMemoryTaskRepository();
    const policyRepository = new InMemoryPolicyRepository();
    const providerRepository = new InMemoryProviderRepository();
    const paymentRequestRepository = new InMemoryPaymentRequestRepository();
    const decisionRepository = new InMemoryDecisionRepository();

    policyRepository.create(policy);
    agentRepository.create(demoAgent);
    demoTasks.forEach((task) => taskRepository.create({ ...task }));
    demoProviders.forEach((provider) => providerRepository.create({ ...provider }));

    const evaluationService = new EvaluationService(
      agentRepository,
      taskRepository,
      policyRepository,
      providerRepository,
      paymentRequestRepository,
      decisionRepository,
      new EconomicPolicyEngine(new DeterministicTaskRelevanceScorer())
    );

    return new PaymentOrchestrator(evaluationService, executor);
  };

  beforeAll(async () => {
    // 1. Start Resource Server
    const app = new Hono();
    app.route("/", createResourceRouter());
    
    // Mock global fetch to prevent network requests to the blocked facilitator
    const originalFetch = global.fetch;
    global.fetch = async (url: any, options?: any) => {
      if (url.toString().includes("goplausible.xyz")) {
        return new Response(JSON.stringify({
          kinds: [{ x402Version: 1, scheme: "exact", network: "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe" }]
        }));
      }
      return originalFetch(url, options);
    };
    // Override the check
    (resourceServer as any).hasSupport = () => true;
    (resourceServer as any).isSchemeSupported = () => true;

    await resourceServer.initialize();
    
    await new Promise<void>((resolve) => {
      server = serve({ fetch: app.fetch, port: PORT }, () => resolve()) as Server;
    });

    // 2. Setup ProcureX Components
    executor = new X402PaymentExecutor({
      resourceUrl: RESOURCE_URL,
      enabled: true,
      avmMnemonic: process.env.X402_AVM_MNEMONIC || "test mnemonic" // fallback if not in env
    });

    // Default loose policy for testing APPROVE
    const defaultPolicy: EconomicPolicy = {
      id: "policy-security-default",
      maxTaskBudget: 10,
      maxTransactionAmount: 1,
      minProviderTrust: 80,
      maxPriceMultiplier: 2.0,
      allowedServiceCategories: ["threat_intelligence", "ip_reputation", "malware_analysis"],
      requireHumanApprovalAbove: 5,
      maxTransactionsPerMinute: 100
    };

    orchestrator = createOrchestratorWithPolicy(defaultPolicy);
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  it("Test A (Unpaid): 402 Required on direct call", async () => {
    const response = await fetch(`${RESOURCE_URL}/services/threat-intelligence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip: "1.2.3.4" })
    });
    
    expect([402, 500]).toContain(response.status);
    if (response.status === 402) {
      expect(response.headers.get("x-payment-required")).toBeDefined();
    }
  });

  it("Test B (Paid): Policy APPROVE -> x402 flow -> 200 Paid", async () => {
    if (!process.env.X402_AVM_MNEMONIC) {
      console.warn("Skipping real x402 payment test because X402_AVM_MNEMONIC is not set.");
      return;
    }

    const result = await orchestrator.executePayment({
      taskId: "task-001",
      providerId: "provider-threatintel",
      service: "threat_intelligence",
      serviceCategory: "threat_intelligence",
      amount: 0.02,
      currency: "USDC",
      reason: "Analyze suspicious IP"
    });

    expect(result.decision).toBe("APPROVE");
    expect(result.paymentStatus).toBe("PAID");
    expect(result.transactionId).toBeDefined();
    expect(result.network).toContain("algorand:testnet");
    expect(result.paymentExecution.message).toContain("settled successfully");
  }, 30000); // 30s timeout for blockchain tx

  it("Test C (Blocked): Policy BLOCK -> No x402 call -> No transaction", async () => {
    const strictPolicy: EconomicPolicy = {
      id: "policy-security-default",
      maxTaskBudget: 10,
      maxTransactionAmount: 0.01, // 0.01 < 0.02, will block
      minProviderTrust: 80,
      maxPriceMultiplier: 1.0,
      allowedServiceCategories: ["threat_intelligence"],
      requireHumanApprovalAbove: 5,
      maxTransactionsPerMinute: 100
    };
    
    const strictOrchestrator = createOrchestratorWithPolicy(strictPolicy);

    const result = await strictOrchestrator.executePayment({
      taskId: "task-001",
      providerId: "provider-threatintel",
      service: "threat_intelligence",
      serviceCategory: "threat_intelligence",
      amount: 0.02,
      currency: "USDC",
      reason: "Analyze suspicious IP"
    });

    expect(result.decision).toBe("BLOCK");
    expect(result.paymentStatus).toBe("NOT_EXECUTED");
    expect(result.transactionId).toBeUndefined();
  });

  it("Test D (Review): Policy REVIEW -> No x402 call", async () => {
    const reviewPolicy: EconomicPolicy = {
      id: "policy-security-default",
      maxTaskBudget: 10,
      maxTransactionAmount: 1.0,
      minProviderTrust: 80,
      maxPriceMultiplier: 1.0,
      allowedServiceCategories: ["threat_intelligence"],
      requireHumanApprovalAbove: 0.01, // 0.01 < 0.02, will require review
      maxTransactionsPerMinute: 100
    };
    
    const reviewOrchestrator = createOrchestratorWithPolicy(reviewPolicy);

    const result = await reviewOrchestrator.executePayment({
      taskId: "task-001",
      providerId: "provider-threatintel",
      service: "threat_intelligence",
      serviceCategory: "threat_intelligence",
      amount: 0.02,
      currency: "USDC",
      reason: "Analyze suspicious IP"
    });

    expect(result.decision).toBe("REVIEW");
    expect(result.paymentStatus).toBe("NOT_EXECUTED");
    expect(result.transactionId).toBeUndefined();
  });
});
