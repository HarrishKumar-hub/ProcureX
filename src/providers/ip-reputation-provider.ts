import { PaidServiceProvider, ProviderMetadata, ServiceInput } from "./provider-types";
import { clampProbability, getIpSignal } from "./provider-utils";

export class IpReputationProvider implements PaidServiceProvider {
  private readonly metadata: ProviderMetadata = {
    id: "provider-ip-reputation",
    name: "IP Reputation X",
    serviceCategory: "ip_reputation",
    trustScore: 94,
    reputationScore: 90,
    historicalAveragePrice: 0.01,
    currentPrice: 0.01,
    successRate: 0.97,
    status: "ACTIVE",
    price: 0.01,
    currency: "USDC",
    endpoint: "/services/ip-reputation",
    description: "Deterministic mock IP reputation scoring for security demos."
  };

  getMetadata(): ProviderMetadata {
    return this.metadata;
  }

  async execute(input: ServiceInput): Promise<Record<string, unknown>> {
    const signal = getIpSignal(input.ip);
    const riskScore = Math.max(10, Math.min(95, signal));
    const malicious = riskScore >= 70;

    return {
      service: "ip_reputation",
      ip: input.ip,
      riskScore,
      classification: malicious ? "malicious" : "benign",
      confidence: clampProbability(0.5 + riskScore / 200),
      signals: malicious
        ? ["Known malicious infrastructure", "Associated with suspicious activity"]
        : ["No known malicious infrastructure", "Low anomaly footprint in demo dataset"],
      disclaimer: "Demo-only deterministic response. Not real threat intelligence."
    };
  }
}
