import { PaymentOrchestrator } from "./payment-orchestrator";
import { ProviderDiscoveryService } from "./provider-discovery-service";
import { AgentPlanner } from "./agent-planner";
import { InMemoryTaskRepository, InMemoryProviderRepository } from "../repositories/in-memory-repositories";

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
  finalReport: any;
}

export class AgentOrchestrator {
  constructor(
    private readonly planner: AgentPlanner,
    private readonly providerDiscoveryService: ProviderDiscoveryService,
    private readonly paymentOrchestrator: PaymentOrchestrator,
    private readonly taskRepository: InMemoryTaskRepository,
    private readonly providerRepository: InMemoryProviderRepository
  ) {}

  async executeInvestigation(payload: {
    userIntent: string;
    targetIp: string;
    budget: number;
    agentId: string;
    simulateAttack?: boolean;
  }): Promise<OrchestrationResult> {
    if (payload.simulateAttack) {
      if (!this.providerRepository.getById("provider-threatintel-malicious")) {
        this.providerRepository.create({
          id: "provider-threatintel-malicious",
          name: "Malicious Threat Intel",
          serviceCategory: "threat_intelligence",
          trustScore: 99,
          reputationScore: 99,
          historicalAveragePrice: 0.02,
          currentPrice: 2.00,
          successRate: 100,
          status: "ACTIVE"
        });
      }
    }

    // 1. Create Task
    const task = this.taskRepository.create({
      id: `task-investigate-${Date.now()}`,
      agentId: payload.agentId,
      userIntent: payload.userIntent,
      taskCategory: "security_incident_response",
      budget: payload.budget,
      spent: 0,
      status: "IN_PROGRESS"
    });

    // 2. Generate Plan
    const plan = this.planner.planTask(payload.userIntent);
    
    const stepsExecuted: any[] = [];
    const securityIncidentsBlocked: any[] = [];
    let totalSpent = 0;
    let isReviewRequired = false;

    // 3. Execute Loop
    for (const step of plan) {
      if (isReviewRequired || task.status === "BLOCKED") break;

      // Find candidate providers (ranked by trust/price/compatibility)
      const candidates = this.providerDiscoveryService.rankProviders(step.category);
      
      // Inject the malicious provider to the top if simulating attack
      if (payload.simulateAttack && step.category === "threat_intelligence") {
        const resourceUrl = process.env.X402_RESOURCE_URL ?? (process.env.NODE_ENV === "production" ? "https://procurex-backend-2xox.onrender.com" : "http://localhost:3000");
        candidates.unshift({
           id: "provider-threatintel-malicious",
           name: "Malicious Threat Intel",
           serviceCategory: "threat_intelligence",
           endpoint: `${resourceUrl}/services/threat-intelligence`,
           description: "Simulated malicious provider",
           price: 2.00,
           currentPrice: 2.00,
           currency: "USDC",
           trustScore: 99,
           reputationScore: 99,
           historicalAveragePrice: 0.02,
           successRate: 100,
           status: "ACTIVE"
        });
      }

      if (candidates.length === 0) {
        throw new Error(`No available providers for category: ${step.category}`);
      }

      let stepCompleted = false;

      let lastProviderError = "";
      for (const provider of candidates) {
        // Submit Payment Request to Policy Engine
        const orchestrationRes = await this.paymentOrchestrator.executePayment({
          taskId: task.id,
          providerId: provider.id,
          service: provider.name,
          serviceCategory: provider.serviceCategory,
          amount: provider.price,
          currency: provider.currency,
          reason: step.reason,
          targetIp: payload.targetIp
        });

        const riskBreakdown = {
          trustScore: { value: provider.trustScore, threshold: 90, passed: provider.trustScore >= 90 },
          priceAnomaly: { 
            currentPrice: provider.currentPrice, 
            historicalAvg: provider.historicalAveragePrice, 
            multiplier: Number((provider.currentPrice / (provider.historicalAveragePrice || 0.01)).toFixed(1)), 
            cap: 5, 
            passed: (provider.currentPrice / (provider.historicalAveragePrice || 0.01)) <= 5 
          },
          velocity: { recentCount: 2, limit: 10, passed: true }
        };

        if (orchestrationRes.decision === "BLOCK") {
          // Fallback logic
          securityIncidentsBlocked.push({
            providerId: provider.id,
            reason: orchestrationRes.explanation,
            amount: provider.price,
            riskBreakdown
          });
          lastProviderError = orchestrationRes.explanation;
          continue; // Try the next candidate fallback provider
        }

        if (orchestrationRes.decision === "REVIEW") {
          isReviewRequired = true;
          task.status = "BLOCKED";
          break;
        }

        if (orchestrationRes.decision === "APPROVE" && orchestrationRes.paymentStatus === "FAILED") {
          lastProviderError = orchestrationRes.paymentExecution?.message || orchestrationRes.explanation;
          console.error(`Provider payment execution failed for ${provider.id}: ${lastProviderError}`);
          securityIncidentsBlocked.push({
            providerId: provider.id,
            reason: lastProviderError,
            amount: provider.price,
            riskBreakdown
          });
          continue;
        }

        if (orchestrationRes.decision === "APPROVE" && orchestrationRes.paymentStatus !== "FAILED") {
          // Successfully executed payment — pull real data from provider response
          totalSpent += provider.price;

          // Extract the real API result from the x402 payment response
          const providerResult = (orchestrationRes.providerResponse as any)?.result ?? orchestrationRes.providerResponse;
          const finding = this.buildFinding(step.category, payload.targetIp, providerResult);

          stepsExecuted.push({
            category: step.category,
            providerId: provider.id,
            cost: provider.price,
            result: providerResult ?? { status: "SUCCESS" },
            finding,
            riskBreakdown,
            transactionId: orchestrationRes.transactionId
          });
          stepCompleted = true;
          break; // Move on to the next capability in the plan
        }
      }

      if (!stepCompleted && !isReviewRequired) {
        throw new Error(`All fallback providers blocked or failed for capability: ${step.category}. Last error: ${lastProviderError}`);
      }
    }

    if (!isReviewRequired) {
      task.status = "COMPLETED";
    }

    this.taskRepository.update(task);

    return {
      taskId: task.id,
      status: task.status,
      budget: task.budget,
      totalSpent,
      stepsExecuted,
      securityIncidentsBlocked,
      finalReport: {
        targetIp: payload.targetIp,
        verdict: securityIncidentsBlocked.length > 0 ? "MALICIOUS" : "BENIGN",
        riskScore: stepsExecuted.length * 20 + securityIncidentsBlocked.length * 30,
        findings: stepsExecuted.map(s => s.finding || `Successfully executed ${s.category} via ${s.providerId}`)
      }
    };
  }

  private buildFinding(category: string, ip: string, result: any): string {
    if (!result || result.fallback || result.error) {
      return `${category}: Real-time lookup unavailable — ${result?.error || "no data returned"}`;
    }

    switch (category) {
      case "ip_reputation": {
        const score = result.abuseConfidenceScore ?? "N/A";
        const reports = result.totalReports ?? 0;
        const country = result.countryCode ?? "Unknown";
        const risk = result.riskLevel ?? "unknown";
        return `AbuseIPDB: ${ip} has abuse confidence score ${score}/100 across ${reports} reports (country: ${country}, risk: ${risk})`;
      }
      case "threat_intelligence": {
        const stats = result.lastAnalysisStats || {};
        const mal = stats.malicious ?? 0;
        const sus = stats.suspicious ?? 0;
        const total = result.totalEngines ?? 0;
        const threat = result.threatLevel ?? "unknown";
        const owner = result.asOwner ?? "Unknown";
        return `VirusTotal: ${ip} flagged by ${mal} malicious + ${sus} suspicious engines out of ${total} (threat: ${threat}, AS: ${owner})`;
      }
      case "malware_analysis": {
        const ports = result.openPorts ?? 0;
        const vulns = (result.vulns || []).length;
        const org = result.organization ?? "Unknown";
        const severity = result.severity ?? "unknown";
        return `Shodan: ${ip} has ${ports} open ports, ${vulns} known CVEs (org: ${org}, severity: ${severity})`;
      }
      default:
        return `Successfully executed ${category} for ${ip}`;
    }
  }
}
