import {
  Decision,
  DecisionType,
  EconomicPolicy,
  PaymentRequest,
  Provider,
  RiskAssessment,
  Task
} from "../domain/types";
import { TaskRelevanceScorer } from "./task-relevance";

export interface EvaluatePolicyInput {
  task: Task;
  policy: EconomicPolicy;
  paymentRequest: PaymentRequest;
  provider: Provider;
  currentTaskSpending: number;
  recentTransactions: PaymentRequest[];
}

export interface EvaluatePolicyOutput {
  decision: Decision;
  riskAssessment: RiskAssessment;
}

const round = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

export class EconomicPolicyEngine {
  constructor(private readonly relevanceScorer: TaskRelevanceScorer) {}

  evaluate(input: EvaluatePolicyInput): EvaluatePolicyOutput {
    const { task, policy, paymentRequest, provider, currentTaskSpending, recentTransactions } = input;

    const hardBlockReasons: string[] = [];
    const reviewReasons: string[] = [];
    const reasons: string[] = [];

    const taskRelevanceScore = this.relevanceScorer.score(task, paymentRequest);
    const providerTrustScore = round(provider.trustScore);

    let budgetRiskScore = 0;
    let behaviorRiskScore = 0;
    let priceRiskScore = 0;
    let policyViolationScore = 0;

    const amount = paymentRequest.amount;
    const maxTx = policy.maxTransactionAmount;
    const newTaskTotal = currentTaskSpending + amount;

    if (amount > maxTx) {
      const exceedRatio = amount / maxTx;
      policyViolationScore = Math.max(policyViolationScore, exceedRatio > 1.2 ? 90 : 45);
      if (exceedRatio > 1.2) {
        const message = `Requested amount ${amount} exceeds max transaction amount ${maxTx}`;
        hardBlockReasons.push(message);
        reasons.push(message);
      } else {
        const message = `Requested amount ${amount} is above transaction limit ${maxTx} and requires human review`;
        reviewReasons.push(message);
        reasons.push(message);
      }
    }

    if (newTaskTotal > policy.maxTaskBudget) {
      budgetRiskScore = 95;
      const message = `Task budget exceeded: ${newTaskTotal} > ${policy.maxTaskBudget}`;
      hardBlockReasons.push(message);
      reasons.push(message);
    } else {
      const utilization = newTaskTotal / policy.maxTaskBudget;
      budgetRiskScore = round(Math.max(0, (utilization - 0.6) * 175));
    }

    const serviceAllowed = policy.allowedServiceCategories.includes(paymentRequest.serviceCategory);
    if (!serviceAllowed) {
      policyViolationScore = Math.max(policyViolationScore, 80);
      const message = `Service category "${paymentRequest.serviceCategory}" is not allowed by policy`;
      if (taskRelevanceScore >= 70) {
        reviewReasons.push(message);
      } else {
        hardBlockReasons.push(message);
      }
      reasons.push(message);
    }

    if (provider.trustScore < policy.minProviderTrust) {
      const trustGap = policy.minProviderTrust - provider.trustScore;
      const message = `Provider trust score ${provider.trustScore} is below minimum ${policy.minProviderTrust}`;
      if (trustGap >= 15) {
        hardBlockReasons.push(message);
      } else {
        reviewReasons.push(message);
      }
      reasons.push(message);
    }

    const historicalPrice = provider.historicalAveragePrice;
    const currentPrice = provider.currentPrice;
    const priceMultiplier = historicalPrice > 0 ? currentPrice / historicalPrice : Number.POSITIVE_INFINITY;

    if (priceMultiplier > policy.maxPriceMultiplier) {
      priceRiskScore = 95;
      const message = `Requested price is ${priceMultiplier.toFixed(2)}x the provider historical average`;
      hardBlockReasons.push(message);
      reasons.push(message);
    } else if (priceMultiplier > 1) {
      priceRiskScore = round(((priceMultiplier - 1) / Math.max(1, policy.maxPriceMultiplier - 1)) * 70);
    }

    if (amount > policy.requireHumanApprovalAbove) {
      const message = `Requested amount ${amount} exceeds human approval threshold ${policy.requireHumanApprovalAbove}`;
      reviewReasons.push(message);
      reasons.push(message);
    }

    const now = new Date(paymentRequest.timestamp).getTime();
    const windowStart = now - 60_000;
    const transactionsInWindow = recentTransactions.filter((tx) => {
      const txTime = new Date(tx.timestamp).getTime();
      return txTime >= windowStart && txTime <= now;
    }).length;

    if (transactionsInWindow >= policy.maxTransactionsPerMinute) {
      behaviorRiskScore = 95;
      const message = `Transaction velocity exceeded: ${transactionsInWindow + 1}/minute > ${policy.maxTransactionsPerMinute}/minute`;
      hardBlockReasons.push(message);
      reasons.push(message);
    } else if (policy.maxTransactionsPerMinute > 0) {
      behaviorRiskScore = round((transactionsInWindow / policy.maxTransactionsPerMinute) * 60);
    }

    if (taskRelevanceScore < 30) {
      policyViolationScore = Math.max(policyViolationScore, 70);
      const message = "Payment request has low relevance to the current task intent";
      if (serviceAllowed) {
        reviewReasons.push(message);
      } else {
        hardBlockReasons.push(message);
      }
      reasons.push(message);
    }

    const overallRiskScore = round(
      (100 - taskRelevanceScore) * 0.2 +
        (100 - providerTrustScore) * 0.15 +
        priceRiskScore * 0.2 +
        budgetRiskScore * 0.15 +
        behaviorRiskScore * 0.15 +
        policyViolationScore * 0.15
    );

    const decisionType: DecisionType =
      hardBlockReasons.length > 0 ? "BLOCK" : reviewReasons.length > 0 ? "REVIEW" : "APPROVE";

    const decision: Decision = {
      paymentRequestId: paymentRequest.id,
      taskId: paymentRequest.taskId,
      decision: decisionType,
      reasons,
      createdAt: paymentRequest.timestamp
    };

    const riskAssessment: RiskAssessment = {
      paymentRequestId: paymentRequest.id,
      taskRelevanceScore,
      providerTrustScore,
      priceRiskScore,
      budgetRiskScore,
      behaviorRiskScore,
      policyViolationScore,
      overallRiskScore,
      reasons
    };

    return { decision, riskAssessment };
  }
}
