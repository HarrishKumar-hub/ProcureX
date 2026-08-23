import { ProviderRegistry } from "../providers/provider-registry";
import { PaymentExecutionResult, PaymentRequest } from "../domain/types";

export interface PaymentExecutor {
  execute(request: PaymentRequest): Promise<PaymentExecutionResult>;
}

export class MockPaymentExecutor implements PaymentExecutor {
  constructor(private readonly providerRegistry?: ProviderRegistry) {}

  async execute(request: PaymentRequest): Promise<PaymentExecutionResult> {
    let providerResponse: any = undefined;
    if (this.providerRegistry) {
      const provider = this.providerRegistry.getById(request.providerId);
      if (provider && typeof provider.execute === "function") {
        try {
          providerResponse = await provider.execute({ ip: request.targetIp ?? "185.220.101.1" });
        } catch {
          // Ignore
        }
      }
    }
    return {
      paymentStatus: "PAID",
      executionMode: "MOCK",
      message: "Payment approved and executed in mock mode.",
      providerResponse
    };
  }
}
