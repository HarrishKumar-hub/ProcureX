import { Agent, EconomicPolicy, Provider, Task } from "../domain/types";

export const demoPolicy: EconomicPolicy = {
  id: "policy-security-default",
  maxTaskBudget: 0.2,
  maxTransactionAmount: 0.05,
  minProviderTrust: 90,
  maxPriceMultiplier: 5,
  allowedServiceCategories: [
    "threat_intelligence",
    "ip_reputation",
    "malware_analysis"
  ],
  requireHumanApprovalAbove: 0.05,
  maxTransactionsPerMinute: 10
};

export const demoAgent: Agent = {
  id: "agent-security-01",
  name: "SecurityAgent-01",
  description: "Autonomous security investigation agent for incident triage.",
  walletAddress: undefined,
  policyId: demoPolicy.id,
  status: "ACTIVE"
};

export const demoTasks: Task[] = [
  {
    id: "task-001",
    agentId: demoAgent.id,
    userIntent: "Investigate suspicious login activity and related threat indicators.",
    taskCategory: "security_incident_response",
    budget: 0.2,
    spent: 0,
    status: "OPEN"
  },
  {
    id: "task-002",
    agentId: demoAgent.id,
    userIntent: "Analyze suspicious binary and identify malware family associations.",
    taskCategory: "malware_triage",
    budget: 0.2,
    spent: 0,
    status: "OPEN"
  }
];

export const demoProviders: Provider[] = [
  {
    id: "provider-threatintel",
    name: "ThreatIntel-X",
    serviceCategory: "threat_intelligence",
    trustScore: 96,
    reputationScore: 93,
    historicalAveragePrice: 0.02,
    currentPrice: 0.02,
    successRate: 0.98,
    status: "ACTIVE"
  },
  {
    id: "provider-ip-reputation",
    name: "IP-Reputation-X",
    serviceCategory: "ip_reputation",
    trustScore: 94,
    reputationScore: 90,
    historicalAveragePrice: 0.01,
    currentPrice: 0.01,
    successRate: 0.97,
    status: "ACTIVE"
  },
  {
    id: "provider-suspicious-threatintel",
    name: "SuspiciousProvider-X",
    serviceCategory: "threat_intelligence",
    trustScore: 42,
    reputationScore: 40,
    historicalAveragePrice: 0.02,
    currentPrice: 2,
    successRate: 0.45,
    status: "ACTIVE"
  }
];
