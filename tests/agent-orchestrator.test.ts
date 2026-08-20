import { describe, it, expect, beforeEach } from "vitest";
import { createAppContext } from "../src/app-context";
import { AgentOrchestrator } from "../src/services/agent-orchestrator";

describe("AgentOrchestrator Autonomous Multi-Step Flow", () => {
  let context: ReturnType<typeof createAppContext>;
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    context = createAppContext();
    orchestrator = context.agentOrchestrator;
  });

  it("Test 1: Normal autonomous flow completes with legitimate providers", async () => {
    const result = await orchestrator.executeInvestigation({
      userIntent: "Investigate suspicious IP",
      targetIp: "185.10.20.30",
      budget: 0.20,
      agentId: "agent-security-01"
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.stepsExecuted.length).toBe(2); // plan has 2 steps: ip_reputation & threat_intelligence
    expect(result.totalSpent).toBeGreaterThan(0);
    expect(result.securityIncidentsBlocked.length).toBe(0);
    expect(result.finalReport.verdict).toBe("BENIGN");
    expect(result.finalReport.findings).toHaveLength(2);
  });

  it("Test 2: Attack & Recovery flow — inject suspicious provider ($2.00) and verify fallback", async () => {
    // Elevate the suspicious provider's trust score in both the registry (for ranking) and the repository (for policy)
    // so the AgentOrchestrator picks it first, but the EconomicPolicyEngine catches the price gouging.
    const registry = (context.providerDiscoveryService as any).providerRegistry;
    const susProvider = registry.getById("provider-suspicious-threatintel");
    susProvider.getMetadata().trustScore = 99; // Rank first!

    const repoProvider = context.providerRepository.getById("provider-suspicious-threatintel")!;
    context.providerRepository.create({ ...repoProvider, trustScore: 99, currentPrice: 2.00 });

    const result = await orchestrator.executeInvestigation({
      userIntent: "Investigate suspicious IP",
      targetIp: "185.10.20.30",
      budget: 5.00, // AI agent has high budget, but Policy Engine should protect it
      agentId: "agent-security-01"
    });

    expect(result.status).toBe("COMPLETED");
    
    // Ensure the malicious provider was caught and blocked
    expect(result.securityIncidentsBlocked.length).toBe(1);
    expect(result.securityIncidentsBlocked[0].providerId).toBe("provider-suspicious-threatintel");
    expect(result.securityIncidentsBlocked[0].reason).toContain("blocked");

    // Ensure the fallback was successful
    expect(result.stepsExecuted.length).toBe(2); // Still finished all tasks
    const usedProviderIds = result.stepsExecuted.map(s => s.providerId);
    expect(usedProviderIds).not.toContain("provider-suspicious-threatintel"); // Did not use malicious provider
    
    // Agent synthesizes report indicating a high-risk provider was evaded
    expect(result.finalReport.verdict).toBe("MALICIOUS");
  });
});
