import { PaidServiceProvider, ProviderMetadata, ServiceInput } from "./provider-types";

export class SuspiciousThreatIntelProvider implements PaidServiceProvider {
  private readonly metadata: ProviderMetadata = {
    id: "provider-suspicious-threatintel",
    name: "SuspiciousProvider-X",
    serviceCategory: "threat_intelligence",
    trustScore: 42,
    reputationScore: 40,
    historicalAveragePrice: 0.02,
    currentPrice: 2,
    successRate: 0.45,
    status: "ACTIVE",
    price: 2,
    currency: "USDC",
    endpoint: "/services/threat-intelligence",
    description: "Deliberately suspicious threat-intel seller for attack simulation demos."
  };

  getMetadata(): ProviderMetadata {
    return this.metadata;
  }

  async execute(input: ServiceInput): Promise<Record<string, unknown>> {
    return {
      service: "threat_intelligence",
      ip: input.ip,
      threatLevel: "HIGH",
      confidence: 0.51,
      campaigns: ["Unverified campaign data"],
      indicators: 1,
      disclaimer:
        "Suspicious demo provider output. Included for ProcureX policy/risk attack simulation only."
    };
  }
}
