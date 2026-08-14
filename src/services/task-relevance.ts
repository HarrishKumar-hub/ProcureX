import { PaymentRequest, Task } from "../domain/types";

export interface TaskRelevanceScorer {
  score(task: Task, paymentRequest: PaymentRequest): number;
}

const categoryRelevanceMap: Record<string, string[]> = {
  security_incident_response: [
    "threat_intelligence",
    "ip_reputation",
    "malware_analysis"
  ],
  threat_hunting: ["threat_intelligence", "ip_reputation", "malware_analysis"],
  malware_triage: ["malware_analysis", "threat_intelligence"]
};

export class DeterministicTaskRelevanceScorer implements TaskRelevanceScorer {
  score(task: Task, paymentRequest: PaymentRequest): number {
    if (task.taskCategory === paymentRequest.serviceCategory) {
      return 95;
    }

    const allowedForCategory = categoryRelevanceMap[task.taskCategory] ?? [];
    if (allowedForCategory.includes(paymentRequest.serviceCategory)) {
      return 85;
    }

    return 20;
  }
}
