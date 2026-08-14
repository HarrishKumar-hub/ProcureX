import { Provider } from "../domain/types";

export type SupportedServiceCategory =
  | "ip_reputation"
  | "threat_intelligence"
  | "malware_analysis";

export interface ServiceInput {
  ip: string;
}

export interface ProviderMetadata extends Provider {
  price: number;
  currency: "USDC";
  endpoint: string;
  description: string;
}

export interface PaidServiceProvider {
  getMetadata(): ProviderMetadata;
  execute(input: ServiceInput): Promise<Record<string, unknown>>;
}
