import { describe, expect, it } from "vitest";
import { ProviderRegistry } from "../src/providers/provider-registry";
import { ProviderDiscoveryService } from "../src/services/provider-discovery-service";

describe("ProviderDiscoveryService", () => {
  const service = new ProviderDiscoveryService(new ProviderRegistry());

  it("discovers all three core services", () => {
    const catalog = service.listServiceCatalog();
    const categories = new Set(catalog.map((item) => item.category));

    expect(categories.has("ip_reputation")).toBe(true);
    expect(categories.has("threat_intelligence")).toBe(true);
    expect(categories.has("malware_analysis")).toBe(true);
  });

  it("returns correct provider metadata for legitimate providers", () => {
    const ipReputation = service.getProviderById("provider-ip-reputation");
    const threatIntel = service.getProviderById("provider-threatintel");
    const malware = service.getProviderById("provider-malware-analysis");

    expect(ipReputation?.price).toBe(0.01);
    expect(threatIntel?.price).toBe(0.02);
    expect(malware?.price).toBe(0.03);
    expect(ipReputation?.trustScore).toBe(94);
  });

  it("filters providers by service category", () => {
    const threatProviders = service.listByCategory("threat_intelligence");
    const threatProviderIds = threatProviders.map((provider) => provider.id);

    expect(threatProviderIds).toContain("provider-threatintel");
    expect(threatProviderIds).toContain("provider-suspicious-threatintel");
    expect(threatProviderIds).not.toContain("provider-ip-reputation");
  });

  it("shows suspicious provider in provider inventory", () => {
    const suspicious = service.getProviderById("provider-suspicious-threatintel");

    expect(suspicious).toBeDefined();
  });

  it("marks suspicious provider with low trust score", () => {
    const suspicious = service.getProviderById("provider-suspicious-threatintel");

    expect(suspicious?.trustScore).toBe(42);
  });

  it("marks suspicious provider with abnormal pricing", () => {
    const suspicious = service.getProviderById("provider-suspicious-threatintel");
    const multiplier =
      (suspicious?.currentPrice ?? 0) / Math.max(0.000001, suspicious?.historicalAveragePrice ?? 1);

    expect(multiplier).toBe(100);
  });

  it("keeps legitimate providers on normal pricing", () => {
    const legitimate = [
      service.getProviderById("provider-ip-reputation"),
      service.getProviderById("provider-threatintel"),
      service.getProviderById("provider-malware-analysis")
    ];

    legitimate.forEach((provider) => {
      const multiplier =
        (provider?.currentPrice ?? 0) / Math.max(0.000001, provider?.historicalAveragePrice ?? 1);
      expect(multiplier).toBeLessThanOrEqual(1);
    });
  });
});
