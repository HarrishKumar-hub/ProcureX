import {
  EvaluatePaymentInput,
  PaymentExecutionView,
  PaymentOrchestrationResult,
  PolicyDecisionView
} from "../domain/types";
import { EvaluationService } from "./evaluation-service";
import { PaymentExecutor } from "./payment-executor";

export class PaymentOrchestrator {
  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly paymentExecutor: PaymentExecutor
  ) {}

  async executePayment(input: EvaluatePaymentInput): Promise<PaymentOrchestrationResult> {
    const evaluated = this.evaluationService.evaluatePaymentDecision(input);
    this.evaluationService.recordPaymentEvaluation(evaluated.paymentRequest, evaluated.result);

    const policyDecision: PolicyDecisionView = {
      decision: evaluated.result.decision.decision,
      reasons: evaluated.result.decision.reasons,
      explanation: this.buildExplanation(evaluated.result.decision.decision),
      riskAssessment: evaluated.result.riskAssessment
    };

    if (policyDecision.decision !== "APPROVE") {
      const paymentExecution: PaymentExecutionView = {
        paymentStatus: "NOT_EXECUTED",
        executionMode: "MOCK",
        message:
          policyDecision.decision === "BLOCK"
            ? "Payment was blocked by ProcureX policy controls; executor was not invoked."
            : "Payment requires human review before execution; executor was not invoked."
      };

      return {
        decision: policyDecision.decision,
        paymentStatus: paymentExecution.paymentStatus,
        providerId: input.providerId,
        amount: input.amount,
        currency: input.currency,
        riskAssessment: policyDecision.riskAssessment,
        explanation: policyDecision.explanation,
        policyDecision,
        paymentExecution
      };
    }

    const execution = await this.paymentExecutor.execute(evaluated.paymentRequest);

    if (execution.paymentStatus === "PAID") {
      this.evaluationService.incrementTaskSpend(evaluated.task, evaluated.paymentRequest.amount);
    }

    const paymentExecution: PaymentExecutionView = {
      paymentStatus: execution.paymentStatus,
      executionMode: execution.executionMode,
      message: execution.message,
      transactionId: execution.transactionId,
      network: execution.network
    };

    return {
      decision: policyDecision.decision,
      paymentStatus: execution.paymentStatus,
      transactionId: execution.transactionId,
      providerId: input.providerId,
      amount: input.amount,
      currency: input.currency,
      riskAssessment: policyDecision.riskAssessment,
      explanation: policyDecision.explanation,
      policyDecision,
      paymentExecution
    };
  }

  private buildExplanation(decision: "APPROVE" | "BLOCK" | "REVIEW"): string {
    if (decision === "APPROVE") {
      return "Policy approved payment request. Payment execution is delegated to the x402 executor.";
    }
    if (decision === "REVIEW") {
      return "Policy requires human approval before any payment execution.";
    }
    return "Policy blocked this payment request due to high-confidence risk or policy violations.";
  }
}
