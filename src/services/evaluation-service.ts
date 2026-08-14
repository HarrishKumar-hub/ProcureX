import {
  AgentRepository,
  DecisionRepository,
  PaymentRequestRepository,
  PolicyRepository,
  ProviderRepository,
  TaskRepository
} from "../domain/repositories";
import {
  EvaluatePaymentInput,
  EvaluationResult,
  PaymentRequest,
  Provider,
  Task
} from "../domain/types";
import { EconomicPolicyEngine, EvaluatePolicyOutput } from "./economic-policy-engine";

const createId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;

export class EvaluationService {
  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly taskRepository: TaskRepository,
    private readonly policyRepository: PolicyRepository,
    private readonly providerRepository: ProviderRepository,
    private readonly paymentRequestRepository: PaymentRequestRepository,
    private readonly decisionRepository: DecisionRepository,
    private readonly policyEngine: EconomicPolicyEngine
  ) {}

  evaluatePayment(input: EvaluatePaymentInput): EvaluationResult {
    const evaluated = this.evaluatePaymentDecision(input);

    this.recordPaymentEvaluation(evaluated.paymentRequest, evaluated.result);

    if (evaluated.result.decision.decision === "APPROVE") {
      this.incrementTaskSpend(evaluated.task, evaluated.paymentRequest.amount);
    }

    return {
      ...evaluated.result,
      explanation: this.buildExplanation(evaluated.result)
    };
  }

  evaluatePaymentDecision(input: EvaluatePaymentInput): {
    task: Task;
    provider: Provider;
    paymentRequest: PaymentRequest;
    result: EvaluatePolicyOutput;
  } {
    const task = this.taskRepository.getById(input.taskId);
    if (!task) {
      throw new Error(`Task not found: ${input.taskId}`);
    }

    const agent = this.agentRepository.getById(task.agentId);
    if (!agent) {
      throw new Error(`Agent not found for task: ${task.agentId}`);
    }

    const policy = this.policyRepository.getById(agent.policyId);
    if (!policy) {
      throw new Error(`Policy not found: ${agent.policyId}`);
    }

    const provider = this.providerRepository.getById(input.providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${input.providerId}`);
    }

    const paymentRequest: PaymentRequest = {
      id: createId("payment"),
      taskId: input.taskId,
      providerId: input.providerId,
      service: input.service,
      serviceCategory: input.serviceCategory,
      amount: input.amount,
      currency: input.currency,
      reason: input.reason,
      timestamp: new Date().toISOString()
    };

    const recentTransactions = this.getRecentAgentTransactions(agent.id);

    const result = this.policyEngine.evaluate({
      task,
      policy,
      paymentRequest,
      provider,
      currentTaskSpending: task.spent,
      recentTransactions
    });

    return { task, provider, paymentRequest, result };
  }

  recordPaymentEvaluation(paymentRequest: PaymentRequest, result: EvaluatePolicyOutput): void {
    this.paymentRequestRepository.create(paymentRequest);
    this.decisionRepository.create(result.decision);
  }

  incrementTaskSpend(task: Task, amount: number): Task {
    return this.taskRepository.update({
      ...task,
      spent: Number((task.spent + amount).toFixed(6))
    });
  }

  listDecisionsByTaskId(taskId: string) {
    return this.decisionRepository.listByTaskId(taskId);
  }

  private getRecentAgentTransactions(agentId: string): PaymentRequest[] {
    return this.paymentRequestRepository.list().filter((request) => {
      const task = this.taskRepository.getById(request.taskId);
      return task?.agentId === agentId;
    });
  }

  private buildExplanation(result: EvaluatePolicyOutput): string {
    const outcome = result.decision.decision;
    if (outcome === "APPROVE") {
      return "Payment approved because the service is relevant to the task, provider trust is above policy minimum, price is within normal range, and the payment is within budget.";
    }

    if (outcome === "REVIEW") {
      return "Payment requires human review due to policy or risk signals that are not severe enough for an automatic block.";
    }

    return "Payment blocked due to high-confidence policy violations or risk anomalies.";
  }
}
