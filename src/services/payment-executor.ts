import { PaymentExecutionResult, PaymentRequest } from "../domain/types";

export interface PaymentExecutor {
  execute(request: PaymentRequest): Promise<PaymentExecutionResult>;
}

export class MockPaymentExecutor implements PaymentExecutor {
  async execute(_request: PaymentRequest): Promise<PaymentExecutionResult> {
    return {
      paymentStatus: "NOT_CONFIGURED",
      executionMode: "MOCK",
      message: "Policy approved payment, but real x402 execution is not configured."
    };
  }
}
