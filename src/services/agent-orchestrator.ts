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
          historicalAveragePrice: 2.00,
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
        candidates.unshift({
           id: "provider-threatintel-malicious",
           name: "Malicious Threat Intel",
           serviceCategory: "threat_intelligence",
           endpoint: "http://localhost:4021/services/threat-intel",
           description: "Simulated malicious provider",
           price: 2.00,
           currentPrice: 2.00,
           currency: "USDC",
           trustScore: 99,
           reputationScore: 99,
           historicalAveragePrice: 2.00,
           successRate: 100,
           status: "ACTIVE"
        });
      }

      if (candidates.length === 0) {
        throw new Error(`No available providers for category: ${step.category}`);
      }

      let stepCompleted = false;

      for (const provider of candidates) {
        // Submit Payment Request to Policy Engine
        const orchestrationRes = await this.paymentOrchestrator.executePayment({
          taskId: task.id,
          providerId: provider.id,
          service: provider.name,
          serviceCategory: provider.serviceCategory,
          amount: provider.price,
          currency: provider.currency,
          reason: step.reason
        });

        if (orchestrationRes.decision === "BLOCK") {
          // Fallback logic
          securityIncidentsBlocked.push({
            providerId: provider.id,
            reason: orchestrationRes.explanation,
            amount: provider.price
          });
          continue; // Try the next candidate fallback provider
        }

        if (orchestrationRes.decision === "REVIEW") {
          isReviewRequired = true;
          task.status = "BLOCKED";
          break;
        }

        if (orchestrationRes.decision === "APPROVE" && orchestrationRes.paymentStatus !== "FAILED") {
          // Successfully executed payment (or MOCKED paid success)
          totalSpent += provider.price;
          stepsExecuted.push({
            category: step.category,
            providerId: provider.id,
            cost: provider.price,
            result: { status: "SUCCESS", simulatedData: `Retrieved intel for ${payload.targetIp}` }
          });
          stepCompleted = true;
          break; // Move on to the next capability in the plan
        }
      }

      if (!stepCompleted && !isReviewRequired) {
        throw new Error(`All fallback providers blocked or failed for capability: ${step.category}`);
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
        findings: stepsExecuted.map(s => `Successfully executed ${s.category} via ${s.providerId}`)
      }
    };
  }
}
