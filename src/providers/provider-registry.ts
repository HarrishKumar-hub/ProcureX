import {
  IpReputationProvider
} from "./ip-reputation-provider";
import { MalwareAnalysisProvider } from "./malware-analysis-provider";
import { PaidServiceProvider, ProviderMetadata, SupportedServiceCategory } from "./provider-types";
import { SuspiciousThreatIntelProvider } from "./suspicious-threat-intel-provider";
import { ThreatIntelligenceProvider } from "./threat-intelligence-provider";

export class ProviderRegistry {
  private readonly providers: PaidServiceProvider[];

  constructor(providers?: PaidServiceProvider[]) {
    this.providers = providers ?? [
      new IpReputationProvider(),
      new ThreatIntelligenceProvider(),
      new MalwareAnalysisProvider(),
      new SuspiciousThreatIntelProvider()
    ];
  }

  listProviders(): ProviderMetadata[] {
    return this.providers.map((provider) => provider.getMetadata());
  }

  getById(providerId: string): PaidServiceProvider | undefined {
    return this.providers.find((provider) => provider.getMetadata().id === providerId);
  }

  getByCategory(serviceCategory: SupportedServiceCategory): PaidServiceProvider[] {
    return this.providers.filter(
      (provider) => provider.getMetadata().serviceCategory === serviceCategory
    );
  }
}
