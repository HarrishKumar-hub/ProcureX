import {
  PaymentExecutionResult,
  PaymentExecutionMode,
  PaymentRequest
} from "../domain/types";
import { PaymentExecutor } from "./payment-executor";
import { x402Client, wrapFetchWithPayment, x402HTTPClient } from "@x402/fetch";
import { toClientAvmSigner, ExactAvmScheme } from "@x402/avm";
import { ed25519SigningKeyFromWrappedSecret } from "@algorandfoundation/algokit-utils/crypto";
import { seedFromMnemonic } from "@algorandfoundation/algokit-utils/algo25";

interface X402ExecutorConfig {
  resourceUrl?: string;
  avmMnemonic?: string;
  enabled: boolean;
}

interface PaymentSettleResponse {
  success?: boolean;
  transaction?: string;
  network?: string;
}

const isConfigured = (config: X402ExecutorConfig): boolean =>
  config.enabled && Boolean(config.resourceUrl && config.avmMnemonic);

export class RealPaymentExecutor implements PaymentExecutor {
  private readonly config: X402ExecutorConfig;

  constructor(config: Partial<X402ExecutorConfig> = {}) {
    this.config = {
      resourceUrl: config.resourceUrl ?? process.env.X402_RESOURCE_URL,
      avmMnemonic: config.avmMnemonic ?? process.env.X402_AVM_MNEMONIC,
      enabled: config.enabled ?? process.env.X402_ENABLED === "true"
    };
  }

  async execute(request: PaymentRequest): Promise<PaymentExecutionResult> {
    if (!isConfigured(this.config)) {
      return {
        paymentStatus: "FAILED",
        executionMode: "X402",
        message: "x402 execution failed: Real x402 payment executor is enabled but not properly configured (missing RESOURCE_URL or AVM_MNEMONIC)."
      };
    }

    const mode: PaymentExecutionMode = "X402";

    // Setup AVM / x402 client
    let fetchWithPayment: typeof fetch;
    let client: any;
    try {
      const secretKey = await this.getSecretKeyFromMnemonic(
        this.config.avmMnemonic as string
      );

      const avmSigner = toClientAvmSigner(secretKey);
      client = new x402Client();
      const ALGORAND_TESTNET_CAIP2_FULL = "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=";
      client.register(ALGORAND_TESTNET_CAIP2_FULL, new ExactAvmScheme(avmSigner));
      fetchWithPayment = wrapFetchWithPayment(fetch, client);
    } catch (e: any) {
      return {
        paymentStatus: "FAILED",
        executionMode: mode,
        message: `x402 client initialization failed: ${e.message}`
      };
    }

    const endpointUrl = `${this.config.resourceUrl}/services/${request.serviceCategory.replace("_", "-")}`;

    // Retry configuration
    const maxRetries = 2; // Initial try + 1 retry
    let attempt = 0;
    let lastError: any = null;

    while (attempt < maxRetries) {
      attempt++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetchWithPayment(endpointUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            taskId: request.taskId,
            providerId: request.providerId,
            service: request.service,
            serviceCategory: request.serviceCategory,
            amount: request.amount,
            currency: request.currency,
            reason: request.reason,
            ip: request.targetIp
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const responseText = await response.text();
          throw new Error(`x402 execution failed with status ${response.status}: ${responseText}`);
        }

        const paymentResponse = new x402HTTPClient(client).getPaymentSettleResponse(
          (name: string) => response.headers.get(name)
        );
        const responseBody = await this.safeParseJson(response);

        if (!paymentResponse?.success) {
          throw new Error("x402 call completed but settlement headers did not confirm success");
        }

        return {
          paymentStatus: "PAID",
          executionMode: mode,
          message: "x402 payment settled successfully.",
          transactionId: paymentResponse.transaction,
          network: paymentResponse.network ?? "algorand-testnet",
          providerResponse: responseBody
        };
      } catch (error: any) {
        lastError = error;
        const errMsg = error.name === "AbortError" ? "Timeout after 10s" : error.message;
        console.warn(`x402 payment attempt ${attempt} failed: ${errMsg}`);
        if (attempt < maxRetries) {
          // Wait 1 second before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    return {
      paymentStatus: "FAILED",
      executionMode: mode,
      message: `x402 execution failed after ${maxRetries} attempts. Last error: ${lastError?.message || "Unknown error"}`
    };
  }

  private async safeParseJson(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return response.text();
    }
    return response.json();
  }

  private async getSecretKeyFromMnemonic(avmMnemonic: string): Promise<string> {
    const seed = seedFromMnemonic(avmMnemonic);
    const seedCopy = new Uint8Array(seed);

    const wrappedSecret = await ed25519SigningKeyFromWrappedSecret({
      unwrapEd25519Seed: async () => seed,
      wrapEd25519Seed: async () => undefined
    });

    return Buffer.concat([Buffer.from(seedCopy), Buffer.from(wrappedSecret.ed25519Pubkey)]).toString(
      "base64"
    );
  }
}
