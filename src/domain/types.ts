export type AgentStatus = "ACTIVE" | "PAUSED" | "DISABLED";
export type TaskStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
export type ProviderStatus = "ACTIVE" | "SUSPENDED";
export type DecisionType = "APPROVE" | "BLOCK" | "REVIEW";

export interface Agent {
  id: string;
  name: string;
  description: string;
  walletAddress?: string;
  policyId: string;
  status: AgentStatus;
}

export interface Task {
  id: string;
  agentId: string;
  userIntent: string;
  taskCategory: string;
  budget: number;
  spent: number;
  status: TaskStatus;
}

export interface EconomicPolicy {
  id: string;
  maxTaskBudget: number;
  maxTransactionAmount: number;
  minProviderTrust: number;
  maxPriceMultiplier: number;
  allowedServiceCategories: string[];
  requireHumanApprovalAbove: number;
  maxTransactionsPerMinute: number;
}

export interface Provider {
  id: string;
  name: string;
  serviceCategory: string;
  trustScore: number;
  reputationScore: number;
  historicalAveragePrice: number;
  currentPrice: number;
  successRate: number;
  status: ProviderStatus;
}

export interface PaymentRequest {
  id: string;
  taskId: string;
  providerId: string;
  service: string;
  serviceCategory: string;
  amount: number;
  currency: string;
  reason: string;
  timestamp: string;
}

export interface RiskAssessment {
  paymentRequestId: string;
  taskRelevanceScore: number;
  providerTrustScore: number;
  priceRiskScore: number;
  budgetRiskScore: number;
  behaviorRiskScore: number;
  policyViolationScore: number;
  overallRiskScore: number;
  reasons: string[];
}

export interface Decision {
  paymentRequestId: string;
  taskId: string;
  decision: DecisionType;
  reasons: string[];
  createdAt: string;
}

export interface EvaluationResult {
  decision: Decision;
  riskAssessment: RiskAssessment;
  explanation: string;
}

export interface NewAgentInput extends Omit<Agent, "id"> {
  id?: string;
}

export interface NewTaskInput extends Omit<Task, "id" | "spent" | "status"> {
  id?: string;
  spent?: number;
  status?: TaskStatus;
}

export interface NewProviderInput extends Omit<Provider, "id"> {
  id?: string;
}

export interface EvaluatePaymentInput {
  taskId: string;
  providerId: string;
  service: string;
  serviceCategory: string;
  amount: number;
  currency: string;
  reason: string;
}

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "NOT_EXECUTED"
  | "NOT_CONFIGURED";

export type PaymentExecutionMode = "X402" | "MOCK";

export interface PaymentExecutionResult {
  paymentStatus: PaymentStatus;
  executionMode: PaymentExecutionMode;
  message: string;
  transactionId?: string;
  network?: string;
  providerResponse?: unknown;
}

export interface PolicyDecisionView {
  decision: DecisionType;
  reasons: string[];
  explanation: string;
  riskAssessment: RiskAssessment;
}

export interface PaymentExecutionView {
  paymentStatus: PaymentStatus;
  executionMode: PaymentExecutionMode;
  message: string;
  transactionId?: string;
  network?: string;
}

export interface PaymentOrchestrationResult {
  decision: DecisionType;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  providerId: string;
  amount: number;
  currency: string;
  riskAssessment: RiskAssessment;
  explanation: string;
  policyDecision: PolicyDecisionView;
  paymentExecution: PaymentExecutionView;
  providerResponse?: unknown;
}
