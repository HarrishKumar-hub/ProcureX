import { describe, expect, it } from "vitest";
import { demoAgent, demoPolicy, demoProviders, demoTasks } from "../src/data/demo-data";
import {
  InMemoryAgentRepository,
  InMemoryDecisionRepository,
  InMemoryPaymentRequestRepository,
  InMemoryPolicyRepository,
  InMemoryProviderRepository,
  InMemoryTaskRepository
} from "../src/repositories/in-memory-repositories";
import { EconomicPolicyEngine } from "../src/services/economic-policy-engine";
import { EvaluationService } from "../src/services/evaluation-service";
import { PaymentExecutor } from "../src/services/payment-executor";
import { PaymentOrchestrator } from "../src/services/payment-orchestrator";
import { DeterministicTaskRelevanceScorer } from "../src/services/task-relevance";
import { PaymentExecutionResult, PaymentRequest } from "../src/domain/types";

class SpyPaymentExecutor implements PaymentExecutor {
  callCount = 0;

  constructor(private readonly result: PaymentExecutionResult) {}

  async execute(_request: PaymentRequest): Promise<PaymentExecutionResult> {
    this.callCount += 1;
    return this.result;
  }
}

const createOrchestrator = (executor: SpyPaymentExecutor) => {
  const agentRepository = new InMemoryAgentRepository();
  const taskRepository = new InMemoryTaskRepository();
  const policyRepository = new InMemoryPolicyRepository();
  const providerRepository = new InMemoryProviderRepository();
  const paymentRequestRepository = new InMemoryPaymentRequestRepository();
  const decisionRepository = new InMemoryDecisionRepository();

  policyRepository.create(demoPolicy);
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

  return {
    orchestrator: new PaymentOrchestrator(evaluationService, executor),
    taskRepository
  };
};

const baseInput = {
  taskId: "task-001",
  providerId: "provider-threatintel",
  service: "Threat Intelligence",
  serviceCategory: "threat_intelligence",
  amount: 0.02,
  currency: "USDC",
  reason: "Required for investigation."
};

describe("PaymentOrchestrator", () => {
  it("calls payment executor when policy approves", async () => {
    const executor = new SpyPaymentExecutor({
      paymentStatus: "PAID",
      executionMode: "X402",
      message: "ok",
      transactionId: "TX-1"
    });
    const { orchestrator } = createOrchestrator(executor);

    const result = await orchestrator.executePayment(baseInput);

    expect(result.decision).toBe("APPROVE");
    expect(result.paymentStatus).toBe("PAID");
    expect(executor.callCount).toBe(1);
  });

  it("does not call payment executor when policy blocks", async () => {
    const executor = new SpyPaymentExecutor({
      paymentStatus: "PAID",
      executionMode: "X402",
      message: "ok"
    });
    const { orchestrator } = createOrchestrator(executor);

    const result = await orchestrator.executePayment({
      ...baseInput,
      providerId: "provider-suspicious-threatintel",
      amount: 2
    });

    expect(result.decision).toBe("BLOCK");
    expect(result.paymentStatus).toBe("NOT_EXECUTED");
    expect(executor.callCount).toBe(0);
  });

  it("does not call payment executor when policy returns review", async () => {
    const executor = new SpyPaymentExecutor({
      paymentStatus: "PAID",
      executionMode: "X402",
      message: "ok"
    });
    const { orchestrator } = createOrchestrator(executor);

    const result = await orchestrator.executePayment({
      ...baseInput,
      amount: 0.06
    });

    expect(result.decision).toBe("REVIEW");
    expect(result.paymentStatus).toBe("NOT_EXECUTED");
    expect(executor.callCount).toBe(0);
  });

  it("returns failed status when executor fails", async () => {
    const executor = new SpyPaymentExecutor({
      paymentStatus: "FAILED",
      executionMode: "X402",
      message: "facilitator error"
    });
    const { orchestrator } = createOrchestrator(executor);

    const result = await orchestrator.executePayment(baseInput);

    expect(result.decision).toBe("APPROVE");
    expect(result.paymentStatus).toBe("FAILED");
    expect(executor.callCount).toBe(1);
  });

  it("returns paid status when executor succeeds", async () => {
    const executor = new SpyPaymentExecutor({
      paymentStatus: "PAID",
      executionMode: "X402",
      message: "settled",
      transactionId: "TX-SUCCESS"
    });
    const { orchestrator, taskRepository } = createOrchestrator(executor);

    const result = await orchestrator.executePayment(baseInput);
    const updatedTask = taskRepository.getById("task-001");

    expect(result.paymentStatus).toBe("PAID");
    expect(result.transactionId).toBe("TX-SUCCESS");
    expect(updatedTask?.spent).toBe(0.02);
  });

  it("keeps policy decision authoritative even with successful executor", async () => {
    const executor = new SpyPaymentExecutor({
      paymentStatus: "PAID",
      executionMode: "X402",
      message: "should not run"
    });
    const { orchestrator } = createOrchestrator(executor);

    const result = await orchestrator.executePayment({
      ...baseInput,
      providerId: "provider-suspicious-threatintel",
      amount: 2
    });

    expect(result.decision).toBe("BLOCK");
    expect(result.paymentStatus).toBe("NOT_EXECUTED");
    expect(executor.callCount).toBe(0);
  });
});
