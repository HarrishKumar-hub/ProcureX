import { PaidServiceProvider, ProviderMetadata, ServiceInput } from "./provider-types";
import { clampProbability, getIpSignal } from "./provider-utils";

export class ThreatIntelligenceProvider implements PaidServiceProvider {
  private readonly metadata: ProviderMetadata = {
    id: "provider-threatintel",
    name: "ThreatIntel-X",
    serviceCategory: "threat_intelligence",
    trustScore: 96,
    reputationScore: 93,
    historicalAveragePrice: 0.02,
    currentPrice: 0.02,
    successRate: 0.98,
    status: "ACTIVE",
    price: 0.02,
    currency: "USDC",
    endpoint: "/services/threat-intelligence",
    description: "Deterministic mock threat context enrichment for demo investigations."
  };

  getMetadata(): ProviderMetadata {
    return this.metadata;
  }

  async execute(input: ServiceInput): Promise<Record<string, unknown>> {
    const signal = getIpSignal(input.ip);
    const threatLevel = signal >= 75 ? "HIGH" : signal >= 45 ? "MEDIUM" : "LOW";
    const campaigns =
      threatLevel === "HIGH"
        ? ["Credential harvesting", "Botnet activity"]
        : threatLevel === "MEDIUM"
          ? ["Reconnaissance scanning", "Phishing infrastructure"]
          : ["No active campaigns in demo dataset"];

    return {
      service: "threat_intelligence",
      ip: input.ip,
      threatLevel,
      confidence: clampProbability(0.56 + signal / 250),
      campaigns,
      indicators: threatLevel === "HIGH" ? 4 : threatLevel === "MEDIUM" ? 2 : 0,
      disclaimer: "Demo-only deterministic response. Not real threat intelligence."
    };
  }
}
