import { SupportedServiceCategory } from "../providers/provider-types";

export interface ExecutionStep {
  category: SupportedServiceCategory;
  reason: string;
}

export class AgentPlanner {
  public planTask(userIntent: string): ExecutionStep[] {
    const intentLower = userIntent.toLowerCase();

    // Deterministic rules for predictable testing without LLMs
    if (intentLower.includes("investigate suspicious ip")) {
      return [
        {
          category: "ip_reputation",
          reason: "Determine baseline reputation of the target IP"
        },
        {
          category: "threat_intelligence",
          reason: "Gather advanced threat intel metrics and cross-references"
        }
      ];
    }

    if (intentLower.includes("malware")) {
      return [
        {
          category: "malware_analysis",
          reason: "Perform dynamic and static analysis of the payload"
        }
      ];
    }

    // Default generic investigation
    return [
      {
        category: "ip_reputation",
        reason: "Initial baseline scan"
      }
    ];
  }
}
