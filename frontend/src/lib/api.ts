export interface ProviderMetadata {
  id: string;
  name: string;
  serviceCategory: string;
  trustScore: number;
  reputationScore: number;
  historicalAveragePrice: number;
  currentPrice: number;
  successRate: number;
  status: string;
}

export interface OrchestrationResult {
  taskId: string;
  status: string;
  budget: number;
  totalSpent: number;
  stepsExecuted: Array<{
    category: string;
    providerId: string;
    cost: number;
    result: any;
  }>;
  securityIncidentsBlocked: Array<{
    providerId: string;
    reason: string;
    amount?: number;
  }>;
  finalReport: {
    targetIp: string;
    verdict: string;
    riskScore: number;
    findings: string[];
  };
}

export async function runInvestigation(targetIp: string, budget: number, simulateAttack: boolean): Promise<OrchestrationResult> {
  const response = await fetch("/api-proxy/agent/investigate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userIntent: `Investigate suspicious IP ${targetIp}`,
      targetIp,
      budget,
      simulateAttack
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to run investigation");
  }

  return response.json();
}
