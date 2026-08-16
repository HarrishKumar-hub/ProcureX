import { ProviderRegistry } from "../providers/provider-registry";
import { PaidServiceProvider, ProviderMetadata, SupportedServiceCategory } from "../providers/provider-types";

interface RankOptions {
  allowedServiceCategories?: string[];
  minProviderTrust?: number;
}

export class ProviderDiscoveryService {
  constructor(private readonly providerRegistry: ProviderRegistry) {}

  listProviders(): ProviderMetadata[] {
    return this.providerRegistry.listProviders();
  }

  listServiceCatalog(): Array<{
    id: string;
    service: string;
    category: string;
    price: number;
    currency: string;
    trustScore: number;
  }> {
    return this.providerRegistry.listProviders().map((provider) => ({
      id: provider.id,
      service: provider.name,
      category: provider.serviceCategory,
      price: provider.price,
      currency: provider.currency,
      trustScore: provider.trustScore
    }));
  }

  listByCategory(category: SupportedServiceCategory): ProviderMetadata[] {
    return this.providerRegistry.getByCategory(category).map((provider) => provider.getMetadata());
  }

  rankProviders(category: SupportedServiceCategory, options: RankOptions = {}): ProviderMetadata[] {
    const providers = this.listByCategory(category);

    return providers.sort((a, b) => {
      const aCompatibility = this.compatibilityScore(a, options);
      const bCompatibility = this.compatibilityScore(b, options);
      if (aCompatibility !== bCompatibility) {
        return bCompatibility - aCompatibility;
      }

      if (a.trustScore !== b.trustScore) {
        return b.trustScore - a.trustScore;
      }

      if (a.price !== b.price) {
        return a.price - b.price;
      }

      if (a.status !== b.status) {
        return a.status === "ACTIVE" ? -1 : 1;
      }

      return a.id.localeCompare(b.id);
    });
  }

  getProviderById(providerId: string): ProviderMetadata | undefined {
    return this.providerRegistry.getById(providerId)?.getMetadata();
  }



  private selectTopProvider(category: SupportedServiceCategory): PaidServiceProvider {
    const ranked = this.rankProviders(category, {
      allowedServiceCategories: [category],
      minProviderTrust: 90
    });
    if (ranked.length === 0) {
      throw new Error(`No providers available for category: ${category}`);
    }

    const selected = this.providerRegistry.getById(ranked[0].id);
    if (!selected) {
      throw new Error(`Provider not found for ranked selection: ${ranked[0].id}`);
    }

    return selected;
  }

  private compatibilityScore(provider: ProviderMetadata, options: RankOptions): number {
    let score = 0;
    const allowed = options.allowedServiceCategories;
    if (!allowed || allowed.includes(provider.serviceCategory)) {
      score += 50;
    }
    const minTrust = options.minProviderTrust ?? 0;
    if (provider.trustScore >= minTrust) {
      score += 40;
    }
    if (provider.status === "ACTIVE") {
      score += 10;
    }
    return score;
  }
}
